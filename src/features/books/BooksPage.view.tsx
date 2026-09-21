import { observer } from "mobx-react";
import { ErrorBanner } from "../../shared/components/ErrorBanner";
import { SegmentedControl } from "../../shared/components/SegmentedControl";
import { Spinner } from "../../shared/components/Spinner";
import { AddBookFormView } from "./components/AddBookForm.view";
import { BookListView } from "./components/BookList.view";
import { useBooksPageController } from "./BooksPage.controller";

export const BooksPageView = observer(() => {
  const vm = useBooksPageController();

  return (
    <main className="page">
      <SegmentedControl options={vm.scopeOptions} onChange={vm.onScopeChange} />
      {vm.isSpinnerVisible && <Spinner />}
      {vm.isRefreshing && <p className="refreshing">{vm.refreshingText}</p>}
      {vm.isErrorVisible && <ErrorBanner text={vm.errorText} onRetry={vm.onRetry} />}
      {vm.isListVisible && <BookListView books={vm.books} />}
      {vm.isEmptyVisible && <p className="empty">{vm.emptyText}</p>}
      <AddBookFormView onAdded={vm.onBookAdded} />
    </main>
  );
});
