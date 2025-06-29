
import React, { useState, useMemo } from 'react';
import { competencies } from './data/evaluationData';
import { Header } from './components/Header';
import { CompetencyBlock } from './components/CompetencyBlock';
import { useEvaluationState } from './hooks/useEvaluationState';
import { Sidebar } from './components/Sidebar';
import { SummaryPage } from './components/SummaryPage';
import { AddWorkerModal } from './components/AddWorkerModal';
import { UserPlusIcon } from './components/icons';

function App() {
  const {
    evaluation,
    setWorkerId,
    setPeriod,
    updateCriteriaCheck,
    updateRealEvidence,
    addFiles,
    removeFile,
    saveEvaluation,
    addWorker
  } = useEvaluationState();

  const [activeCompetencyId, setActiveCompetencyId] = useState<string>('B');
  const [isAddWorkerModalOpen, setAddWorkerModalOpen] = useState(false);

  const handleWorkerChange = (workerId: string) => {
    setWorkerId(workerId);
    setActiveCompetencyId('B'); // Reset to the first competency
  };

  const handleAddWorker = (name: string) => {
    addWorker(name);
    setAddWorkerModalOpen(false);
  };

  const activeCompetency = useMemo(
    () => competencies.find(c => c.id === activeCompetencyId),
    [activeCompetencyId]
  );
  
  if (evaluation.workers.length === 0) {
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
              Para comenzar, por favor, añada el primer perfil de trabajador/a.
            </p>
            <div className="mt-8">
              <button
                onClick={() => setAddWorkerModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
              >
                <UserPlusIcon className="h-6 w-6" />
                <span>Añadir Primer Trabajador/a</span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const isFormActive = evaluation.workerId !== null;

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
          />

          <div className="flex-grow p-4 sm:p-6 lg:p-8">
            {isFormActive ? (
              <div className="max-w-7xl mx-auto">
                {activeCompetency ? (
                  <CompetencyBlock
                    key={activeCompetency.id}
                    competency={activeCompetency}
                    evaluation={evaluation}
                    onCriteriaChange={updateCriteriaCheck}
                    onEvidenceChange={updateRealEvidence}
                    onFilesAdded={addFiles}
                    onFileRemoved={removeFile}
                  />
                ) : activeCompetencyId === 'summary' ? (
                  <SummaryPage 
                    evaluation={evaluation}
                    onSave={saveEvaluation}
                  />
                ) : null}
              </div>
            ) : (
              <div className="text-center max-w-4xl mx-auto mt-6">
                <div className="bg-white shadow-md rounded-xl p-16">
                  <h2 className="text-2xl font-semibold text-gray-700">Comenzar Evaluación</h2>
                  <p className="mt-2 text-gray-500">Por favor, seleccione un trabajador/a del menú superior para comenzar o continuar una evaluación.</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default App;
