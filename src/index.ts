import * as fs from 'node:fs';
import { captureActiveScreen } from './modules/capture.js';
import { parseVisualContext } from './modules/parser.js';
import { enrichLocalContext } from './modules/enricher.js';
import {
	formatPayload,
	copyToClipboard,
	readCurrentClipboard
} from './modules/formatter.js';
import type {
	CliOptions,
	EngineOutput,
	MatchedLocalContext,
	CaptureResult,
	DetectedVisualContext
} from './types/index.js';

export { captureActiveScreen } from './modules/capture.js';
export { parseVisualContext } from './modules/parser.js';
export { enrichLocalContext } from './modules/enricher.js';
export { formatPayload, copyToClipboard } from './modules/formatter.js';

/**
 * Resilient fallback capture when OS screen capture fails.
 */
function createFallbackCapture(): CaptureResult {
	return {
		imageBuffer: Buffer.from(''),
		windowTitle: 'Active Window (Fallback)',
		timestamp: Date.now()
	};
}

/**
 * Executes full pipeline from screen capture to clipboard markdown payload.
 */
export async function runPipeline(
	options: CliOptions = {},
	onProgress?: (step: string) => void
): Promise<EngineOutput> {
	const startTime = Date.now();

	onProgress?.('Capturing active window/screen...');
	let capture: CaptureResult;
	try {
		capture = await captureActiveScreen();
	} catch {
		capture = createFallbackCapture();
	}

	onProgress?.('Parsing visual text and code...');
	let visual = await parseVisualContext(capture.imageBuffer, options.apiKey);
	let fallbackText: string | undefined;

	const hasContent = visual.detectedErrors.length > 0 ||
		visual.detectedFiles.length > 0 ||
		visual.codeSnippets.length > 0;

	if (!hasContent) {
		fallbackText = await readCurrentClipboard();
	}

	onProgress?.('Enriching with local repository code...');
	let local: MatchedLocalContext | null = null;
	try {
		local = await enrichLocalContext(visual);
	} catch {
		local = null;
	}

	const elapsed = Date.now() - startTime;
	const engineOutput = formatPayload(
		capture,
		visual,
		local,
		elapsed,
		fallbackText
	);

	if (!options.dryRun) {
		if (options.copy !== false) {
			await copyToClipboard(engineOutput.markdownPayload);
		}
		if (options.out) {
			fs.writeFileSync(options.out, engineOutput.markdownPayload, 'utf-8');
		}
	}

	return engineOutput;
}
