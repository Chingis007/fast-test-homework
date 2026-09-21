import { makeAutoObservable } from "mobx";
import type { Book } from "./model/Book";

/** Data only: no async and no view concerns, so both consumers see one truth. */
export class BooksStore {
  allBooks: Book[] = [];
  privateBooks: Book[] = [];

  /** False means "not fetched yet", which is not the same as "none". */
  isPrivateLoaded = false;

  constructor() {
    makeAutoObservable(this);
  }

  get privateCount(): number {
    return this.privateBooks.length;
  }

  setAll(books: Book[]): void {
    this.allBooks = books;
  }

  setPrivate(books: Book[]): void {
    this.privateBooks = books;
    this.isPrivateLoaded = true;
  }
}
