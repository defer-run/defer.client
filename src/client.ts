import type { HTTPClient } from "./httpClient.js";
import type { ExecutionMetadata } from "./index.js";
import { jitter } from "./jitter.js";

export interface EnqueueExecutionRequest {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  arguments: any[];
  scheduleFor: Date;
  discardAfter?: Date;
  metadata: ExecutionMetadata;
}

export interface EnqueueExecutionResponse {
  id: string;
}

export interface FetchExecutionRequest {
  id: string;
}

export type ExecutionState =
  | "created"
  | "started"
  | "succeed"
  | "failed"
  | "cancelled"
  | "cancelling"
  | "aborting"
  | "aborted";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface FetchExecutionResponse<R = any> {
  id: string;
  state: ExecutionState;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: R;
}

export type PoolExecutionRequest = FetchExecutionRequest;

export type PoolExecutionResponse = FetchExecutionResponse;

export interface CancelExecutionRequest {
  id: string;
  force: boolean;
}

export interface CancelExecutionResponse {}

export function cancelExecution(
  client: HTTPClient,
  request: CancelExecutionRequest
): Promise<CancelExecutionResponse> {
  const data = JSON.stringify({ force: request.force });
  return client<CancelExecutionResponse>(
    "POST",
    `/public/v1/executions/${request.id}/cancel`,
    data
  );
}

export interface GetExecutionTriesRequest {
  id: string;
}

export type GetExecutionTriesResponse = [
  {
    id: string;
    state: string;
  }
];

export function getExecutionTries(
  client: HTTPClient,
  request: GetExecutionTriesRequest
): Promise<GetExecutionTriesResponse> {
  return client<GetExecutionTriesResponse>(
    "GET",
    `/public/v1/executions/${request.id}/tries`
  );
}

export interface RescheduleExecutionRequest {
  id: string;
  scheduleFor: Date;
}

export interface RescheduleExecutionResponse {}

export function rescheduleExecution(
  client: HTTPClient,
  request: RescheduleExecutionRequest
): Promise<RescheduleExecutionResponse> {
  const data = JSON.stringify({ schedule_for: request.scheduleFor });
  return client<RescheduleExecutionResponse>(
    "POST",
    `/public/v1/executions/${request.id}/cancel`,
    data
  );
}

export function enqueueExecution(
  client: HTTPClient,
  request: EnqueueExecutionRequest
): Promise<EnqueueExecutionResponse> {
  const data = JSON.stringify({
    name: request.name,
    arguments: request.arguments,
    schedule_for: request.scheduleFor,
    metadata: request.metadata,
  });
  return client<EnqueueExecutionResponse>("POST", "/public/v1/enqueue", data);
}

export function fetchExecution(
  client: HTTPClient,
  request: FetchExecutionRequest
): Promise<FetchExecutionResponse> {
  return client<FetchExecutionResponse>(
    "GET",
    `/public/v1/executions/${request.id}`
  );
}

export async function waitExecutionResult(
  client: HTTPClient,
  request: PoolExecutionRequest
): Promise<PoolExecutionResponse> {
  let attempts = 1;

  return new Promise<PoolExecutionResponse>((resolve, reject) => {
    const pool = function () {
      fetchExecution(client, request).then(
        (response) => {
          switch (response.state) {
            case "failed":
              resolve(response);
              break;
            case "succeed":
              resolve(response);
              break;
            default:
              setTimeout(pool, jitter(attempts++) * 1000);
          }

          return;
        },
        (error) => reject(error)
      );
    };

    setTimeout(pool, jitter(attempts++) * 1000);
  });
}
