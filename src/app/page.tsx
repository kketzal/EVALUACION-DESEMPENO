'use client';

import { useState } from 'react';
import { useEvaluationState } from '@/hooks/useEvaluationState';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { CompetencyBlock } from '@/components/CompetencyBlock';
import { SummaryPage } from '@/components/SummaryPage';
import { AddWorkerModal } from '@/components/AddWorkerModal';
import { InfoModal } from '@/components/InfoModal';

export default function Home() {
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [currentView, setCurrentView] = useState<'evaluation' | 'summary'>('evaluation');
  
  const {
    workers,
    selectedWorkerId,
    evaluation,
    criteriaChecks,
    scores,
    realEvidences,
    files,
    isLoading,
    error,
    setWorkerId,
    updateCriteria,
    updateScore,
    updateEvidence,
    addFiles,
    removeFile,
    calculateTotalScore,
  } = useEvaluationState();

  const selectedWorker = workers.find(w => w.id === selectedWorkerId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        selectedWorker={selectedWorker}
        onAddWorker={() => setShowAddWorkerModal(true)}
        onShowInfo={() => setShowInfoModal(true)}
        onExit={() => {
          setCurrentView('evaluation');
          // Reset state
        }}
      />
      
      <div className="flex">
        <Sidebar
          workers={workers}
          selectedWorkerId={selectedWorkerId}
          onWorkerSelect={setWorkerId}
          onAddWorker={() => setShowAddWorkerModal(true)}
        />
        
        <main className="flex-1 p-6">
          {!selectedWorker ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Selecciona un trabajador
              </h2>
              <p className="text-gray-600 mb-6">
                Para comenzar una evaluación, selecciona un trabajador de la lista o agrega uno nuevo.
              </p>
              <button
                onClick={() => setShowAddWorkerModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Agregar Trabajador
              </button>
            </div>
          ) : currentView === 'evaluation' ? (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Evaluación de Desempeño - {selectedWorker.name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Cargo:</span>
                    <span className="ml-2 text-gray-900">{selectedWorker.position}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Departamento:</span>
                    <span className="ml-2 text-gray-900">{selectedWorker.department}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Puntuación Total:</span>
                    <span className="ml-2 text-gray-900">
                      {calculateTotalScore().toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <CompetencyBlock
                evaluation={evaluation}
                criteriaChecks={criteriaChecks}
                scores={scores}
                realEvidences={realEvidences}
                files={files}
                onCriteriaChange={updateCriteria}
                onScoreChange={updateScore}
                onEvidenceChange={updateEvidence}
                addFiles={addFiles}
                removeFile={removeFile}
              />
            </div>
          ) : (
            <SummaryPage
              worker={selectedWorker}
              evaluation={evaluation}
              criteriaChecks={criteriaChecks}
              scores={scores}
              realEvidences={realEvidences}
              files={files}
              onBackToEvaluation={() => setCurrentView('evaluation')}
            />
          )}
        </main>
      </div>

      {showAddWorkerModal && (
        <AddWorkerModal
          onClose={() => setShowAddWorkerModal(false)}
          onWorkerAdded={(worker) => {
            setShowAddWorkerModal(false);
            setWorkerId(worker.id);
          }}
        />
      )}

      {showInfoModal && (
        <InfoModal onClose={() => setShowInfoModal(false)} />
      )}
    </div>
  );
} 