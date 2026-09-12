import { Command } from 'commander';
import type { CliOptions } from '../types/index.js';

/**
 * Parses and validates CLI command line arguments.
 */
export function parseCliArgs(argv: string[] = process.argv): CliOptions {
	const program = new Command();

	program
		.name('snap2context')
		.description('Zero-latency visual context engine for AI coding agents.')
		.version('0.1.0')
		.option('-c, --copy', 'Copy output to clipboard', true)
		.option('--no-copy', 'Do not copy output to clipboard')
		.option('-o, --out <path>', 'Write output markdown to specified file')
		.option('-a, --api-key <key>', 'Gemini API Key for multimodal extraction')
		.option('-d, --dry-run', 'Run pipeline without clipboard or file output', false)
		.parse(argv);

	const opts = program.opts();
	return {
		copy: opts.copy !== false,
		out: opts.out,
		apiKey: opts.apiKey,
		dryRun: Boolean(opts.dryRun)
	};
}
