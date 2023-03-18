import { fetch } from "@whatwg-node/fetch";
import { URL } from "node:url";

import { APIError, ClientError, HTTPRequestError } from "./errors.js";
import { version } from "../package.json";

export type HTTPClient = ReturnType<typeof makeHTTPClient>;

const basicAuth = (username: string, password: string) => {
  const credentials = Buffer.from(`${username}:${password}`).toString("base64");
  return `Basic ${credentials}`;
};

interface APIErrorResponse {
  code: string;
  message: string;
}

export function makeHTTPClient(
  apiEndpoint: string,
  accessToken: string,
  clientOptions?: RequestInit
) {
  return async <T>(
    method: string,
    path: string,
    body: string | null = null
  ): Promise<T> => {
    let endpoint;

    try {
      endpoint = new URL(path, apiEndpoint);
    } catch (error) {
      let message;

      if (error instanceof Error)
        message = `invalid endpoint url: ${error.message}`;
      else message = `unknown error: ${String(error)}`;

      throw new ClientError(message);
    }
    const customHeaderFields = clientOptions?.headers || {};
    const options: RequestInit = {
      ...clientOptions,
      method,
      body,
      headers: {
        ...customHeaderFields,
        "Content-type": "application/json",
        "User-Agent": `defer/${version} (source: https://github.com/defer-run/defer.client)`,
        Authorization: basicAuth("", accessToken),
      },
    };

    let response: Response;
    let data: string;

    try {
      response = await fetch(endpoint.toString(), options);
    } catch (error) {
      let message;

      if (error instanceof Error)
        message = `cannot execute http request: ${error.message}`;
      else message = `unknown error: ${String(error)}`;

      throw new ClientError(message);
    }

    try {
      data = await response.text();
    } catch (error) {
      let message;

      if (error instanceof Error)
        message = `cannot decode http response: ${error.message}`;
      else message = `unknown error: ${String(error)}`;

      throw new Error(message);
    }

    const { status } = response;
    if (status >= 100 && status < 200) {
      throw new ClientError("unexpected 1xx response code");
    } else if (status >= 200 && status < 300) {
      try {
        return JSON.parse(data) as T;
      } catch (error) {
        const e = error as Error;
        throw new ClientError(`cannot decode http response body: ${e.message}`);
      }
    } else if (status >= 300 && status < 400) {
      throw new ClientError("unexpected 3xx response code");
    } else if (status >= 400 && status < 500) {
      let decodedData: APIErrorResponse;
      try {
        decodedData = JSON.parse(data);
      } catch (error) {
        const e = error as Error;
        throw new ClientError(`cannot decode http response body: ${e.message}`);
      }

      throw new APIError(decodedData.message, decodedData.code);
    } else if (status >= 500 && status < 600) {
      throw new HTTPRequestError("internal server error", status, data);
    } else {
      throw new HTTPRequestError(
        `invalid http response status code: ${status}`,
        status,
        data
      );
    }
  };
}
