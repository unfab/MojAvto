import React from 'react';

export default function RangeSlider({ label, value, onChange, min = 0, max = 100000, step = 100, unit = '' }) {
  return (
    <div className="filter-group mb-4">
      <label className="block text-sm font-semibold mb-2 text-gray-700">{label}</label>
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <input
            type="number"
            value={value.min}
            onChange={(e) => onChange({ ...value, min: Number(e.target.value) })}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder={`Od ${unit}`}
          />
        </div>
        <span className="text-gray-400">—</span>
        <div className="relative flex-1">
          <input
            type="number"
            value={value.max}
            onChange={(e) => onChange({ ...value, max: Number(e.target.value) })}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder={`Do ${unit}`}
          />
        </div>
      </div>
    </div>
  );
}
