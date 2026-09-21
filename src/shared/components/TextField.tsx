interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Unwraps the DOM event here so feature views can bind a controller action
 * that takes a plain string.
 */
export const TextField = ({ label, value, onChange, disabled }: Props) => (
  <label className="field">
    <span className="field__label">{label}</span>
    <input
      className="field__input"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);
