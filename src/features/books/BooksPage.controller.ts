import { makeAutoObservable, reaction, runInAction, type IReactionDisposer } from "mobx";
import type { Controller } from "../../shared/mvvm/Controller";
import { useController } from "../../shared/mvvm/useController";
import { useServices } from "../../shared/di/ServicesContext";
import { describeError } from "../../shared/api/describeError";
import type { UiStore } from "../../stores/UiStore";
import type { BooksRepository } from "./Books.repository";
import type { BooksStore } from "./BooksStore";
import type { Book } from "./model/Book";
import type { BooksScope } from "./model/BooksScope";

export interface BookRowVM {
  key: string;
  title: string;
}

export interface ScopeOptionVM {
  value: BooksScope;
  label: string;
  isActive: boolean;
}

const SCOPE_LABELS: Record<BooksScope, string> = {
  all: "All books",
  private: "Private books"
};

const LOAD_ERROR = "Could not load books. Please try again.";

export class BooksPageController implements Controller {
  isLoading = false;
  errorText = "";

  /** False until a load has actually settled — distinct from "loaded nothing". */
  hasLoaded = false;

  private disposers: IReactionDisposer[] = [];
  /** Guards against responses arriving after a newer load or after dispose. */
  private requestToken = 0;

  constructor(
    private readonly booksStore: BooksStore,
    private readonly uiStore: UiStore,
    private readonly repository: BooksRepository
  ) {
    makeAutoObservable<BooksPageController, "disposers" | "requestToken">(
      this,
      { disposers: false, requestToken: false },
      { autoBind: true }
    );
  }

  mount(): void {
    this.disposers.push(reaction(() => this.uiStore.booksScope, () => void this.load()));
    void this.load();
  }

  dispose(): void {
    this.disposers.forEach((dispose) => dispose());
    this.disposers = [];
    this.requestToken += 1;
  }

  get books(): BookRowVM[] {
    return this.visibleBooks.map((book, index) => ({
      key: `${book.id ?? "no-id"}-${index}`,
      title: `${book.author}: ${book.name}`
    }));
  }

  get scopeOptions(): ScopeOptionVM[] {
    return (Object.keys(SCOPE_LABELS) as BooksScope[]).map((value) => ({
      value,
      label: SCOPE_LABELS[value],
      isActive: this.uiStore.booksScope === value
    }));
  }

  /** Covers both the window before the first fetch starts and the fetch itself. */
  get isSpinnerVisible(): boolean {
    return !this.errorText && this.books.length === 0 && (this.isLoading || !this.hasLoaded);
  }

  get isListVisible(): boolean {
    return !this.errorText && this.books.length > 0;
  }

  get isRefreshing(): boolean {
    return this.isLoading && this.books.length > 0;
  }

  get isEmptyVisible(): boolean {
    return this.hasLoaded && !this.isLoading && !this.errorText && this.books.length === 0;
  }

  get isErrorVisible(): boolean {
    return this.errorText !== "";
  }

  get refreshingText(): string {
    return "Refreshing…";
  }

  get emptyText(): string {
    return this.uiStore.booksScope === "private"
      ? "You have not added any books yet."
      : "There are no books yet.";
  }

  onScopeChange(scope: BooksScope): void {
    this.uiStore.setBooksScope(scope);
  }

  onRetry(): void {
    void this.load();
  }

  /** After a successful creation both the list and the counter are stale. */
  onBookAdded(): void {
    void this.load(true);
  }

  private get visibleBooks(): Book[] {
    return this.uiStore.booksScope === "private"
      ? this.booksStore.privateBooks
      : this.booksStore.allBooks;
  }

  /**
   * The visible list and the header's private count are independent concerns
   * that merely travel together, so they settle independently: a failed count
   * leaves the list alone and only keeps the counter unknown.
   */
  private async load(reloadPrivate = false): Promise<void> {
    const scope = this.uiStore.booksScope;
    const token = ++this.requestToken;
    const needsPrivateCount =
      scope !== "private" && (reloadPrivate || !this.booksStore.isPrivateLoaded);

    runInAction(() => {
      this.isLoading = true;
      this.errorText = "";
    });

    const [visible, privateCount] = await Promise.allSettled([
      scope === "private" ? this.repository.getPrivate() : this.repository.getAll(),
      needsPrivateCount ? this.repository.getPrivate() : Promise.resolve(null)
    ]);

    if (token !== this.requestToken) return;

    if (visible.status === "rejected") {
      console.debug("Books load failed", visible.reason);
    }
    if (privateCount.status === "rejected") {
      console.debug("Private books count failed", privateCount.reason);
    }

    runInAction(() => {
      if (visible.status === "fulfilled") {
        if (scope === "private") {
          this.booksStore.setPrivate(visible.value);
        } else {
          this.booksStore.setAll(visible.value);
        }
      } else {
        this.errorText = describeError(visible.reason, LOAD_ERROR);
      }

      if (privateCount.status === "fulfilled" && privateCount.value) {
        this.booksStore.setPrivate(privateCount.value);
      }

      this.isLoading = false;
      this.hasLoaded = true;
    });
  }
}

export const useBooksPageController = (): BooksPageController => {
  const { booksStore, uiStore, booksRepository } = useServices();
  return useController(() => new BooksPageController(booksStore, uiStore, booksRepository));
};
