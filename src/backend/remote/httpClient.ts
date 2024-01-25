import { DeferError } from "../../backend.js";
import { errorMessage } from "../../utils.js";
import VERSION from "../../version.js";

export type HTTPClient = <T>(
  method: string,
  path: string,
  body?: string | null
) => Promise<{ status: number; response: T }>;

const basicAuth = (username: string, password: string) => {
  const credentials = btoa(`${username}:${password}`);
  return `Basic ${credentials}`;
};

export class ClientError extends DeferError {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, ClientError.prototype);
  }
}

export function makeHTTPClient(
  apiEndpoint: string,
  accessToken: string,
  clientOptions?: RequestInit
): HTTPClient {
  return async <T>(
    method: string,
    path: string,
    body: string | null = null
  ): Promise<{ status: number; response: T }> => {
    let endpoint;

    try {
      endpoint = new URL(path, apiEndpoint);
    } catch (error) {
      let message;

      if (error instanceof Error)
        message = `invalid endpoint url: ${errorMessage(error)}`;
      else message = `unknown error: ${String(error)}`;

      throw new ClientError(message);
    }
    const customHeaderFields = clientOptions?.headers || {};
    const options: RequestInit = {
      ...clientOptions,
      method,
      body,
      cache: "no-store",
      headers: {
        ...customHeaderFields,
        "Content-type": "application/json",
        "User-Agent": `defer/${VERSION} (source: https://github.com/defer-run/defer.client)`,
        Authorization: basicAuth("", accessToken),
      },
    };

    let response: Response;
    let data: T;

    try {
      response = await fetch(endpoint.toString(), options);
    } catch (error) {
      let message;

      if (error instanceof Error)
        message = `cannot execute http request: ${errorMessage(error)}`;
      else message = `unknown error: ${String(error)}`;

      throw new ClientError(message);
    }

    try {
      const text = await response.text();
      data = JSON.parse(text) as T;
    } catch (error) {
      let message;

      if (error instanceof Error)
        message = `cannot decode http response: ${errorMessage(error)}`;
      else message = `unknown error: ${String(error)}`;

      throw new ClientError(message);
    }

    return { status: response.status, response: data };
  };
}
