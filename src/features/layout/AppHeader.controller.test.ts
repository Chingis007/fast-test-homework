import { reaction } from "mobx";
import { describe, expect, it } from "vitest";
import { AppHeaderController } from "./AppHeader.controller";
import { BooksStore } from "../books/BooksStore";
import { makeBook } from "../../test/fakes";

const setup = () => {
  const booksStore = new BooksStore();
  return { booksStore, controller: new AppHeaderController(booksStore, "kyrylo") };
};

describe("AppHeaderController", () => {
  it("names the current user", () => {
    expect(setup().controller.title).toBe("Books of kyrylo");
  });

  describe("counter", () => {
    it("reads as unknown before anything has been fetched", () => {
      // "0" would claim the user has no books; the truth is we do not know
      expect(setup().controller.counterText).toBe("Your books: —");
    });

    it("shows the count once the private list has been read", () => {
      const { booksStore, controller } = setup();

      booksStore.setPrivate([makeBook({ id: 1 }), makeBook({ id: 2 })]);

      expect(controller.counterText).toBe("Your books: 2");
    });

    it("says zero only when the server really returned nothing", () => {
      const { booksStore, controller } = setup();

      booksStore.setPrivate([]);

      expect(controller.counterText).toBe("Your books: 0");
    });

    it("stays unknown when only the other list was loaded", () => {
      const { booksStore, controller } = setup();

      booksStore.setAll([makeBook({ id: 1 })]);

      expect(controller.counterText).toBe("Your books: —");
    });

    it("tracks the shared count without knowing who loaded it", () => {
      const { booksStore, controller } = setup();
      const texts: string[] = [];
      const stop = reaction(
        () => controller.counterText,
        (text) => texts.push(text)
      );

      booksStore.setPrivate([makeBook({ id: 1 }), makeBook({ id: 2 })]);
      stop();

      expect(texts).toEqual(["Your books: 2"]);
    });
  });
});
