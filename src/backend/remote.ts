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
  GetExecutionResult,
  RescheduleExecutionResult,
} from "../backend.js";
import { DeferableFunction, DeferredFunction } from "../index.js";
import { error } from "../logger.js";
import { getEnv } from "../utils.js";
import { HTTPClient, makeHTTPClient } from "./remote/httpClient.js";

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

  const request: any = {
    name: func.__fn.name,
    arguments: args,
    scheduleFor,
    discardAfter,
    metadata: func.__execOptions?.metadata || {},
  };

  try {
    const response = await httpClient("POST", "/public/v1/enqueue", request);
    return {
      id: response.id,
      state: response.state,
      functionName: response.function_name,
      functionId: response.function_id,
      updatedAt: response.updated_at,
      createdAt: response.created_at,
    };
  } catch (e) {
    error("cannot enqueue function is the queue", {
      function: originalFunction.name,
    });
    throw e;
  }
}

export async function getExecution(id: string): Promise<GetExecutionResult> {
  const httpClient = newClientFromEnv();
  const response = await httpClient("GET", `/public/v1/executions/${id}`);
  return {
    id: response.id,
    state: response.state,
    functionName: response.function_name,
    functionId: response.function_id,
    updatedAt: response.updated_at,
    createdAt: response.created_at,
  };
}

export async function cancelExecution(
  id: string,
  force: boolean
): Promise<CancelExecutionResult> {
  const httpClient = newClientFromEnv();
  const request = JSON.stringify({ force: force });
  const response = await httpClient(
    "POST",
    `/public/v1/executions/${id}/cancel`,
    request
  );
  return {
    id: response.id,
    state: response.state,
    functionName: response.function_name,
    functionId: response.function_id,
    updatedAt: response.updated_at,
    createdAt: response.created_at,
  };
}

export async function rescheduleExecution(
  id: string,
  scheduleFor: Date
): Promise<RescheduleExecutionResult> {
  const httpClient = newClientFromEnv();
  const request = JSON.stringify({ schedule_for: scheduleFor });
  const response = await httpClient(
    "POST",
    `/public/v1/executions/${id}/reschedule`,
    request
  );
  return {
    id: response.id,
    state: response.state,
    functionName: response.function_name,
    functionId: response.function_id,
    updatedAt: response.updated_at,
    createdAt: response.created_at,
  };
}
