import { dotCase } from 'change-case';

import type { DotCaseKeys } from './TypeUtils';

export const dotCaseKeys = <T extends Record<string, unknown>>(obj: T): DotCaseKeys<T> =>
	Object.fromEntries(Object.entries(obj).map(([key, value]) => [dotCase(key), value])) as DotCaseKeys<T>;

export const alpha = (color: string, value: number) => `oklch(from ${color} l c h / ${value})` as const;
