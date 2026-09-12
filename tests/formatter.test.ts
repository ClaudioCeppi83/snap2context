import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	formatPayload,
	estimateTokens,
	copyToClipboard
} from '../src/modules/formatter.js';
import clipboardy from 'clipboardy';
import type {
	CaptureResult,
	DetectedVisualContext,
	MatchedLocalContext
} from '../types/index.js';

vi.mock('clipboardy');

describe('core/formatter: Payload Formatter & Clipboard', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('should accurately estimate token count', () => {
		const sample = 'a'.repeat(400);
		const tokens = estimateTokens(sample);
		expect(tokens).toBe(100);
	});

	it('should format structured markdown with enriched local context', () => {
		const capture: CaptureResult = {
			imageBuffer: Buffer.from(''),
			windowTitle: 'VSCode - App.tsx',
			timestamp: 1726000000000
		};

		const visual: DetectedVisualContext = {
			rawText: 'TypeError: boom',
			detectedFiles: ['src/App.tsx'],
			detectedErrors: ['TypeError: boom'],
			codeSnippets: ['function App()']
		};

		const local: MatchedLocalContext = {
			filePath: 'src/App.tsx',
			matchedLines: '> 25 | throw new Error("boom");',
			startLine: 10,
			endLine: 40,
			relatedImports: ["import React from 'react';"]
		};

		const output = formatPayload(capture, visual, local, 450);

		expect(output.markdownPayload).toContain('### 🖥️ Screen Context');
		expect(output.markdownPayload).toContain('VSCode - App.tsx');
		expect(output.markdownPayload).toContain('src/App.tsx');
		expect(output.markdownPayload).toContain("import React from 'react';");
		expect(output.markdownPayload).toContain('> 25 | throw new Error("boom");');
		expect(output.markdownPayload).toContain('Agent Directive:');
		expect(output.processingTimeMs).toBe(450);
		expect(output.tokensEstimated).toBeGreaterThan(0);
	});

	it('should format fallback markdown when no local match exists', () => {
		const capture: CaptureResult = {
			imageBuffer: Buffer.from(''),
			windowTitle: 'Terminal',
			timestamp: 1726000000000
		};

		const visual: DetectedVisualContext = {
			rawText: 'Some unmapped log text',
			detectedFiles: [],
			detectedErrors: [],
			codeSnippets: []
		};

		const output = formatPayload(capture, visual, null, 200, 'fallback buffer');

		expect(output.markdownPayload).toContain('fallback buffer');
		expect(output.markdownPayload).toContain('Some unmapped log text');
	});

	it('should copy payload to clipboard via clipboardy', async () => {
		vi.mocked(clipboardy.write).mockResolvedValue();

		await copyToClipboard('test markdown');
		expect(clipboardy.write).toHaveBeenCalledWith('test markdown');
	});
});
