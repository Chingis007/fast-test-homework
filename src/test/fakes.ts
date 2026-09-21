import type { HttpGateway } from "../shared/api/HttpGateway";
import type { BooksRepository } from "../features/books/Books.repository";
import type { Book, BookDraft } from "../features/books/model/Book";

export const makeBook = (overrides: Partial<Book> = {}): Book => ({
  id: 1,
  name: "I, Robot",
  author: "Isaac Asimov",
  ...overrides
});

export class FakeHttpGateway implements HttpGateway {
  readonly getCalls: string[] = [];
  readonly postCalls: { path: string; payload: unknown }[] = [];

  constructor(
    private readonly responses: Record<string, unknown> = {},
    private readonly postResponse: unknown = { status: "ok" }
  ) {}

  get = async <T>(path: string): Promise<T> => {
    this.getCalls.push(path);
    return this.responses[path] as T;
  };

  post = async <T>(path: string, payload: unknown): Promise<T> => {
    this.postCalls.push({ path, payload });
    return this.postResponse as T;
  };
}

/**
 * Repository double with per-method control: queues let a test hold a response
 * open and resolve it by hand, which is how out-of-order loads are exercised.
 */
export class FakeBooksRepository implements BooksRepository {
  all: Book[] = [];
  private: Book[] = [];
  addedDrafts: BookDraft[] = [];
  addedIds: number[] = [];

  getAllCalls = 0;
  getPrivateCalls = 0;

  failGetAll = false;
  /** Thrown instead of the generic error when set, to exercise error mapping. */
  getAllError: unknown = null;
  getPrivateError: unknown = null;
  failGetPrivate = false;
  failAdd = false;
  addError: unknown = null;

  private pendingAll: ((books: Book[]) => void) | null = null;

  /** When true, getAll() waits until `resolveAll()` is called. */
  holdGetAll = false;

  getAll = async (): Promise<Book[]> => {
    this.getAllCalls += 1;
    if (this.failGetAll) throw this.getAllError ?? new Error("getAll failed");
    if (this.holdGetAll) {
      return new Promise<Book[]>((resolve) => {
        this.pendingAll = resolve;
      });
    }
    return this.all;
  };

  resolveAll = (books: Book[] = this.all): void => {
    this.pendingAll?.(books);
    this.pendingAll = null;
  };

  getPrivate = async (): Promise<Book[]> => {
    this.getPrivateCalls += 1;
    if (this.failGetPrivate) throw this.getPrivateError ?? new Error("getPrivate failed");
    return this.private;
  };

  add = async (draft: BookDraft, id: number): Promise<void> => {
    if (this.failAdd) throw this.addError ?? new Error("add failed");
    this.addedDrafts.push(draft);
    this.addedIds.push(id);

    const created = makeBook({ id, ...draft });
    this.all = [...this.all, created];
    this.private = [...this.private, created];
  };
}
