'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export interface RepeaterFieldProps<T> {
  /** Section title displayed above the list */
  label: string;
  /** Array of current items */
  items: T[];
  /** Callback to append a new empty item */
  onAdd: () => void;
  /** Callback to remove the item at the given index */
  onRemove: (index: number) => void;
  /** Renders a single item row given the item and its index */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Label text on the add button (default: 'Add Entry') */
  addLabel?: string;
  /**
   * Minimum number of items. When items.length <= minItems
   * the remove button is hidden to prevent going below the floor.
   */
  minItems?: number;
  className?: string;
}

/**
 * Generic dynamic list component that renders an add button and
 * a remove button for each item. The renderItem prop handles
 * all field-level rendering, keeping this component reusable
 * across different form sections.
 */
export function RepeaterField<T>({
  label,
  items,
  onAdd,
  onRemove,
  renderItem,
  addLabel = 'Add Entry',
  minItems,
  className,
}: RepeaterFieldProps<T>) {
  const canRemove = minItems === undefined || items.length > minItems;

  return (
    <fieldset className={cn('space-y-4', className)}>
      <legend className="text-sm font-semibold text-gray-700">{label}</legend>

      {items.length === 0 && (
        <p className="text-sm text-gray-400 italic">
          No entries yet. Click the button below to add one.
        </p>
      )}

      <ul className="space-y-4 list-none p-0 m-0">
        {items.map((item, index) => (
          <li
            key={index}
            className="rounded-lg border border-gray-200 bg-gray-50 p-4 relative"
          >
            {canRemove && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Remove ${label} entry ${index + 1}`}
                className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Remove
              </button>
            )}

            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Entry {index + 1}
            </p>

            {renderItem(item, index)}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {addLabel}
      </button>
    </fieldset>
  );
}
