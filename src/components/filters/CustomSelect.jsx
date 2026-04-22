import React from 'react';

export default function CustomSelect({ label, value, options, onChange, placeholder = "Izberi..." }) {
  return (
    <div className="filter-group mb-4">
      {label && <label className="block text-sm font-semibold mb-2 text-gray-700">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
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
