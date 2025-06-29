import React from 'react';
import clsx from 'clsx';
import { Competency } from '../types';
import { SaveIcon } from './icons';

interface SidebarProps {
  competencies: Competency[];
  activeId: string;
  onSelect: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ competencies, activeId, onSelect }) => {
  return (
    <aside className="fixed top-0 left-0 h-screen w-[280px] bg-gray-800 text-white flex-col p-4 shadow-lg z-20 hidden md:flex">
      <h2 className="text-lg font-semibold mb-6 px-2">Competencias</h2>
      <nav className="flex-grow overflow-y-auto pr-2">
        <ul>
          {competencies.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => onSelect(c.id)}
                className={clsx(
                  'w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 flex items-center gap-3',
                  {
                    'bg-indigo-600 text-white': activeId === c.id,
                    'text-gray-300 hover:bg-gray-700 hover:text-white': activeId !== c.id,
                  }
                )}
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-gray-700 text-xs flex-shrink-0">{c.id}</span>
                <span>{c.title.split('. ')[1]}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="pt-4 border-t border-gray-700">
        <button
          onClick={() => onSelect('summary')}
          className={clsx(
            'w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 flex items-center gap-3',
            {
              'bg-indigo-600 text-white': activeId === 'summary',
              'text-gray-300 hover:bg-gray-700 hover:text-white': activeId !== 'summary',
            }
          )}
        >
          <SaveIcon className="h-5 w-5" />
          <span>Resumen y Guardado</span>
        </button>
      </div>
    </aside>
  );
};
