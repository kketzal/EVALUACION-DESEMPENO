import React, { useState } from 'react';

interface SettingsPageProps {
  sessionTimeout: number;
  onSessionTimeoutChange: (timeout: number) => void;
  handleExportDB: () => void;
  handleImportDB: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  dbLoading?: boolean;
  dbMessage?: string | null;
  useT1SevenPoints: boolean;
  onT1SevenPointsChange: (useT1SevenPoints: boolean) => void;
  autoSave: boolean;
  onAutoSaveChange: (autoSave: boolean) => void;
}

const TIMEOUT_OPTIONS = [5, 10, 15, 30, 60];

export const SettingsPage: React.FC<SettingsPageProps> = ({
  sessionTimeout,
  onSessionTimeoutChange,
  handleExportDB,
  handleImportDB,
  fileInputRef,
  dbLoading = false,
  dbMessage,
  useT1SevenPoints,
  onT1SevenPointsChange,
  autoSave,
  onAutoSaveChange
}) => {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Configuración</h2>
      {/* Accordion: Session Timeout */}
      <div className="mb-4 border rounded-lg bg-white shadow">
        <button className="w-full flex justify-between items-center px-4 py-3 text-lg font-medium text-gray-800 focus:outline-none" onClick={() => setOpen(open === 'timeout' ? null : 'timeout')}>
          Tiempo de sesión
          <span>{open === 'timeout' ? '▲' : '▼'}</span>
        </button>
        {open === 'timeout' && (
          <div className="px-4 pb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Minutos de inactividad antes de cerrar sesión:</label>
            <select
              value={sessionTimeout}
              onChange={e => onSessionTimeoutChange(Number(e.target.value))}
              className="w-32 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {TIMEOUT_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt} minutos</option>
              ))}
            </select>
          </div>
        )}
      </div>
      {/* Accordion: Importar/Exportar BD */}
      <div className="mb-4 border rounded-lg bg-white shadow">
        <button className="w-full flex justify-between items-center px-4 py-3 text-lg font-medium text-gray-800 focus:outline-none" onClick={() => setOpen(open === 'db' ? null : 'db')}>
          Importar / Exportar Base de Datos
          <span>{open === 'db' ? '▲' : '▼'}</span>
        </button>
        {open === 'db' && (
          <div className="px-4 pb-4 flex flex-col gap-3">
            <button
              onClick={handleExportDB}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              disabled={dbLoading}
            >
              Exportar BD
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
              disabled={dbLoading}
            >
              Importar BD
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".sqlite,.db,.json"
              onChange={handleImportDB}
            />
            {dbMessage && <div className="text-sm text-indigo-700 mt-2">{dbMessage}</div>}
          </div>
        )}
      </div>
      {/* Accordion: Configuración TRAMO 1 */}
      <div className="mb-4 border rounded-lg bg-white shadow">
        <button className="w-full flex justify-between items-center px-4 py-3 text-lg font-medium text-gray-800 focus:outline-none" onClick={() => setOpen(open === 'tramo' ? null : 'tramo')}>
          Configuración TRAMO 1
          <span>{open === 'tramo' ? '▲' : '▼'}</span>
        </button>
        {open === 'tramo' && (
          <div className="px-4 pb-4 flex items-center gap-4">
            <span className="text-sm">Modo:</span>
            <button
              onClick={() => onT1SevenPointsChange(!useT1SevenPoints)}
              className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${useT1SevenPoints ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${useT1SevenPoints ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
            <span className="text-sm font-medium text-gray-900">
              {useT1SevenPoints ? '7 puntos (3 criterios)' : '8 puntos (4 criterios)'}
            </span>
          </div>
        )}
      </div>
      {/* Accordion: Guardado Automático */}
      <div className="mb-4 border rounded-lg bg-white shadow">
        <button className="w-full flex justify-between items-center px-4 py-3 text-lg font-medium text-gray-800 focus:outline-none" onClick={() => setOpen(open === 'autosave' ? null : 'autosave')}>
          Guardado Automático
          <span>{open === 'autosave' ? '▲' : '▼'}</span>
        </button>
        {open === 'autosave' && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-4 mb-3">
              <span className="text-sm">Guardar automáticamente cambios:</span>
              <button
                onClick={() => onAutoSaveChange(!autoSave)}
                className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${autoSave ? 'bg-indigo-600' : 'bg-gray-200'}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${autoSave ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
              <span className="text-sm font-medium text-gray-900">
                {autoSave ? 'Activado' : 'Desactivado'}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {autoSave 
                ? 'Los cambios se guardan automáticamente al modificar criterios, evidencia o archivos. El botón "Guardar" en la página de Resumen solo actualiza el timestamp.'
                : 'Los cambios solo se guardan al hacer clic en el botón "Guardar" en la página de Resumen y Guardado.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 