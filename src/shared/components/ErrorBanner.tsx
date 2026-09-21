import { Button } from "./Button";

interface Props {
  text: string;
  onRetry: () => void;
}

export const ErrorBanner = ({ text, onRetry }: Props) => (
  <div className="error" role="alert">
    <span>{text}</span>
    <Button label="Retry" onClick={onRetry} />
  </div>
);
