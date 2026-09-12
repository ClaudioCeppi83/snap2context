import ora, { type Ora } from 'ora';
import pc from 'picocolors';

/**
 * Creates and starts a CLI progress spinner.
 */
export function createSpinner(initialText: string): Ora {
	return ora({
		text: pc.cyan(initialText),
		color: 'cyan'
	}).start();
}

/**
 * Displays completion success message matching PRD criteria.
 */
export function showSuccess(
	durationMs: number,
	matchedPath?: string | null
): void {
	const timeStr = pc.bold(`${durationMs}ms`);
	const matchText = matchedPath
		? pc.dim(` (Matches found in: ${pc.cyan(matchedPath)})`)
		: pc.dim(' (Using clipboard buffer fallback)');
	const prefix = pc.green('✔');
	console.log(`${prefix} Context copied to clipboard in ${timeStr}!${matchText}`);
}

/**
 * Displays user warning for recoverable fallback states.
 */
export function showWarning(msg: string): void {
	console.warn(`${pc.yellow('⚠')} ${pc.yellow(msg)}`);
}

/**
 * Displays terminal error message.
 */
export function showError(err: unknown): void {
	const msg = err instanceof Error ? err.message : String(err);
	console.error(`${pc.red('✖')} ${pc.red(msg)}`);
}
