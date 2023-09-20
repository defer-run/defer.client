// Although the function implementation may not be completely secure,
// it is suitable for local use.
export function randomUUID() {
  return URL.createObjectURL(new Blob([])).slice(-36);
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
