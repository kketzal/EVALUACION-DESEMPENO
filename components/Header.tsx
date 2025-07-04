import React, { useState } from 'react';
import { Worker } from '../types';
import { UserPlusIcon } from './icons';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';

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

interface VersionSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  periods: string[];
  versionsByPeriod: Record<string, { version: number, created_at: string, id: number }[]>;
  onSelect: (period: string, version: number) => void;
  onNew: (period: string) => void;
  currentPeriod: string;
}

const VersionSelectorModal: React.FC<VersionSelectorModalProps> = ({ isOpen, onClose, periods, versionsByPeriod, onSelect, onNew, currentPeriod }) => {
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative animate-fade-in">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Seleccionar periodo y evaluación</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Periodo</label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 text-base bg-white"
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
          >
            {periods.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Evaluaciones guardadas</label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {(versionsByPeriod[selectedPeriod] || []).map(v => (
              <button
                key={v.version}
                onClick={() => onSelect(selectedPeriod, v.version)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 hover:bg-indigo-50 transition-colors text-left"
              >
                <span className="font-mono text-sm text-gray-800">v{v.version}</span>
                <span className="text-xs text-gray-500 ml-2">{new Date(v.created_at).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</span>
              </button>
            ))}
            {(!versionsByPeriod[selectedPeriod] || versionsByPeriod[selectedPeriod].length === 0) && (
              <div className="text-gray-400 text-sm text-center py-2">No hay evaluaciones guardadas</div>
            )}
          </div>
        </div>
        <button
          onClick={() => onNew(selectedPeriod)}
          className="mt-4 w-full py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow"
        >
          Nueva evaluación para este periodo
        </button>
      </div>
    </div>
  );
};

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
  onHamburgerClick,
  workerEvaluations = [],
  onSelectVersion,
  onNewVersion
}) => {
  const [isVersionModalOpen, setVersionModalOpen] = useState(false);

  // Agrupar evaluaciones por periodo
  const versionsByPeriod: Record<string, { version: number, created_at: string, id: number }[]> = {};
  workerEvaluations.forEach(ev => {
    if (!versionsByPeriod[ev.period]) versionsByPeriod[ev.period] = [];
    versionsByPeriod[ev.period].push({ version: ev.version, created_at: ev.created_at, id: ev.id });
  });
  const periods = Object.keys(versionsByPeriod).sort().reverse();

  const periodOptions = [...basePeriods];
  if (!periodOptions.includes(period)) {
      periodOptions.unshift(period);
  }

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
            <span className="text-[10px] text-indigo-700 font-normal">{worker.worker_group}</span>
            <Listbox value={period} onChange={onPeriodChange}>
              {({ open }) => (
                <div className="relative min-w-[70px]">
                  <Listbox.Button className="text-[10px] bg-white border border-indigo-200 text-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all w-full px-2 py-1 pr-6 appearance-none shadow-sm cursor-pointer flex items-center justify-between">
                    <span className="truncate">{period}</span>
                    <svg className={`h-4 w-4 ml-1 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Listbox.Button>
                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-xl rounded-md py-1 ring-1 ring-black ring-opacity-5 focus:outline-none text-[11px]">
                      {periodOptions.map((p) => (
                        <Listbox.Option
                          key={p}
                          value={p}
                          className={({ active, selected }) =>
                            `cursor-pointer select-none px-3 py-2 rounded-md mx-1 my-0.5 ${
                              active ? 'bg-indigo-100 text-indigo-900' : selected ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-900'
                            }`
                          }
                        >
                          {p}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              )}
            </Listbox>
          </div>
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
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-indigo-700 font-normal">{worker.worker_group}</span>
              <Listbox value={period} onChange={onPeriodChange}>
                {({ open }) => (
                  <div className="relative min-w-[100px]">
                    <Listbox.Button className="text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors w-auto min-w-[90px] px-2 py-1 appearance-none shadow-sm cursor-pointer flex items-center justify-between">
                      <span className="truncate">{period}</span>
                      <svg className={`h-4 w-4 ml-1 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Listbox.Button>
                    <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-xl rounded-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none text-xs">
                        {periodOptions.map((p) => (
                          <Listbox.Option
                            key={p}
                            value={p}
                            className={({ active, selected }) =>
                              `cursor-pointer select-none px-3 py-2 rounded-md mx-1 my-0.5 ${
                                active ? 'bg-indigo-100 text-indigo-900' : selected ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-900'
                              }`
                            }
                          >
                            {p}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                )}
              </Listbox>
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
        <div className="flex items-center gap-4">
          {/* Logos a la izquierda */}
          <img src="/logos/logo_uco-3.png" alt="Logo UCO" className="h-10 w-auto" />
          <img src="/logos/logo_scai.png" alt="Logo SCAI" className="h-10 w-auto" />
          <h1 className="text-2xl font-bold text-gray-900 ml-4">Evaluación de Desempeño</h1>
          {/* El resto del header minimalista sigue aquí... */}
          <div className="flex items-center gap-2 min-w-[120px]">
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xs text-amber-700 font-normal">Guardando...</span>
              </>
            ) : lastSavedAt ? (
              <>
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs text-green-700 font-normal">Guardado</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-xs text-gray-500 font-normal">No guardado</span>
              </>
            )}
          </div>
          {/* Usuario y periodo */}
          {userDesktopBlock}
          {/* Botones de acción */}
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
              onClick={onExitApp}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors shadow-sm"
              title="Salir de la aplicación"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Salir
            </button>
            <button
              onClick={() => setVersionModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 transition-colors shadow-sm"
              title="Seleccionar periodo/evaluación"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h2a4 4 0 014 4v2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7a4 4 0 018 0" />
              </svg>
              Seleccionar periodo/evaluación
            </button>
          </div>
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
        {/* Fila 2: Menú hamburguesa + usuario + cambiar usuario */}
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
          {/* Botón cambiar usuario a la derecha */}
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
      <VersionSelectorModal
        isOpen={isVersionModalOpen}
        onClose={() => setVersionModalOpen(false)}
        periods={periods}
        versionsByPeriod={versionsByPeriod}
        onSelect={(p, v) => { setVersionModalOpen(false); onSelectVersion && onSelectVersion(p, v); }}
        onNew={p => { setVersionModalOpen(false); onNewVersion && onNewVersion(p); }}
        currentPeriod={period}
      />
    </header>
  );
};
