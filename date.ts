// new Date('1970-01-02T00:00:00Z').getTime()
const DAY = 86400000

// Keep it simple, because calendar stuff is hard to handle it properly.
const YEAR_IN_DAY = 365.25

const intl = new Intl.RelativeTimeFormat(
	navigator.languages.slice(),
	{ numeric: "auto" },
)

export const relative = (dat: string, now: number): string => {
	const days = (now - new Date(dat).getTime()) / DAY
	const years = days / YEAR_IN_DAY
	return years > 1
		? intl.format(-(years | 0), "year")
		: intl.format(-(days | 0), "day")
}
