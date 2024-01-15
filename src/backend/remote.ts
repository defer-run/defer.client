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

import { DeferableFunction, DeferredFunction } from "../../index.js";
import { debug, error, info } from "../../logger.js";
import {
  fromDurationToDate,
  getEnv,
  sanitizeFunctionArguments,
} from "../../utils.js";
import { HTTPClient, makeHTTPClient } from "./httpClient.js";

function newClientFromEnv(): HTTPClient {
  const accessToken = getEnv("DEFER_TOKEN") || "";
  const endpoint = getEnv("DEFER_ENDPOINT") || "https://api.defer.run";

  return makeHTTPClient(endpoint, accessToken);
}

export async function enqueue<F extends DeferableFunction>(
  func: DeferredFunction<F>,
  args: Parameters<F>
): Promise<any> {
  const originalFunction = func.__fn;

  debug("serializing function arguments", { function: originalFunction.name });
  const functionArguments = sanitizeFunctionArguments(args);

  debug("creating http defer client from environment variable", {
    function: originalFunction.name,
  });
  const httpClient = newClientFromEnv();

  debug("preparing enqueue request", { function: originalFunction.name });
  const request: any = {
    name: originalFunction.name,
    arguments: functionArguments,
    metadata: func.__execOptions?.metadata || {},
  };

  const delay = func.__execOptions?.delay;
  if (delay instanceof Date) {
    request.schedule_for = delay;
  } else if (delay) {
    const now = new Date();
    request.schedule_for = fromDurationToDate(now, delay);
  } else {
    request.schedule_for = new Date();
  }

  const after = func.__execOptions?.discardAfter;
  if (after instanceof Date) {
    request.discard_after = after;
  } else if (after) {
    const now = new Date();
    request.discard_after = fromDurationToDate(now, after);
  }

  info("enqueueing function in the queue", { function: originalFunction.name });
  try {
    const response = await httpClient("POST", "/public/v1/enqueue", request);
    return {
      id: response.id,
    };
  } catch (e) {
    error("cannot enqueue function is the queue", {
      function: originalFunction.name,
    });
    throw e;
  }
}
