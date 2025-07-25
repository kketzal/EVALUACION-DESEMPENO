import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import * as XLSX from 'xlsx';
import { Competency, EvaluationState, CriteriaCheckState, Worker } from '../types';
import { ConductRow } from './ConductRow';
import { DownloadIcon, LightbulbIcon } from './icons';
import { EvidenceUploader } from './EvidenceUploader';

interface CompetencyBlockProps {
  competency: Competency;
  evaluation: EvaluationState;
  onCriteriaChange: (conductId: string, tramo: 't1' | 't2', criterionIndex: number, isChecked: boolean) => void;
  onEvidenceChange: (conductId: string, text: string) => void;
  addFiles: Function;
  removeFile: Function;
  removeAllFilesFromConduct?: Function;
  onToggleAccordion: (conductId: string, isOpen: boolean) => void;
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

// Tooltip responsive
const Tooltip: React.FC<{ content: React.ReactNode; anchorRef: React.RefObject<HTMLElement | null> }> = ({ content, anchorRef }) => {
  const [style, setStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (anchorRef.current && tooltipRef.current) {
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      let top = anchorRect.bottom + 8;
      let left = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;
      // Ajustar si se sale por la derecha
      if (left + tooltipRect.width > window.innerWidth - 8) {
        left = window.innerWidth - tooltipRect.width - 8;
      }
      // Ajustar si se sale por la izquierda
      if (left < 8) {
        left = 8;
      }
      // Si no cabe abajo, mostrar arriba
      if (top + tooltipRect.height > window.innerHeight - 8) {
        top = anchorRect.top - tooltipRect.height - 8;
      }
      setStyle({ position: 'fixed', top, left, zIndex: 9999 });
    }
  }, [anchorRef.current]);

  return ReactDOM.createPortal(
    <div
      ref={tooltipRef}
      style={style}
      className="bg-gray-900 text-white text-xs rounded-lg shadow-lg px-4 py-3 max-w-xs pointer-events-none animate-fade-in"
    >
      {content}
    </div>,
    document.body
  );
};

