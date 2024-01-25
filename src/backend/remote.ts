// Copyright (c) 2021-2023 Defer SAS <hello@defer.run>.
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
// REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
// AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
// LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
// OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
// PERFORMANCE OF THIS SOFTWARE.

import {
  CancelExecutionResult,
  DateInterval,
  EnqueueResult,
  Execution,
  ExecutionErrorCode,
  ExecutionFilters,
  ExecutionState,
  GetExecutionResult,
  ListExecutionAttemptsResult,
  ListExecutionsResult,
  PageRequest,
  ReRunExecutionResult,
  RescheduleExecutionResult,
} from "../backend.js";
import { DeferableFunction, DeferredFunction } from "../index.js";
import { error } from "../logger.js";
import { getEnv, stringify } from "../utils.js";
import { HTTPClient, makeHTTPClient } from "./remote/httpClient.js";

export interface SingleObjectResponse<T> {
  data: T;
}

export interface Page {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

export interface PageInfo {
  has_next_page: boolean;
  has_prev_page: boolean;
  start_cursor: string;
  end_cursor: string;
}

export interface ListObjectsResponse<T> {
  page_info: PageInfo;
  data: T[];
}

export interface ListObjectRequest<T> {
  page: Page | undefined;
  filters: T | undefined;
}

export interface APIExecution {
  id: string;
  state: ExecutionState;
  function_name: string;
  function_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExecutionRequest {
  function_name: string;
  function_arguments: string[];
  schedule_for: string;
  discard_after: string | undefined;
  metadata: { [key: string]: string };
}

export interface CancelExecutionRequest {
  force: boolean;
}

export interface RescheduleExecutionRequest {
  schedule_for: string;
}

export interface ListExecutionFilters {
  states?: ExecutionState[] | undefined;
  function_ids?: string[] | undefined;
  error_codes?: ExecutionErrorCode[] | undefined;
  scheduled_at?: DateInterval | undefined;
  started_at?: DateInterval | undefined;
  executed_by?: string | undefined;
  metadata?:
    | {
        key: string;
        values: string[];
      }[]
    | undefined;
}

export type ListExecutionsRequest = ListObjectRequest<ListExecutionFilters>;

export type ListExecutionAttemptsRequest =
  ListObjectRequest<ListExecutionFilters>;

export interface ReRunExecutionRequest {}

export type CreateExecutionResponse = SingleObjectResponse<APIExecution>;

export type GetExecutionResponse = SingleObjectResponse<APIExecution>;

export type ReRunExecutionResponse = SingleObjectResponse<APIExecution>;

export type RescheduleExecutionResponse = SingleObjectResponse<APIExecution>;

export type CancelExecutionResponse = SingleObjectResponse<APIExecution>;

export type ListExecutionsResponse = ListObjectsResponse<APIExecution>;

export type ListExecutionAttemptsResponse = ListObjectsResponse<APIExecution>;

function newExecution(o: APIExecution): Execution {
  return {
    id: o.id,
    state: o.state,
    functionName: o.function_name,
    functionId: o.function_id,
    updatedAt: new Date(Date.parse(o.updated_at)),
    createdAt: new Date(Date.parse(o.created_at)),
  };
}

function newClientFromEnv(): HTTPClient {
  const accessToken = getEnv("DEFER_TOKEN") || "";
  const endpoint = getEnv("DEFER_ENDPOINT") || "https://api.defer.run";

  return makeHTTPClient(endpoint, accessToken);
}

export async function enqueue<F extends DeferableFunction>(
  func: DeferredFunction<F>,
  args: Parameters<F>,
  scheduleFor: Date,
  discardAfter: Date | undefined
): Promise<EnqueueResult> {
  const originalFunction = func.__fn;
  const httpClient = newClientFromEnv();

  const request: CreateExecutionRequest = {
    function_name: func.__fn.name,
    function_arguments: args,
    schedule_for: scheduleFor.toISOString(),
    discard_after: discardAfter?.toISOString(),
    metadata: func.__execOptions?.metadata || {},
  };

  try {
    const response = await httpClient<CreateExecutionResponse>(
      "PUT",
      "/public/v2/executions",
      stringify(request)
    );
    return newExecution(response.data);
  } catch (e) {
    error("cannot enqueue function is the queue", {
      function: originalFunction.name,
    });
    throw e;
  }
}

export async function getExecution(id: string): Promise<GetExecutionResult> {
  const httpClient = newClientFromEnv();
  const response = await httpClient<GetExecutionResponse>(
    "GET",
    `/public/v2/executions/${id}`
  );
  return newExecution(response.data);
}

export async function cancelExecution(
  id: string,
  force: boolean
): Promise<CancelExecutionResult> {
  const httpClient = newClientFromEnv();
  const request: CancelExecutionRequest = { force: force };
  const response = await httpClient<CancelExecutionResponse>(
    "POST",
    `/public/v2/executions/${id}/cancellation`,
    stringify(request)
  );
  return newExecution(response.data);
}

export async function rescheduleExecution(
  id: string,
  scheduleFor: Date
): Promise<RescheduleExecutionResult> {
  const httpClient = newClientFromEnv();
  const request: RescheduleExecutionRequest = {
    schedule_for: scheduleFor.toISOString(),
  };
  const response = await httpClient<RescheduleExecutionResponse>(
    "PATCH",
    `/public/v2/executions/${id}/schedule`,
    stringify(request)
  );
  return newExecution(response.data);
}

export async function reRunExecution(
  id: string
): Promise<ReRunExecutionResult> {
  const httpClient = newClientFromEnv();
  const request: ReRunExecutionRequest = {};
  const response = await httpClient<ReRunExecutionResponse>(
    "POST",
    `/public/v2/executions/${id}/reruns`,
    stringify(request)
  );
  return newExecution(response.data);
}

export async function listExecutions(
  pageRequest?: PageRequest,
  filters?: ExecutionFilters
): Promise<ListExecutionsResult> {
  const httpClient = newClientFromEnv();
  const request: ListExecutionsRequest = {
    page: pageRequest,
    filters: filters
      ? {
          states: filters?.states,
          error_codes: filters?.errorCodes,
          function_ids: filters?.functionIds,
          scheduled_at: filters?.scheduleAt,
          started_at: filters?.startedAt,
          executed_by: filters?.executedBy,
          metadata: filters?.metadata,
        }
      : undefined,
  };
  const response = await httpClient<ListExecutionsResponse>(
    "POST",
    `/public/v2/executions`,
    stringify(request)
  );

  const executions: Execution[] = [];
  for (const data of response.data) executions.push(newExecution(data));

  return {
    pageInfo: {
      hasPrevPage: response.page_info.has_prev_page,
      hasNextPage: response.page_info.has_next_page,
      startCursor: response.page_info.start_cursor,
      endCursor: response.page_info.end_cursor,
    },
    data: executions,
  };
}

export async function listExecutionAttempts(
  id: string,
  pageRequest?: PageRequest,
  filters?: ExecutionFilters
): Promise<ListExecutionAttemptsResult> {
  const httpClient = newClientFromEnv();
  const request: ListExecutionAttemptsRequest = {
    page: pageRequest,
    filters: filters
      ? {
          states: filters?.states,
          error_codes: filters?.errorCodes,
          function_ids: filters?.functionIds,
          scheduled_at: filters?.scheduleAt,
          started_at: filters?.startedAt,
          executed_by: filters?.executedBy,
          metadata: filters?.metadata,
        }
      : undefined,
  };
  const response = await httpClient<ListExecutionAttemptsResponse>(
    "POST",
    `/public/v2/executions/${id}/attempts`,
    stringify(request)
  );

  const executions: Execution[] = [];
  for (const data of response.data) executions.push(newExecution(data));

  return {
    pageInfo: {
      hasPrevPage: response.page_info.has_prev_page,
      hasNextPage: response.page_info.has_next_page,
      startCursor: response.page_info.start_cursor,
      endCursor: response.page_info.end_cursor,
    },
    data: executions,
  };
}
