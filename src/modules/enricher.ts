import * as fs from 'node:fs';
import * as path from 'node:path';
import fuzzysort from 'fuzzysort';
import type {
	DetectedVisualContext,
	MatchedLocalContext
} from '../types/index.js';

const IGNORED_DIRS = new Set([
	'node_modules', '.git', 'dist', 'build', '.next', 'coverage'
]);

/**
 * Recursively retrieves code files within local project directory.
 */
function scanSourceFiles(dir: string, fileList: string[] = []): string[] {
	if (!fs.existsSync(dir)) return fileList;
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		if (IGNORED_DIRS.has(entry.name)) continue;
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			scanSourceFiles(fullPath, fileList);
		} else if (entry.isFile()) {
			fileList.push(fullPath);
		}
	}
	return fileList;
}

/**
 * Extracts top-level module imports from file content.
 */
function extractTopImports(fileContent: string): string[] {
	const lines = fileContent.split('\n');
	const imports: string[] = [];
	for (const line of lines.slice(0, 50)) {
		const trimmed = line.trim();
		if (trimmed.startsWith('import ') || trimmed.includes('require(')) {
			imports.push(trimmed);
		}
	}
	return imports;
}

/**
 * Slices 15 lines above and below the matched line epicenter.
 */
function sliceSurrounding(
	lines: string[],
	centerIdx: number
): { matchedLines: string; startLine: number; endLine: number } {
	const startIdx = Math.max(0, centerIdx - 15);
	const endIdx = Math.min(lines.length - 1, centerIdx + 15);
	const sliced = lines.slice(startIdx, endIdx + 1).map((line, idx) => {
		const lineNum = startIdx + idx + 1;
		const marker = (startIdx + idx === centerIdx) ? '>' : ' ';
		return `${marker} ${lineNum.toString().padStart(4, ' ')} | ${line}`;
	});
	return {
		matchedLines: sliced.join('\n'),
		startLine: startIdx + 1,
		endLine: endIdx + 1
	};
}

/**
 * Locates line index matching visual clues inside a specific file.
 */
function locateEpicenterLine(lines: string[], clues: string[]): number {
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		for (const clue of clues) {
			if (clue && line.includes(clue)) return i;
		}
	}
	return 0;
}

/**
 * Enriches visually detected context with local repository source code.
 */
export async function enrichLocalContext(
	context: DetectedVisualContext,
	rootDir: string = process.cwd()
): Promise<MatchedLocalContext | null> {
	const files = scanSourceFiles(rootDir);
	if (files.length === 0) return null;

	const clues = [...context.detectedErrors, ...context.codeSnippets];
	let targetFile: string | null = null;

	// 1. Direct path check
	for (const rawPath of context.detectedFiles) {
		const base = path.basename(rawPath);
		const found = files.find((f) => f.endsWith(base) || f.includes(rawPath));
		if (found) {
			targetFile = found;
			break;
		}
	}

	// 2. Fuzzy search across files if not found directly
	if (!targetFile && clues.length > 0) {
		const fileItems = files.map((f) => ({
			path: f,
			content: fs.readFileSync(f, 'utf-8')
		}));
		for (const clue of clues) {
			const results = fuzzysort.go(clue, fileItems, {
				key: 'content',
				threshold: -10000
			});
			if (results.length > 0) {
				targetFile = results[0].obj.path;
				break;
			}
		}
	}

	if (!targetFile) return null;

	const content = fs.readFileSync(targetFile, 'utf-8');
	const lines = content.split('\n');
	const center = locateEpicenterLine(lines, clues);
	const { matchedLines, startLine, endLine } = sliceSurrounding(lines, center);

	return {
		filePath: path.relative(rootDir, targetFile),
		matchedLines,
		startLine,
		endLine,
		relatedImports: extractTopImports(content)
	};
}
