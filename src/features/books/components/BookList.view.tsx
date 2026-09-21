import { observer } from "mobx-react";
import type { BookRowVM } from "../BooksPage.controller";

interface Props {
  books: BookRowVM[];
}

export const BookListView = observer(({ books }: Props) => (
  <ul className="book-list">
    {books.map((book) => (
      <li className="book-list__item" key={book.key}>
        {book.title}
      </li>
    ))}
  </ul>
));
