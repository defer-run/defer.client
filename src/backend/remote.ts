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
  EnqueueResult,
  Execution,
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

export interface ReRunExecutionRequest {}

export type CreateExecutionResponse = SingleObjectResponse<APIExecution>;

export type GetExecutionResponse = SingleObjectResponse<APIExecution>;

export type ReRunExecutionResponse = SingleObjectResponse<APIExecution>;

export type RescheduleExecutionResponse = SingleObjectResponse<APIExecution>;

export type CancelExecutionResponse = SingleObjectResponse<APIExecution>;

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
  args: string,
  scheduleFor: Date,
  discardAfter: Date | undefined
): Promise<EnqueueResult> {
  const originalFunction = func.__fn;
  const httpClient = newClientFromEnv();

  const request: CreateExecutionRequest = {
    function_name: func.__fn.name,
    function_arguments: [], // TODO
    schedule_for: scheduleFor.toISOString(),
    discard_after: discardAfter?.toISOString(),
    metadata: func.__execOptions?.metadata || {},
  };

  try {
    const response = await httpClient<CreateExecutionResponse>(
      "PUT",
      "/public/v2/enqueue",
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
  _pageRequest?: PageRequest,
  _filters?: ExecutionFilters
): Promise<ListExecutionsResult> {
  return {} as any;
}

export async function listExecutionAttempts(
  _id: string,
  _pageRequest?: PageRequest,
  _filters?: ExecutionFilters
): Promise<ListExecutionAttemptsResult> {
  return {} as any;
}
