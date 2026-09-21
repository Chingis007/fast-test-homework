interface Props {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
  type?: "button" | "submit";
}

export const Button = ({ label, onClick, disabled, isActive, type = "button" }: Props) => (
  <button
    className={isActive ? "button button--active" : "button"}
    type={type}
    disabled={disabled}
    onClick={onClick}
  >
    {label}
  </button>
);
