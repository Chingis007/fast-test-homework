// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ServicesProvider, useServices } from "./ServicesContext";
import { BooksStore } from "../../features/books/BooksStore";
import { UiStore } from "../../stores/UiStore";
import { FakeBooksRepository } from "../../test/fakes";

const Probe = () => <span>{useServices().apiUser}</span>;

describe("ServicesContext", () => {
  it("hands the composed services to whoever asks", () => {
    render(
      <ServicesProvider
        services={{
          apiUser: "kyrylo",
          booksStore: new BooksStore(),
          uiStore: new UiStore(),
          booksRepository: new FakeBooksRepository()
        }}
      >
        <Probe />
      </ServicesProvider>
    );

    expect(screen.getByText("kyrylo")).toBeInTheDocument();
  });

  it("fails loudly instead of silently handing out undefined services", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Probe />)).toThrow(/ServicesProvider/);
  });
});
