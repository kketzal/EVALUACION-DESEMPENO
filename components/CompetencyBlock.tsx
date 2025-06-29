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

export const CompetencyBlock: React.FC<CompetencyBlockProps> = ({ 
  competency, 
  evaluation, 
  onCriteriaChange, 
  onEvidenceChange 
}) => {
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

    // Obtener todos los archivos de todas las conductas de esta competencia
    const allFiles: Array<{
      id: number;
      evaluation_id: number;
      competency_id: string;
      conduct_id: string;
      original_name: string;
      file_name: string;
      file_type: string;
      file_size: number;
      uploaded_at: string;
      url: string;
    }> = [];
    blockConducts.forEach(conduct => {
      const conductFiles = evaluation.files[conduct.id] || [];
      allFiles.push(...conductFiles.map(file => ({
        id: parseInt(file.id),
        evaluation_id: evaluation.evaluationId || 0,
        competency_id: competency.id,
        conduct_id: conduct.id,
        original_name: file.name,
        file_name: file.name,
        file_type: file.type,
        file_size: 0,
        uploaded_at: new Date().toISOString(),
        url: file.content,
      })));
    });

    if(allFiles.length > 0) {
        exportData.push({'ID': '', 'Descripción': '', 'Nota T1': '', 'Nota T2': '', 'Nota Final': '', 'Evidencia Observada': ''});
        exportData.push({'ID': 'ARCHIVOS ADJUNTOS', 'Descripción': allFiles.map(f => f.original_name).join(', '), 'Nota T1': '', 'Nota T2': '', 'Nota Final': '', 'Evidencia Observada': ''});
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
        {competency.conducts.map((conduct) => {
          return (
            <div key={conduct.id}>
              <ConductRow
                conduct={conduct}
                score={evaluation.scores[conduct.id] || emptyScore}
                criteriaChecks={evaluation.criteriaChecks[conduct.id] || emptyCriteriaChecks}
                realEvidence={evaluation.realEvidences[conduct.id] || ''}
                onCriteriaChange={(tramo, index, isChecked) => onCriteriaChange(conduct.id, tramo, index, isChecked)}
                onEvidenceChange={(text) => onEvidenceChange(conduct.id, text)}
              />
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Archivos de Evidencia para esta Conducta</h4>
                <EvidenceUploader
                  evaluationId={evaluation.evaluationId || 0}
                  competencyId={competency.id}
                  conductId={conduct.id}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};