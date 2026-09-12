import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { enrichLocalContext } from '../src/modules/enricher.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { DetectedVisualContext } from '../types/index.js';

describe('core/enricher: Local Code Enricher', () => {
	let testDir: string;

	beforeEach(() => {
		testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'enricher-test-'));
		const sampleFile = path.join(testDir, 'Sample.tsx');
		const lines: string[] = [
			"import React, { useState } from 'react';",
			"import { Button } from './ui/button';",
			"",
			"export function SampleComponent() {",
			"  const [count, setCount] = useState(0);",
			"  // Some filler line 1",
			"  // Some filler line 2",
			"  // Some filler line 3",
			"  // Some filler line 4",
			"  // Some filler line 5",
			"  // Some filler line 6",
			"  // Some filler line 7",
			"  // Some filler line 8",
			"  // Some filler line 9",
			"  // Some filler line 10",
			"  // Some filler line 11",
			"  // Some filler line 12",
			"  // Some filler line 13",
			"  // Some filler line 14",
			"  // Some filler line 15",
			"  function triggerError() {",
			"    throw new Error('Epicenter failure line');",
			"  }",
			"  // After filler line 1",
			"  // After filler line 2",
			"  // After filler line 3",
			"  // After filler line 4",
			"  // After filler line 5",
			"  return <Button onClick={triggerError}>Click</Button>;",
			"}"
		];
		fs.writeFileSync(sampleFile, lines.join('\n'), 'utf-8');
	});

	afterEach(() => {
		fs.rmSync(testDir, { recursive: true, force: true });
	});

	it('should match direct file path and extract surrounding lines + imports', async () => {
		const context: DetectedVisualContext = {
			rawText: 'Error at Sample.tsx:22',
			detectedFiles: ['Sample.tsx'],
			detectedErrors: ['Error: Epicenter failure line'],
			codeSnippets: ['function triggerError']
		};

		const result = await enrichLocalContext(context, testDir);

		expect(result).not.toBeNull();
		expect(result?.filePath).toContain('Sample.tsx');
		expect(result?.relatedImports.length).toBe(2);
		expect(result?.relatedImports[0]).toContain("import React");
		expect(result?.matchedLines).toContain('Epicenter failure line');
		expect(result?.startLine).toBeGreaterThanOrEqual(1);
		expect(result?.endLine).toBeGreaterThan(result!.startLine);
	});

	it('should match via fuzzy search on error or snippet when path is not direct', async () => {
		const context: DetectedVisualContext = {
			rawText: 'Epicenter failure line',
			detectedFiles: [],
			detectedErrors: ['Epicenter failure line'],
			codeSnippets: ['triggerError']
		};

		const result = await enrichLocalContext(context, testDir);

		expect(result).not.toBeNull();
		expect(result?.filePath).toContain('Sample.tsx');
		expect(result?.matchedLines).toContain('triggerError');
	});

	it('should return null gracefully when no file or match is found', async () => {
		const context: DetectedVisualContext = {
			rawText: 'completely_unknown_token_xyz_999999',
			detectedFiles: ['non_existent_file.ts'],
			detectedErrors: [],
			codeSnippets: ['nonExistentFunction']
		};

		const result = await enrichLocalContext(context, testDir);
		expect(result).toBeNull();
	});
});
