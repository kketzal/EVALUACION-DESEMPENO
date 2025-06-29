import React, { useState } from 'react';
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
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  const getExportData = () => {
    return competencies.flatMap(competency =>
      competency.conducts.map(conduct => {
        const score = evaluation.scores[conduct.id] || { t1: null, t2: null, final: 0 };
        const evidence = evaluation.realEvidences[conduct.id] || '';
        const conductFiles = evaluation.files[conduct.id] || [];
        const fileNames = conductFiles.map(f => f.name).join(', ');
        
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

  const handleSave = async () => {
    await onSave();
    // Mostrar notificación de éxito temporal
    setShowSuccessNotification(true);
    setTimeout(() => setShowSuccessNotification(false), 3000);
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-6 border-t relative">
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-10px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
      
      {/* Notificación de éxito */}
      {showSuccessNotification && (
        <div 
          className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2"
          style={{
            animation: 'fadeInOut 3s ease-in-out',
            zIndex: 1000
          }}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>¡Evaluación guardada!</span>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Información de última guardado */}
        <div className="text-sm text-gray-600">
          {evaluation.lastSavedAt && (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Última guardado: {evaluation.lastSavedAt}
            </span>
          )}
        </div>
        
        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
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
            onClick={handleSave}
            disabled={!isSavable || evaluation.isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {evaluation.isSaving ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <SaveIcon className="h-5 w-5" />
                <span>Guardar Evaluación</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
