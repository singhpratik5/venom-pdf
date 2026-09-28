import React from 'react';

interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, color, onChange, disabled }) => {
  return (
    <div className="flex items-center justify-between py-2">
      <label className="text-sm text-gray-300">{label}</label>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 uppercase">{color}</span>
        <div className="relative w-8 h-8 rounded overflow-hidden border border-gray-600">
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
