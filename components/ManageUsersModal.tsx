import React, { useState } from 'react';
import { Worker } from '../types';
import { UserPlusIcon } from './icons';

interface ManageUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  onUpdateWorker: (workerId: string, group: 'GRUPO 1-2' | 'GRUPO 3-4', name: string) => void;
  isLoading?: boolean;
}

const ManageUsersModal: React.FC<ManageUsersModalProps> = ({ isOpen, onClose, workers, onUpdateWorker, isLoading = false }) => {
  const [editWorkerId, setEditWorkerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editGroup, setEditGroup] = useState<'GRUPO 1-2' | 'GRUPO 3-4'>('GRUPO 1-2');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleEdit = (worker: Worker) => {
    setEditWorkerId(worker.id);
    setEditName(worker.name);
    setEditGroup(worker.worker_group);
    setSuccess(false);
  };

  const handleSave = async () => {
    if (editWorkerId) {
      setSaving(true);
      await onUpdateWorker(editWorkerId, editGroup, editName);
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1200);
      setEditWorkerId(null);
    }
  };

  const handleCancel = () => {
    setEditWorkerId(null);
    setSuccess(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 relative" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserPlusIcon className="h-7 w-7 text-indigo-500" /> Gestionar Usuarios
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            <div className="col-span-2 py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-lg text-gray-600">Cargando trabajadores...</p>
            </div>
          ) : workers.length === 0 ? (
            <div className="col-span-2 py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay trabajadores</h3>
              <p className="text-gray-600">Añade trabajadores para empezar a gestionar usuarios</p>
            </div>
          ) : (
            workers.map(worker => (
              <div key={worker.id} className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex items-center gap-4 shadow-sm relative">
                <div className="flex-shrink-0">
                  <div className="bg-indigo-100 rounded-full p-2">
                    <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  {editWorkerId === worker.id ? (
                    <>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="mb-2 w-full rounded-md border border-indigo-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
                        placeholder="Nombre completo"
                        autoFocus
                      />
                      <select
                        value={editGroup}
                        onChange={e => setEditGroup(e.target.value as 'GRUPO 1-2' | 'GRUPO 3-4')}
                        className="w-full rounded-md border border-indigo-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
                      >
                        <option value="GRUPO 1-2">GRUPO 1-2</option>
                        <option value="GRUPO 3-4">GRUPO 3-4</option>
                      </select>
                    </>
                  ) : (
                    <>
                      <div className="text-base font-semibold text-indigo-900 break-words" style={{wordBreak: 'break-word'}}>{worker.name}</div>
                      <div className="text-sm text-indigo-700 mt-1">{worker.worker_group}</div>
                    </>
                  )}
                </div>
                <div className="flex flex-col gap-2 ml-2">
                  {editWorkerId === worker.id ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saving || !editName.trim()}
                        className={`px-3 py-1.5 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 text-sm font-medium shadow transition-colors ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {saving ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-3 py-1.5 rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 text-sm font-medium shadow"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleEdit(worker)}
                      className="px-3 py-1.5 rounded-lg text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 text-sm font-medium shadow"
                    >
                      Editar
                    </button>
                  )}
                </div>
                {success && editWorkerId === worker.id && (
                  <div className="absolute top-2 right-2 text-green-600 text-sm font-semibold">¡Guardado!</div>
                )}
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end mt-8">
          <button
            onClick={onClose}
            className="px-5 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageUsersModal; 