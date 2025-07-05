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

interface AccordionItemProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  description,
  icon,
  gradient,
  isOpen,
  onToggle,
  children
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={onToggle}
        className={`w-full p-4 text-left transition-all duration-300 ${
          isOpen ? 'bg-gradient-to-r ' + gradient : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isOpen ? 'bg-white/20' : 'bg-gray-100'}`}>
              {icon}
            </div>
            <div>
              <h3 className={`text-base font-semibold ${isOpen ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </h3>
              <p className={`text-xs ${isOpen ? 'text-white/90' : 'text-gray-600'} mt-0.5`}>
                {description}
              </p>
            </div>
          </div>
          <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            <svg 
              className={`w-4 h-4 ${isOpen ? 'text-white' : 'text-gray-400'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="p-6 pt-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export const SettingsPage: React.FC<SettingsPageProps> = ({
  sessionTimeout,
  onSessionTimeoutChange,
  handleExportDB,
  handleImportDB,
  fileInputRef,
  dbLoading = false,
  dbMessage = null,
  useT1SevenPoints,
  onT1SevenPointsChange,
  autoSave,
  onAutoSaveChange
}) => {
  const [openAccordion, setOpenAccordion] = useState<string | null>('session');

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header fuera del card interior, alineado al borde izquierdo */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg shadow-sm">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            Configuración
          </h1>
          <p className="text-gray-600 text-sm">
            Personaliza la aplicación según tus necesidades y preferencias
          </p>
        </div>
      </div>

      {/* Accordion de configuración */}
      <div className="space-y-4">
        {/* Tiempo de Sesión */}
        <AccordionItem
          title="Tiempo de Sesión"
          description="Configura el tiempo de inactividad antes de cerrar la sesión automáticamente"
          icon={
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          gradient="from-blue-400 to-blue-500"
          isOpen={openAccordion === 'session'}
          onToggle={() => toggleAccordion('session')}
        >
          <div className="space-y-3 p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo de inactividad (minutos)
              </label>
              <select
                value={sessionTimeout}
                onChange={(e) => onSessionTimeoutChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              >
                {TIMEOUT_OPTIONS.map(timeout => (
                  <option key={timeout} value={timeout}>
                    {timeout} minutos
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs font-medium text-blue-800">Información</p>
                  <p className="text-xs text-blue-700 mt-1">
                    La sesión se cerrará automáticamente después de {sessionTimeout} minutos de inactividad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </AccordionItem>

        {/* Base de Datos */}
        <AccordionItem
          title="Base de Datos"
          description="Exporta e importa datos de la aplicación para respaldo y migración"
          icon={
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          }
          gradient="from-emerald-400 to-emerald-500"
          isOpen={openAccordion === 'database'}
          onToggle={() => toggleAccordion('database')}
        >
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">Exportar datos</h4>
                <p className="text-xs text-gray-600">
                  Descarga una copia completa de la base de datos en formato JSON
                </p>
                <button
                  onClick={handleExportDB}
                  disabled={dbLoading}
                  className="w-full px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2 text-sm"
                >
                  {dbLoading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  Exportar Base de Datos
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">Importar datos</h4>
                <p className="text-xs text-gray-600">
                  Restaura datos desde un archivo JSON previamente exportado
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={dbLoading}
                  className="w-full px-3 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2 text-sm"
                >
                  {dbLoading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  )}
                  Importar Base de Datos
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleImportDB}
                  accept=".json"
                  className="hidden"
                />
              </div>
            </div>

            {dbMessage && (
              <div className={`rounded-lg p-3 ${
                dbMessage.includes('Error') 
                  ? 'bg-red-50 border border-red-100' 
                  : 'bg-green-50 border border-green-100'
              }`}>
                <div className="flex items-start gap-2">
                  {dbMessage.includes('Error') ? (
                    <svg className="w-4 h-4 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <p className={`text-xs ${
                    dbMessage.includes('Error') ? 'text-red-700' : 'text-green-700'
                  }`}>
                    {dbMessage}
                  </p>
                </div>
              </div>
            )}
          </div>
        </AccordionItem>



        {/* Configuración de Evaluación */}
        <AccordionItem
          title="Configuración de Evaluación"
          description="Personaliza el comportamiento del sistema de evaluación"
          icon={
            <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          gradient="from-violet-400 to-violet-500"
          isOpen={openAccordion === 'evaluation'}
          onToggle={() => toggleAccordion('evaluation')}
        >
          <div className="space-y-4 p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">Usar escala T1 de 7 puntos</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Activa la escala de evaluación T1 con 7 niveles de puntuación
                  </p>
                </div>
                <button
                  onClick={() => onT1SevenPointsChange(!useT1SevenPoints)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    useT1SevenPoints ? 'bg-violet-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      useT1SevenPoints ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">Guardado automático</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Guarda automáticamente los cambios en la evaluación
                  </p>
                </div>
                <button
                  onClick={() => onAutoSaveChange(!autoSave)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    autoSave ? 'bg-violet-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      autoSave ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="bg-violet-50 border border-violet-100 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-violet-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs font-medium text-violet-800">Configuración actual</p>
                  <ul className="text-xs text-violet-700 mt-1 space-y-0.5">
                    <li>• Escala T1 de 7 puntos: <span className="font-medium">{useT1SevenPoints ? 'Activada' : 'Desactivada'}</span></li>
                    <li>• Guardado automático: <span className="font-medium">{autoSave ? 'Activado' : 'Desactivado'}</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </AccordionItem>
      </div>
    </div>
  );
}; 