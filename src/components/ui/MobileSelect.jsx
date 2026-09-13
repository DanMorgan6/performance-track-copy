import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

/**
 * MobileSelect: on small screens renders a bottom-sheet Drawer,
 * on larger screens falls back to a styled native <select>.
 *
 * Props:
 *   value, onChange, options: [{value, label}], label, placeholder, className, required, disabled
 */
export default function MobileSelect({
  value,
  onChange,
  options = [],
  label,
  placeholder = 'Select…',
  className,
  required,
  disabled
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  const handleSelect = (val) => {
    onChange({ target: { value: val } });
    setOpen(false);
  };

  return (
    <>
      {/* Mobile trigger – hidden on md+ */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "md:hidden w-full min-h-[44px] px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white text-left flex items-center justify-between select-none",
          !selected && "text-slate-400",
          className
        )}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
      </button>

      {/* Desktop native select – hidden on mobile */}
      <select
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={cn(
          "hidden md:block w-full min-h-[44px] px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white",
          className
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Bottom-sheet drawer (mobile) */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          {label && (
            <DrawerHeader>
              <DrawerTitle>{label}</DrawerTitle>
            </DrawerHeader>
          )}
          <div className="px-4 pb-6 space-y-1 max-h-[60vh] overflow-y-auto">
            {options.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => handleSelect(o.value)}
                className={cn(
                  "w-full min-h-[44px] px-4 py-3 rounded-xl text-left text-sm font-medium flex items-center justify-between select-none transition-colors",
                  o.value === value
                    ? "bg-purple-50 text-purple-700"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                {o.label}
                {o.value === value && <Check className="w-4 h-4 text-purple-600" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}