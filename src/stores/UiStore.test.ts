import { reaction } from "mobx";
import { describe, expect, it } from "vitest";
import { UiStore } from "./UiStore";

describe("UiStore", () => {
  it("shows all books until told otherwise", () => {
    expect(new UiStore().booksScope).toBe("all");
  });

  it("switches between the two mutually exclusive scopes", () => {
    const store = new UiStore();

    store.setBooksScope("private");
    expect(store.booksScope).toBe("private");

    store.setBooksScope("all");
    expect(store.booksScope).toBe("all");
  });

  it("is observable, so a controller can react to the switch", () => {
    const store = new UiStore();
    const seen: string[] = [];
    const stop = reaction(
      () => store.booksScope,
      (scope) => seen.push(scope)
    );

    store.setBooksScope("private");
    stop();

    expect(seen).toEqual(["private"]);
  });
});
