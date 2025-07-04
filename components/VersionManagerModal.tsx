import React, { useState } from 'react';
import { Evaluation } from '../services/api';

interface VersionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluations: Evaluation[];
  onOpen: (evaluationId: number) => void;
  onDelete: (evaluationIds: number[]) => void;
  onDeleteAll: () => void;
}

const VersionManagerModal: React.FC<VersionManagerModalProps> = ({ isOpen, onClose, evaluations, onOpen, onDelete, onDeleteAll }) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  if (!isOpen) return null;

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDelete = () => {
    if (selectedIds.length > 0) {
      if (window.confirm('¿Seguro que quieres eliminar las revisiones seleccionadas?')) {
        onDelete(selectedIds);
        setSelectedIds([]);
      }
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm('¿Seguro que quieres eliminar TODAS las revisiones? Esta acción no se puede deshacer.')) {
      onDeleteAll();
      setSelectedIds([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative animate-fade-in">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Gestionar Versiones</h2>
        <div className="mb-4 max-h-80 overflow-y-auto divide-y divide-gray-100">
          {evaluations.length === 0 && <div className="text-gray-400 text-center py-8">No hay revisiones guardadas.</div>}
          {evaluations.map(ev => (
            <div key={ev.id} className="flex items-center gap-3 py-2 px-2 hover:bg-indigo-50 rounded transition">
              <input
                type="checkbox"
                checked={selectedIds.includes(ev.id)}
                onChange={() => toggleSelect(ev.id)}
                className="accent-indigo-600"
              />
              <div className="flex-1 cursor-pointer" onClick={() => onOpen(ev.id)}>
                <div className="font-mono text-sm text-gray-800">
                  {typeof (ev as any)['version'] !== 'undefined' ? `v${(ev as any)['version']} - ` : ''}{ev.period}
                </div>
                <div className="text-xs text-gray-500">{new Date(ev.created_at).toLocaleString()}</div>
              </div>
              <button
                className="text-red-500 hover:text-red-700 p-1 rounded"
                title="Eliminar esta revisión"
                onClick={() => onDelete([ev.id])}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow disabled:opacity-50"
            onClick={handleDelete}
            disabled={selectedIds.length === 0}
          >
            Eliminar seleccionadas
          </button>
          <button
            className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors shadow"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
        <button
          className="mt-4 w-full py-2 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition-colors shadow"
          onClick={handleDeleteAll}
        >
          Eliminar TODAS las revisiones
        </button>
      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: scale(0.97);} to { opacity: 1; transform: scale(1);} }
        .animate-fade-in { animation: fade-in 0.2s ease; }
      `}</style>
    </div>
  );
};

export default VersionManagerModal; 