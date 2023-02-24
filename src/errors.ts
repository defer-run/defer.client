export class DeferError extends Error {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, DeferError.prototype);
  }
}

export class ClientError extends DeferError {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, ClientError.prototype);
  }
}

export class HTTPRequestError extends ClientError {
  public readonly status: number;
  public readonly body: string;

  constructor(msg: string, status: number, body: string) {
    super(msg);
    this.status = status;
    this.body = body;
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

export class APIError extends ClientError {
  public readonly code: string;

  constructor(msg: string, code: string) {
    super(msg);
    this.code = code;
    Object.setPrototypeOf(this, APIError.prototype);
  }
}
