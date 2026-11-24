import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';
import { Temporal } from 'temporal-polyfill-lite';

const posts = defineCollection({
	loader: glob({
		base: './contents',
		pattern: '**/*.mdx',
		generateId: ({ entry }) => {
			// entry == {{ ulid }}/slug.md
			const matched = /^(?<ulid>[0-9A-HJKMNP-TV-Z]{26})\/(?<slug>.+)\.mdx$/u.exec(entry);
			if (matched == null || matched.groups == null) {
				throw new Error('Invalid content path');
			}
			const { ulid } = matched.groups;
			if (ulid == null) {
				throw new Error('Invalid matched group');
			}

			return ulid;
		},
	}),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		tags: z.array(z.string()),
		publishedAt: z.string().refine((v) => {
			try {
				Temporal.ZonedDateTime.from(v);

				return true;
			} catch {
				return false;
			}
		}),
		updatedAt: z
			.string()
			.refine((v) => {
				try {
					Temporal.ZonedDateTime.from(v);

					return true;
				} catch {
					return false;
				}
			})
			.optional(),
	}),
});

export const collections = { posts };
