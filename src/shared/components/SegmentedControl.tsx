import { Button } from "./Button";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  isActive: boolean;
}

interface Props<T extends string> {
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
}

export const SegmentedControl = <T extends string>({ options, onChange }: Props<T>) => (
  <div className="segmented" role="group">
    {options.map((option) => (
      <Button
        key={option.value}
        label={option.label}
        isActive={option.isActive}
        onClick={() => onChange(option.value)}
      />
    ))}
  </div>
);
