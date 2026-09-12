#!/usr/bin/env node

import { parseCliArgs } from '../dist/cli/args.js';
import { createSpinner, showSuccess, showError } from '../dist/cli/ui.js';
import { runPipeline } from '../dist/index.js';

async function main() {
	const options = parseCliArgs(process.argv);
	const spinner = createSpinner('Initializing screen context engine...');

	try {
		const output = await runPipeline(options, (step) => {
			spinner.text = step;
		});
		spinner.stop();
		showSuccess(output.processingTimeMs);
	} catch (err) {
		spinner.stop();
		showError(err);
		process.exit(1);
	}
}

main();
