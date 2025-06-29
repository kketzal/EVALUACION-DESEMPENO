import React, { useState, useMemo } from 'react';
import { competencies } from './data/evaluationData';
import { Header } from './components/Header';
import { CompetencyBlock } from './components/CompetencyBlock';
import { useEvaluationState } from './hooks/useEvaluationState';
import { Sidebar } from './components/Sidebar';
import { SummaryPage } from './components/SummaryPage';
import { AddWorkerModal } from './components/AddWorkerModal';
import { UserPlusIcon } from './components/icons';
import { EvidenceFile } from './services/api';

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
    setUseT1SevenPoints
  } = useEvaluationState();

  const [activeCompetencyId, setActiveCompetencyId] = useState<string>('B');
  const [isAddWorkerModalOpen, setAddWorkerModalOpen] = useState(false);
  const [hasJustExited, setHasJustExited] = useState(false);

  const handleWorkerChange = async (workerId: string) => {
    await setWorkerId(workerId);
    setActiveCompetencyId('B'); // Reset to the first competency
  };

  const handleAddWorker = async (name: string) => {
    await addWorker(name);
    setAddWorkerModalOpen(false);
  };

  const handleExitApp = () => {
    if (window.confirm('¿Está seguro de que desea salir de la aplicación? Los datos se guardarán automáticamente.')) {
      setHasJustExited(true);
      setWorkerId(null);
      setActiveCompetencyId('B');
    }
  };

  const handleFilesUploaded = (conductId: string, files: EvidenceFile[]) => {
    // Los archivos ya se han subido a través del EvidenceUploader
    // Solo necesitamos actualizar el estado local si es necesario
    console.log('Archivos subidos para conducta:', conductId, files);
  };

  const handleFileDeleted = (conductId: string, fileId: number) => {
    // El archivo ya se ha eliminado a través del EvidenceUploader
    // Solo necesitamos actualizar el estado local si es necesario
    console.log('Archivo eliminado de conducta:', conductId, fileId);
  };

  const activeCompetency = useMemo(
    () => competencies.find(c => c.id === activeCompetencyId),
    [activeCompetencyId]
  );
  
  // Debug logs
  console.log('App render state:', {
    workersLength: evaluation.workers.length,
    workerId: evaluation.workerId,
    isLoading,
    shouldShowInitialPage: evaluation.workers.length === 0 || evaluation.workerId === null,
    filesCount: Object.keys(evaluation.files).length,
    files: evaluation.files
  });
  
  // Selección automática de trabajador si solo hay uno y no se acaba de salir
  React.useEffect(() => {
    if (!hasJustExited && evaluation.workers.length === 1 && !evaluation.workerId) {
      setWorkerId(evaluation.workers[0].id);
    }
  }, [evaluation.workers, evaluation.workerId, setWorkerId, hasJustExited]);

  // Si el usuario selecciona manualmente un trabajador o añade uno, resetear hasJustExited
  React.useEffect(() => {
    if (evaluation.workerId && hasJustExited) {
      setHasJustExited(false);
    }
  }, [evaluation.workerId, hasJustExited]);

  // Mostrar página inicial si no hay trabajadores o si no hay trabajador seleccionado
  if (evaluation.workers.length === 0 || evaluation.workerId === null) {
    return (
      <>
        <AddWorkerModal
          isOpen={isAddWorkerModalOpen}
          onClose={() => setAddWorkerModalOpen(false)}
          onSave={handleAddWorker}
        />
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4">
          <div className="bg-white shadow-xl rounded-2xl p-8 sm:p-12 max-w-2xl w-full">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Bienvenido/a a la Herramienta de Evaluación
            </h1>
            <p className="mt-4 text-base sm:text-lg text-gray-600">
              {evaluation.workers.length === 0 
                ? 'Para comenzar, por favor, añada el primer perfil de trabajador/a.'
                : 'Seleccione un trabajador/a para comenzar una evaluación o añada uno nuevo.'
              }
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setAddWorkerModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
              >
                <UserPlusIcon className="h-6 w-6" />
                <span>Añadir Nuevo Trabajador/a</span>
              </button>
              {evaluation.workers.length > 0 && (
                <button
                  onClick={() => setWorkerId(evaluation.workers[0].id)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Seleccionar Trabajador Existente</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AddWorkerModal 
        isOpen={isAddWorkerModalOpen}
        onClose={() => setAddWorkerModalOpen(false)}
        onSave={handleAddWorker}
      />
      <div className="min-h-screen">
        <Sidebar
          competencies={competencies}
          activeId={activeCompetencyId}
          onSelect={setActiveCompetencyId}
        />
        
        <main className="pl-0 md:pl-[280px] flex flex-col transition-all duration-300">
          <Header 
            workers={evaluation.workers}
            selectedWorkerId={evaluation.workerId}
            onWorkerChange={handleWorkerChange}
            period={evaluation.period}
            onPeriodChange={setPeriod}
            onAddWorkerClick={() => setAddWorkerModalOpen(true)}
            onExitApp={handleExitApp}
            useT1SevenPoints={evaluation.useT1SevenPoints}
            onT1SevenPointsChange={setUseT1SevenPoints}
            isSaving={evaluation.isSaving}
            lastSavedAt={evaluation.lastSavedAt}
          />

          <div className="flex-grow p-4 sm:p-6 lg:p-8">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-gray-600">Cargando evaluación...</span>
              </div>
            ) : (
              <div className="max-w-7xl mx-auto">
                {activeCompetency ? (
                  <CompetencyBlock
                    key={activeCompetency.id}
                    competency={activeCompetency}
                    evaluation={evaluation}
                    onCriteriaChange={updateCriteriaCheck}
                    onEvidenceChange={updateRealEvidence}
                  />
                ) : activeCompetencyId === 'summary' ? (
                  <SummaryPage 
                    evaluation={evaluation}
                    onSave={saveEvaluation}
                  />
                ) : null}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default App;
