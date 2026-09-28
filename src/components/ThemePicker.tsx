import React from 'react';
import { useTheme } from '../hooks/useTheme';
import clsx from 'clsx';

const ThemePicker: React.FC = () => {
  const { theme, predefinedThemes, applyTheme } = useTheme();

  return (
    <div className="flex-1 flex flex-col min-h-[50%]">
      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Themes
      </div>
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 gap-2">
        {predefinedThemes.map((t) => (
          <div
            key={t.id}
            onClick={() => applyTheme(t)}
            className={clsx(
              "p-3 rounded border cursor-pointer transition-all",
              theme.id === t.id 
                ? "border-accent-toxic bg-background-main" 
                : "border-background-border hover:border-gray-500"
            )}
          >
            <div className="font-medium text-sm mb-1">{t.name}</div>
            <div className="flex gap-1 mb-2">
              <div className="w-4 h-4 rounded-full border border-gray-600" style={{ backgroundColor: t.background }} title="Background" />
              <div className="w-4 h-4 rounded-full border border-gray-600" style={{ backgroundColor: t.text }} title="Text" />
              <div className="w-4 h-4 rounded-full border border-gray-600" style={{ backgroundColor: t.accent }} title="Accent" />
            </div>
            <div className="text-xs text-gray-500 line-clamp-2">{t.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThemePicker;
