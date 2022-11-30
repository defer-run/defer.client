import { fetch } from "@whatwg-node/fetch";

export interface DeferConfiguredFetcher {
  (path: string, options: Partial<RequestInit>): ReturnType<typeof fetch>;
}

export function makeFetcher(
  apiEndpoint: string,
  apiToken: string
): DeferConfiguredFetcher {
  return (path, options) =>
    fetch(`${apiEndpoint}${path}`, {
      headers: {
        "Content-type": "application/json",
        Authorization: `Basic ${Buffer.from(":" + apiToken).toString(
          "base64"
        )}`,
        ...(options.headers || {}),
      },
      ...options,
    });
}
