import React, { useState } from 'react';

interface AddWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, group: 'GRUPO 1-2' | 'GRUPO 3-4', password: string) => void;
}

export const AddWorkerModal: React.FC<AddWorkerModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [group, setGroup] = useState<'GRUPO 1-2' | 'GRUPO 3-4'>('GRUPO 1-2');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && password.trim().length >= 4) {
      onSave(name.trim(), group, password);
      setName('');
      setGroup('GRUPO 1-2');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Añadir Nuevo Trabajador/a</h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
            
          <div className="space-y-4">
            <div>
              <label htmlFor="worker-name" className="block text-sm font-medium text-gray-700">
                Nombre completo
              </label>
              <input
                type="text"
                id="worker-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md bg-white text-gray-900 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Ej: Juan Pérez"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="worker-password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                type="password"
                id="worker-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md bg-white text-gray-900 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Mínimo 4 caracteres"
                required
              />
            </div>

            <div>
              <label htmlFor="worker-group" className="block text-sm font-medium text-gray-700">
                Grupo
              </label>
              <select
                id="worker-group"
                value={group}
                onChange={(e) => setGroup(e.target.value as 'GRUPO 1-2' | 'GRUPO 3-4')}
                className="mt-1 block w-full rounded-md bg-white text-gray-900 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="GRUPO 1-2">GRUPO 1-2</option>
                <option value="GRUPO 3-4">GRUPO 3-4</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};