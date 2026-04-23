import React from 'react';

export default function CustomSelect({ label, value, options, onChange, placeholder = 'Izberi...', disabled = false, compact = false }) {
  const selectClass = compact
    ? 'w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none disabled:opacity-40'
    : 'w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none disabled:opacity-40';

  return (
    <div className={`filter-group ${compact ? 'mb-3' : 'mb-4'}`}>
      {label && (
        <label className={`block font-semibold mb-1.5 text-gray-700 ${compact ? 'text-xs' : 'text-sm'}`}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={selectClass}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value || opt} value={opt.value || opt}>
            {opt.label || opt}
          </option>
        ))}
      </select>
    </div>
  );
}
