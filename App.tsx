import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { CompetencyBlock } from './components/CompetencyBlock';
import { useEvaluationState, getVisibleCompetencies } from './hooks/useEvaluationState';
import { Sidebar } from './components/Sidebar';
import { SummaryPage } from './components/SummaryPage';
import { AddWorkerModal } from './components/AddWorkerModal';
import { UserPlusIcon } from './components/icons';
import { EvidenceFile } from './services/api';
import { Worker } from './types';
import { EvidenceUploader } from './components/EvidenceUploader';
import ManageUsersModal from './components/ManageUsersModal';
import ManageUsersPanel from './components/ManageUsersPanel';

function WorkerSelectorModal({ workers, isOpen, onSelect, onClose }: {
  workers: Worker[];
  isOpen: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const filtered = workers.filter((w: Worker) => w.name.toLowerCase().includes(search.toLowerCase()));
  
  if (!isOpen) return null;

  const handleWorkerSelect = (worker: Worker) => {
    setSelectedWorker(worker);
    setPasswordInput('');
    setPasswordError('');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;
    
    if (passwordInput.trim().length < 3) {
      setPasswordError('Contraseña incorrecta o demasiado corta.');
      return;
    }

    setIsAuthenticating(true);
    try {
      const result = await fetch('/api/workers/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedWorker.id, password: passwordInput }),
      });

      if (!result.ok) {
        setPasswordError('Contraseña incorrecta.');
        return;
      }

      // Autenticación exitosa
      onSelect(selectedWorker.id);
      onClose();
    } catch (error) {
      setPasswordError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCancel = () => {
    setSelectedWorker(null);
    setPasswordInput('');
    setPasswordError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            {selectedWorker ? 'Introduce tu contraseña' : 'Seleccionar Trabajador/a'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!selectedWorker ? (
          <>
            <input
              type="text"
              placeholder="Buscar trabajador/a..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mb-4 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            />
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
              {filtered.length === 0 && <div className="py-4 text-gray-500 text-center">No hay resultados</div>}
              {filtered.map((worker: Worker) => (
                <button
                  key={worker.id}
                  onClick={() => handleWorkerSelect(worker)}
                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 rounded transition-colors flex items-center gap-2"
                >
                  <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <div>
                    <span className="truncate block">{worker.name}</span>
                    <span className="text-sm text-gray-500">{worker.worker_group}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="bg-indigo-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <div className="font-medium text-indigo-900">{selectedWorker.name}</div>
                  <div className="text-sm text-indigo-700">{selectedWorker.worker_group}</div>
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                placeholder="Introduce tu contraseña"
                autoFocus
                required
              />
            </div>

            {passwordError && (
              <div className="text-red-600 text-sm">{passwordError}</div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isAuthenticating}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAuthenticating ? 'Verificando...' : 'Acceder'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function App() {
  const {
    evaluation,
    isLoading,
    setWorkerId,
    setPeriod,
    updateCriteriaCheck,
    updateRealEvidence,
    addFiles,
    removeFile,
    saveEvaluation,
    addWorker,
    updateWorker,
    setUseT1SevenPoints,
  } = useEvaluationState();

  const [activeCompetencyId, setActiveCompetencyId] = useState<string>('B');
  const [isAddWorkerModalOpen, setAddWorkerModalOpen] = useState(false);
  const [isManageUsersModalOpen, setManageUsersModalOpen] = useState(false);
  const [isWorkerSelectorOpen, setWorkerSelectorOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const handleWorkerChange = async (workerId: string) => {
    console.log('Seleccionando trabajador:', workerId);
    await setWorkerId(workerId);
    const worker = evaluation.workers.find(w => w.id === workerId);
    // Establecer la primera competencia visible como activa
    if (worker) {
      const visibleCompetencies = getVisibleCompetencies(worker.worker_group ?? null);
      if (visibleCompetencies.length > 0) {
        setActiveCompetencyId(visibleCompetencies[0].id);
      }
    }
    setWorkerSelectorOpen(false);
  };

  const handleAddWorker = async (name: string, group: 'GRUPO 1-2' | 'GRUPO 3-4', password: string) => {
    const newWorkerId = await addWorker(name, group, password);
    setAddWorkerModalOpen(false);
    if (newWorkerId) {
      await setWorkerId(newWorkerId);
      // Selecciona la primera competencia visible
      const worker = evaluation.workers.find(w => w.id === newWorkerId);
      const visibleCompetencies = getVisibleCompetencies(worker?.worker_group ?? null);
      if (visibleCompetencies.length > 0) {
        setActiveCompetencyId(visibleCompetencies[0].id);
      }
    }
  };

  const handleExitApp = () => {
    if (window.confirm('¿Está seguro de que desea salir de la aplicación? Los datos se guardarán automáticamente.')) {
      setWorkerId(null);
      setActiveCompetencyId('B');
    }
  };

  const handleFilesUploaded = (conductId: string, files: EvidenceFile[]) => {
    console.log('Archivos subidos para conducta:', conductId, files);
  };

  const handleFileDeleted = (conductId: string, fileId: number) => {
    console.log('Archivo eliminado de conducta:', conductId, fileId);
  };

  // Encuentra el trabajador actual
  const currentWorker = evaluation.workers.find(w => w.id === evaluation.workerId);

  const visibleCompetencies = useMemo(() => {
    console.log('currentWorker:', currentWorker);
    console.log('currentWorker.worker_group:', currentWorker?.worker_group);
    return getVisibleCompetencies(currentWorker?.worker_group ?? null);
  }, [evaluation.workerId, evaluation.workers]);
  const activeCompetency = useMemo(
    () => visibleCompetencies.find(c => c.id === activeCompetencyId),
    [activeCompetencyId, visibleCompetencies]
  );

  // Cambiar periodo y recargar evaluación
  const handlePeriodChange = async (newPeriod: string) => {
    setPeriod(newPeriod);
    if (evaluation.workerId) {
      await setWorkerId(evaluation.workerId, newPeriod);
    }
  };

  React.useEffect(() => {
    const handler = () => setManageUsersModalOpen(true);
    window.addEventListener('open-manage-users', handler);
    return () => window.removeEventListener('open-manage-users', handler);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {evaluation.workerId && (
        <Header
          workers={evaluation.workers}
          selectedWorkerId={evaluation.workerId}
          onWorkerChange={handleWorkerChange}
          onChangeWorkerClick={() => setWorkerSelectorOpen(true)}
          period={evaluation.period}
          onPeriodChange={handlePeriodChange}
          onAddWorkerClick={() => setAddWorkerModalOpen(true)}
          onExitApp={handleExitApp}
          useT1SevenPoints={evaluation.useT1SevenPoints}
          onT1SevenPointsChange={setUseT1SevenPoints}
          isSaving={evaluation.isSaving}
          lastSavedAt={evaluation.lastSavedAt}
          onHamburgerClick={() => setSidebarOpen(true)}
        />
      )}

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 max-w-full h-full bg-gradient-to-b from-slate-50 to-white shadow-xl border-r border-slate-200 pt-2 pb-6 px-4 flex flex-col justify-between animate-slide-in-left">
            <button
              className="absolute left-2 top-2 z-10 text-gray-400 hover:text-gray-700 p-1"
              onClick={() => setSidebarOpen(false)}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Sidebar
              competencies={visibleCompetencies}
              activeCompetencyId={activeCompetencyId}
              onCompetencyChange={(id) => {
                setActiveCompetencyId(id);
                setSidebarOpen(false);
              }}
              compact={true}
              mobile={true}
            />
          </aside>
        </div>
      )}

      <div className="flex flex-row" style={{ minHeight: 'calc(100vh - 112px)' }}>
        {evaluation.workerId && (
          <div className="hidden lg:flex">
            <Sidebar
              competencies={visibleCompetencies}
              activeCompetencyId={activeCompetencyId}
              onCompetencyChange={setActiveCompetencyId}
            />
          </div>
        )}
        <main className={`flex-1 h-full ${evaluation.workerId ? 'ml-0 lg:ml-80' : ''} overflow-x-hidden`}>
          {!evaluation.workerId && (
            <div className="flex flex-col items-center justify-center min-h-screen w-full px-4">
              <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center w-full max-w-md">
                <div className="flex justify-center items-center gap-6 mb-6">
                  <img src="/logos/logo_uco-3.png" alt="Logo UCO" className="h-14 w-auto" />
                  <img src="/logos/logo_scai.png" alt="Logo SCAI" className="h-14 w-auto" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Bienvenido/a al Sistema de Evaluación del Desempeño</h2>
                <p className="text-gray-600 mb-8 text-center">Para comenzar, seleccione un trabajador existente o añada uno nuevo.</p>
                <div className="flex flex-col gap-4 w-full">
                  <button
                    onClick={() => setWorkerSelectorOpen(true)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Seleccionar Trabajador
                  </button>
                  <button
                    onClick={() => setAddWorkerModalOpen(true)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    <UserPlusIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Añadir Nuevo Trabajador
                  </button>
                </div>
              </div>
            </div>
          )}
          {evaluation.workerId && (
            activeCompetencyId === 'manage-users' ? (
              <ManageUsersPanel currentWorker={currentWorker ?? null} />
            ) : activeCompetency ? (
              <CompetencyBlock
                competency={activeCompetency}
                evaluation={evaluation}
                onCriteriaChange={updateCriteriaCheck}
                onEvidenceChange={updateRealEvidence}
                addFiles={addFiles}
                removeFile={removeFile}
              />
            ) : (
              <div className="bg-white shadow-md rounded-xl p-6 mb-8">
                <SummaryPage evaluation={evaluation} onSave={saveEvaluation} />
              </div>
            )
          )}
        </main>
      </div>

      <AddWorkerModal
        isOpen={isAddWorkerModalOpen}
        onClose={() => setAddWorkerModalOpen(false)}
        onSave={handleAddWorker}
      />

      <WorkerSelectorModal
        workers={evaluation.workers}
        isOpen={isWorkerSelectorOpen}
        onSelect={handleWorkerChange}
        onClose={() => setWorkerSelectorOpen(false)}
      />

      <ManageUsersModal
        isOpen={isManageUsersModalOpen}
        onClose={() => setManageUsersModalOpen(false)}
        workers={evaluation.workers}
        onUpdateWorker={updateWorker}
      />
    </div>
  );
}

export default App;
