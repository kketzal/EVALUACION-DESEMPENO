import React, { useState, useEffect } from 'react';
import { UserPlusIcon } from '../../../components/icons';
import { Worker } from '../../../types';
import { apiService } from '../../../services/api';

const UsuariosPage: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
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
  
  // Estados para crear nuevo usuario
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkerId, setNewWorkerId] = useState('');
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerGroup, setNewWorkerGroup] = useState<'GRUPO 1-2' | 'GRUPO 3-4'>('GRUPO 1-2');
  const [newWorkerPassword, setNewWorkerPassword] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Estados para eliminar usuario
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      const workersData = await apiService.getWorkers();
      setWorkers(workersData);
    } catch (error) {
      console.error('Error cargando trabajadores:', error);
    }
  };

  const filteredWorkers = workers.filter(w => w.name.toLowerCase().includes(search.toLowerCase()));

  const handleSelectWorker = (worker: Worker) => {
    setPasswordRequired(true);
    setSelectedWorker(worker);
    setEditName(worker.name);
    setEditGroup(worker.worker_group);
    setEditPassword('');
    setPasswordInput('');
    setPasswordError('');
    setSuccess(false);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí puedes validar el password real si lo tienes en backend
    if (passwordInput.trim().length < 3) {
      setPasswordError('Contraseña incorrecta o demasiado corta.');
      return;
    }
    setPasswordRequired(false);
    setPasswordError('');
  };

  const handleSave = async () => {
    if (!selectedWorker) return;
    setSaving(true);
    try {
      await apiService.updateWorker(selectedWorker.id, editName, editGroup, editPassword || undefined);
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1200);
      await loadWorkers();
      // Actualizar datos locales
      setSelectedWorker({ ...selectedWorker, name: editName, worker_group: editGroup });
    } catch (error) {
      setSaving(false);
      console.error('Error al guardar:', error);
    }
  };

  const handleCreateWorker = async () => {
    if (!newWorkerId.trim() || !newWorkerName.trim() || !newWorkerPassword.trim()) {
      return;
    }
    
    setCreating(true);
    try {
      await apiService.createWorker({
        id: newWorkerId.trim(),
        name: newWorkerName.trim(),
        worker_group: newWorkerGroup,
        password: newWorkerPassword
      });
      
      // Limpiar formulario
      setNewWorkerId('');
      setNewWorkerName('');
      setNewWorkerGroup('GRUPO 1-2');
      setNewWorkerPassword('');
      setShowCreateModal(false);
      
      // Recargar lista
      await loadWorkers();
    } catch (error) {
      console.error('Error al crear trabajador:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWorker = async () => {
    if (!workerToDelete) return;
    
    setDeleting(true);
    try {
      await apiService.deleteWorker(workerToDelete.id);
      setShowDeleteModal(false);
      setWorkerToDelete(null);
      
      // Si el trabajador eliminado era el seleccionado, limpiar selección
      if (selectedWorker?.id === workerToDelete.id) {
        setSelectedWorker(null);
        setPasswordRequired(false);
      }
      
      // Recargar lista
      await loadWorkers();
    } catch (error) {
      console.error('Error al eliminar trabajador:', error);
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = (worker: Worker) => {
    setWorkerToDelete(worker);
    setShowDeleteModal(true);
  };

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[80vh] bg-gray-50 rounded-2xl shadow-xl overflow-hidden">
      {/* Listado de trabajadores */}
      <div className="md:w-1/3 w-full bg-white border-r border-gray-200 p-6 flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlusIcon className="h-6 w-6 text-indigo-500" />
            <h2 className="text-xl font-bold text-gray-900">Trabajadores</h2>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Nuevo
          </button>
        </div>
        <input
          type="text"
          placeholder="Buscar trabajador..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-4 w-full rounded-md border border-indigo-200 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
        />
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredWorkers.map(worker => (
            <div
              key={worker.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors shadow-sm border border-indigo-100 hover:bg-indigo-50 ${selectedWorker?.id === worker.id ? 'bg-indigo-100 border-indigo-300' : 'bg-white'}`}
            >
              <button
                onClick={() => handleSelectWorker(worker)}
                className="flex items-center gap-3 flex-1 text-left"
              >
                <div className="bg-indigo-100 rounded-full p-1">
                  <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-indigo-900 break-words block" style={{wordBreak: 'break-word'}}>
                    {worker.name}
                  </span>
                  <span className="text-xs text-indigo-700">{worker.worker_group}</span>
                </div>
              </button>
              <button
                onClick={() => confirmDelete(worker)}
                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                title="Eliminar trabajador"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
          {filteredWorkers.length === 0 && <div className="text-gray-400 text-center py-8">No hay trabajadores</div>}
        </div>
      </div>
      
      {/* Panel de edición */}
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
            <label className="block text-sm font-medium text-gray-700">ID</label>
            <input
              type="text"
              value={selectedWorker.id}
              disabled
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-500 bg-gray-100 text-base"
            />
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

      {/* Modal de crear nuevo trabajador */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Crear nuevo trabajador</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                <input
                  type="text"
                  value={newWorkerId}
                  onChange={e => setNewWorkerId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
                  placeholder="ID único del trabajador"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={newWorkerName}
                  onChange={e => setNewWorkerName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                <select
                  value={newWorkerGroup}
                  onChange={e => setNewWorkerGroup(e.target.value as 'GRUPO 1-2' | 'GRUPO 3-4')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
                >
                  <option value="GRUPO 1-2">GRUPO 1-2</option>
                  <option value="GRUPO 3-4">GRUPO 3-4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={newWorkerPassword}
                  onChange={e => setNewWorkerPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
                  placeholder="Contraseña inicial"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateWorker}
                disabled={creating || !newWorkerId.trim() || !newWorkerName.trim() || !newWorkerPassword.trim()}
                className={`flex-1 px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 text-base font-medium shadow ${creating ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {creating ? 'Creando...' : 'Crear trabajador'}
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 text-base font-medium shadow"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && workerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
              ¿Eliminar trabajador?
            </h3>
            <p className="text-gray-600 text-center mb-6">
              ¿Estás seguro de que deseas eliminar al trabajador <strong>{workerToDelete.name}</strong>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-red-800">Esta acción eliminará:</span>
              </div>
              <ul className="text-sm text-red-700 space-y-1 ml-7">
                <li>• El trabajador y su cuenta</li>
                <li>• Todas sus evaluaciones</li>
                <li>• Todos los criterios y puntuaciones</li>
                <li>• Todas las evidencias y archivos adjuntos</li>
                <li>• Los archivos físicos del servidor</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteWorker}
                disabled={deleting}
                className={`flex-1 px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 text-base font-medium shadow ${deleting ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 text-base font-medium shadow"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosPage; 