import { fetch } from "@whatwg-node/fetch";
import { URL } from "node:url";

export type HTTPClient = (path: string, options: Partial<RequestInit>) => ReturnType<typeof fetch>;

const basicAuth = (password: string) => {
	const credentials = Buffer.from(`:${password}`).toString("base64")
	return `Basic ${credentials}`
}

export function makeHTTPClient(
	apiEndpoint: string,
	accessToken: string
): HTTPClient {
	return (path, clientOptions) => {
		const endpoint = new URL(apiEndpoint, path)
		const customHeaderFields = clientOptions.headers || {}
		const options = {
			headers: {
				"Content-type": "application/json",
				Authorization: basicAuth(accessToken),
				...customHeaderFields,
			},
			...clientOptions,
		}

		return fetch(endpoint, options);
	}
}
