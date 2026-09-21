import { makeAutoObservable } from "mobx";
import { useController } from "../../shared/mvvm/useController";
import { useServices } from "../../shared/di/ServicesContext";
import type { BooksStore } from "../books/BooksStore";

export class AppHeaderController {
  constructor(
    private readonly booksStore: BooksStore,
    private readonly apiUser: string
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get title(): string {
    return `Books of ${this.apiUser}`;
  }

  /**
   * Before the first read there is no count — saying "0" would claim the user
   * has no books when the truth is that we do not know yet.
   */
  get counterText(): string {
    return this.booksStore.isPrivateLoaded
      ? `Your books: ${this.booksStore.privateCount}`
      : "Your books: —";
  }
}

export const useAppHeaderController = (): AppHeaderController => {
  const { booksStore, apiUser } = useServices();
  return useController(() => new AppHeaderController(booksStore, apiUser));
};
