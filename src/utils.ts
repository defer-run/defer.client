// Although the function implementation may not be completely secure,
// it is suitable for local use. The reason we use the conditional is
// because Bun lacks support for URL.createObjectURL, while Remix and
// Cloudflare Workers (without NodeJS support enabled) lacks support for crypto
export function randomUUID() {
  if (typeof crypto === "undefined") {
    return URL.createObjectURL(new Blob([])).slice(-36);
  } else {
    return crypto.randomUUID();
  }
}

export function debug(...args: any) {
  if (getEnv("DEFER_DEBUG")) {
    console.debug(...args);
  }
}

export function getEnv(key: string): string | undefined {
  if (typeof process !== "undefined") return process.env[key];
  if (typeof globalThis !== "undefined") return (globalThis as any)[key];
  return;
}

export function sanitizeFunctionArguments(values: any): any {
  try {
    const stringified = JSON.stringify(values);
    const sanitized = JSON.parse(stringified);
    return sanitized;
  } catch (e) {
    const error = e as Error;
    throw new Error(`cannot serialize argument: ${error.message}`);
  }
}
