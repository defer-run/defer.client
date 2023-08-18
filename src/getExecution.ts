import { fetchExecution, FetchExecutionResponse } from "./client.js";
import { APIError } from "./errors.js";
import { makeHTTPClient } from "./httpClient.js";
import { __database, getAccessToken, getEndpoint } from "./index.js";

export async function getExecution(
  id: string
): Promise<FetchExecutionResponse> {
  const httpClient = makeHTTPClient(getEndpoint(), getAccessToken());
  if (httpClient) return fetchExecution(httpClient, { id });

  console.log("getExecution", id);

  const response = __database.get(id);
  if (response)
    return Promise.resolve({
      ...response,
      state: response.state,
    });

  throw new APIError("execution not found", "not found");
}
