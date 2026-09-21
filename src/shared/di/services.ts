import { API_BASE, API_USER } from "../config";
import { ApiGateway } from "../api/ApiGateway";
import { BooksStore } from "../../features/books/BooksStore";
import { HttpBooksRepository, type BooksRepository } from "../../features/books/Books.repository";
import { BooksUiStore } from "../../features/books/BooksUiStore";

export interface Services {
  /** Plain string, not a store: with no sign-in it cannot change at runtime. */
  apiUser: string;
  booksStore: BooksStore;
  booksUiStore: BooksUiStore;
  booksRepository: BooksRepository;
}

export const createServices = (): Services => ({
  apiUser: API_USER,
  booksStore: new BooksStore(),
  booksUiStore: new BooksUiStore(),
  booksRepository: new HttpBooksRepository(new ApiGateway(API_BASE), API_USER)
});
