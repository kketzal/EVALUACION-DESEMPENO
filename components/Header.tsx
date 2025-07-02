import React from 'react';
import { Worker } from '../types';
import { UserPlusIcon } from './icons';

interface HeaderProps {
  workers: Worker[];
  selectedWorkerId: string | null;
  onWorkerChange: (id: string) => void;
  onChangeWorkerClick: () => void;
  period: string;
  onPeriodChange: (period: string) => void;
  onAddWorkerClick: () => void;
  onExitApp: () => void;
  useT1SevenPoints: boolean;
  onT1SevenPointsChange: (useT1SevenPoints: boolean) => void;
  isSaving?: boolean;
  lastSavedAt?: string | null;
  onHamburgerClick?: () => void;
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
  onChangeWorkerClick, 
  period, 
  onPeriodChange, 
  onAddWorkerClick, 
  onExitApp, 
  useT1SevenPoints, 
  onT1SevenPointsChange,
  isSaving = false,
  lastSavedAt = null,
  onHamburgerClick
}) => {
  const periodOptions = [...basePeriods];
  if (!periodOptions.includes(period)) {
      periodOptions.unshift(period);
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10 w-full">
      {/* MOBILE: Rediseño completo */}
      <div className="lg:hidden px-4 py-3 border-b border-gray-100">
        {/* Fila 1: Logos y título a la izquierda */}
        <div className="flex items-center gap-2 mb-2">
          <img src="/logos/logo_uco-3.png" alt="Logo UCO" className="h-7 w-auto" />
          <img src="/logos/logo_scai.png" alt="Logo SCAI" className="h-7 w-auto" />
          <h1 className="text-lg font-bold text-gray-900 ml-2 whitespace-nowrap">Evaluación de Desempeño</h1>
        </div>
        {/* Fila 2: Menú hamburguesa + iconos */}
        <div className="flex items-center justify-between mb-2">
          <div>
            {onHamburgerClick && (
              <button
                className="block p-2 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none"
                onClick={onHamburgerClick}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onAddWorkerClick}
              className="inline-flex items-center justify-center p-2 text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              aria-label="Nuevo Trabajador"
              title="Añadir nuevo trabajador"
            >
              <UserPlusIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onChangeWorkerClick}
              className="inline-flex items-center justify-center p-2 text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              aria-label="Cambiar trabajador"
              title="Cambiar trabajador"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={onExitApp}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none"
              title="Salir de la aplicación"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
        {/* Fila 4: Tarjeta del trabajador */}
        {selectedWorkerId && (() => {
          const worker = workers.find(w => w.id === selectedWorkerId);
          if (!worker) return null;
          return (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2 flex flex-col items-start mb-2 w-full max-w-full">
              <span className="text-base font-semibold text-indigo-900 break-words" style={{wordBreak: 'break-word'}}>{worker.name}</span>
              <span className="text-xs text-indigo-700 mt-0.5">{worker.worker_group}</span>
            </div>
          );
        })()}
        {/* Fila 5: Selector de periodo y configuración tramo */}
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex-1">
            <label htmlFor="period-select" className="block text-xs font-medium text-gray-700 mb-0.5">
              Período
            </label>
            <select
              id="period-select"
              value={period}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              {periodOptions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 flex flex-col items-end">
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Configuración TRAMO 1
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onT1SevenPointsChange(!useT1SevenPoints)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  useT1SevenPoints ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    useT1SevenPoints ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
              <div className="flex flex-col items-end">
                <span className="text-xs font-medium text-gray-900">
                  {useT1SevenPoints ? '7 puntos' : '8 puntos'}
                </span>
                <span className="text-[10px] text-gray-500">
                  {useT1SevenPoints ? '3 criterios' : '4 criterios'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* DESKTOP: Logos, título, estado, botones */}
      <div className="hidden lg:flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-4">
          {/* Logos a la izquierda */}
          <img src="/logos/logo_uco-3.png" alt="Logo UCO" className="h-10 w-auto" />
          <img src="/logos/logo_scai.png" alt="Logo SCAI" className="h-10 w-auto" />
          <h1 className="text-2xl font-bold text-gray-900 ml-4">Evaluación de Desempeño</h1>
          {/* Indicador de estado de guardado */}
          <div className="flex items-center gap-2 ml-6">
            {isSaving ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full">
                <svg className="animate-spin h-4 w-4 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        {/* Botones de acción en desktop */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onChangeWorkerClick}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            title="Cambiar trabajador"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Cambiar trabajador
          </button>
          <button
            onClick={onAddWorkerClick}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            title="Añadir nuevo trabajador"
          >
            <UserPlusIcon className="h-4 w-4" />
            <span>Nuevo Trabajador</span>
          </button>
          <button
            onClick={onExitApp}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            title="Salir de la aplicación"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Salir</span>
          </button>
        </div>
      </div>
      {/* Barra inferior con controles (solo desktop) */}
      <div className="hidden lg:block px-4 py-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Información del trabajador */}
          <div className="flex-1 min-w-0 max-w-xs w-full flex flex-col justify-center">
            {selectedWorkerId ? (
              (() => {
                const worker = workers.find(w => w.id === selectedWorkerId);
                if (!worker) return null;
                return (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2 flex flex-col items-start">
                    <span className="text-base font-semibold text-indigo-900 truncate">{worker.name}</span>
                    <span className="text-xs text-indigo-700 mt-0.5">{worker.worker_group}</span>
                  </div>
                );
              })()
            ) : null}
          </div>

          {/* Selector de período */}
          <div className="flex-1 min-w-0 max-w-xs w-full">
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
          <div className="flex-1 min-w-0 max-w-xs w-full">
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
