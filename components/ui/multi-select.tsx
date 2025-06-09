import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Badge } from './badge';
import { X } from 'lucide-react';

interface MultiSelectProps {
  id?: string;
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  children?: React.ReactNode;
  creatable?: boolean;
}

export function MultiSelect({ id, value, onValueChange, placeholder, children, creatable }: MultiSelectProps) {
  const [input, setInput] = React.useState('');
  const [open, setOpen] = React.useState(false);

  const handleSelect = (val: string) => {
    if (!value.includes(val)) {
      onValueChange([...value, val]);
    }
    setInput('');
    setOpen(false);
  };

  const handleRemove = (val: string) => {
    onValueChange(value.filter(v => v !== val));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (creatable && input && (e.key === 'Enter' || e.key === ',')) {
      e.preventDefault();
      if (!value.includes(input.trim())) {
        onValueChange([...value, input.trim()]);
      }
      setInput('');
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-1 mb-1">
        {value.map(tag => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
            {tag}
            <button type="button" onClick={() => handleRemove(tag)} className="ml-1">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Select open={open} onOpenChange={setOpen}>
        <SelectTrigger id={id} onClick={() => setOpen(true)}>
          <SelectValue placeholder={placeholder || 'Select or add tags'} />
        </SelectTrigger>
        <SelectContent>
          {children}
          {creatable && (
            <div className="flex items-center px-2 py-1">
              <input
                className="w-full border-none outline-none bg-transparent text-sm"
                placeholder="Add new tag"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
              />
              <button
                type="button"
                className="ml-2 text-xs text-primary"
                onClick={() => {
                  if (input.trim() && !value.includes(input.trim())) {
                    onValueChange([...value, input.trim()]);
                    setInput('');
                  }
                }}
              >
                Add
              </button>
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

export function MultiSelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <SelectItem value={value}>{children}</SelectItem>;
} 