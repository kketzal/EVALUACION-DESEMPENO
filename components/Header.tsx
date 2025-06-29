import React from 'react';
import { Worker } from '../types';
import { UserPlusIcon } from './icons';

interface HeaderProps {
  workers: Worker[];
  selectedWorkerId: string | null;
  onWorkerChange: (id: string) => void;
  period: string;
  onPeriodChange: (period: string) => void;
  onAddWorkerClick: () => void;
  onExitApp: () => void;
}

const generateBiennialPeriods = (startYear: number, count: number): string[] => {
    const periods: string[] = [];
    let currentStartYear = startYear;
    for (let i = 0; i < count; i++) {
        periods.push(`${currentStartYear}-${currentStartYear + 1}`);
        currentStartYear += 2;
    }
    return periods;
};

const basePeriods = generateBiennialPeriods(2023, 10); // Genera 10 periodos desde 2023-2024

export const Header: React.FC<HeaderProps> = ({ workers, selectedWorkerId, onWorkerChange, period, onPeriodChange, onAddWorkerClick, onExitApp }) => {
  const periodOptions = [...basePeriods];
  if (!periodOptions.includes(period)) {
      periodOptions.unshift(period);
  }

  return (
    <header className="bg-white shadow-sm p-4 mb-6 sticky top-0 z-10 border-b border-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          Evaluación de Desempeño
        </h1>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-full sm:w-auto">
            <label htmlFor="worker-select" className="block text-sm font-medium text-gray-700 mb-1">Trabajador/a</label>
            <select
              id="worker-select"
              value={selectedWorkerId || ''}
              onChange={(e) => onWorkerChange(e.target.value)}
              disabled={workers.length === 0}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              <option value="" disabled>
                {workers.length === 0 ? 'No hay trabajadores' : 'Seleccione un trabajador'}
              </option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>{worker.name}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-auto">
             <label htmlFor="period-select" className="block text-sm font-medium text-gray-700 mb-1">Período</label>
            <select
              id="period-select"
              value={period}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
            >
              {periodOptions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
           <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1 opacity-0 pointer-events-none">Acción</label>
             <button
                onClick={onAddWorkerClick}
                className="mt-1 flex items-center justify-center gap-2 w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <UserPlusIcon className="h-5 w-5" />
                <span>Nuevo Trabajador</span>
              </button>
           </div>
           <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1 opacity-0 pointer-events-none">Salir</label>
             <button
                onClick={onExitApp}
                className="mt-1 flex items-center justify-center gap-2 w-full px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Salir</span>
              </button>
           </div>
        </div>
      </div>
    </header>
  );
};
