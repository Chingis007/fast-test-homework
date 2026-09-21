import { observer } from "mobx-react";
import { Button } from "../../../shared/components/Button";
import { Form } from "../../../shared/components/Form";
import { TextField } from "../../../shared/components/TextField";
import { useAddBookFormController } from "./AddBookForm.controller";

interface Props {
  onAdded: () => void;
}

export const AddBookFormView = observer(({ onAdded }: Props) => {
  const vm = useAddBookFormController(onAdded);

  return (
    <Form onSubmit={vm.onSubmit}>
      <TextField
        label="Title"
        value={vm.name}
        onChange={vm.onNameChange}
        disabled={vm.isSubmitting}
      />
      <TextField
        label="Author"
        value={vm.author}
        onChange={vm.onAuthorChange}
        disabled={vm.isSubmitting}
      />
      <Button
        type="submit"
        label={vm.submitLabel}
        onClick={vm.onSubmit}
        disabled={vm.isSubmitDisabled}
      />
      {vm.isErrorVisible && (
        <p className="error" role="alert">
          {vm.submitError}
        </p>
      )}
    </Form>
  );
});
