import type { HttpGateway } from "../../shared/api/HttpGateway";
import type { Book, BookDraft } from "./model/Book";
import { toBook, type AddBookResponseDto, type BookDto } from "./model/BookDto";

export interface BooksRepository {
  getAll(): Promise<Book[]>;
  getPrivate(): Promise<Book[]>;
  add(draft: BookDraft, id: number): Promise<void>;
}

export class HttpBooksRepository implements BooksRepository {
  constructor(
    private readonly gateway: HttpGateway,
    private readonly ownerId: string
  ) {}

  getAll = async (): Promise<Book[]> => {
    const dtos = await this.gateway.get<BookDto[]>("/");
    return dtos.map(toBook);
  };

  getPrivate = async (): Promise<Book[]> => {
    const dtos = await this.gateway.get<BookDto[]>("/private");
    return dtos.map(toBook);
  };

  add = async ({ name, author }: BookDraft, id: number): Promise<void> => {
    const response = await this.gateway.post<AddBookResponseDto>("/", {
      id,
      name,
      author,
      ownerId: this.ownerId
    });

    if (response?.status !== "ok") {
      throw new Error(`Book was not created: ${JSON.stringify(response)}`);
    }
  };
}
