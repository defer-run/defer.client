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

import parseDuration, { Units } from "parse-duration";

export type Duration = `${string}${Units}`;

export function randomUUID() {
  // Although the function implementation may not be completely secure,
  // it is suitable for local use. The reason we use the conditional is
  // because Bun lacks support for URL.createObjectURL, while Remix and
  // Cloudflare Workers (without NodeJS support enabled) lacks support for crypto

  if (typeof crypto === "undefined") {
    return URL.createObjectURL(new Blob([])).slice(-36);
  } else {
    return crypto.randomUUID();
  }
}

export function getEnv(key: string): string | undefined {
  if (typeof process !== "undefined") return process.env[key];
  if (typeof globalThis !== "undefined") return (globalThis as any)[key];
  return;
}

export function stringify(src: any): string {
  try {
    return JSON.stringify(src);
  } catch (e) {
    const error = e as Error;
    throw new Error(`cannot stringify value: ${error.message}`);
  }
}

export function isDebugEnabled(): boolean {
  return getEnv("DEFER_DEBUG") !== undefined;
}

export function fromDurationToDate(dt: Date, delay: Duration): Date {
  return new Date(dt.getTime() + parseDuration(delay)!);
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function errorMessage(error: Error): string {
  let message = error.message;

  if (error.cause instanceof Error) {
    message = `${message}: ${errorMessage(error.cause)}`;
  } else {
    message = `${message}: ${String(error.cause)}`;
  }

  return message;
}
