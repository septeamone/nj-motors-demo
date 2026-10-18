"use client";

import * as RS from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

export type Option = { value: string; label: string };

// Radix Select cannot use "" as an item value, so the "not chosen" option gets a sentinel.
const NONE = "__none__";

export function Select({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  invalid,
  "aria-label": ariaLabel,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  "aria-label"?: string;
}) {
  // An empty value shows the placeholder; if none is given, fall back to the "not chosen" option's label.
  const shown = placeholder ?? options.find((o) => o.value === "")?.label;
  return (
    <RS.Root
      value={value}
      onValueChange={(v) => onChange(v === NONE ? "" : v)}
      disabled={disabled}
    >
      <RS.Trigger
        id={id}
        aria-label={ariaLabel}
        data-invalid={invalid || undefined}
        className="field w-full cursor-pointer justify-between text-left text-[16px] font-semibold data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45 data-[placeholder]:text-ink-3 data-[invalid]:border-[#ef5b5b]"
      >
        <span className="truncate">
          <RS.Value placeholder={shown} />
        </span>
        <RS.Icon asChild>
          <ChevronDown className="size-4 shrink-0 text-ink-3" strokeWidth={1.75} />
        </RS.Icon>
      </RS.Trigger>
      <RS.Portal>
        <RS.Content className="select-content" position="popper" sideOffset={8} collisionPadding={16}>
          <RS.Viewport>
            {options.map((o) => (
              <RS.Item key={o.value || NONE} value={o.value === "" ? NONE : o.value} className="select-item">
                <RS.ItemText>{o.label}</RS.ItemText>
                <RS.ItemIndicator>
                  <Check className="size-4" strokeWidth={2} />
                </RS.ItemIndicator>
              </RS.Item>
            ))}
          </RS.Viewport>
        </RS.Content>
      </RS.Portal>
    </RS.Root>
  );
}
