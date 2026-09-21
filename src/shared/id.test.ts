import { describe, expect, it, vi } from "vitest";
import { nextId } from "./id";

describe("nextId", () => {
  it("never repeats, even when the clock does not move", () => {
    // Date.now() has millisecond resolution; a fast burst used to collide.
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

    const ids = Array.from({ length: 50 }, nextId);

    expect(new Set(ids).size).toBe(50);
    vi.restoreAllMocks();
  });

  it("keeps ids ascending so they stay time-ordered", () => {
    const ids = Array.from({ length: 10 }, nextId);

    expect([...ids].sort((a, b) => a - b)).toEqual(ids);
  });
});
