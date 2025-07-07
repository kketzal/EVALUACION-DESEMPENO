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
  periods?: string[];
}

export function RevisionSelectorModal({ 
  isOpen, 
  evaluations, 
  onContinue, 
  onNew, 
  onSelect, 
  onClose, 
  isLoading = false, 
  periods = [] 
}: RevisionSelectorModalProps) {
  
  if (!isOpen) return null;

  // Obtener la evaluación más reciente (por updated_at, luego por created_at)
  const getMostRecentEvaluation = () => {
    if (!evaluations || evaluations.length === 0) return null;
    
    return evaluations.sort((a, b) => {
      const aDate = a.updated_at ? new Date(a.updated_at).getTime() : new Date(a.created_at).getTime();
      const bDate = b.updated_at ? new Date(b.updated_at).getTime() : new Date(b.created_at).getTime();
      return bDate - aDate;
    })[0];
  };

  const mostRecentEvaluation = getMostRecentEvaluation();
  
  // Obtener el periodo más reciente para el selector
  const getMostRecentPeriod = () => {
    if (mostRecentEvaluation) {
      return mostRecentEvaluation.period;
    }
    return periods[0] || '2023-2024';
  };

  const [selectedPeriod, setSelectedPeriod] = React.useState(getMostRecentPeriod());

  // Actualizar periodo seleccionado cuando cambien las evaluaciones
  React.useEffect(() => {
    setSelectedPeriod(getMostRecentPeriod());
  }, [evaluations, periods]);

  // Filtrar evaluaciones por periodo
  const filteredEvaluations = React.useMemo(() => {
    return evaluations.filter(ev => ev.period === selectedPeriod);
  }, [evaluations, selectedPeriod]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-fade-in">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-150"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Selecciona una evaluación</h2>
        
        {/* Botón principal para continuar con la última evaluación */}
        {mostRecentEvaluation && (
          <div className="mb-6">
            <button
              className="w-full px-4 py-4 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => onContinue(mostRecentEvaluation)}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Cargando evaluación...</span>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-lg font-bold mb-1">Continuar con la última evaluación</div>
                  <div className="text-sm text-indigo-100">
                    Periodo: {mostRecentEvaluation.period} | Versión: {mostRecentEvaluation.version}
                  </div>
                  <div className="text-xs text-indigo-200 mt-1">
                    Última edición: {new Date(mostRecentEvaluation.updated_at || mostRecentEvaluation.created_at).toLocaleString('es-ES')}
                  </div>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Selector de periodo */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Periodo bienal</label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 text-base bg-white transition-colors duration-150"
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            disabled={isLoading}
          >
            {periods.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Botón para crear nueva evaluación */}
        <button
          className="w-full mb-6 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold shadow hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Lista de evaluaciones guardadas */}
        <div className="mb-4">
          <div className="text-gray-700 font-medium mb-2">O abrir una guardada:</div>
          <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 rounded-lg border border-gray-200 bg-gray-50">
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Cargando evaluaciones...</p>
              </div>
            ) : filteredEvaluations.length > 0 ? (
              filteredEvaluations.map((ev: Evaluation) => (
                <button
                  key={ev.id}
                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors duration-150 text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => onSelect(ev)}
                  disabled={isLoading}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">Periodo: {ev.period}</span>
                    <span className="text-xs text-gray-500">Versión: {ev.version}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(ev.updated_at || ev.created_at).toLocaleString('es-ES', { 
                      timeZone: 'Europe/Madrid',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </button>
              ))
            ) : (
              <div className="py-4 text-gray-400 text-center">No hay evaluaciones guardadas para este periodo</div>
            )}
          </div>
        </div>

        <button 
          className="mt-2 w-full text-gray-400 hover:text-gray-600 text-sm transition-colors duration-150" 
          onClick={onClose}
        >
          Cancelar
        </button>
      </div>
      
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(30px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
      `}</style>
    </div>
  );
} 