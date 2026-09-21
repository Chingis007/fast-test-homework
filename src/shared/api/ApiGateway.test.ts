import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiGateway } from "./ApiGateway";
import { ApiError, NetworkError } from "./HttpGateway";

const BASE = "https://example.test/v1/books/kyrylo";

const respondWith = (body: unknown, ok = true, status = 200) =>
  vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body
  } as Response);

describe("ApiGateway", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("appends the path to the base url and returns parsed json", async () => {
    const fetchMock = respondWith([{ id: 1 }]);
    vi.stubGlobal("fetch", fetchMock);

    const result = await new ApiGateway(BASE).get<unknown[]>("/private");

    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/private`);
    expect(result).toEqual([{ id: 1 }]);
  });

  it("posts json with the right headers", async () => {
    const fetchMock = respondWith({ status: "ok" });
    vi.stubGlobal("fetch", fetchMock);

    await new ApiGateway(BASE).post("/", { name: "Dune" });

    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Dune" })
    });
  });

  it("throws ApiError on a non-2xx response instead of parsing the body", async () => {
    vi.stubGlobal("fetch", respondWith({}, false, 500));

    await expect(new ApiGateway(BASE).get("/")).rejects.toBeInstanceOf(ApiError);
  });

  it("carries the status so callers can tell failures apart", async () => {
    vi.stubGlobal("fetch", respondWith({}, false, 404));

    await expect(new ApiGateway(BASE).get("/")).rejects.toMatchObject({ status: 404 });
  });

  it("wraps an unsent request as NetworkError, not a bare TypeError", async () => {
    // fetch rejects like this when offline, on DNS failure, or a refused cert
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(new ApiGateway(BASE).get("/")).rejects.toBeInstanceOf(NetworkError);
  });

  it("keeps the original failure reachable through the standard cause", async () => {
    const original = new TypeError("Failed to fetch");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(original));

    const error = await new ApiGateway(BASE).get("/").catch((e: unknown) => e);

    expect((error as NetworkError).cause).toBe(original);
    expect((error as NetworkError).url).toBe(`${BASE}/`);
  });

  it("wraps a failed POST too", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(new ApiGateway(BASE).post("/", {})).rejects.toBeInstanceOf(NetworkError);
  });
})