// Accordion mejorado con bombilla y tooltip
const Accordion: React.FC<{ 
  title: React.ReactNode; 
  open?: boolean; 
  children: React.ReactNode; 
  exampleEvidence?: React.ReactNode;
  onToggle?: (isOpen: boolean) => void;
}> = ({ title, open = false, children, exampleEvidence, onToggle }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const bulbRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    const newState = !open;
    onToggle?.(newState);
  };

  return (
    <div className="border rounded-lg mb-2 bg-gray-50">
      <div className="w-full flex items-center justify-between px-4 py-3 text-base font-medium text-gray-800 focus:outline-none focus:ring transition-colors hover:bg-indigo-50">
        <button
          type="button"
          className="flex-1 text-left"
          onClick={handleToggle}
          aria-expanded={open}
        >
          {title}
        </button>
        {exampleEvidence && (
          <button
            ref={bulbRef}
            type="button"
            className="ml-2 p-1 text-yellow-400 hover:text-yellow-500 focus:outline-none"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            tabIndex={0}
            aria-label="Ver ejemplo de evidencia"
          >
            <LightbulbIcon className="h-6 w-6" />
            {showTooltip && (
              <Tooltip
                content={<div><span className="font-bold block mb-1">Ejemplo de Evidencia:</span>{exampleEvidence}</div>}
                anchorRef={bulbRef}
              />
            )}
          </button>
        )}
        <button
          type="button"
          className="ml-2"
          onClick={handleToggle}
          tabIndex={-1}
          aria-label={open ? 'Cerrar' : 'Abrir'}
        >
          <svg
            className={`h-5 w-5 transform transition-transform ${open ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  );
};

export const CompetencyBlock: React.FC<CompetencyBlockProps> = ({ 
  competency, 
  evaluation, 
  onCriteriaChange, 
  onEvidenceChange, 
  addFiles, 
  removeFile,
  removeAllFilesFromConduct,
  onToggleAccordion
}) => {
  const emptyScore = { t1: null, t2: null, final: 0 };
  const emptyCriteriaChecks: CriteriaCheckState = { t1: [], t2: [] };
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Calcular si todos los accordions están abiertos
  const allAccordionsOpen = competency.conducts.every(conduct => 
    evaluation.openAccordions[conduct.id] || false
  );
  
  // Función para expandir/colapsar todos los accordions con animación
  const handleToggleAllAccordions = () => {
    const newState = !allAccordionsOpen;
    setIsAnimating(true);
    
    // Aplicar cambios con un pequeño delay para crear efecto cascada
    competency.conducts.forEach((conduct, index) => {
      setTimeout(() => {
        onToggleAccordion(conduct.id, newState);
      }, index * 50); // 50ms de delay entre cada accordion
    });
    
    // Resetear estado de animación después de completar
    setTimeout(() => {
      setIsAnimating(false);
    }, competency.conducts.length * 50 + 200);
  };
  
  const handleExportBlock = () => {
    if (!evaluation.workerId) return;

    const workerName = getWorkerName(evaluation.workers, evaluation.workerId);
    
    const blockConducts = competency.conducts;
    const exportData: ExportRow[] = blockConducts.map(conduct => {
        const score = evaluation.scores[conduct.id] || { t1: null, t2: null, final: 0 };
        const evidence = evaluation.realEvidences[conduct.id] || '';
        const conductFiles = evaluation.files[conduct.id] || [];
        const fileNames = conductFiles.map(f => f.name).join(', ');
        
        const fullEvidence = [evidence, fileNames ? `Archivos: ${fileNames}`: ''].filter(Boolean).join('\n\n');
        
        return {
            'ID': conduct.id,
            'Descripción': conduct.description,
            'Nota T1': score.t1 ?? '',
            'Nota T2': score.t2 ?? '',
            'Nota Final': score.final,
            'Evidencia Observada': fullEvidence,
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

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Bloque ${competency.id}`);
    XLSX.writeFile(wb, `evaluacion_bloque_${competency.id}_${workerName.replace(/\s/g, '_')}_${evaluation.period}.xlsx`);
  };

  return (
    <div data-testid="competency-block">
      <div className="border-b border-gray-200 pb-4 mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{competency.title}</h2>
          <p className="mt-1 text-sm text-gray-600 italic">{competency.description}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Botón para expandir/colapsar todos los accordions */}
          <button
            onClick={handleToggleAllAccordions}
            disabled={isAnimating}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform ${
              isAnimating 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 hover:scale-105'
            }`}
            title={allAccordionsOpen ? "Colapsar todos los accordions" : "Expandir todos los accordions"}
          >
            <svg
              className={`h-5 w-5 transform transition-transform duration-200 ${
                isAnimating ? 'animate-spin' : allAccordionsOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>{isAnimating ? 'Procesando...' : (allAccordionsOpen ? 'Colapsar Todo' : 'Expandir Todo')}</span>
          </button>
          
          {/* Botón de exportar */}
          <button
            onClick={handleExportBlock}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105"
          >
            <DownloadIcon className="h-5 w-5" />
            <span>Exportar Bloque</span>
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {competency.conducts.map((conduct, idx) => (
          <Accordion
            key={conduct.id}
            data-testid="conduct-accordion"
            title={<span><span className="font-semibold">{conduct.id}.</span> {conduct.description}</span>}
            open={evaluation.openAccordions[conduct.id] || false}
            exampleEvidence={conduct.exampleEvidence}
            onToggle={(isOpen) => onToggleAccordion(conduct.id, isOpen)}
          >
            <ConductRow
              conduct={conduct}
              score={evaluation.scores[conduct.id] || emptyScore}
              criteriaChecks={evaluation.criteriaChecks[conduct.id] || emptyCriteriaChecks}
              realEvidence={evaluation.realEvidences[conduct.id] || ''}
              onCriteriaChange={(tramo, index, isChecked) => onCriteriaChange(conduct.id, tramo, index, isChecked)}
              onEvidenceChange={(text) => onEvidenceChange(conduct.id, text)}
              useT1SevenPoints={evaluation.useT1SevenPoints}
              hideDescription={true}
            />
            <div className="mt-4 border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Archivos de Evidencia para esta Conducta</h4>
              <EvidenceUploader
                evaluationId={evaluation.evaluationId || 0}
                competencyId={competency.id}
                conductId={conduct.id}
                evaluation={evaluation}
                addFiles={addFiles}
                removeFile={removeFile}
                removeAllFilesFromConduct={removeAllFilesFromConduct}
              />
            </div>
          </Accordion>
        ))}
      </div>
    </div>
  );
};