import { autorun, reaction } from "mobx";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BooksPageController } from "./BooksPage.controller";
import { BooksStore } from "./BooksStore";
import { BooksUiStore } from "./BooksUiStore";
import { NetworkError } from "../../shared/api/HttpGateway";
import { FakeBooksRepository, makeBook } from "../../test/fakes";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("BooksPageController", () => {
  let booksStore: BooksStore;
  let uiStore: BooksUiStore;
  let repository: FakeBooksRepository;
  let controller: BooksPageController;

  beforeEach(() => {
    booksStore = new BooksStore();
    uiStore = new BooksUiStore();
    repository = new FakeBooksRepository();
    repository.all = [makeBook({ id: 1, name: "I, Robot", author: "Isaac Asimov" })];
    repository.private = [makeBook({ id: 1 }), makeBook({ id: 2 })];
    controller = new BooksPageController(booksStore, uiStore, repository);
  });

  describe("before anything has been fetched", () => {
    it("shows the loader rather than claiming the shelf is empty", () => {
      // mount() runs from a useEffect, i.e. after the first paint
      expect(controller.isSpinnerVisible).toBe(true);
      expect(controller.isEmptyVisible).toBe(false);
      expect(controller.hasLoaded).toBe(false);
    });

    it("keeps the loader up once fetching actually starts", () => {
      repository.holdGetAll = true;

      controller.mount();

      expect(controller.isSpinnerVisible).toBe(true);
      expect(controller.isEmptyVisible).toBe(false);
    });

    it("only says there are no books after a load came back with none", async () => {
      repository.all = [];
      repository.private = [];

      controller.mount();
      await flush();

      expect(controller.hasLoaded).toBe(true);
      expect(controller.isEmptyVisible).toBe(true);
      expect(controller.isSpinnerVisible).toBe(false);
    });

    it("counts a failed load as having looked", async () => {
      vi.spyOn(console, "debug").mockImplementation(() => {});
      repository.failGetAll = true;

      controller.mount();
      await flush();

      expect(controller.hasLoaded).toBe(true);
    });

    it("does not count a response that arrived after dispose", async () => {
      repository.holdGetAll = true;
      controller.mount();

      controller.dispose();
      repository.resolveAll([]);
      await flush();

      // that load never really finished, so the page still has not looked
      expect(controller.hasLoaded).toBe(false);
    });
  });

  describe("mount", () => {
    it("loads the visible scope and the private count in one pass", async () => {
      controller.mount();
      await flush();

      expect(repository.getAllCalls).toBe(1);
      expect(repository.getPrivateCalls).toBe(1);
      expect(booksStore.allBooks).toHaveLength(1);
      expect(booksStore.privateCount).toBe(2);
    });

    it("skips the extra private request when private is the visible scope", async () => {
      uiStore.setBooksScope("private");

      controller.mount();
      await flush();

      expect(repository.getAllCalls).toBe(0);
      expect(repository.getPrivateCalls).toBe(1);
      expect(booksStore.privateCount).toBe(2);
    });

    it("toggles the loading flag around the request", async () => {
      repository.holdGetAll = true;

      controller.mount();
      expect(controller.isLoading).toBe(true);

      repository.resolveAll([]);
      await flush();

      expect(controller.isLoading).toBe(false);
    });
  });

  describe("view model", () => {
    it("formats each row as 'author: name' with a stable key", async () => {
      controller.mount();
      await flush();

      expect(controller.books).toEqual([{ key: "1-0", title: "Isaac Asimov: I, Robot" }]);
    });

    it("shows the list and hides the empty state when books exist", async () => {
      controller.mount();
      await flush();

      expect(controller.isListVisible).toBe(true);
      expect(controller.isEmptyVisible).toBe(false);
      expect(controller.isErrorVisible).toBe(false);
    });

    it("shows a scope-specific empty message when there is nothing to list", async () => {
      repository.all = [];
      repository.private = [];

      controller.mount();
      await flush();

      expect(controller.isEmptyVisible).toBe(true);
      expect(controller.emptyText).toBe("There are no books yet.");

      controller.onScopeChange("private");
      await flush();

      expect(controller.emptyText).toBe("You have not added any books yet.");
    });

    it("keys a record the server stored without an id", async () => {
      repository.all = [makeBook({ id: null, name: "Orphan", author: "Nobody" })];

      controller.mount();
      await flush();

      // the record is saved, it just has no identity — hence "no-id", not "unsaved"
      expect(controller.books[0].key).toBe("no-id-0");
    });

    it("keeps duplicate server ids distinguishable", async () => {
      repository.all = [makeBook({ id: 777 }), makeBook({ id: 777 })];

      controller.mount();
      await flush();

      const keys = controller.books.map((row) => row.key);
      expect(new Set(keys).size).toBe(2);
    });

    it("marks exactly one scope option as active", () => {
      expect(controller.scopeOptions).toEqual([
        { value: "all", label: "All books", isActive: true },
        { value: "private", label: "Private books", isActive: false }
      ]);

      controller.onScopeChange("private");

      expect(controller.scopeOptions.map((option) => option.isActive)).toEqual([false, true]);
    });
  });

  describe("scope switching", () => {
    it("reloads through the private endpoint when the scope changes", async () => {
      controller.mount();
      await flush();
      const privateCallsAfterMount = repository.getPrivateCalls;

      controller.onScopeChange("private");
      await flush();

      expect(repository.getPrivateCalls).toBe(privateCallsAfterMount + 1);
      expect(controller.books).toHaveLength(2);
    });

    it("does not fetch the private list twice for the counter once it is loaded", async () => {
      controller.mount();
      await flush();

      controller.onScopeChange("private");
      await flush();
      controller.onScopeChange("all");
      await flush();

      // mount + switch to private + switch back (counter already known) = 2
      expect(repository.getPrivateCalls).toBe(2);
    });
  });

  describe("independent failures", () => {
    beforeEach(() => {
      vi.spyOn(console, "debug").mockImplementation(() => {});
    });

    it("keeps the list when only the counter's fetch fails", async () => {
      repository.failGetPrivate = true;

      controller.mount();
      await flush();

      // the successfully fetched list must not be discarded with the counter
      expect(booksStore.allBooks).toHaveLength(1);
      expect(controller.isListVisible).toBe(true);
      expect(controller.isErrorVisible).toBe(false);
      expect(booksStore.isPrivateLoaded).toBe(false);
    });

    it("still updates the counter when only the list's fetch fails", async () => {
      repository.failGetAll = true;

      controller.mount();
      await flush();

      expect(controller.isErrorVisible).toBe(true);
      expect(booksStore.privateCount).toBe(2);
      expect(booksStore.isPrivateLoaded).toBe(true);
    });

    it("tells the user the server is unreachable, not just that it failed", async () => {
      repository.failGetAll = true;
      repository.getAllError = new NetworkError("https://x.test/", new TypeError());

      controller.mount();
      await flush();

      expect(controller.errorText).toBe("Cannot reach the server. Check your connection.");
    });

    it("stays silent about the counter even when it fails for a visible reason", async () => {
      repository.failGetPrivate = true;
      repository.getPrivateError = new NetworkError("https://x.test/", new TypeError());

      controller.mount();
      await flush();

      // the list is fine, so an offline counter is not the user's problem
      expect(controller.errorText).toBe("");
      expect(controller.isListVisible).toBe(true);
    });

    it("retries the counter on the next load, since it was never loaded", async () => {
      repository.failGetPrivate = true;
      controller.mount();
      await flush();

      repository.failGetPrivate = false;
      controller.onRetry();
      await flush();

      expect(booksStore.privateCount).toBe(2);
    });
  });

  describe("refreshing", () => {
    it("shows the spinner only when there is nothing on screen yet", async () => {
      repository.holdGetAll = true;

      controller.mount();

      expect(controller.isSpinnerVisible).toBe(true);
      expect(controller.isListVisible).toBe(false);
      expect(controller.isRefreshing).toBe(false);

      repository.resolveAll();
      await flush();
    });

    it("keeps the rows visible while reloading them", async () => {
      controller.mount();
      await flush();
      repository.holdGetAll = true;

      controller.onRetry();

      expect(controller.isListVisible).toBe(true);
      expect(controller.isSpinnerVisible).toBe(false);
      expect(controller.isRefreshing).toBe(true);

      repository.resolveAll();
      await flush();
      expect(controller.isRefreshing).toBe(false);
    });

    it("does not flash the empty state while a reload is in flight", async () => {
      controller.mount();
      await flush();
      repository.holdGetAll = true;

      controller.onRetry();

      expect(controller.isEmptyVisible).toBe(false);

      repository.resolveAll();
      await flush();
    });
  });

  describe("failures", () => {
    beforeEach(() => {
      vi.spyOn(console, "debug").mockImplementation(() => {});
    });

    it("surfaces an error message and hides the list", async () => {
      repository.failGetAll = true;

      controller.mount();
      await flush();

      expect(controller.isErrorVisible).toBe(true);
      expect(controller.errorText).toBe("Could not load books. Please try again.");
      expect(controller.isListVisible).toBe(false);
      expect(controller.isLoading).toBe(false);
    });

    it("clears the error and reloads on retry", async () => {
      repository.failGetAll = true;
      controller.mount();
      await flush();

      repository.failGetAll = false;
      controller.onRetry();
      await flush();

      expect(controller.isErrorVisible).toBe(false);
      expect(controller.books).toHaveLength(1);
    });
  });

  describe("creation callback", () => {
    it("reloads both the list and the private counter", async () => {
      controller.mount();
      await flush();
      repository.private = [makeBook({ id: 1 }), makeBook({ id: 2 }), makeBook({ id: 3 })];

      controller.onBookAdded();
      await flush();

      expect(repository.getAllCalls).toBe(2);
      expect(booksStore.privateCount).toBe(3);
    });

  });

  describe("lifecycle and resource disposal", () => {
    it("stops reacting to scope changes after dispose", async () => {
      controller.mount();
      await flush();
      const callsBefore = repository.getAllCalls + repository.getPrivateCalls;

      controller.dispose();
      uiStore.setBooksScope("private");
      await flush();

      expect(repository.getAllCalls + repository.getPrivateCalls).toBe(callsBefore);
    });

    it("ignores a response that arrives after dispose", async () => {
      repository.holdGetAll = true;
      controller.mount();

      controller.dispose();
      repository.resolveAll([makeBook({ id: 99 })]);
      await flush();

      expect(booksStore.allBooks).toEqual([]);
      expect(controller.isLoading).toBe(true);
    });

    it("can be mounted again after dispose (React StrictMode remount)", async () => {
      controller.mount();
      await flush();
      controller.dispose();

      controller.mount();
      await flush();
      controller.onScopeChange("private");
      await flush();

      expect(controller.books).toHaveLength(2);
    });
  });

  describe("reactivity", () => {
    it("renders once per load instead of once per mutated field", async () => {
      const onRender = vi.fn();
      const stop = autorun(() => {
        onRender(controller.isLoading, controller.books.length, controller.errorText);
      });
      onRender.mockClear();

      controller.mount();
      await flush();
      stop();

      // one render for "loading started", one for the batched result
      expect(onRender).toHaveBeenCalledTimes(2);
    });

    it("keeps the booksStore's private count observable for other views", async () => {
      const counts: number[] = [];
      const stop = reaction(
        () => booksStore.privateCount,
        (count) => counts.push(count)
      );

      controller.mount();
      await flush();
      stop();

      expect(counts).toEqual([2]);
    });
  });
});
