// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { observer } from "mobx-react";
import { beforeEach, describe, expect, it } from "vitest";
import { BooksPageController } from "./BooksPage.controller";
import { BooksStore } from "./BooksStore";
import { BooksUiStore } from "./BooksUiStore";
import { FakeBooksRepository, makeBook } from "../../test/fakes";

/**
 * Guards appendix rule 8: MobX must not cause renders beyond the ones the user
 * can actually perceive. These count real React renders, not observable reads.
 */
describe("BooksPage rendering", () => {
  let booksStore: BooksStore;
  let uiStore: BooksUiStore;
  let repository: FakeBooksRepository;
  let controller: BooksPageController;

  beforeEach(() => {
    booksStore = new BooksStore();
    uiStore = new BooksUiStore();
    repository = new FakeBooksRepository();
    repository.all = [makeBook({ id: 1 }), makeBook({ id: 2 })];
    repository.private = [makeBook({ id: 2 })];
    controller = new BooksPageController(booksStore, uiStore, repository);
  });

  it("renders once when the load starts and once when it settles", async () => {
    repository.holdGetAll = true;
    let renders = 0;
    const Page = observer(() => {
      renders += 1;
      return <span>{controller.isLoading ? "loading" : String(controller.books.length)}</span>;
    });

    render(<Page />);
    expect(renders).toBe(1);

    await act(async () => {
      controller.mount();
    });
    expect(renders).toBe(2);

    await act(async () => {
      repository.resolveAll();
      await Promise.resolve();
    });

    // The result mutates three observables (visible list, private list,
    // loading flag) but repaints once. React 18 would auto-batch these too;
    // `runInAction` is what guarantees it for every MobX observer, which is
    // asserted directly in BooksPage.controller.test.ts.
    expect(renders).toBe(3);
  });

  it("does not re-render a child whose view-model slice did not change", async () => {
    let childRenders = 0;

    const Child = observer(({ onRetry }: { onRetry: () => void }) => {
      childRenders += 1;
      return <button onClick={onRetry}>retry</button>;
    });

    const Page = observer(() => (
      <div>
        <span>{controller.books.length}</span>
        <Child onRetry={controller.onRetry} />
      </div>
    ));

    render(<Page />);
    expect(childRenders).toBe(1);

    await act(async () => {
      controller.mount();
      await Promise.resolve();
    });

    // `observer` memoizes, and autoBind keeps `onRetry` identity stable, so a
    // list reload does not repaint unrelated components.
    expect(childRenders).toBe(1);
  });

  it("renders once when switching scope, not once per list mutation", async () => {
    await act(async () => {
      controller.mount();
      await Promise.resolve();
    });

    let renders = 0;
    const Page = observer(() => {
      renders += 1;
      return <span>{controller.books.length}</span>;
    });
    render(<Page />);
    renders = 0;

    await act(async () => {
      controller.onScopeChange("private");
      await Promise.resolve();
    });

    expect(renders).toBe(1);
  });
});
