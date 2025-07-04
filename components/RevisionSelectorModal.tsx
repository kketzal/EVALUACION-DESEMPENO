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
  onNew: () => void;
  onSelect: (evaluation: Evaluation) => void;
  onClose: () => void;
}

export function RevisionSelectorModal({ isOpen, evaluations, onContinue, onNew, onSelect, onClose }: RevisionSelectorModalProps) {
  if (!isOpen) return null;

  const lastEval = evaluations && evaluations.length > 0 ? evaluations[0] : null;

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
            className="w-full mb-3 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow hover:bg-indigo-700 transition"
            onClick={() => onContinue(lastEval)}
          >
            Continuar con la última evaluación<br/>
            <span className="text-xs font-normal text-indigo-100">Periodo: {lastEval.period} | Versión: {lastEval.version}</span>
          </button>
        )}
        <button
          className="w-full mb-6 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold shadow hover:bg-green-700 transition"
          onClick={onNew}
        >
          Crear nueva evaluación
        </button>
        <div className="mb-2 text-gray-700 font-medium">O abrir una guardada:</div>
        <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 rounded-lg border border-gray-100 bg-gray-50 mb-2">
          {evaluations && evaluations.length > 0 ? (
            evaluations.map((ev: Evaluation) => (
              <button
                key={ev.id}
                className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors text-gray-800"
                onClick={() => onSelect(ev)}
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