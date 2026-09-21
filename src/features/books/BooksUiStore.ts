import { makeAutoObservable } from "mobx";

export type BooksScope = "all" | "private";

/**
 * What the books feature is showing, kept apart from what it knows. Feature
 * state, not application state: nothing outside books has a use for it, so it
 * lives here rather than in a global store.
 */
export class BooksUiStore {
  booksScope: BooksScope = "all";

  constructor() {
    makeAutoObservable(this);
  }

  setBooksScope(scope: BooksScope): void {
    this.booksScope = scope;
  }
}
