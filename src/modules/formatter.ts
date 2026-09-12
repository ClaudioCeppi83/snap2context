import clipboardy from 'clipboardy';
import type {
	CaptureResult,
	DetectedVisualContext,
	MatchedLocalContext,
	EngineOutput
} from '../types/index.js';

/**
 * Estimates token count based on character density.
 */
export function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4);
}

/**
 * Reads existing clipboard content safely for fallback resilience.
 */
export async function readCurrentClipboard(): Promise<string> {
	try {
		return await clipboardy.read();
	} catch {
		return '';
	}
}

/**
 * Copies the final markdown payload to system clipboard.
 */
export async function copyToClipboard(payload: string): Promise<void> {
	await clipboardy.write(payload);
}

/**
 * Builds the visual snippets section of the markdown payload.
 */
function buildVisualSection(visual: DetectedVisualContext): string {
	const parts: string[] = ['### 👁️ Detected Visual Snippets & Errors'];
	if (visual.detectedErrors.length > 0) {
		parts.push('**Errors:**');
		parts.push('```\n' + visual.detectedErrors.join('\n') + '\n```');
	}
	if (visual.codeSnippets.length > 0) {
		parts.push('**Code Tokens:** ' + visual.codeSnippets.join(', '));
	}
	if (!visual.detectedErrors.length && !visual.codeSnippets.length) {
		parts.push('```\n' + (visual.rawText || 'None detected') + '\n```');
	}
	return parts.join('\n');
}

/**
 * Builds the local repository enriched code section.
 */
function buildLocalSection(
	local: MatchedLocalContext | null,
	fallback?: string
): string {
	if (!local) {
		const text = fallback || 'No local matching file identified.';
		return `### 📁 Local Context Fallback\n\`\`\`\n${text}\n\`\`\``;
	}
	const parts: string[] = [
		`### 📁 Local Enriched Context: \`${local.filePath}\``
	];
	if (local.relatedImports.length > 0) {
		parts.push('**Relevant Imports:**');
		parts.push('```typescript\n' + local.relatedImports.join('\n') + '\n```');
	}
	parts.push(`**Code Context (Lines ${local.startLine}-${local.endLine}):**`);
	parts.push('```typescript\n' + local.matchedLines + '\n```');
	return parts.join('\n');
}

/**
 * Assembles full Markdown prompt payload according to specifications.
 */
export function formatPayload(
	capture: CaptureResult,
	visual: DetectedVisualContext,
	local: MatchedLocalContext | null,
	processingTimeMs: number,
	fallbackBuffer?: string
): EngineOutput {
	const isoTime = new Date(capture.timestamp).toISOString();
	const header = [
		'### 🖥️ Screen Context',
		`- **Window:** ${capture.windowTitle}`,
		`- **Timestamp:** ${isoTime}`,
		`- **Processing Time:** ${processingTimeMs}ms`
	].join('\n');

	const visualSection = buildVisualSection(visual);
	const localSection = buildLocalSection(local, fallbackBuffer);
	const directive =
		'---\n> **Agent Directive:** Utilize the visual context and local ' +
		'code above to diagnose the issue and propose a solution.';

	const markdown = [
		header,
		visualSection,
		localSection,
		directive
	].join('\n\n');

	return {
		markdownPayload: markdown,
		tokensEstimated: estimateTokens(markdown),
		processingTimeMs
	};
}
