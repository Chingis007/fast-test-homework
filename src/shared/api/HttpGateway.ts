/**
 * The seam between the application and the network. Repositories depend on
 * this interface, never on `fetch`; `test/setup.ts` blocks `fetch` outright,
 * so the whole suite runs offline against fakes.
 */
export interface HttpGateway {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, payload: unknown): Promise<T>;
}

/** The server answered, but not with success. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly url: string
  ) {
    super(`Request to ${url} failed with status ${status}`);
    this.name = "ApiError";
  }
}

/**
 * The server never answered — offline, DNS, CORS, or a rejected certificate.
 * `fetch` signals this with a bare `TypeError`, which is indistinguishable
 * from a programming error until it is wrapped here.
 */
export class NetworkError extends Error {
  constructor(readonly url: string, cause: unknown) {
    // standard `cause`, not a shadowing field: devtools and loggers read it
    super(`Request to ${url} could not be sent`, { cause });
    this.name = "NetworkError";
  }
}
