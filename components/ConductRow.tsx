import React from 'react';
import { Conduct, Score, CriteriaCheckState } from '../types';
import { t1Criteria, t1Criteria7Points, t2Criteria } from '../data/criteriaData';
import { ToggleSwitch } from './ToggleSwitch';
import { LightbulbIcon } from './icons';

interface ConductRowProps {
  conduct: Conduct;
  score: Score;
  criteriaChecks: CriteriaCheckState;
  realEvidence: string;
  onCriteriaChange: (tramo: 't1' | 't2', criterionIndex: number, isChecked: boolean) => void;
  onEvidenceChange: (text: string) => void;
  useT1SevenPoints?: boolean;
  hideDescription?: boolean;
}

const CriteriaList: React.FC<{
    title: string;
    criteria: string[];
    checks: boolean[];
    conductId: string;
    tramo: 't1' | 't2';
    onCriteriaChange: (tramo: 't1' | 't2', criterionIndex: number, isChecked: boolean) => void;
    titleColor: string;
    useT1SevenPoints?: boolean;
}> = ({ title, criteria, checks, conductId, tramo, onCriteriaChange, titleColor, useT1SevenPoints }) => (
    <div>
        <h4 className={`font-semibold text-base mb-3 ${titleColor}`}>{title}</h4>
        <ul className="space-y-3">
            {criteria.map((criterion, index) => (
                <li key={index} className="flex items-start justify-between gap-4">
                    <span className="text-sm text-gray-600 flex-grow">{criterion}</span>
                    <ToggleSwitch
                        id={`${conductId}-${tramo}-${index}`}
                        checked={checks[index]}
                        onChange={(isChecked) => onCriteriaChange(tramo, index, isChecked)}
                    />
                </li>
            ))}
        </ul>
    </div>
);


export const ConductRow: React.FC<ConductRowProps> = ({ 
  conduct, 
  score, 
  criteriaChecks, 
  realEvidence, 
  onCriteriaChange, 
  onEvidenceChange,
  useT1SevenPoints = false,
  hideDescription = false
}) => {
    // Siempre usar los 4 criterios originales para mostrar
    const t1CriteriaToUse = t1Criteria;
    // Asegura que t1Checks y t2Checks sean arrays de longitud correcta y sin undefined
    const t1Checks = Array(4).fill(false).map((_, i) => criteriaChecks.t1 && typeof criteriaChecks.t1[i] === 'boolean' ? criteriaChecks.t1[i] : false);
    const t2Checks = Array(3).fill(false).map((_, i) => criteriaChecks.t2 && typeof criteriaChecks.t2[i] === 'boolean' ? criteriaChecks.t2[i] : false);

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4 border border-gray-200">
            <div className="flex-grow mb-4 flex items-start gap-3">
                {!hideDescription && (
                  <p className="font-semibold text-gray-800 flex-grow">{conduct.id}. {conduct.description}</p>
                )}
                {!hideDescription && (
                  <div className="relative group flex-shrink-0">
                      <LightbulbIcon className="h-6 w-6 text-yellow-400 cursor-pointer" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <span className="font-bold block mb-1">Ejemplo de Evidencia:</span>
                          {conduct.exampleEvidence}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-900"></div>
                      </div>
                  </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-4">
                <CriteriaList
                    title="TRAMO 1 (NOTA 5-8)"
                    criteria={t1CriteriaToUse}
                    checks={t1Checks}
                    conductId={conduct.id}
                    tramo="t1"
                    onCriteriaChange={onCriteriaChange}
                    titleColor="text-indigo-700"
                    useT1SevenPoints={useT1SevenPoints}
                />
                 <CriteriaList
                    title="TRAMO 2 (NOTA 9-10)"
                    criteria={t2Criteria}
                    checks={t2Checks}
                    conductId={conduct.id}
                    tramo="t2"
                    onCriteriaChange={onCriteriaChange}
                    titleColor="text-teal-700"
                />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
                 <div>
                    <label htmlFor={`t1-${conduct.id}`} className="block text-sm font-medium text-indigo-700">Nota T1 (Calculada)</label>
                    <input
                        type="text"
                        id={`t1-${conduct.id}`}
                        value={score.t1 ?? '-'}
                        disabled
                        className="mt-1 block w-full rounded-md border-gray-300 bg-gray-200 text-gray-600 shadow-sm sm:text-sm cursor-not-allowed text-center font-bold"
                    />
                </div>
                <div>
                    <label htmlFor={`t2-${conduct.id}`} className="block text-sm font-medium text-teal-700">Nota T2 (Calculada)</label>
                    <input
                        type="text"
                        id={`t2-${conduct.id}`}
                        value={score.t2 ?? '-'}
                        disabled
                        className="mt-1 block w-full rounded-md border-gray-300 bg-gray-200 text-gray-600 shadow-sm sm:text-sm cursor-not-allowed text-center font-bold"
                    />
                </div>
                <div>
                    <label htmlFor={`final-${conduct.id}`} className="block text-sm font-medium text-gray-700">Nota Final</label>
                    <input
                        type="text"
                        id={`final-${conduct.id}`}
                        value={score.final}
                        disabled
                        className="mt-1 block w-full rounded-md border-gray-300 bg-gray-200 text-gray-800 shadow-sm sm:text-sm cursor-not-allowed text-center font-bold text-lg"
                    />
                </div>
            </div>

            <div className="mt-4">
                 <label htmlFor={`evidence-${conduct.id}`} className="block text-sm font-medium text-gray-700">Evidencias Reales Observadas</label>
                <textarea
                    id={`evidence-${conduct.id}`}
                    rows={2}
                    value={realEvidence}
                    onChange={(e) => onEvidenceChange(e.target.value)}
                    className="mt-1 block w-full rounded-md bg-white text-gray-900 border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Describa aquí las conductas observadas..."
                />
            </div>
        </div>
    );
};