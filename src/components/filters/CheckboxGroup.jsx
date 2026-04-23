import React from 'react';

export default function CheckboxGroup({ label, options, selectedValues, onChange, compact = false }) {
  const handleToggle = (val) => {
    const newValues = selectedValues.includes(val)
      ? selectedValues.filter(v => v !== val)
      : [...selectedValues, val];
    onChange(newValues);
  };

  return (
    <div className={`filter-group ${compact ? 'mb-3' : 'mb-4'}`}>
      {label && (
        <label className={`block font-semibold mb-1.5 text-gray-700 ${compact ? 'text-xs' : 'text-sm'}`}>
          {label}
        </label>
      )}
      <div className={compact ? 'flex flex-col gap-1' : 'grid grid-cols-2 gap-2'}>
        {options.map((opt) => {
          const val = opt.value || opt;
          const lab = opt.label || opt;
          const isActive = selectedValues.includes(val);

          return (
            <label
              key={val}
              className={`flex items-center gap-2 cursor-pointer transition-colors rounded-lg ${
                compact
                  ? `px-2 py-1 text-xs ${isActive ? 'text-blue-700 font-semibold' : 'text-gray-600 hover:text-gray-900'}`
                  : `p-2 border ${isActive ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white hover:bg-gray-50'}`
              }`}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => handleToggle(val)}
                className="hidden"
              />
              <span
                className={`flex-shrink-0 w-3.5 h-3.5 rounded border transition-colors ${
                  isActive ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                }`}
                aria-hidden="true"
              />
              <span>{lab}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
