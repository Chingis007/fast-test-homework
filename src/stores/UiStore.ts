import { makeAutoObservable } from "mobx";
import type { BooksScope } from "../features/books/model/BooksScope";

/** What the user is looking at, kept apart from what the application knows. */
export class UiStore {
  booksScope: BooksScope = "all";

  constructor() {
    makeAutoObservable(this);
  }

  setBooksScope(scope: BooksScope): void {
    this.booksScope = scope;
  }
}
