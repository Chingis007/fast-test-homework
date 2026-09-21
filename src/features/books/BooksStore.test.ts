import { describe, expect, it } from "vitest";
import { BooksStore } from "./BooksStore";
import { makeBook } from "../../test/fakes";

describe("BooksStore", () => {
  it("starts empty, with the private list explicitly not loaded", () => {
    const store = new BooksStore();

    expect(store.allBooks).toEqual([]);
    expect(store.privateBooks).toEqual([]);
    expect(store.privateCount).toBe(0);
    // the distinction the header relies on: unknown, not zero
    expect(store.isPrivateLoaded).toBe(false);
  });

  it("keeps the two lists independent", () => {
    const store = new BooksStore();

    store.setAll([makeBook({ id: 1 }), makeBook({ id: 2 })]);

    expect(store.allBooks).toHaveLength(2);
    expect(store.privateBooks).toEqual([]);
    expect(store.isPrivateLoaded).toBe(false);
  });

  it("counts private books and marks them loaded", () => {
    const store = new BooksStore();

    store.setPrivate([makeBook({ id: 1 }), makeBook({ id: 2 }), makeBook({ id: 3 })]);

    expect(store.privateCount).toBe(3);
    expect(store.isPrivateLoaded).toBe(true);
  });

  it("stays loaded when a later read returns nothing", () => {
    const store = new BooksStore();
    store.setPrivate([makeBook({ id: 1 })]);

    store.setPrivate([]);

    expect(store.privateCount).toBe(0);
    expect(store.isPrivateLoaded).toBe(true);
  });
});
