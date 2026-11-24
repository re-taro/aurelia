export type OpenGraphData = {
	title?: string;
	description?: string;
	ogTitle?: string;
	ogDescription?: string;
	ogImage?: string;
	twitterCard?: string;
};

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export type OgImageInput = {
	title: string;
	text: string | null;
};

export type OgImageChunks = {
	title: string[];
	text: string[] | null;
};
