import { describe, it, expect } from 'vitest';
import { parseCliArgs } from '../src/cli/args.js';

describe('cli/args: parseCliArgs', () => {
	it('should parse default flags', () => {
		const opts = parseCliArgs(['node', 'snap2context']);
		expect(opts.copy).toBe(true);
		expect(opts.dryRun).toBe(false);
	});

	it('should parse custom flags', () => {
		const opts = parseCliArgs([
			'node',
			'snap2context',
			'--no-copy',
			'--out',
			'context.md',
			'--api-key',
			'my-key',
			'--dry-run'
		]);
		expect(opts.copy).toBe(false);
		expect(opts.out).toBe('context.md');
		expect(opts.apiKey).toBe('my-key');
		expect(opts.dryRun).toBe(true);
	});
});
