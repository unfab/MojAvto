import React from 'react';

// onCommit fires on blur/Enter — use this for auto-apply in sidebar to avoid per-keystroke updates
export default function RangeSlider({ label, value, onChange, onCommit, min = 0, max = 100000, step = 100, unit = '', compact = false }) {
  const inputClass = compact
    ? 'w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white'
    : 'w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none';

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter' && onCommit) {
      onCommit({ ...value, [field]: Number(e.target.value) });
    }
  };

  return (
    <div className={`filter-group ${compact ? 'mb-3' : 'mb-4'}`}>
      <label className={`block font-semibold mb-1.5 text-gray-700 ${compact ? 'text-xs' : 'text-sm'}`}>{label}</label>
      <div className="flex gap-2 items-center">
        <input
          type="number"
          value={value.min}
          min={min}
          max={value.max}
          step={step}
          onChange={(e) => onChange({ ...value, min: Number(e.target.value) })}
          onBlur={(e) => onCommit && onCommit({ ...value, min: Number(e.target.value) })}
          onKeyDown={(e) => handleKeyDown(e, 'min')}
          className={inputClass}
          placeholder={`Od${unit ? ' ' + unit : ''}`}
        />
        <span className="text-gray-400 flex-shrink-0">—</span>
        <input
          type="number"
          value={value.max}
          min={value.min}
          max={max}
          step={step}
          onChange={(e) => onChange({ ...value, max: Number(e.target.value) })}
          onBlur={(e) => onCommit && onCommit({ ...value, max: Number(e.target.value) })}
          onKeyDown={(e) => handleKeyDown(e, 'max')}
          className={inputClass}
          placeholder={`Do${unit ? ' ' + unit : ''}`}
        />
      </div>
    </div>
  );
}
