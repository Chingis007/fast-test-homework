import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddBookFormController } from "./AddBookForm.controller";
import { NetworkError } from "../../../shared/api/HttpGateway";
import { FakeBooksRepository } from "../../../test/fakes";

describe("AddBookFormController", () => {
  let repository: FakeBooksRepository;
  let onAdded: ReturnType<typeof vi.fn>;
  let controller: AddBookFormController;

  beforeEach(() => {
    repository = new FakeBooksRepository();
    onAdded = vi.fn();
    controller = new AddBookFormController(repository, onAdded);
  });

  const fill = (name = "Dune", author = "Frank Herbert") => {
    controller.onNameChange(name);
    controller.onAuthorChange(author);
  };

  describe("validation", () => {
    it("blocks submission until both fields carry real characters", () => {
      expect(controller.canSubmit).toBe(false);

      controller.onNameChange("Dune");
      expect(controller.canSubmit).toBe(false);

      controller.onAuthorChange("   ");
      expect(controller.canSubmit).toBe(false);

      controller.onAuthorChange("Frank Herbert");
      expect(controller.canSubmit).toBe(true);
      expect(controller.isSubmitDisabled).toBe(false);
    });

    it("does nothing when submitted while invalid", async () => {
      await controller.onSubmit();

      expect(repository.addedDrafts).toEqual([]);
      expect(onAdded).not.toHaveBeenCalled();
    });
  });

  describe("submission", () => {
    it("sends trimmed values to the repository", async () => {
      fill("  Dune  ", "  Frank Herbert  ");

      await controller.onSubmit();

      expect(repository.addedDrafts).toEqual([{ name: "Dune", author: "Frank Herbert" }]);
    });

    it("mints the id itself, since the API never assigns one", async () => {
      fill();

      await controller.onSubmit();

      expect(repository.addedIds).toHaveLength(1);
      expect(repository.addedIds[0]).toBeGreaterThan(0);
    });

    it("gives two identical books distinct ids", async () => {
      fill("Dune", "Frank Herbert");
      await controller.onSubmit();
      fill("Dune", "Frank Herbert");
      await controller.onSubmit();

      expect(new Set(repository.addedIds).size).toBe(2);
    });

    it("clears the form and notifies the page on success", async () => {
      fill();

      await controller.onSubmit();

      expect(controller.name).toBe("");
      expect(controller.author).toBe("");
      expect(controller.isSubmitting).toBe(false);
      expect(onAdded).toHaveBeenCalledTimes(1);
    });
  });

  describe("one creation at a time", () => {
    it("locks the form while a creation is in flight", async () => {
      fill();
      expect(controller.submitLabel).toBe("Add book");

      const pending = controller.onSubmit();

      expect(controller.isSubmitting).toBe(true);
      expect(controller.submitLabel).toBe("Adding…");
      expect(controller.isSubmitDisabled).toBe(true);

      await pending;
      expect(controller.submitLabel).toBe("Add book");
    });

    it("ignores a second submit fired before the first answers", async () => {
      fill();
      const first = controller.onSubmit();
      const second = controller.onSubmit();

      await Promise.all([first, second]);

      expect(repository.addedDrafts).toHaveLength(1);
      expect(onAdded).toHaveBeenCalledTimes(1);
    });
  });

  describe("failures", () => {
    beforeEach(() => {
      vi.spyOn(console, "debug").mockImplementation(() => {});
    });

    it("keeps the typed values and shows an error", async () => {
      repository.failAdd = true;
      fill();

      await controller.onSubmit();

      expect(controller.isErrorVisible).toBe(true);
      expect(controller.submitError).toBe("Could not add the book. Please try again.");
      expect(controller.name).toBe("Dune");
      expect(controller.author).toBe("Frank Herbert");
      expect(onAdded).not.toHaveBeenCalled();
    });

    it("tells the user the server is unreachable, not just that it failed", async () => {
      repository.failAdd = true;
      repository.addError = new NetworkError("https://x.test/", new TypeError());
      fill();

      await controller.onSubmit();

      expect(controller.submitError).toBe("Cannot reach the server. Check your connection.");
    });

    it("unlocks the form so the user can retry", async () => {
      repository.failAdd = true;
      fill();
      await controller.onSubmit();

      expect(controller.isSubmitting).toBe(false);
      expect(controller.canSubmit).toBe(true);
    });

    it("clears a previous error on the next attempt", async () => {
      repository.failAdd = true;
      fill();
      await controller.onSubmit();

      repository.failAdd = false;
      await controller.onSubmit();

      expect(controller.isErrorVisible).toBe(false);
      expect(onAdded).toHaveBeenCalledTimes(1);
    });
  });

  describe("lifecycle and resource disposal", () => {
    it("does not notify the page after the form was disposed", async () => {
      fill();

      const pending = controller.onSubmit();
      controller.dispose();
      await pending;

      expect(onAdded).not.toHaveBeenCalled();
    });

    it("works again after a StrictMode mount -> dispose -> mount", async () => {
      // React 18 StrictMode reuses the same controller instance
      controller.mount();
      controller.dispose();
      controller.mount();

      fill();
      await controller.onSubmit();

      expect(repository.addedDrafts).toHaveLength(1);
      expect(controller.isSubmitting).toBe(false);
      expect(controller.isSubmitDisabled).toBe(true); // disabled only because the fields are empty
      expect(controller.name).toBe("");
      expect(onAdded).toHaveBeenCalledTimes(1);
    });

    it("releases a submission left in flight by the previous mount", async () => {
      fill();
      const pending = controller.onSubmit();
      controller.dispose();
      await pending;

      controller.mount();

      // that submit may well have reached the server, so its values must not
      // be sitting in the inputs inviting a duplicate
      expect(controller.isSubmitting).toBe(false);
      expect(controller.name).toBe("");
      expect(controller.author).toBe("");

      controller.onNameChange("Neuromancer");
      controller.onAuthorChange("Gibson");
      expect(controller.canSubmit).toBe(true);
    });

    it("leaves an unmounted form's own state alone", async () => {
      vi.spyOn(console, "debug").mockImplementation(() => {});
      repository.failAdd = true;
      fill();

      const pending = controller.onSubmit();
      controller.dispose();
      await pending;

      expect(controller.submitError).toBe("");
    });
  });
});
