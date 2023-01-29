import { renderStatic } from "./render.tsx"

export const html = Promise.resolve(renderStatic())

if (import.meta.main) {
	html.then(console.log)
}
