import { describe, expect, it } from "vitest";
import { describeError } from "./describeError";
import { ApiError, NetworkError } from "./HttpGateway";

const FALLBACK = "Could not load books. Please try again.";

describe("describeError", () => {
  it("tells the user the server was never reached", () => {
    const text = describeError(new NetworkError("https://x.test/", new TypeError()), FALLBACK);

    expect(text).toBe("Cannot reach the server. Check your connection.");
  });

  it("separates a server fault from the caller's problem", () => {
    expect(describeError(new ApiError(500, "u"), FALLBACK)).toBe(
      "The server had a problem. Please try again."
    );
    expect(describeError(new ApiError(503, "u"), FALLBACK)).toBe(
      "The server had a problem. Please try again."
    );
  });

  it("names a missing resource", () => {
    expect(describeError(new ApiError(404, "u"), FALLBACK)).toBe(
      "The server could not find what was requested."
    );
  });

  it("falls back to the action's own wording for anything else", () => {
    expect(describeError(new ApiError(418, "u"), FALLBACK)).toBe(FALLBACK);
    expect(describeError(new Error("boom"), FALLBACK)).toBe(FALLBACK);
    expect(describeError("not even an error", FALLBACK)).toBe(FALLBACK);
  });

  it("keeps the fallback action-specific", () => {
    const submit = "Could not add the book. Please try again.";

    expect(describeError(new Error("boom"), submit)).toBe(submit);
  });
});
