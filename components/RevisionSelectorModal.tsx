import React from 'react';

interface Evaluation {
  id: number;
  period: string;
  version: number;
  created_at: string;
  updated_at: string;
  worker_id: string;
}

interface RevisionSelectorModalProps {
  isOpen: boolean;
  evaluations: Evaluation[];
  onContinue: (evaluation: Evaluation) => void;
  onNew: (period: string) => void;
  onSelect: (evaluation: Evaluation) => void;
  onClose: () => void;
  isLoading?: boolean;
  periods?: string[]; // Lista de periodos bienales posibles
}

export function RevisionSelectorModal({ isOpen, evaluations, onContinue, onNew, onSelect, onClose, isLoading = false, periods = [] }: RevisionSelectorModalProps) {
  console.log('RevisionSelectorModal renderizado:', { isOpen, evaluationsLength: evaluations?.length, isLoading });
  
  if (!isOpen) return null;

  const [selectedPeriod, setSelectedPeriod] = React.useState(periods[0] || '2023-2024');

  // Filtrar evaluaciones por el periodo seleccionado
  const filteredEvaluations = evaluations.filter(ev => ev.period === selectedPeriod);
  const lastEval = filteredEvaluations.length > 0 ? filteredEvaluations[0] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-fade-in">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Selecciona una evaluación</h2>
        {lastEval && (
          <button
            className="w-full mb-3 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => onContinue(lastEval)}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Cargando evaluación...</span>
              </div>
            ) : (
              <>
                Continuar con la última evaluación<br/>
                <span className="text-xs font-normal text-indigo-100">Periodo: {lastEval.period} | Versión: {lastEval.version}</span>
              </>
            )}
          </button>
        )}
        {/* Selector de periodo bienal */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Periodo bienal</label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 text-base bg-white"
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            disabled={isLoading}
          >
            {periods.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <button
          className="w-full mb-6 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold shadow hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onNew(selectedPeriod)}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Creando nueva evaluación...</span>
            </div>
          ) : (
            'Crear nueva evaluación'
          )}
        </button>
        <div className="mb-2 text-gray-700 font-medium">O abrir una guardada:</div>
        <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 rounded-lg border border-gray-100 bg-gray-50 mb-2">
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Cargando evaluaciones...</p>
            </div>
          ) : filteredEvaluations.length > 0 ? (
            filteredEvaluations.map((ev: Evaluation) => (
              <button
                key={ev.id}
                className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => onSelect(ev)}
                disabled={isLoading}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Periodo: {ev.period}</span>
                  <span className="text-xs text-gray-500">Versión: {ev.version}</span>
                </div>
                <div className="text-xs text-gray-500">{new Date(ev.created_at).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</div>
              </button>
            ))
          ) : (
            <div className="py-4 text-gray-400 text-center">No hay evaluaciones guardadas</div>
          )}
        </div>
        <button className="mt-2 w-full text-gray-400 hover:text-gray-600 text-sm" onClick={onClose}>Cancelar</button>
      </div>
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
} 