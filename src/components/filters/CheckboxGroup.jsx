import React from 'react';

export default function CheckboxGroup({ label, options, selectedValues, onChange }) {
  const handleToggle = (val) => {
    const newValues = selectedValues.includes(val)
      ? selectedValues.filter(v => v !== val)
      : [...selectedValues, val];
    onChange(newValues);
  };

  return (
    <div className="filter-group mb-4">
      <label className="block text-sm font-semibold mb-2 text-gray-700">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const val = opt.value || opt;
          const lab = opt.label || opt;
          const isActive = selectedValues.includes(val);

          return (
            <label 
              key={val} 
              className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${
                isActive ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => handleToggle(val)}
                className="hidden"
              />
              <span className="text-sm">{lab}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
