import { useContext, useEffect, useRef, useState } from "preact/hooks"
import { createContext } from "preact"
import { getStars, type StarData } from "./star.ts"
import { relative } from "./date.ts"

const Now = createContext(Date.now())

const ArchivedBadge = () => (
	<div class="archived-badge">
		Archived
	</div>
)

const MetaItem = (
	{ field, value }: {
		readonly field: string
		readonly value: string | number
	},
) => <li>{field}: {value}</li>

const Metadata = ({ data }: { readonly data: StarData }) => {
	const now = useContext(Now)
	return (
		<ul class="metadata">
			<MetaItem field="star" value={data.stars} />
			<MetaItem field="issue" value={data.issues} />
			<MetaItem field="watch" value={data.watches} />
			<MetaItem field="fork" value={data.forks} />
			{data.pushed_at && (
				<MetaItem
					field="last push"
					value={relative(data.pushed_at, now)}
				/>
			)}
			{data.created_at && (
				<MetaItem
					field="created"
					value={relative(data.created_at, now)}
				/>
			)}
		</ul>
	)
}

const StarItem = ({ data }: { readonly data: StarData }) => {
	const now = useContext(Now)
	return (
		<li>
			<a class="item" href={data.url} rel="noreferrer" target="_blank">
				<div class={`header ${data.archived ? "archived" : ""}`}>
					<div class="reponame">{data.name}</div>
					{data.archived && <ArchivedBadge />}
					<div class="you-star">
						You starred: {relative(data.starred_at, now)}
					</div>
				</div>
				<div class="description">{data.desc}</div>
				<Metadata data={data} />
			</a>
		</li>
	)
}

const Items = ({ list }: { readonly list: readonly StarData[] }) => (
	<ul class="items">
		{list.map((data) => <StarItem key={data.url} data={data} />)}
	</ul>
)

const List = ({ username }: { readonly username: string }) => {
	const [list, setList] = useState([] as readonly StarData[])
	useEffect(() => {
		const cachedUsername = username
		;(async () => {
			for await (const items of getStars(username)) {
				if (cachedUsername === username) setList(items || [])
				break
			}
		})().catch(() => {})
	}, [username])

	return (
		<Now.Provider value={Date.now()}>
			<Items list={list} />
		</Now.Provider>
	)
}

const UsernameInput = (
	{ onChange }: { readonly onChange: (username: string) => void },
) => {
	const input = useRef<HTMLInputElement>(null)
	const [valid, setValid] = useState(true)

	useEffect(() => {
		if (input != null) {
			setValid(input.current?.checkValidity() || false)
		}
	}, [input])

	return (
		<form
			class="username-form"
			onSubmit={(event) => {
				event.preventDefault()

				const currentInput = input.current
				if (currentInput == null) return

				const rawValue = currentInput.value
				if (rawValue == null) return

				const value = rawValue.replace("@", "").trim()
				onChange(value)

				currentInput.value = value
			}}
		>
			<label class="username-label">
				<div>Your GitHub ID: @</div>
				<input
					class="username"
					ref={input}
					name="username"
					type="text"
					required
					pattern="\s*@?\s*[-a-zA-Z0-9]+\s*"
					spellCheck={false}
					placeholder="octocat"
					autoComplete="username"
					onInput={(event) =>
						setValid(event.currentTarget.checkValidity())}
				/>
			</label>
			<button class="submit" type="submit" disabled={!valid}>
				Search
			</button>
		</form>
	)
}

export const App = () => {
	const [username, setUsername] = useState(null as string | null)
	return (
		<main>
			<UsernameInput onChange={setUsername} />
			<div>{username && <List username={username} />}</div>
		</main>
	)
}
