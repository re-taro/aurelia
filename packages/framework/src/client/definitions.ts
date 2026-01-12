const GLOBAL_PREFIX = 'AURELIA_';

export const appClientManifestVar: `${typeof GLOBAL_PREFIX}appClientManifest` = `${GLOBAL_PREFIX}appClientManifest`;

export interface AppClientManifest {
	marker: string;
	stream: string;
}
