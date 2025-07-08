import React from 'react';
import { Evaluation } from '../services/api';
import { VersionFlowIndicator } from './VersionFlowIndicator';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluations: Evaluation[];
  currentVersion: number | null;
  onSelectVersion: (evaluationId: number) => void;
  onDeleteVersion: (evaluationId: number) => void;
  isLoading?: boolean;
  versionFlow?: string;
  originalVersionId?: number | null;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  evaluations,
  currentVersion,
  onSelectVersion,
  onDeleteVersion,
  isLoading = false,
  versionFlow,
  originalVersionId
}) => {
  if (!isOpen) return null;

  // Ordenar evaluaciones por versión (más reciente primero)
  const sortedEvaluations = [...evaluations].sort((a, b) => (b.version || 0) - (a.version || 0));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Historial de Versiones
            </h2>
            {versionFlow && (
              <VersionFlowIndicator
                versionFlow={versionFlow}
                currentVersion={currentVersion}
                originalVersionId={originalVersionId || null}
              />
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-3 text-gray-600">Cargando versiones...</span>
            </div>
          ) : sortedEvaluations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay versiones disponibles
            </div>
          ) : (
            <div className="space-y-4">
              {sortedEvaluations.map((evaluation) => (
                <div
                  key={evaluation.id}
                  className={`border rounded-lg p-4 transition-all ${
                    evaluation.version === currentVersion
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          evaluation.version === currentVersion
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          Versión {evaluation.version}
                        </span>
                        {evaluation.version === currentVersion && (
                          <span className="text-indigo-600 text-sm font-medium">
                            (Actual)
                          </span>
                        )}
                      </div>
                      
                                             <div className="mt-2 text-sm text-gray-600">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                           <div>
                             <span className="font-medium">Creada:</span>{' '}
                             {evaluation.created_at ? new Date(evaluation.created_at).toLocaleString('es-ES') : 'N/A'}
                           </div>
                           <div>
                             <span className="font-medium">Última modificación:</span>{' '}
                             {evaluation.updated_at ? new Date(evaluation.updated_at).toLocaleString('es-ES') : 'N/A'}
                           </div>
                         </div>
                         {evaluation.version === currentVersion && versionFlow && (
                           <div className="mt-2 pt-2 border-t border-gray-200">
                             <VersionFlowIndicator
                               versionFlow={versionFlow}
                               currentVersion={currentVersion}
                               originalVersionId={originalVersionId || null}
                             />
                           </div>
                         )}
                       </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {evaluation.version !== currentVersion && (
                        <>
                          <button
                            onClick={() => onSelectVersion(evaluation.id)}
                            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                          >
                            Cargar
                          </button>
                          <button
                            onClick={() => onDeleteVersion(evaluation.id)}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}; 