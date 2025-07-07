import React, { useState } from 'react';
import { Worker } from '../types';
import { UserPlusIcon } from './icons';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { RevisionSelectorModal } from './RevisionSelectorModal';

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
  lastSavedAtFull?: string | null;
  version?: number | null;
  onHamburgerClick?: () => void;
  isNewEvaluation?: boolean;
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

export const Header: React.FC<HeaderProps & {
  workerEvaluations?: any[];
  onSelectVersion?: (period: string, version: number) => void;
  onNewVersion?: (period: string) => void;
  isLoading?: boolean;
}> = ({
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
  lastSavedAtFull = null,
  version = null,
  onHamburgerClick,
  workerEvaluations = [],
  onSelectVersion,
  onNewVersion,
  isLoading = false,
  isNewEvaluation
}) => {
  const [isVersionModalOpen, setVersionModalOpen] = useState(false);

  // Generar periodos bienales posibles
  const biennialPeriods = generateBiennialPeriods(2023, 10);

  // Estado de guardado
  const showSavedBanner = !isSaving && lastSavedAt && !isNewEvaluation;

  // Log temporal para depurar
  console.log('Header - Debug estado de guardado:', {
    isSaving,
    lastSavedAt,
    isNewEvaluation,
    showSavedBanner,
    condition1: !isSaving,
    condition2: !!lastSavedAt,
    condition3: !isNewEvaluation
  });

  // Handlers para el RevisionSelectorModal
  const handleContinue = (evaluation: any) => {
    if (onSelectVersion) {
      onSelectVersion(evaluation.period, evaluation.version);
    }
    setVersionModalOpen(false);
  };

  const handleNew = (selectedPeriod: string) => {
    if (onNewVersion) {
      onNewVersion(selectedPeriod);
    }
    setVersionModalOpen(false);
  };

  const handleSelect = (evaluation: any) => {
    if (onSelectVersion) {
      onSelectVersion(evaluation.period, evaluation.version);
    }
    setVersionModalOpen(false);
  };

  let userMobileBlock: React.ReactNode = null;
  if (selectedWorkerId) {
    const worker = workers.find(w => w.id === selectedWorkerId);
    if (worker) {
      let nameClass = "text-xs font-semibold text-indigo-900 whitespace-nowrap text-center";
      if (worker.name.length > 22) nameClass = "text-[9px] font-semibold text-indigo-900 whitespace-nowrap text-center";
      else if (worker.name.length > 16) nameClass = "text-[10px] font-semibold text-indigo-900 whitespace-nowrap text-center";
      userMobileBlock = (
        <div className="flex flex-col items-center bg-indigo-50/70 rounded-lg px-2 py-1 shadow-sm min-w-0 flex-1 w-full">
          <span className={nameClass + " w-full truncate whitespace-nowrap text-center"} style={{wordBreak: 'break-word'}} title={worker.name}>{worker.name}</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[9px] text-indigo-700 font-normal">{worker.worker_group}</span>
            <span className="text-[9px] text-indigo-600 font-medium">•</span>
            <span className="text-[9px] text-indigo-600 font-medium">{period}</span>
            {version && (
              <>
                <span className="text-[9px] text-indigo-600 font-medium">•</span>
                <span className="text-[9px] text-indigo-600 font-semibold">v{version}</span>
              </>
            )}
          </div>
          {isSaving ? (
            <div className="flex items-center gap-1 mt-0.5">
              <svg className="animate-spin h-2.5 w-2.5 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-[9px] text-amber-600 font-medium">Guardando...</span>
            </div>
          ) : showSavedBanner ? (
            <div className="flex items-center gap-1 mt-0.5">
              <svg className="h-2.5 w-2.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[9px] text-green-600 font-medium">{lastSavedAtFull || lastSavedAt}</span>
              {version && (
                <span className="text-[9px] text-green-600 font-semibold">v{version}</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-0.5">
              <svg className="h-2.5 w-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-[9px] text-gray-500 font-medium">No guardado</span>
            </div>
          )}
        </div>
      );
    }
  }

  let userDesktopBlock: React.ReactNode = null;
  if (selectedWorkerId) {
    const worker = workers.find(w => w.id === selectedWorkerId);
    if (worker) {
      userDesktopBlock = (
        <div className="flex items-center gap-3 bg-indigo-50/70 rounded-xl px-4 py-2 shadow-sm min-w-0">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-indigo-900 break-words leading-tight" style={{wordBreak: 'break-word'}}>{worker.name}</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs text-indigo-700 font-normal">{worker.worker_group}</span>
              <span className="text-xs text-indigo-600 font-medium">•</span>
              <span className="text-xs text-indigo-600 font-medium">{period}</span>
              {version && (
                <>
                  <span className="text-xs text-indigo-600 font-medium">•</span>
                  <span className="text-xs text-indigo-600 font-semibold">v{version}</span>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white shadow-md">
      {/* DESKTOP: Logos, título, estado, botones */}
      <div className="hidden lg:flex items-center justify-between px-4 py-3 border-b border-gray-100">
        {/* Contenido izquierdo */}
        <div className="flex items-center gap-4">
          {/* Logos a la izquierda */}
          <img src="/logos/logo_uco-3.png" alt="Logo UCO" className="h-10 w-auto" />
          <img src="/logos/logo_scai.png" alt="Logo SCAI" className="h-10 w-auto" />
          <h1 className="text-2xl font-bold text-gray-900 ml-4">Evaluación de Desempeño</h1>
          {/* Estado de guardado */}
          <div className="flex items-center gap-2 min-w-[120px]">
            {isSaving ? (
              <div className="flex items-center gap-2" title="Guardando evaluación...">
                <svg className="animate-spin h-4 w-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xs text-amber-700">Guardando...</span>
              </div>
            ) : showSavedBanner ? (
              <div className="flex items-center gap-2 relative group cursor-pointer">
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs text-green-700 font-mono">{lastSavedAt}</span>
                {version && (
                  <span className="text-xs text-green-600 font-medium">v{version}</span>
                )}
                {/* Tooltip responsivo */}
                <div
                  className="absolute z-50 hidden group-hover:flex flex-col items-center"
                  style={{
                    left: '50%',
                    transform: 'translateX(-50%)',
                    minWidth: '140px',
                    maxWidth: '260px',
                    wordBreak: 'break-word',
                    bottom: 'auto',
                    top: 'calc(100% + 8px)',
                  }}
                >
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-pre-line text-center">
                    {`Guardado: ${lastSavedAtFull ? lastSavedAtFull : (lastSavedAt ? `${lastSavedAt} (hora no disponible)` : 'Fecha no disponible')}`}
                    {version && `\nVersión: v${version}`}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2" title="Evaluación no guardada">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-xs text-gray-500">No guardado</span>
              </div>
            )}
          </div>
          {/* Usuario y periodo */}
          {userDesktopBlock}
        </div>
        
        {/* Contenido derecho */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onChangeWorkerClick}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 transition-colors shadow-sm"
            title="Cambiar trabajador"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Cambiar trabajador
          </button>
          <button
            onClick={() => setVersionModalOpen(true)}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Seleccionar periodo/evaluación"
            disabled={isLoading}
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h2a4 4 0 014 4v2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7a4 4 0 018 0" />
              </svg>
            )}
            {isLoading ? 'Cargando...' : 'Seleccionar periodo/evaluación'}
          </button>
          <button
            onClick={onExitApp}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors shadow-sm"
            title="Salir de la aplicación"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Salir
          </button>
        </div>
      </div>
      {/* MOBILE: Logos y título originales */}
      <div className="lg:hidden px-4 py-3 border-b border-gray-100 relative">
        <div className="flex items-center gap-2 mb-2">
          <img src="/logos/logo_uco-3.png" alt="Logo UCO" className="h-7 w-auto" />
          <img src="/logos/logo_scai.png" alt="Logo SCAI" className="h-7 w-auto" />
          <h1 className="text-lg font-bold text-gray-900 ml-1 whitespace-nowrap">Evaluación de Desempeño</h1>
        </div>
        {/* Botón logout flotante en móvil */}
        <button
          onClick={onExitApp}
          className="absolute top-1.5 right-2 z-20 p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none lg:hidden"
          title="Salir de la aplicación"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
        {/* Fila 2: Menú hamburguesa + usuario + botones */}
        <div className="flex items-center justify-between mb-2 gap-2">
          {onHamburgerClick && (
            <button
              className="block p-2 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none mr-2"
              onClick={onHamburgerClick}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          {userMobileBlock}
          {/* Botones a la derecha */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setVersionModalOpen(true)}
              className={`inline-flex items-center justify-center p-2 text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Seleccionar periodo/evaluación"
              title="Seleccionar periodo/evaluación"
              disabled={isLoading}
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h2a4 4 0 014 4v2" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7a4 4 0 018 0" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={onChangeWorkerClick}
              className="inline-flex items-center justify-center p-2 text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 transition-colors"
              aria-label="Cambiar trabajador"
              title="Cambiar trabajador"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

      </div>
      <RevisionSelectorModal
        isOpen={isVersionModalOpen}
        evaluations={workerEvaluations}
        onContinue={handleContinue}
        onNew={handleNew}
        onSelect={handleSelect}
        onClose={() => setVersionModalOpen(false)}
        isLoading={isLoading}
        periods={biennialPeriods}
      />
    </header>
  );
};
