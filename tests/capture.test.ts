import { describe, it, expect, vi, beforeEach } from 'vitest';
import { captureActiveScreen } from '../src/modules/capture.js';
import * as child_process from 'node:child_process';
import * as fs from 'node:fs';

vi.mock('node:child_process');
vi.mock('node:fs');

describe('core/capture: captureActiveScreen', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('should capture screen on Linux Wayland using grim', async () => {
		const originalPlatform = process.platform;
		const originalSession = process.env.XDG_SESSION_TYPE;
		Object.defineProperty(process, 'platform', { value: 'linux' });
		process.env.XDG_SESSION_TYPE = 'wayland';

		const dummyBuffer = Buffer.from('dummy-image-bytes');
		vi.spyOn(child_process, 'execSync').mockReturnValue(Buffer.from(''));
		vi.spyOn(fs, 'readFileSync').mockReturnValue(dummyBuffer);
		vi.spyOn(fs, 'existsSync').mockReturnValue(true);
		vi.spyOn(fs, 'unlinkSync').mockReturnValue();

		const result = await captureActiveScreen();

		expect(result).toBeDefined();
		expect(result.imageBuffer).toEqual(dummyBuffer);
		expect(result.timestamp).toBeGreaterThan(0);
		expect(typeof result.windowTitle).toBe('string');

		Object.defineProperty(process, 'platform', { value: originalPlatform });
		process.env.XDG_SESSION_TYPE = originalSession;
	});

	it('should capture screen on macOS using screencapture', async () => {
		const originalPlatform = process.platform;
		Object.defineProperty(process, 'platform', { value: 'darwin' });

		const dummyBuffer = Buffer.from('darwin-image-bytes');
		vi.spyOn(child_process, 'execSync').mockReturnValue(Buffer.from(''));
		vi.spyOn(fs, 'readFileSync').mockReturnValue(dummyBuffer);
		vi.spyOn(fs, 'existsSync').mockReturnValue(true);
		vi.spyOn(fs, 'unlinkSync').mockReturnValue();

		const result = await captureActiveScreen();

		expect(result.imageBuffer).toEqual(dummyBuffer);

		Object.defineProperty(process, 'platform', { value: originalPlatform });
	});

	it('should capture screen on Windows using PowerShell', async () => {
		const originalPlatform = process.platform;
		Object.defineProperty(process, 'platform', { value: 'win32' });

		const dummyBuffer = Buffer.from('win32-image-bytes');
		vi.spyOn(child_process, 'execSync').mockReturnValue(Buffer.from(''));
		vi.spyOn(fs, 'readFileSync').mockReturnValue(dummyBuffer);
		vi.spyOn(fs, 'existsSync').mockReturnValue(true);
		vi.spyOn(fs, 'unlinkSync').mockReturnValue();

		const result = await captureActiveScreen();

		expect(result.imageBuffer).toEqual(dummyBuffer);

		Object.defineProperty(process, 'platform', { value: originalPlatform });
	});

	it('should throw handled error if native capture utility fails', async () => {
		vi.spyOn(child_process, 'execSync').mockImplementation(() => {
			throw new Error('Command failed');
		});
		vi.spyOn(fs, 'existsSync').mockReturnValue(false);

		await expect(captureActiveScreen()).rejects.toThrow();
	});
});
