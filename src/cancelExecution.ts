import {
  cancelExecution as cancelExecution2,
  CancelExecutionResponse,
} from "./client.js";
import { makeHTTPClient } from "./httpClient.js";
import { getAccessToken, getEndpoint } from "./index.js";

export async function cancelExecution(
  id: string,
  force: boolean = false
): Promise<CancelExecutionResponse> {
  const httpClient = makeHTTPClient(getEndpoint(), getAccessToken());
  if (httpClient) return cancelExecution2(httpClient, { id, force });

  return {};
}
