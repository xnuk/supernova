import type { StarredRepository } from "./starred.d.ts"

export const firstStarred = (username: string) =>
	`https://api.github.com/users/${username}/starred?per_page=100&sort=created&direction=asc` as const

const getNextLink = (link: string): string | null =>
	// naive but it works
	link.match(/<(https:[^<]+)>;\s*rel="next",/)?.[1] || null

const processData = (starred: readonly StarredRepository[]) =>
	starred.map(({ starred_at, repo }) => ({
		starred_at,
		name: repo.full_name,
		url: repo.html_url,
		desc: repo.description,
		forks: repo.forks_count || repo.forks,
		issues: repo.open_issues_count || repo.open_issues,
		stars: repo.stargazers_count,
		archived: repo.archived,
		pushed_at: repo.pushed_at,
		created_at: repo.created_at,
		watches: repo.watchers || repo.watchers_count,
	} as const))

export type StarData = Exclude<
	ReturnType<typeof processData>[number],
	null | undefined
>

export const getStars = (
	username: string,
	auth: `Bearer ${string}` | `token ${string}` | null = null,
) => {
	const headers = Object.freeze({
		Accept: "application/vnd.github.star+json",
		// "X-Github-Api-Version": "2022-11-28", <-- CORS fails

		...(auth ? { Authorization: auth } : null),
	})

	let nextUrl: string | null = firstStarred(username)

	const next = async () => {
		if (nextUrl == null) return { done: true } as const

		const resp = await fetch(nextUrl, { headers })

		const link = resp.headers.get("link")
		const next = link && getNextLink(link)
		const value = processData(await resp.json())

		nextUrl = next

		return { done: false, value } as const
	}

	return { [Symbol.asyncIterator]: () => ({ next } as const), next } as const
}
