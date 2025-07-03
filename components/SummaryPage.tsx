import React from 'react';
import { EvaluationState, Competency } from '../types';
import { ReportActions } from './ReportActions';
import { competencies } from '../data/evaluationData';
import { FileIcon } from './icons';

interface SummaryPageProps {
  evaluation: EvaluationState;
  onSave: () => void;
}

export const SummaryPage: React.FC<SummaryPageProps> = ({ evaluation, onSave }) => {
  // Contar el total de archivos
  const totalFiles = Object.values(evaluation.files).reduce((sum, files) => sum + files.length, 0);

  return (
    <div>
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Resumen y Guardado de la Evaluación</h2>
        <p className="text-sm text-gray-600 italic">Revise los archivos de evidencia y guarde la evaluación completa.</p>
      </div>
      
      <div className="bg-white shadow-md rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Resumen de Archivos de Evidencia
          {totalFiles > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-600">
              ({totalFiles} archivo{totalFiles !== 1 ? 's' : ''} en total)
            </span>
          )}
        </h3>
        {totalFiles > 0 ? (
          <div className="space-y-6">
            {competencies.map(comp => {
              // Obtener todos los archivos para las conductas de esta competencia
              const competencyFiles = Object.entries(evaluation.files)
                .filter(([conductId]) => conductId.startsWith(comp.id))
                .reduce((acc, [conductId, files]) => {
                  if (files && files.length > 0) {
                    acc[conductId] = files;
                  }
                  return acc;
                }, {} as Record<string, any[]>);

              const hasFiles = Object.keys(competencyFiles).length > 0;

              if (!hasFiles) return null;

              return (
                <div key={comp.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 pb-2 border-b">
                    {comp.title}
                  </h4>
                  <div className="space-y-4">
                    {Object.entries(competencyFiles).map(([conductId, files]) => {
                      const conduct = comp.conducts.find(c => c.id === conductId);
                      return (
                        <div key={conductId} className="pl-4">
                          <h5 className="text-sm font-medium text-gray-600 mb-2">
                            Conducta {conductId}: {conduct?.description}
                          </h5>
                          <ul className="space-y-2">
                            {files.map(file => (
                              <li key={file.id} className="flex items-center gap-3 bg-gray-50 p-2 rounded">
                                <FileIcon className="h-5 w-5 text-gray-400" />
                                <span className="text-sm text-gray-700 truncate flex-1">
                                  {file.original_name || file.name}
                                </span>
                                {file.url && (
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-800"
                                    title="Ver archivo"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                  </a>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 italic">No se han adjuntado archivos de evidencia.</p>
        )}
      </div>

      <ReportActions
        evaluation={evaluation}
        onSave={onSave}
        isSavable={evaluation.workerId !== null}
      />
    </div>
  );
};
