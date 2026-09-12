import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { CaptureResult } from '../types/index.js';

/**
 * Builds OS-native screen capture shell command.
 * Avoids heavy graphical dependencies like Electron/Puppeteer.
 */
function getCaptureCommand(platform: string, outPath: string): string {
	if (platform === 'darwin') {
		return `/usr/sbin/screencapture -x "${outPath}"`;
	}
	if (platform === 'win32') {
		return `powershell -NoProfile -Command ` +
			`"Add-Type -AssemblyName System.Windows.Forms,System.Drawing; ` +
			`$s = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; ` +
			`$b = New-Object System.Drawing.Bitmap $s.Width, $s.Height; ` +
			`$g = [System.Drawing.Graphics]::FromImage($b); ` +
			`$g.CopyFromScreen($s.Location, [System.Drawing.Point]::Empty, $s.Size); ` +
			`$b.Save('${outPath}', [System.Drawing.Imaging.ImageFormat]::Png); ` +
			`$g.Dispose(); $b.Dispose()"`;
	}
	const isWayland = process.env.XDG_SESSION_TYPE === 'wayland';
	if (isWayland) {
		return `grim "${outPath}"`;
	}
	return `maim "${outPath}" || import -window root "${outPath}"`;
}

/**
 * Safely resolves active window title if supported by OS.
 */
function resolveActiveWindowTitle(platform: string): string {
	try {
		if (platform === 'linux' && process.env.XDG_SESSION_TYPE !== 'wayland') {
			const cmd = 'xdotool getactivewindow getwindowname';
			const opts = { encoding: 'utf-8' as const, stdio: ['pipe', 'pipe', 'ignore'] as any };
			return execSync(cmd, opts).trim();
		}
	} catch {
		/* Fallback to generic title on missing CLI utility */
	}
	return 'Active Window';
}

/**
 * Captures the current active screen/window to an in-memory buffer.
 */
export async function captureActiveScreen(): Promise<CaptureResult> {
	const platform = process.platform;
	const timestamp = Date.now();
	const tmpFile = path.join(os.tmpdir(), `screen_ctx_${timestamp}.png`);
	const command = getCaptureCommand(platform, tmpFile);

	try {
		execSync(command, { stdio: ['pipe', 'pipe', 'pipe'] });
		if (!fs.existsSync(tmpFile)) {
			throw new Error(`Capture failed: output file not found at ${tmpFile}`);
		}
		const imageBuffer = fs.readFileSync(tmpFile);
		const windowTitle = resolveActiveWindowTitle(platform);
		return { imageBuffer, windowTitle, timestamp };
	} finally {
		if (fs.existsSync(tmpFile)) {
			try {
				fs.unlinkSync(tmpFile);
			} catch {
				/* Ignore cleanup errors */
			}
		}
	}
}
