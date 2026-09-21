// @vitest-environment jsdom
import { StrictMode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "../../App";
import { BooksStore } from "./BooksStore";
import { ServicesProvider } from "../../shared/di/ServicesContext";
import { UiStore } from "../../stores/UiStore";
import { FakeBooksRepository, makeBook } from "../../test/fakes";

/**
 * The views own no logic, so this suite only checks that they are wired to the
 * controllers correctly. All behaviour is asserted in the controller suites.
 */
const renderApp = () => {
  const booksRepository = new FakeBooksRepository();
  booksRepository.all = [
    makeBook({ id: 1, name: "I, Robot", author: "Isaac Asimov" }),
    makeBook({ id: 2, name: "The Hobbit", author: "Jrr Tolkein" })
  ];
  booksRepository.private = [makeBook({ id: 2, name: "The Hobbit", author: "Jrr Tolkein" })];

  render(
    <StrictMode>
    <ServicesProvider
      services={{
        apiUser: "kyrylo",
        booksStore: new BooksStore(),
        uiStore: new UiStore(),
        booksRepository
      }}
    >
      <App />
    </ServicesProvider>
    </StrictMode>
  );

  return { booksRepository, user: userEvent.setup() };
};

const listItems = () => within(screen.getByRole("list")).getAllByRole("listitem");

describe("Books page", () => {
  it("renders the rows the controller produced", async () => {
    renderApp();

    await waitFor(() => expect(listItems()).toHaveLength(2));
    expect(listItems()[0]).toHaveTextContent("Isaac Asimov: I, Robot");
  });

  it("shows the application-wide private counter in the sticky header", async () => {
    renderApp();

    await screen.findByText("Your books: 1");
  });

  it("switches between the mutually exclusive scopes", async () => {
    const { user } = renderApp();
    await waitFor(() => expect(listItems()).toHaveLength(2));

    await user.click(screen.getByRole("button", { name: "Private books" }));

    await waitFor(() => expect(listItems()).toHaveLength(1));
    expect(listItems()[0]).toHaveTextContent("Jrr Tolkein: The Hobbit");
  });

  it("creates a book and refreshes both the list and the counter", async () => {
    const { user, booksRepository } = renderApp();
    await waitFor(() => expect(listItems()).toHaveLength(2));

    await user.type(screen.getByLabelText("Title"), "Dune");
    await user.type(screen.getByLabelText("Author"), "Frank Herbert");
    await user.click(screen.getByRole("button", { name: "Add book" }));

    expect(booksRepository.addedDrafts).toEqual([{ name: "Dune", author: "Frank Herbert" }]);
    await waitFor(() => expect(listItems()).toHaveLength(3));
    await screen.findByText("Your books: 2");
  });
});
