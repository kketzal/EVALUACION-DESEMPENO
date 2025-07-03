import React from 'react';
import { Competency } from '../types';
import SessionTimeoutModal from './SessionTimeoutModal';

interface SidebarProps {
  competencies: Competency[];
  activeCompetencyId: string;
  onCompetencyChange: (id: string) => void;
  compact?: boolean;
  mobile?: boolean;
  fixedDesktop?: boolean;
  onOpenSettings?: () => void;
  className?: string;
  handleExportDB: () => void;
  handleImportDB: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  dbLoading?: boolean;
  dbMessage?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ competencies, activeCompetencyId, onCompetencyChange, compact = false, mobile = false, fixedDesktop = false, onOpenSettings, className, handleExportDB, handleImportDB, fileInputRef, dbLoading = false, dbMessage }) => {
  const [isTimeoutModalOpen, setTimeoutModalOpen] = React.useState(false);

  return (
    <aside
      className={`w-80 bg-gradient-to-b from-slate-50 to-white shadow-xl border-r border-slate-200 rounded-none ${compact ? 'pb-6 px-4' : 'p-6 pt-4'} flex flex-col lg:fixed lg:left-0 lg:top-[96px] lg:max-h-[calc(100vh-96px-56px)] lg:overflow-y-auto lg:z-10 ${className || ''}`}
    >
      {/* Título de competencias */}
      <div className="mb-6 px-2">
        <h2 className="text-2xl font-extrabold text-indigo-900 tracking-tight border-b-2 border-indigo-100 pb-2">Competencias</h2>
      </div>
      {/* Lista de competencias */}
      <nav className="pr-1">
        <ul className="space-y-0.5">
          {competencies.map((competency, idx) => (
            <li key={competency.id} className={idx === 0 ? '!mt-0' : ''}>
              <button
                onClick={() => onCompetencyChange(competency.id)}
                className={`group w-full text-left px-3 py-1 rounded-xl transition-all duration-300 transform hover:scale-[1.02] ${
                  activeCompetencyId === competency.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-100 hover:to-indigo-50 hover:shadow-md'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    activeCompetencyId === competency.id
                      ? 'bg-white/20'
                      : 'bg-indigo-100 group-hover:bg-indigo-200'
                  }`}>
                    <span className={`text-xs font-bold ${
                      activeCompetencyId === competency.id
                        ? 'text-white'
                        : 'text-indigo-600'
                    }`}>
                      {competency.id}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${
                    activeCompetencyId === competency.id
                      ? 'text-white'
                      : 'text-slate-700'
                  }`}>
                    {competency.title.replace(/^[A-Z]\.\s*/, '')}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Separador visual */}
      <div className="my-6 border-t border-slate-200" />

      {/* Bloque de opciones */}
      <div className="flex flex-col gap-1">
        <button
          onClick={() => onCompetencyChange('summary')}
          className={`group w-full text-left px-3 py-1 rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center space-x-3 ${
            activeCompetencyId === 'summary'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
              : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-100 hover:to-emerald-50 hover:shadow-md'
          }`}
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            activeCompetencyId === 'summary'
              ? 'bg-white/20'
              : 'bg-emerald-100 group-hover:bg-emerald-200'
          }`}>
            <svg className={`w-3.5 h-3.5 ${
              activeCompetencyId === 'summary'
                ? 'text-white'
                : 'text-emerald-600'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className={`text-sm font-medium ${
            activeCompetencyId === 'summary'
              ? 'text-white'
              : 'text-slate-700'
          }`}>
            Resumen y Guardado
          </span>
        </button>
        <button
          onClick={() => onCompetencyChange('manage-users')}
          className={`group w-full text-left px-3 py-1 rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center space-x-3 ${
            activeCompetencyId === 'manage-users'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-100 hover:to-blue-50 hover:shadow-md'
          }`}
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            activeCompetencyId === 'manage-users'
              ? 'bg-white/20'
              : 'bg-blue-100 group-hover:bg-blue-200'
          }`}>
            <svg className={`w-3.5 h-3.5 ${
              activeCompetencyId === 'manage-users'
                ? 'text-white'
                : 'text-blue-600'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <span className={`text-sm font-medium ${
            activeCompetencyId === 'manage-users'
              ? 'text-white'
              : 'text-slate-700'
          }`}>
            Gestionar usuarios
          </span>
        </button>
        <button
          onClick={() => onCompetencyChange('settings')}
          className={`group w-full text-left px-3 py-1 rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center space-x-3 ${
            activeCompetencyId === 'settings'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
              : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-100 hover:to-amber-50 hover:shadow-md'
          }`}
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            activeCompetencyId === 'settings'
              ? 'bg-white/20'
              : 'bg-amber-100 group-hover:bg-amber-200'
          }`}>
            <svg className={`w-4 h-4 ${
              activeCompetencyId === 'settings'
                ? 'text-white'
                : 'text-amber-600'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-sm font-medium">Configuración</span>
        </button>
      </div>
      <SessionTimeoutModal open={isTimeoutModalOpen} onClose={() => setTimeoutModalOpen(false)} />
    </aside>
  );
};
