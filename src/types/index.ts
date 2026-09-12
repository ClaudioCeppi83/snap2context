export interface CaptureResult {
	imageBuffer: Buffer;
	windowTitle: string;
	timestamp: number;
}

export interface DetectedVisualContext {
	rawText: string;
	detectedFiles: string[];
	detectedErrors: string[];
	codeSnippets: string[];
}

export interface MatchedLocalContext {
	filePath: string;
	matchedLines: string;
	startLine: number;
	endLine: number;
	relatedImports: string[];
}

export interface EngineOutput {
	markdownPayload: string;
	tokensEstimated: number;
	processingTimeMs: number;
}

export interface CliOptions {
	copy?: boolean;
	apiKey?: string;
	out?: string;
	dryRun?: boolean;
}
