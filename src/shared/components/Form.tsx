import type { ReactNode } from "react";

interface Props {
  onSubmit: () => void;
  children: ReactNode;
}

/** Owns `preventDefault` so feature views never touch the DOM event. */
export const Form = ({ onSubmit, children }: Props) => (
  <form
    className="form"
    onSubmit={(event) => {
      event.preventDefault();
      onSubmit();
    }}
  >
    {children}
  </form>
);
