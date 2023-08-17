import {
  cancelExecution as cancelExecution2,
  CancelExecutionResponse,
} from "./client.js";
import { __httpClient } from "./index.js";

export async function cancelExecution(
  id: string,
  force: boolean = false
): Promise<CancelExecutionResponse> {
  if (__httpClient) return cancelExecution2(__httpClient, { id, force });

  return {};
}
