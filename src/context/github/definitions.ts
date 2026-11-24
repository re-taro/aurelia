export type LineRange = {
	start: number;
	end: number;
};

export type GitHubPermalink = {
	owner: string;
	repo: string;
	ref: string;
	path: string;
	lines: LineRange | null;
};

export type ExtractedLines = {
	code: string;
	start: number;
	end: number;
	totalLines: number;
};

export type GitHubPermalinkSnippet = {
	owner: string;
	repo: string;
	ref: string;
	path: string;
	url: string;
	startLine: number;
	endLine: number;
	totalLines: number;
	lang: string;
	code: string;
};
