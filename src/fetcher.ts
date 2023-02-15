import { fetch } from "@whatwg-node/fetch";
import { URL } from "node:url";

export interface DeferConfiguredFetcher {
	(path: string, options: Partial<RequestInit>): ReturnType<typeof fetch>;
}

const basicAuth = (password: string) => {
	const credentials = Buffer.from(`:${password}`).toString("base64")
	return `Basic ${credentials}`
}

export function makeFetcher(
	apiEndpoint: string,
	accessToken: string
): DeferConfiguredFetcher {
	return (path, pathOptions) => {
		const endpoint = new URL(apiEndpoint, path)
		const customHeaderFields = pathOptions.headers || {}
		const options = {
			headers: {
				"Content-type": "application/json",
				Authorization: basicAuth(accessToken),
				...customHeaderFields,
			},
			...pathOptions,
		}

		return fetch(endpoint, options);
	}
}
