'use client';

import { useState, useCallback, KeyboardEvent } from 'react';

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  className?: string;
};

export function TagInput({
  value,
  onChange,
  maxTags = 5,
  placeholder = '#태그 입력 후 스페이스',
  className = '',
}: TagInputProps) {
  const [input, setInput] = useState('');

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.replace(/^#/, '').trim();
      if (!trimmed || value.length >= maxTags) return;
      if (value.includes(trimmed)) return;
      onChange([...value, trimmed]);
    },
    [value, maxTags, onChange]
  );

  const removeTag = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = input.trim();
      if (tag) {
        addTag(tag);
        setInput('');
      }
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleBlur = () => {
    if (input.trim()) {
      addTag(input);
      setInput('');
    }
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 ${className}`}
    >
      {value.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-sm text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
        >
          #{tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            className="ml-0.5 text-blue-600 hover:text-blue-800 dark:hover:text-blue-400"
          >
            ×
          </button>
        </span>
      ))}
      {value.length < maxTags && (
        <input
          type="text"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ''}
          className="min-w-[120px] flex-1 border-0 bg-transparent p-0 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      )}
    </div>
  );
}
