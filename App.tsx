import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { CompetencyBlock } from './components/CompetencyBlock';
import { useEvaluationState } from './hooks/useEvaluationState';
import { Sidebar } from './components/Sidebar';
import { SummaryPage } from './components/SummaryPage';
import { AddWorkerModal } from './components/AddWorkerModal';
import { UserPlusIcon } from './components/icons';
import { EvidenceFile } from './services/api';
import { Worker } from './types';
import { EvidenceUploader } from './components/EvidenceUploader';
import ManageUsersModal from './components/ManageUsersModal';

function WorkerSelectorModal({ workers, isOpen, onSelect, onClose }: {
  workers: Worker[];
  isOpen: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = workers.filter((w: Worker) => w.name.toLowerCase().includes(search.toLowerCase()));
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Seleccionar Trabajador/a</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
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
              onClick={() => { onSelect(worker.id); onClose(); }}
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
    updateWorkerGroup,
    setUseT1SevenPoints,
    getVisibleCompetencies
  } = useEvaluationState();

  const [activeCompetencyId, setActiveCompetencyId] = useState<string>('B');
  const [isAddWorkerModalOpen, setAddWorkerModalOpen] = useState(false);
  const [isManageUsersModalOpen, setManageUsersModalOpen] = useState(false);
  const [isWorkerSelectorOpen, setWorkerSelectorOpen] = useState(false);

  const handleWorkerChange = async (workerId: string) => {
    console.log('Seleccionando trabajador:', workerId);
    await setWorkerId(workerId);
    const worker = evaluation.workers.find(w => w.id === workerId);
    // Establecer la primera competencia visible como activa
    if (worker) {
      const visibleCompetencies = getVisibleCompetencies();
      if (visibleCompetencies.length > 0) {
        setActiveCompetencyId(visibleCompetencies[0].id);
      }
    }
    setWorkerSelectorOpen(false);
  };

  const handleAddWorker = async (name: string, group: 'GRUPO 1-2' | 'GRUPO 3-4') => {
    const newWorkerId = await addWorker(name, group);
    setAddWorkerModalOpen(false);
    if (newWorkerId) {
      await setWorkerId(newWorkerId);
      // Selecciona la primera competencia visible
      const worker = evaluation.workers.find(w => w.id === newWorkerId);
      const visibleCompetencies = getVisibleCompetencies();
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

  const visibleCompetencies = useMemo(() => getVisibleCompetencies(), [evaluation.workerId, evaluation.workers]);
  const activeCompetency = useMemo(
    () => visibleCompetencies.find(c => c.id === activeCompetencyId),
    [activeCompetencyId, visibleCompetencies]
  );

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
          onWorkerChange={() => setWorkerSelectorOpen(true)}
          period={evaluation.period}
          onPeriodChange={setPeriod}
          onAddWorkerClick={() => setAddWorkerModalOpen(true)}
          onExitApp={handleExitApp}
          useT1SevenPoints={evaluation.useT1SevenPoints}
          onT1SevenPointsChange={setUseT1SevenPoints}
          isSaving={evaluation.isSaving}
          lastSavedAt={evaluation.lastSavedAt}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {!evaluation.workerId && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Bienvenido/a al Sistema de Evaluación</h2>
            <p className="text-gray-600 mb-8">Para comenzar, seleccione un trabajador existente o añada uno nuevo.</p>
            <div className="flex flex-col gap-4 w-full max-w-xs">
              <button
                onClick={() => setWorkerSelectorOpen(true)}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Seleccionar Trabajador
              </button>
              <button
                onClick={() => setAddWorkerModalOpen(true)}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <UserPlusIcon className="h-5 w-5 mr-2 text-gray-500" />
                Añadir Nuevo Trabajador
              </button>
            </div>
          </div>
        )}

        {evaluation.workerId && (
          <div className="flex gap-6">
            <Sidebar
              competencies={visibleCompetencies}
              activeCompetencyId={activeCompetencyId}
              onCompetencyChange={setActiveCompetencyId}
            />

            <div className="flex-1">
              {activeCompetency ? (
                <CompetencyBlock
                  competency={activeCompetency}
                  evaluation={evaluation}
                  onCriteriaChange={updateCriteriaCheck}
                  onEvidenceChange={updateRealEvidence}
                  addFiles={addFiles}
                  removeFile={removeFile}
                />
              ) : (
                <SummaryPage evaluation={evaluation} onSave={saveEvaluation} />
              )}
            </div>
          </div>
        )}
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
        onUpdateWorker={updateWorkerGroup}
      />
    </div>
  );
}

export default App;
