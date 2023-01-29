import { serve } from "std/http/server.ts"
import { html } from "./index.html.ts"

const urlParse = (url: string): URL | null => {
	try {
		return new URL(url)
	} catch {
		return null
	}
}

const fromUtf8 = (() => {
	const cachedDecoder = new TextDecoder()
	return (str: Uint8Array) => cachedDecoder.decode(str)
})()

const bundle = async (path: string) => {
	const process = Deno.run({
		cmd: ["deno", "bundle", "--no-check", "--", path],
		stdout: "piped",
		stderr: "piped",
		stdin: "null",
	})

	const success = process.output().then(fromUtf8)
	const error = process.stderrOutput().then(fromUtf8)
	const exit = await process.status()

	if (exit.success) {
		return { data: await success } as const
	} else {
		return {
			error: `console.error(${JSON.stringify(await error)})`,
		} as const
	}
}

const main = () => {
	serve((req) => {
		const { url, method } = req
		const path = urlParse(url)?.pathname

		if (!["GET", "HEAD"].includes(method.toUpperCase())) {
			return new Response("", { status: 405 })
		}

		if (path === "/") {
			return html.then((html) =>
				new Response(html, {
					headers: {
						"content-type": "text/html; charset=utf-8",
						"link": '<./index.css>; rel="stylesheet"',
					},
				})
			)
		}

		if (path === "/index.css") {
			return Deno.readTextFile("./index.css").then(
				(css) =>
					new Response(css, {
						headers: { "content-type": "text/css; charset=utf-8" },
					}),
				() => new Response("", { status: 404 }),
			)
		}

		if (path === "/index.js") {
			return bundle("./index.ts").then((result) => {
				const mime = "text/javascript; charset=utf-8"
				if (result.data != null) {
					return new Response(result.data, {
						status: 200,
						headers: { "content-type": mime },
					})
				}

				return new Response(result.error, {
					status: 200,
					headers: { "content-type": mime },
				})
			}, () => new Response("", { status: 500 }))
		}

		return new Response("", { status: 404 })
	}, { port: 8000 })
}

if (import.meta.main) main()
