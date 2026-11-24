import type { Tag } from './definitions';

export const normalizeTag = (tag: Tag): Tag => tag.toLowerCase().replaceAll(/[^a-z0-9]/gu, '-');
