import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	parseVisualContext,
	extractFilePaths,
	extractErrors,
	extractCodeSnippets
} from '../src/modules/parser.js';
import Tesseract from 'tesseract.js';

vi.mock('tesseract.js', () => ({
	default: {
		recognize: vi.fn()
	}
}));

describe('core/parser: Visual Context Parser', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		delete process.env.GEMINI_API_KEY;
	});

	it('should extract file paths correctly with regex', () => {
		const sample = 'Error in /src/components/Header.tsx:25 and C:\\projects\\app.ts';
		const paths = extractFilePaths(sample);
		expect(paths).toContain('/src/components/Header.tsx');
		expect(paths).toContain('C:\\projects\\app.ts');
	});

	it('should extract error messages correctly with regex', () => {
		const sample = `
			TypeError: Cannot read properties of undefined (reading 'map')
			Normal log line
			FAILED: Test suite failed to run
		`;
		const errors = extractErrors(sample);
		expect(errors.length).toBe(2);
		expect(errors[0]).toContain("TypeError: Cannot read properties of undefined");
		expect(errors[1]).toContain("FAILED: Test suite failed to run");
	});

	it('should extract code declarations with regex', () => {
		const sample = `
			export function renderHeader() {
			const activeIndex = 0;
			class UserProfile extends Component {
		`;
		const snippets = extractCodeSnippets(sample);
		expect(snippets).toContain('function renderHeader');
		expect(snippets).toContain('const activeIndex');
		expect(snippets).toContain('class UserProfile');
	});

	it('should use Tesseract WASM when GEMINI_API_KEY is not present', async () => {
		const mockText = 'TypeError: fail\nat /src/app.ts\nconst test = 1;';
		vi.mocked(Tesseract.recognize).mockResolvedValue({
			data: { text: mockText }
		} as any);

		const buffer = Buffer.from('fake-png');
		const result = await parseVisualContext(buffer);

		expect(Tesseract.recognize).toHaveBeenCalled();
		expect(result.rawText).toBe(mockText);
		expect(result.detectedFiles).toContain('/src/app.ts');
		expect(result.detectedErrors.length).toBeGreaterThan(0);
	});

	it('should use Gemini 1.5 Flash when GEMINI_API_KEY is provided', async () => {
		process.env.GEMINI_API_KEY = 'test-gemini-key';
		const mockResponse = {
			rawText: 'Console Error in /src/main.ts',
			detectedFiles: ['/src/main.ts'],
			detectedErrors: ['Error: boom'],
			codeSnippets: ['const x = 10']
		};

		const originalFetch = global.fetch;
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				candidates: [{
					content: {
						parts: [{
							text: JSON.stringify(mockResponse)
						}]
					}
				}]
			})
		});

		const buffer = Buffer.from('fake-png');
		const result = await parseVisualContext(buffer);

		expect(result.detectedFiles).toEqual(['/src/main.ts']);
		expect(Tesseract.recognize).not.toHaveBeenCalled();

		global.fetch = originalFetch;
	});
});
