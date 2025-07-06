import React, { useState, useEffect } from 'react';
import { UserPlusIcon } from './icons';
import { Worker } from '../types';
import { apiService } from '../services/api';

interface ManageUsersPanelProps {
  currentWorker: Worker | null;
}

const ManageUsersPanel: React.FC<ManageUsersPanelProps> = ({ currentWorker }) => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [editName, setEditName] = useState('');
  const [editGroup, setEditGroup] = useState<'GRUPO 1-2' | 'GRUPO 3-4'>('GRUPO 1-2');
  const [editPassword, setEditPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const loadWorkers = async () => {
      try {
        setIsLoading(true);
        const workersData = await apiService.getWorkers();
        setWorkers(workersData);
      } catch (error) {
        console.error('Error loading workers:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadWorkers();
  }, []);

  const filteredWorkers = workers.filter(w => w.name.toLowerCase().includes(search.toLowerCase()));

  const handleSelectWorker = (worker: Worker) => {
    if (currentWorker && currentWorker.id === 'superadmin') {
      setPasswordRequired(false);
    } else {
      setPasswordRequired(true);
    }
    setSelectedWorker(worker);
    setEditName(worker.name);
    setEditGroup(worker.worker_group);
    setEditPassword('');
    setPasswordInput('');
    setPasswordError('');
    setSuccess(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;
    if (passwordInput.trim().length < 3) {
      setPasswordError('Contraseña incorrecta o demasiado corta.');
      return;
    }
    // Validar contra backend
    const result = await apiService.authenticateWorker(selectedWorker.id, passwordInput);
    if (!result.success) {
      setPasswordError('Contraseña incorrecta.');
      return;
    }
    setPasswordRequired(false);
    setPasswordError('');
  };

  const handleSave = async () => {
    if (!selectedWorker) return;
    setSaving(true);
    await apiService.updateWorker(selectedWorker.id, editName, editGroup, editPassword.trim() ? editPassword : undefined);
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 1200);
    const updated = await apiService.getWorkers();
    setWorkers(updated);
    setSelectedWorker({ ...selectedWorker, name: editName, worker_group: editGroup });
    setEditPassword('');
  };

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[80vh] bg-gray-50 rounded-2xl shadow-xl overflow-hidden p-6">
      <div className="md:w-1/3 w-full bg-white border-r border-gray-200 p-6 flex flex-col">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Gestionar Usuarios
            </h2>
            <p className="text-gray-600 text-sm">
              Administra trabajadores y sus permisos
            </p>
          </div>
        </div>
        <input
          type="text"
          placeholder="Buscar trabajador..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-4 w-full rounded-md border border-indigo-200 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
        />
        <div className="flex-1 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-600">Cargando trabajadores...</p>
            </div>
          ) : filteredWorkers.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              {search ? 'No hay resultados' : 'No hay trabajadores'}
            </div>
          ) : (
            filteredWorkers.map(worker => (
              <button
                key={worker.id}
                onClick={() => handleSelectWorker(worker)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors shadow-sm border border-indigo-100 hover:bg-indigo-50 ${selectedWorker?.id === worker.id ? 'bg-indigo-100 border-indigo-300' : 'bg-white'}`}
              >
                <div className="bg-indigo-100 rounded-full p-1">
                  <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <span className="text-sm font-medium text-indigo-900 break-words" style={{wordBreak: 'break-word'}}>{worker.name}</span>
                <span className="ml-auto text-xs text-indigo-700">{worker.worker_group}</span>
              </button>
            ))
          )}
        </div>
      </div>
      <div className="flex-1 p-8 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        {!selectedWorker ? (
          <div className="text-gray-400 text-lg">Selecciona un trabajador para editar</div>
        ) : passwordRequired ? (
          <form onSubmit={handlePasswordSubmit} className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Introduce la contraseña</h3>
            <input
              type="password"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              className="mb-3 w-full rounded-md border border-indigo-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
              placeholder="Contraseña"
              autoFocus
            />
            {passwordError && <div className="text-red-500 text-sm mb-2">{passwordError}</div>}
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 text-base font-medium shadow"
            >
              Acceder
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg flex flex-col gap-4">
            <h3 className="text-xl font-bold text-indigo-900 mb-2">Editar trabajador</h3>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full rounded-md border border-indigo-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
            />
            <label className="block text-sm font-medium text-gray-700">Grupo</label>
            <select
              value={editGroup}
              onChange={e => setEditGroup(e.target.value as 'GRUPO 1-2' | 'GRUPO 3-4')}
              className="w-full rounded-md border border-indigo-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
            >
              <option value="GRUPO 1-2">GRUPO 1-2</option>
              <option value="GRUPO 3-4">GRUPO 3-4</option>
            </select>
            <label className="block text-sm font-medium text-gray-700">Contraseña (solo para cambiar)</label>
            <input
              type="password"
              value={editPassword}
              onChange={e => setEditPassword(e.target.value)}
              className="w-full rounded-md border border-indigo-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
              placeholder="Nueva contraseña"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving || !editName.trim()}
                className={`px-5 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 text-base font-medium shadow ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              {success && <div className="text-green-600 text-base font-semibold flex items-center">¡Guardado!</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsersPanel; 