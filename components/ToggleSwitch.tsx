import React from 'react';
import clsx from 'clsx';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, id }) => {
  return (
    <button
      type="button"
      onClick={() => {
        console.log('ToggleSwitch clicked:', id, 'current:', checked, 'new:', !checked);
        onChange(!checked);
      }}
      className="inline-flex items-center cursor-pointer focus:outline-none"
    >
      <span className="relative">
        <div className={clsx(
          "block w-10 h-6 rounded-full transition-colors",
          { "bg-indigo-600": checked, "bg-gray-300": !checked }
        )}></div>
        <div className={clsx(
          "dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform",
          { "transform translate-x-4": checked }
        )}></div>
      </span>
    </button>
  );
};
