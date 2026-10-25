"use client";

import { useId, useState } from "react";

export type ComboItem = { key: string; label: string; hint?: string };

type Props = {
  value: string;
  onChange: (text: string) => void;
  items: ComboItem[];
  onPick: (item: ComboItem) => void;
  placeholder?: string;
  invalid?: boolean;
  ariaLabel: string;
  className?: string;
  id?: string;
};

/**
 * Champ texte avec suggestions (liste déroulante au clavier ou à la souris).
 * Utilisé pour la localisation (texte libre + suggestions) et pour le choix d'un point de la carte.
 */
export function Combobox({ value, onChange, items, onPick, placeholder, invalid, ariaLabel, className, id }: Props) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const shown = open && items.length > 0;

  function pick(item: ComboItem) {
    onPick(item);
    setOpen(false);
  }

  return (
    <div className="relative flex-1 min-w-0">
      <input
        id={id}
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={shown}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={shown ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        className={className}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && items.length) {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(a + 1, items.length - 1));
          } else if (e.key === "ArrowUp" && items.length) {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && shown) {
            e.preventDefault();
            pick(items[active] ?? items[0]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {shown && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 left-0 right-0 top-full mt-0.5 max-h-60 overflow-y-auto bg-white border border-slate-300 rounded shadow-lg text-[13px]"
        >
          {items.map((item, i) => (
            <li
              key={item.key}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown (et non click) : le champ ne doit pas perdre le focus avant le choix
              onMouseDown={(e) => {
                e.preventDefault();
                pick(item);
              }}
              onMouseEnter={() => setActive(i)}
              className={`px-2 py-1.5 cursor-pointer flex justify-between gap-3 ${
                i === active ? "bg-[#0d2644] text-white" : "hover:bg-slate-100"
              }`}
            >
              <span className="truncate">{item.label}</span>
              {item.hint && <span className={`shrink-0 text-[11px] ${i === active ? "text-slate-300" : "text-slate-400"}`}>{item.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
