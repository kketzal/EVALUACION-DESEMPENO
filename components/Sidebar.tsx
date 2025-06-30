import React from 'react';
import { Competency } from '../types';

interface SidebarProps {
  competencies: Competency[];
  activeCompetencyId: string;
  onCompetencyChange: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ competencies, activeCompetencyId, onCompetencyChange }) => {
  return (
    <aside className="w-72 bg-white shadow-lg rounded-lg p-4 h-fit">
      <nav>
        <ul className="space-y-2">
          {competencies.map((competency) => (
            <li key={competency.id}>
              <button
                onClick={() => onCompetencyChange(competency.id)}
                className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                  activeCompetencyId === competency.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {competency.title}
              </button>
            </li>
          ))}
          <li>
            <button
              onClick={() => onCompetencyChange('summary')}
              className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                activeCompetencyId === 'summary'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Resumen y Guardado
            </button>
          </li>
        </ul>
      </nav>
      <div className="pt-6">
        <button
          onClick={() => typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('open-manage-users'))}
          className="w-full text-left px-4 py-2 rounded-md transition-colors text-gray-600 hover:bg-gray-50 mt-2 border-t border-gray-200"
        >
          Gestionar usuarios
        </button>
      </div>
    </aside>
  );
};
