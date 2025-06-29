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
  useT1SevenPoints: boolean;
  onT1SevenPointsChange: (useT1SevenPoints: boolean) => void;
  isSaving?: boolean;
  lastSavedAt?: string | null;
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

export const Header: React.FC<HeaderProps> = ({ 
  workers, 
  selectedWorkerId, 
  onWorkerChange, 
  period, 
  onPeriodChange, 
  onAddWorkerClick, 
  onExitApp, 
  useT1SevenPoints, 
  onT1SevenPointsChange,
  isSaving = false,
  lastSavedAt = null
}) => {
  const periodOptions = [...basePeriods];
  if (!periodOptions.includes(period)) {
      periodOptions.unshift(period);
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      {/* Barra superior con título y estado */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Evaluación de Desempeño
            </h1>
            
            {/* Indicador de estado de guardado */}
            <div className="flex items-center gap-2">
              {isSaving ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full">
                  <svg className="animate-spin h-4 w-4 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium text-amber-700">Guardando...</span>
                </div>
              ) : lastSavedAt ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium text-green-700">Guardado: {lastSavedAt}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full">
                  <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600">No guardado</span>
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-3">
            <button
              onClick={onAddWorkerClick}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <UserPlusIcon className="h-4 w-4" />
              <span>Nuevo Trabajador</span>
            </button>
            
            <button
              onClick={onExitApp}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra inferior con controles */}
      <div className="px-6 py-4">
        <div className="flex flex-wrap items-center gap-6">
          {/* Selector de trabajador */}
          <div className="flex-1 min-w-0 max-w-xs">
            <label htmlFor="worker-select" className="block text-sm font-medium text-gray-700 mb-1">
              Trabajador/a
            </label>
            <select
              id="worker-select"
              value={selectedWorkerId || ''}
              onChange={(e) => onWorkerChange(e.target.value)}
              disabled={workers.length === 0}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              <option value="" disabled>
                {workers.length === 0 ? 'No hay trabajadores' : 'Seleccione un trabajador'}
              </option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>{worker.name}</option>
              ))}
            </select>
          </div>

          {/* Selector de período */}
          <div className="flex-1 min-w-0 max-w-xs">
            <label htmlFor="period-select" className="block text-sm font-medium text-gray-700 mb-1">
              Período
            </label>
            <select
              id="period-select"
              value={period}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              {periodOptions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Toggle TRAMO 1 */}
          <div className="flex-1 min-w-0 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Configuración TRAMO 1
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onT1SevenPointsChange(!useT1SevenPoints)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  useT1SevenPoints ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useT1SevenPoints ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {useT1SevenPoints ? '7 puntos' : '8 puntos'}
                </span>
                <span className="text-xs text-gray-500">
                  {useT1SevenPoints ? '3 criterios' : '4 criterios'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
