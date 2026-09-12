import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runPipeline } from '../src/index.js';
import * as captureMod from '../src/modules/capture.js';
import * as parserMod from '../src/modules/parser.js';
import * as enricherMod from '../src/modules/enricher.js';
import * as formatterMod from '../src/modules/formatter.js';

vi.mock('../src/modules/capture.js');
vi.mock('../src/modules/parser.js');
vi.mock('../src/modules/enricher.js');
vi.mock('../src/modules/formatter.js');

describe('agentic-screen-context: runPipeline', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('should execute complete pipeline sequentially', async () => {
		vi.mocked(captureMod.captureActiveScreen).mockResolvedValue({
			imageBuffer: Buffer.from('img'),
			windowTitle: 'VSCode - Header.tsx',
			timestamp: Date.now()
		});

		vi.mocked(parserMod.parseVisualContext).mockResolvedValue({
			rawText: 'Header error',
			detectedFiles: ['src/components/Header.tsx'],
			detectedErrors: ['TypeError: header'],
			codeSnippets: ['function Header']
		});

		vi.mocked(enricherMod.enrichLocalContext).mockResolvedValue({
			filePath: 'src/components/Header.tsx',
			matchedLines: '> 10 | Header',
			startLine: 1,
			endLine: 20,
			relatedImports: ["import React from 'react';"]
		});

		vi.mocked(formatterMod.formatPayload).mockReturnValue({
			markdownPayload: '# Mock Payload',
			tokensEstimated: 120,
			processingTimeMs: 300
		});

		vi.mocked(formatterMod.copyToClipboard).mockResolvedValue();

		const output = await runPipeline({ copy: true, dryRun: false });

		expect(captureMod.captureActiveScreen).toHaveBeenCalled();
		expect(parserMod.parseVisualContext).toHaveBeenCalled();
		expect(enricherMod.enrichLocalContext).toHaveBeenCalled();
		expect(formatterMod.formatPayload).toHaveBeenCalled();
		expect(formatterMod.copyToClipboard).toHaveBeenCalledWith('# Mock Payload');
		expect(output.markdownPayload).toBe('# Mock Payload');
	});

	it('should trigger clipboard fallback if OCR finds no code', async () => {
		vi.mocked(captureMod.captureActiveScreen).mockResolvedValue({
			imageBuffer: Buffer.from('empty'),
			windowTitle: 'Desktop',
			timestamp: Date.now()
		});

		vi.mocked(parserMod.parseVisualContext).mockResolvedValue({
			rawText: '',
			detectedFiles: [],
			detectedErrors: [],
			codeSnippets: []
		});

		vi.mocked(formatterMod.readCurrentClipboard).mockResolvedValue('existing clipboard code');
		vi.mocked(enricherMod.enrichLocalContext).mockResolvedValue(null);
		vi.mocked(formatterMod.formatPayload).mockReturnValue({
			markdownPayload: '# Fallback Payload',
			tokensEstimated: 80,
			processingTimeMs: 250
		});

		const output = await runPipeline({ copy: false, dryRun: true });

		expect(formatterMod.readCurrentClipboard).toHaveBeenCalled();
		expect(formatterMod.copyToClipboard).not.toHaveBeenCalled();
		expect(output.markdownPayload).toBe('# Fallback Payload');
	});
});
