import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from './Button.js';

export interface RepeaterFieldProps<T> {
  label: string;
  description?: string;
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  addButtonText?: string;
  minItems?: number;
  maxItems?: number;
  emptyStateText?: string;
}

export function RepeaterField<T>({
  label,
  description,
  items,
  onAdd,
  onRemove,
  renderItem,
  addButtonText = 'Add Item',
  minItems = 0,
  maxItems,
  emptyStateText = 'No items added yet.',
}: RepeaterFieldProps<T>) {
  const canAdd = maxItems === undefined || items.length < maxItems;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{label}</h4>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
        {canAdd && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAdd}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            {addButtonText}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="p-4 rounded-lg border border-dashed border-slate-300 text-center bg-slate-50/50">
          <p className="text-xs text-slate-500">{emptyStateText}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const canRemove = items.length > minItems;
            return (
              <div
                key={index}
                className="p-4 rounded-xl border border-slate-200 bg-white relative group"
              >
                {canRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className={canRemove ? 'pr-8' : ''}>
                  {renderItem(item, index)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
