import { App } from "./app.tsx"
import { hydrate } from "preact"
import { render as renderString } from "preact-render-to-string"

export const renderStatic = (): string => {
	return (
		"<!doctype html>" +
		'<meta charset="utf-8">' +
		'<script src="./index.js" type="module"></script>' +
		"<body>" +
		renderString(<App />)
	)
}

export const renderDOM = () => hydrate(<App />, document.body)
