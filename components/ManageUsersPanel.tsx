import React, { useState, useEffect } from 'react';
import { UserPlusIcon, TrashIcon, PencilIcon, EyeIcon } from './icons';
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

  // Estados para estadísticas
  const [workerStats, setWorkerStats] = useState<{[key: string]: number}>({});

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      setIsLoading(true);
      const workersData = await apiService.getWorkers();
      setWorkers(workersData);
      
      // Cargar estadísticas de evaluaciones para cada trabajador
      const stats: {[key: string]: number} = {};
      for (const worker of workersData) {
        try {
          const evaluations = await apiService.getEvaluationsByWorker(worker.id);
          stats[worker.id] = evaluations.length;
        } catch (error) {
          stats[worker.id] = 0;
        }
      }
      setWorkerStats(stats);
    } catch (error) {
      console.error('Error loading workers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.id.toLowerCase().includes(search.toLowerCase())
  );

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
    try {
      await apiService.updateWorker(selectedWorker.id, editName, editGroup, editPassword.trim() ? editPassword : undefined);
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1200);
      await loadWorkers();
      setSelectedWorker({ ...selectedWorker, name: editName, worker_group: editGroup });
      setEditPassword('');
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
    <div className="flex flex-col lg:flex-row h-full min-h-[80vh] bg-gray-50 rounded-2xl shadow-xl overflow-hidden">
      {/* Listado de trabajadores - Ampliado */}
      <div className="lg:w-2/5 w-full bg-white border-r border-gray-200 p-6 flex flex-col">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shadow-sm">
              <UserPlusIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                Gestionar Usuarios
              </h2>
              <p className="text-gray-600 text-sm">
                {workers.length} trabajadores registrados
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            + Nuevo
          </button>
        </div>
        
        <input
          type="text"
          placeholder="Buscar por nombre o ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-4 w-full rounded-lg border border-indigo-200 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
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
              <div
                key={worker.id}
                className={`relative group cursor-pointer rounded-xl transition-all duration-200 ${
                  selectedWorker?.id === worker.id 
                    ? 'bg-indigo-100 border-2 border-indigo-300 shadow-md' 
                    : 'bg-white border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 shadow-sm'
                }`}
                onClick={() => handleSelectWorker(worker)}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 rounded-full p-2 flex-shrink-0">
                      <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div 
                        className="text-sm font-semibold text-gray-900 truncate"
                        title={worker.name} // Tooltip nativo para nombres truncados
                      >
                        {worker.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate" title={`ID: ${worker.id}`}>
                        ID: {worker.id}
                      </div>
                      <div className="text-xs text-indigo-600 font-medium">{worker.worker_group}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {workerStats[worker.id] || 0} eval.
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Botones de acción que aparecen al hacer hover */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectWorker(worker);
                    }}
                    className="p-1 bg-white rounded-md shadow-sm border border-gray-200 hover:bg-indigo-50"
                    title="Editar"
                  >
                    <PencilIcon className="h-4 w-4 text-indigo-600" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDelete(worker);
                    }}
                    className="p-1 bg-white rounded-md shadow-sm border border-gray-200 hover:bg-red-50"
                    title="Eliminar"
                  >
                    <TrashIcon className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Panel de edición */}
      <div className="flex-1 p-8 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        {!selectedWorker ? (
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <EyeIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Selecciona un trabajador</h3>
            <p className="text-gray-600">Elige un trabajador de la lista para ver y editar sus datos</p>
          </div>
        ) : passwordRequired ? (
          <form onSubmit={handlePasswordSubmit} className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center w-full max-w-sm">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Introduce la contraseña</h3>
            <p className="text-sm text-gray-600 mb-4">Para editar los datos de {selectedWorker.name}</p>
            <input
              type="password"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              className="mb-3 w-full rounded-lg border border-indigo-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
              placeholder="Contraseña"
              autoFocus
            />
            {passwordError && <div className="text-red-500 text-sm mb-2">{passwordError}</div>}
            <button
              type="submit"
              className="w-full px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 text-base font-medium shadow transition-colors"
            >
              Acceder
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Editar trabajador</h3>
                <p className="text-sm text-gray-600">ID: {selectedWorker.id}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
                  placeholder="Nombre del trabajador"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo de trabajo</label>
                <select
                  value={editGroup}
                  onChange={e => setEditGroup(e.target.value as 'GRUPO 1-2' | 'GRUPO 3-4')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
                >
                  <option value="GRUPO 1-2">GRUPO 1-2</option>
                  <option value="GRUPO 3-4">GRUPO 3-4</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña (opcional)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
                  placeholder="Dejar vacío para mantener la actual"
                />
                <p className="text-xs text-gray-500 mt-1">Solo se actualizará si introduces una nueva contraseña</p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-800">Estadísticas</span>
                </div>
                <p className="text-sm text-blue-700">
                  Este trabajador tiene {workerStats[selectedWorker.id] || 0} evaluaciones registradas
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving || !editName.trim()}
                className={`flex-1 px-5 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 text-base font-medium shadow transition-colors ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              {success && (
                <div className="flex items-center gap-2 text-green-600 text-base font-semibold">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  ¡Guardado!
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => confirmDelete(selectedWorker)}
                className="w-full px-4 py-2 rounded-lg text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 text-base font-medium transition-colors"
              >
                <TrashIcon className="w-4 h-4 inline mr-2" />
                Eliminar trabajador
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de crear nuevo trabajador */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <UserPlusIcon className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Crear nuevo trabajador</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID del trabajador</label>
                <input
                  type="text"
                  value={newWorkerId}
                  onChange={e => setNewWorkerId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
                  placeholder="Ej: 123456789"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={newWorkerName}
                  onChange={e => setNewWorkerName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
                  placeholder="Nombre del trabajador"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo de trabajo</label>
                <select
                  value={newWorkerGroup}
                  onChange={e => setNewWorkerGroup(e.target.value as 'GRUPO 1-2' | 'GRUPO 3-4')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
                  placeholder="Contraseña del trabajador"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateWorker}
                disabled={creating || !newWorkerId.trim() || !newWorkerName.trim() || !newWorkerPassword.trim()}
                className={`flex-1 px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 text-base font-medium shadow transition-colors ${creating ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {creating ? 'Creando...' : 'Crear trabajador'}
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 text-base font-medium shadow transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && workerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <TrashIcon className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Eliminar trabajador</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                ¿Estás seguro de que quieres eliminar al trabajador <strong>{workerToDelete.name}</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-sm font-medium text-red-800">Acción irreversible</span>
                </div>
                <p className="text-sm text-red-700">
                  Esta acción eliminará permanentemente:
                </p>
                <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                  <li>El trabajador y su cuenta</li>
                  <li>Todas sus evaluaciones ({workerStats[workerToDelete.id] || 0})</li>
                  <li>Todos los criterios y evidencias</li>
                  <li>Todos los archivos adjuntos</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleDeleteWorker}
                disabled={deleting}
                className={`flex-1 px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 text-base font-medium shadow transition-colors ${deleting ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {deleting ? 'Eliminando...' : 'Eliminar permanentemente'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 text-base font-medium shadow transition-colors"
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

export default ManageUsersPanel; 