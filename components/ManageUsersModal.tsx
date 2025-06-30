import React, { useState } from 'react';
import { Worker } from '../types';

interface ManageUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  onUpdateWorker: (workerId: string, group: 'GRUPO 1-2' | 'GRUPO 3-4') => void;
}

const ManageUsersModal: React.FC<ManageUsersModalProps> = ({ isOpen, onClose, workers, onUpdateWorker }) => {
  const [editWorkerId, setEditWorkerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editGroup, setEditGroup] = useState<'GRUPO 1-2' | 'GRUPO 3-4'>('GRUPO 1-2');

  if (!isOpen) return null;

  const handleEdit = (worker: Worker) => {
    setEditWorkerId(worker.id);
    setEditName(worker.name);
    setEditGroup(worker.worker_group);
  };

  const handleSave = () => {
    if (editWorkerId) {
      onUpdateWorker(editWorkerId, editGroup);
      setEditWorkerId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Gestionar Usuarios</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 mb-4">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grupo</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {workers.map(worker => (
                <tr key={worker.id}>
                  <td className="px-4 py-2">
                    {editWorkerId === worker.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        disabled
                      />
                    ) : (
                      worker.name
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editWorkerId === worker.id ? (
                      <select
                        value={editGroup}
                        onChange={e => setEditGroup(e.target.value as 'GRUPO 1-2' | 'GRUPO 3-4')}
                        className="border rounded px-2 py-1 w-full"
                      >
                        <option value="GRUPO 1-2">GRUPO 1-2</option>
                        <option value="GRUPO 3-4">GRUPO 3-4</option>
                      </select>
                    ) : (
                      worker.worker_group
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {editWorkerId === worker.id ? (
                      <button
                        onClick={handleSave}
                        className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                      >
                        Guardar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEdit(worker)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                      >
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageUsersModal; 