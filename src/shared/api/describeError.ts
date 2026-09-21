import { ApiError, NetworkError } from "./HttpGateway";

const OFFLINE = "Cannot reach the server. Check your connection.";
const SERVER = "The server had a problem. Please try again.";
const NOT_FOUND = "The server could not find what was requested.";

/**
 * Turns a thrown transport error into something worth showing a person.
 * `fallback` carries the wording specific to the action that failed, used
 * whenever the failure says nothing more useful than "it did not work".
 */
export const describeError = (error: unknown, fallback: string): string => {
  if (error instanceof NetworkError) {
    return OFFLINE;
  }

  if (error instanceof ApiError) {
    if (error.status >= 500) return SERVER;
    if (error.status === 404) return NOT_FOUND;
  }

  return fallback;
};
