import { describe, expect, it } from "vitest";
import { HttpBooksRepository } from "./Books.repository";
import { FakeHttpGateway } from "../../test/fakes";

const DTOS = [
  { id: 111, name: "Wind in the willows", ownerId: "postnikov", author: "Kenneth Graeme" }
];

const makeRepository = (gateway: FakeHttpGateway) => new HttpBooksRepository(gateway, "kyrylo");

describe("HttpBooksRepository", () => {
  it("reads all books from the collection root", async () => {
    const gateway = new FakeHttpGateway({ "/": DTOS });

    const books = await makeRepository(gateway).getAll();

    expect(gateway.getCalls).toEqual(["/"]);
    // ownerId is sent on create but not carried on the model: nothing reads it
    expect(books).toEqual([{ id: 111, name: "Wind in the willows", author: "Kenneth Graeme" }]);
  });

  it("reads private books from /private", async () => {
    const gateway = new FakeHttpGateway({ "/private": DTOS });

    const books = await makeRepository(gateway).getPrivate();

    expect(gateway.getCalls).toEqual(["/private"]);
    expect(books).toHaveLength(1);
  });

  it("fills missing DTO fields so the model is always complete", async () => {
    const gateway = new FakeHttpGateway({ "/": [{ id: 7 }] });

    const [book] = await makeRepository(gateway).getAll();

    expect(book).toEqual({ id: 7, name: "", author: "" });
  });

  it("creates a book at the collection root, stamped with the owner", async () => {
    const gateway = new FakeHttpGateway();

    await makeRepository(gateway).add({ name: "Dune", author: "Frank Herbert" }, 4242);

    expect(gateway.postCalls).toHaveLength(1);
    expect(gateway.postCalls[0].path).toBe("/");
    expect(gateway.postCalls[0].payload).toEqual({
      id: 4242,
      name: "Dune",
      author: "Frank Herbert",
      ownerId: "kyrylo"
    });
  });

  it("rejects when the server does not confirm the creation", async () => {
    const gateway = new FakeHttpGateway({}, { status: "error" });

    await expect(
      makeRepository(gateway).add({ name: "Dune", author: "Frank Herbert" }, 1)
    ).rejects.toThrow(/not created/);
  });
});

/**
 * Pinned against the live API on 2026-09-20. If these stop matching the server,
 * the fakes above are lying and everything built on them is suspect.
 */
describe("verified API contract", () => {
  it("sends the id the caller minted: the server never assigns one", async () => {
    const gateway = new FakeHttpGateway();

    await makeRepository(gateway).add({ name: "Dune", author: "Frank Herbert" }, 99);

    expect(gateway.postCalls[0].payload).toHaveProperty("id", 99);
  });

  it("reads back a record that was stored without an id", async () => {
    const gateway = new FakeHttpGateway({
      "/": [{ name: "ZZTest NoId", author: "Probe", ownerId: "kyrylo" }]
    });

    const [book] = await makeRepository(gateway).getAll();

    expect(book.id).toBeNull();
  });

  it("tolerates two records sharing an id, which the server allows", async () => {
    const gateway = new FakeHttpGateway({
      "/": [
        { id: 777, name: "A", author: "X", ownerId: "kyrylo" },
        { id: 777, name: "B", author: "Y", ownerId: "kyrylo" }
      ]
    });

    const books = await makeRepository(gateway).getAll();

    expect(books).toHaveLength(2);
  });
});
