import { makeAutoObservable, runInAction } from "mobx";
import type { Controller } from "../../../shared/mvvm/Controller";
import { useController } from "../../../shared/mvvm/useController";
import { useServices } from "../../../shared/di/ServicesContext";
import { describeError } from "../../../shared/api/describeError";
import { nextId } from "../../../shared/id";
import type { BooksRepository } from "../Books.repository";

const SUBMIT_ERROR = "Could not add the book. Please try again.";

export class AddBookFormController implements Controller {
  name = "";
  author = "";
  isSubmitting = false;
  submitError = "";

  private isDisposed = false;

  constructor(
    private readonly repository: BooksRepository,
    private readonly onAdded: () => void
  ) {
    makeAutoObservable<AddBookFormController, "isDisposed">(
      this,
      { isDisposed: false },
      { autoBind: true }
    );
  }

  /**
   * A controller instance outlives an unmount — StrictMode reuses this one
   * after mount → dispose → mount — so mounting undoes disposal and starts the
   * form clean. A submission interrupted by the unmount may have succeeded on
   * the server, so its values must not be left sitting in the inputs.
   */
  mount(): void {
    this.isDisposed = false;
    this.isSubmitting = false;
    this.name = "";
    this.author = "";
    this.submitError = "";
  }

  dispose(): void {
    this.isDisposed = true;
  }

  /** One creation at a time: the form stays locked until the server answers. */
  get canSubmit(): boolean {
    return !this.isSubmitting && this.name.trim() !== "" && this.author.trim() !== "";
  }

  get isSubmitDisabled(): boolean {
    return !this.canSubmit;
  }

  get submitLabel(): string {
    return this.isSubmitting ? "Adding…" : "Add book";
  }

  get isErrorVisible(): boolean {
    return this.submitError !== "";
  }

  onNameChange(name: string): void {
    this.name = name;
  }

  onAuthorChange(author: string): void {
    this.author = author;
  }

  /**
   * The API never assigns ids — verified 2026-09-20: a POST without one stores
   * a record with no id at all — so the client must supply one. Minting it
   * here rather than inside the repository keeps identity a business decision
   * and leaves the repository a pure transport.
   */
  async onSubmit(): Promise<void> {
    if (!this.canSubmit) return;

    const draft = { name: this.name.trim(), author: this.author.trim() };

    runInAction(() => {
      this.isSubmitting = true;
      this.submitError = "";
    });

    try {
      await this.repository.add(draft, nextId());
    } catch (error) {
      console.debug("Book creation failed", error);
      runInAction(() => {
        if (this.isDisposed) return;
        this.submitError = describeError(error, SUBMIT_ERROR);
        this.isSubmitting = false;
      });
      return;
    }

    runInAction(() => {
      if (this.isDisposed) return;
      this.name = "";
      this.author = "";
      this.isSubmitting = false;
    });

    if (this.isDisposed) return;
    this.onAdded();
  }
}

export const useAddBookFormController = (onAdded: () => void): AddBookFormController => {
  const { booksRepository } = useServices();
  return useController(() => new AddBookFormController(booksRepository, onAdded));
};
