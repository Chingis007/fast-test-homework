import { API_BASE, API_USER } from "../config";
import { ApiGateway } from "../api/ApiGateway";
import { BooksStore } from "../../features/books/BooksStore";
import { HttpBooksRepository, type BooksRepository } from "../../features/books/Books.repository";
import { UiStore } from "../../stores/UiStore";

export interface Services {
  /** Plain string, not a store: with no sign-in it cannot change at runtime. */
  apiUser: string;
  booksStore: BooksStore;
  uiStore: UiStore;
  booksRepository: BooksRepository;
}

export const createServices = (): Services => ({
  apiUser: API_USER,
  booksStore: new BooksStore(),
  uiStore: new UiStore(),
  booksRepository: new HttpBooksRepository(new ApiGateway(API_BASE), API_USER)
});
