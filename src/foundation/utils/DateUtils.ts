import { Temporal } from 'temporal-polyfill-lite';

const TIME_ZONE = 'Asia/Tokyo';

export const parseZonedDateTime = (value: string): Temporal.ZonedDateTime => {
	try {
		return Temporal.ZonedDateTime.from(value);
	} catch {
		// no-op
	}
	try {
		return Temporal.Instant.from(value).toZonedDateTimeISO(TIME_ZONE);
	} catch {
		// no-op
	}

	return Temporal.PlainDateTime.from(value).toZonedDateTime(TIME_ZONE);
};

export const jst = (): Temporal.ZonedDateTime => Temporal.Now.zonedDateTimeISO(TIME_ZONE);

type FormatKey = 'MM-DD' | 'YYYY-MM-DD';
const formatters: Record<FormatKey, (date: Temporal.ZonedDateTime) => string> = {
	'MM-DD': (date) => {
		const month = date.month.toString().padStart(2, '0');
		const day = date.day.toString().padStart(2, '0');

		return `${month}-${day}`;
	},
	'YYYY-MM-DD': (date) => date.toPlainDate().toString(),
};

export const formatDate = (date: Temporal.ZonedDateTime, key: FormatKey): string => formatters[key](date);

type SortKey = 'asc' | 'desc';
export const compareZonedDateTime = (a: Temporal.ZonedDateTime, b: Temporal.ZonedDateTime, dir: SortKey): number =>
	dir === 'asc' ? Temporal.ZonedDateTime.compare(a, b) : Temporal.ZonedDateTime.compare(b, a);
