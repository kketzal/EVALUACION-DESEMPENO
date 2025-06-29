import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { EvaluationState, Worker } from '../types';
import { competencies } from '../data/evaluationData';
import { SaveIcon } from './icons';

interface ReportActionsProps {
  evaluation: EvaluationState;
  onSave: () => void;
  isSavable: boolean;
}

const getWorkerName = (workers: Worker[], workerId: string | null): string => {
    if (!workerId) return 'N/A';
    return workers.find(w => w.id === workerId)?.name || 'Desconocido';
};

export const ReportActions: React.FC<ReportActionsProps> = ({ evaluation, onSave, isSavable }) => {

  const getExportData = () => {
    return competencies.flatMap(competency =>
      competency.conducts.map(conduct => {
        const score = evaluation.scores[conduct.id] || { t1: null, t2: null, final: 0 };
        const evidence = evaluation.realEvidences[conduct.id] || '';
        const competencyFiles = evaluation.files[competency.id] || [];
        const fileNames = competencyFiles.map(f => f.name).join(', ');
        
        const fullEvidence = [evidence, fileNames ? `Archivos: ${fileNames}`: ''].filter(Boolean).join('\n\n');

        return {
          'Competencia': competency.title.replace(/^[A-Z]\.\s/, ''),
          'ID': conduct.id,
          'Descripción': conduct.description,
          'Nota T1': score.t1 ?? '',
          'Nota T2': score.t2 ?? '',
          'Nota Final': score.final,
          'Evidencia': fullEvidence,
        };
      })
    );
  };

  const handleGeneratePDF = () => {
    if (!evaluation.workerId) return;

    const doc = new jsPDF();
    const workerName = getWorkerName(evaluation.workers, evaluation.workerId);
    const title = `Evaluación de Desempeño: ${workerName}`;
    const period = `Período: ${evaluation.period}`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(12);
    doc.text(period, 14, 30);

    const tableData = getExportData();
    const head = [['Competencia', 'ID', 'Nota T1', 'Nota T2', 'Final', 'Evidencia']];
    const body = tableData.map(row => [
        row.Competencia,
        row.ID,
        row['Nota T1'],
        row['Nota T2'],
        row['Nota Final'],
        row['Evidencia']
    ]);
    
    autoTable(doc, {
      startY: 40,
      head: head,
      body: body,
      didParseCell: function (data) {
        if (data.column.dataKey === 5) { // Evidencia column
            data.cell.styles.fontSize = 8;
            data.cell.styles.cellWidth = 'wrap';
        }
    },
    columnStyles: {
        5: { cellWidth: 70 }
    }
    });

    doc.save(`evaluacion-${workerName.replace(/\s/g, '_')}-${evaluation.period}.pdf`);
  };

  const handleGenerateExcel = () => {
     if (!evaluation.workerId) return;
    const workerName = getWorkerName(evaluation.workers, evaluation.workerId);
    const tableData = getExportData();

    const ws = XLSX.utils.json_to_sheet(tableData);
    
    // Set column widths
    ws['!cols'] = [
        { wch: 25 }, // Competencia
        { wch: 10 }, // ID
        { wch: 30 }, // Descripción
        { wch: 10 }, // Nota T1
        { wch: 10 }, // Nota T2
        { wch: 10 }, // Nota Final
        { wch: 50 }, // Evidencia
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Evaluación");
    XLSX.writeFile(wb, `evaluacion-${workerName.replace(/\s/g, '_')}-${evaluation.period}.xlsx`);
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-6 border-t">
      <div className="flex flex-col sm:flex-row justify-end items-center gap-4">
        <button
          onClick={handleGeneratePDF}
          disabled={!isSavable}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Exportar a PDF
        </button>
        <button
          onClick={handleGenerateExcel}
          disabled={!isSavable}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Exportar a Excel
        </button>
        <button
          onClick={onSave}
          disabled={!isSavable}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SaveIcon className="h-5 w-5" />
          Guardar Evaluación
        </button>
      </div>
    </div>
  );
};
