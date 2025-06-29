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
  const allFiles = Object.entries(evaluation.files).flatMap(([competencyId, files]) => 
    files.map(file => ({...file, competencyId}))
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Resumen y Guardado de la Evaluación</h2>
        <p className="text-sm text-gray-600 italic">Revise los archivos de evidencia y guarde la evaluación completa.</p>
      </div>
      
      <div className="bg-white shadow-md rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Resumen de Archivos de Evidencia</h3>
        {allFiles.length > 0 ? (
            <div className="space-y-4">
                {competencies.map(c => {
                    const competencyFiles = evaluation.files[c.id];
                    if (!competencyFiles || competencyFiles.length === 0) return null;
                    return (
                        <div key={c.id}>
                            <h4 className="font-semibold text-gray-700 mb-2 border-b pb-1">{c.title}</h4>
                            <ul className="space-y-2 pt-2">
                                {competencyFiles.map(file => (
                                    <li key={file.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-md">
                                        <FileIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                                        <span className="text-sm font-medium text-gray-800 truncate" title={file.name}>{file.name}</span>
                                    </li>
                                ))}
                            </ul>
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
