import Tesseract from 'tesseract.js';
import type { DetectedVisualContext } from '../types/index.js';

const PATH_REGEX = /(?:\/[\w.-]+)+|(?:[A-Z]:\\[\w.-]+(?:\\[\w.-]+)*)/gi;
const CODE_REGEX = /(?:class|function|const|let|var)\s+([A-Za-z0-9_]+)/g;
const ERROR_REGEX = /(?:Error|Exception|TypeError|Uncaught|FAILED):.*/gi;

/**
 * Extracts candidate file paths from OCR text.
 */
export function extractFilePaths(text: string): string[] {
	const matches = text.match(PATH_REGEX) || [];
	const clean = matches.map((m) => m.replace(/:\d+.*$/, '').trim());
	return Array.from(new Set(clean)).filter((p) => p.length > 2);
}

/**
 * Extracts runtime or compilation error strings from text.
 */
export function extractErrors(text: string): string[] {
	const matches = text.match(ERROR_REGEX) || [];
	return matches.map((m) => m.trim()).filter(Boolean);
}

/**
 * Extracts visible code tokens and declarations.
 */
export function extractCodeSnippets(text: string): string[] {
	const snippets: string[] = [];
	let match: RegExpExecArray | null;
	const regex = new RegExp(CODE_REGEX.source, 'g');
	while ((match = regex.exec(text)) !== null) {
		snippets.push(match[0].trim());
	}
	return Array.from(new Set(snippets));
}

/**
 * Returns empty fallback visual context.
 */
function createEmptyContext(): DetectedVisualContext {
	return {
		rawText: '',
		detectedFiles: [],
		detectedErrors: [],
		codeSnippets: []
	};
}

/**
 * Local OCR parsing using tesseract.js WASM engine.
 */
async function parseWithTesseract(
	imageBuffer: Buffer
): Promise<DetectedVisualContext> {
	if (!imageBuffer || imageBuffer.length === 0) {
		return createEmptyContext();
	}
	try {
		const { data } = await Tesseract.recognize(imageBuffer, 'eng');
		const rawText = data?.text || '';
		return {
			rawText,
			detectedFiles: extractFilePaths(rawText),
			detectedErrors: extractErrors(rawText),
			codeSnippets: extractCodeSnippets(rawText)
		};
	} catch {
		/* Fallback gracefully on corrupt/unreadable images */
		return createEmptyContext();
	}
}

/**
 * Multimodal extraction using Gemini 1.5 Flash when API key is provided.
 */
async function parseWithGemini(
	imageBuffer: Buffer,
	apiKey: string
): Promise<DetectedVisualContext> {
	const base64 = imageBuffer.toString('base64');
	const endpoint =
		`https://generativelanguage.googleapis.com/v1beta/` +
		`models/gemini-1.5-flash:generateContent?key=${apiKey}`;

	const prompt = 'Extract code, file paths and errors as JSON: ' +
		'{ "rawText": string, "detectedFiles": string[], ' +
		'"detectedErrors": string[], "codeSnippets": string[] }';

	const body = {
		contents: [{
			parts: [
				{ text: prompt },
				{ inline_data: { mime_type: 'image/png', data: base64 } }
			]
		}],
		generationConfig: { response_mime_type: 'application/json' }
	};

	const res = await fetch(endpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});

	if (!res.ok) {
		throw new Error(`Gemini Vision API error: ${res.statusText}`);
	}
	const data = await res.json();
	const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
	return JSON.parse(text);
}

/**
 * Entry point for visual context parsing.
 */
export async function parseVisualContext(
	imageBuffer: Buffer,
	explicitApiKey?: string
): Promise<DetectedVisualContext> {
	const key = explicitApiKey || process.env.GEMINI_API_KEY;
	if (key) {
		try {
			return await parseWithGemini(imageBuffer, key);
		} catch {
			/* Fallback transparently to local WASM engine on API failure */
		}
	}
	return parseWithTesseract(imageBuffer);
}
