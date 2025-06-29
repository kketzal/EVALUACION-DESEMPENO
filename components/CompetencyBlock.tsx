import React from 'react';
import * as XLSX from 'xlsx';
import { Competency, EvaluationState, CriteriaCheckState, Worker } from '../types';
import { ConductRow } from './ConductRow';
import { DownloadIcon } from './icons';
import { EvidenceUploader } from './EvidenceUploader';

interface CompetencyBlockProps {
  competency: Competency;
  evaluation: EvaluationState;
  onCriteriaChange: (conductId: string, tramo: 't1' | 't2', criterionIndex: number, isChecked: boolean) => void;
  onEvidenceChange: (conductId: string, text: string) => void;
  onFilesAdded: (competencyId: string, files: FileList) => void;
  onFileRemoved: (competencyId: string, fileId: string) => void;
}

// Define an interface for the export data row to ensure type safety.
interface ExportRow {
    'ID': string;
    'Descripción': string;
    'Nota T1': number | string;
    'Nota T2': number | string;
    'Nota Final': number | string;
    'Evidencia Observada': string;
}

const getWorkerName = (workers: Worker[], workerId: string | null): string => {
    if (!workerId) return 'N/A';
    return workers.find(w => w.id === workerId)?.name || 'Desconocido';
};

export const CompetencyBlock: React.FC<CompetencyBlockProps> = ({ competency, evaluation, onCriteriaChange, onEvidenceChange, onFilesAdded, onFileRemoved }) => {
  const emptyScore = { t1: null, t2: null, final: 0 };
  const emptyCriteriaChecks: CriteriaCheckState = { t1: [], t2: [] };
  
  const handleExportBlock = () => {
    if (!evaluation.workerId) return;

    const workerName = getWorkerName(evaluation.workers, evaluation.workerId);
    
    const blockConducts = competency.conducts;
    const exportData: ExportRow[] = blockConducts.map(conduct => {
        const score = evaluation.scores[conduct.id] || { t1: null, t2: null, final: 0 };
        const evidence = evaluation.realEvidences[conduct.id] || '';
        return {
            'ID': conduct.id,
            'Descripción': conduct.description,
            'Nota T1': score.t1 ?? '',
            'Nota T2': score.t2 ?? '',
            'Nota Final': score.final,
            'Evidencia Observada': evidence,
        };
    });

    const totalScore = blockConducts.reduce((sum, conduct) => {
        const score = evaluation.scores[conduct.id];
        return sum + (score ? score.final : 0);
    }, 0);
    const averageScore = blockConducts.length > 0 ? (totalScore / blockConducts.length) : 0;
    
    exportData.push({
        'ID': '',
        'Descripción': 'NOTA MEDIA DEL BLOQUE',
        'Nota T1': '',
        'Nota T2': '',
        'Nota Final': averageScore > 0 ? parseFloat(averageScore.toFixed(2)) : 'N/A',
        'Evidencia Observada': '',
    });

    const competencyFiles = evaluation.files[competency.id] || [];
    if(competencyFiles.length > 0) {
        exportData.push({'ID': '', 'Descripción': '', 'Nota T1': '', 'Nota T2': '', 'Nota Final': '', 'Evidencia Observada': ''});
        exportData.push({'ID': 'ARCHIVOS ADJUNTOS', 'Descripción': competencyFiles.map(f => f.name).join(', '), 'Nota T1': '', 'Nota T2': '', 'Nota Final': '', 'Evidencia Observada': ''});
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Bloque ${competency.id}`);
    XLSX.writeFile(wb, `evaluacion_bloque_${competency.id}_${workerName.replace(/\s/g, '_')}_${evaluation.period}.xlsx`);
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-6 mb-8">
      <div className="border-b border-gray-200 pb-4 mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{competency.title}</h2>
          <p className="mt-1 text-sm text-gray-600 italic">{competency.description}</p>
        </div>
        <button
          onClick={handleExportBlock}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
        >
          <DownloadIcon className="h-5 w-5" />
          <span>Exportar Bloque</span>
        </button>
      </div>
      <div className="space-y-4">
        {competency.conducts.map((conduct) => (
          <ConductRow
            key={conduct.id}
            conduct={conduct}
            score={evaluation.scores[conduct.id] || emptyScore}
            criteriaChecks={evaluation.criteriaChecks[conduct.id] || emptyCriteriaChecks}
            realEvidence={evaluation.realEvidences[conduct.id] || ''}
            onCriteriaChange={(tramo, index, isChecked) => onCriteriaChange(conduct.id, tramo, index, isChecked)}
            onEvidenceChange={(text) => onEvidenceChange(conduct.id, text)}
          />
        ))}
      </div>
      <div className="border-t border-gray-200 mt-6 pt-6">
         <EvidenceUploader
            files={evaluation.files[competency.id] || []}
            onFilesAdded={(files) => onFilesAdded(competency.id, files)}
            onFileRemoved={(fileId) => onFileRemoved(competency.id, fileId)}
        />
      </div>
    </div>
  );
};