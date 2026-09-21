import { BooksPageView } from "./features/books/BooksPage.view";
import { AppHeaderView } from "./features/layout/AppHeader.view";

export const App = () => (
  <div className="app">
    <AppHeaderView />
    <BooksPageView />
  </div>
);
