
import { useState, useCallback, useEffect } from 'react';
import { EvaluationState, Score, Worker, CriteriaCheckState, EvidenceFile } from '../types';
import { competencies } from '../data/evaluationData';
import { t1Criteria, t2Criteria } from '../data/criteriaData';

const APP_STORAGE_KEY = 'evaluation-app-state';

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const calculateScores = (checks: CriteriaCheckState): Score => {
    const t1CheckedCount = checks.t1.filter(Boolean).length;
    const t2CheckedCount = checks.t2.filter(Boolean).length;

    let t1Score: number | null = null;
    if (t1CheckedCount > 0) {
        t1Score = 4 + t1CheckedCount;
    }

    let t2Score: number | null = null;
    if (t2CheckedCount >= 3) {
        t2Score = 10;
    } else if (t2CheckedCount >= 1) {
        t2Score = 9;
    }

    const finalScore = t2Score ?? t1Score ?? 0;

    return { t1: t1Score, t2: t2Score, final: finalScore };
};

const getInitialState = (): EvaluationState => {
  try {
    const savedState = localStorage.getItem(APP_STORAGE_KEY);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      if (parsed.workers && parsed.scores) {
          return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to load state from localStorage", error);
  }
  
  return {
    workerId: null,
    period: "2023-2024",
    scores: {},
    criteriaChecks: {},
    realEvidences: {},
    files: {},
    workers: [],
  };
};

export const useEvaluationState = () => {
  const [evaluation, setEvaluation] = useState<EvaluationState>(getInitialState);

  useEffect(() => {
    try {
        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(evaluation));
    } catch (error) {
        console.error("Failed to save state to localStorage", error);
    }
  }, [evaluation]);


  const setWorkerId = useCallback((workerId: string | null) => {
    setEvaluation(prev => {
        const blankState = {
            scores: {},
            criteriaChecks: {},
            realEvidences: {},
            files: {},
        };

        if (workerId) {
            for (const competency of competencies) {
                for (const conduct of competency.conducts) {
                    const defaultChecks: CriteriaCheckState = {
                        t1: Array(t1Criteria.length).fill(true),
                        t2: Array(t2Criteria.length).fill(false),
                    };
                    blankState.criteriaChecks[conduct.id] = defaultChecks;
                    blankState.scores[conduct.id] = calculateScores(defaultChecks);
                }
            }
        }

        return {
            ...prev,
            workerId,
            ...blankState,
        };
    });
  }, []);

  const setPeriod = useCallback((period: string) => {
    setEvaluation(prev => ({ ...prev, period }));
  }, []);

  const updateCriteriaCheck = useCallback((conductId: string, tramo: 't1' | 't2', criterionIndex: number, isChecked: boolean) => {
    setEvaluation(prev => {
        const newCriteriaChecks = { ...prev.criteriaChecks };
        const currentConductChecks = { ...newCriteriaChecks[conductId] };

        const newTramoChecks = [...currentConductChecks[tramo]];
        newTramoChecks[criterionIndex] = isChecked;
        currentConductChecks[tramo] = newTramoChecks;
        newCriteriaChecks[conductId] = currentConductChecks;

        const newScore = calculateScores(currentConductChecks);

        const newScores = {
            ...prev.scores,
            [conductId]: newScore,
        };
        
        return {
            ...prev,
            criteriaChecks: newCriteriaChecks,
            scores: newScores,
        };
    });
  }, []);

  const updateRealEvidence = useCallback((conductId: string, text: string) => {
    setEvaluation(prev => ({
      ...prev,
      realEvidences: {
        ...prev.realEvidences,
        [conductId]: text,
      },
    }));
  }, []);

  const addFiles = useCallback(async (competencyId: string, newFiles: FileList) => {
    const fileArray = Array.from(newFiles);
    const newEvidenceFiles: EvidenceFile[] = [];

    for (const file of fileArray) {
        try {
            const content = await readFileAsDataURL(file);
            newEvidenceFiles.push({
                id: `${new Date().getTime()}-${file.name}`,
                name: file.name,
                type: file.type,
                content: content,
            });
        } catch (error) {
            console.error("Error reading file:", file.name, error);
        }
    }

    setEvaluation(prev => ({
        ...prev,
        files: {
            ...prev.files,
            [competencyId]: [...(prev.files[competencyId] || []), ...newEvidenceFiles],
        },
    }));
  }, []);
  
  const removeFile = useCallback((competencyId: string, fileIdToRemove: string) => {
    setEvaluation(prev => {
        const competencyFiles = prev.files[competencyId] || [];
        const updatedFiles = competencyFiles.filter(file => file.id !== fileIdToRemove);
        return {
            ...prev,
            files: {
                ...prev.files,
                [competencyId]: updatedFiles,
            },
        };
    });
  }, []);

  const addWorker = useCallback((name: string) => {
    const newWorker: Worker = {
        id: new Date().getTime().toString(),
        name,
    };
    setEvaluation(prev => ({
        ...prev,
        workers: [...prev.workers, newWorker]
    }));
  }, []);

  const saveEvaluation = useCallback(() => {
    console.log("Saving Evaluation:", evaluation);
    alert(`Evaluación para el trabajador con ID ${evaluation.workerId} guardada.`);
  }, [evaluation]);

  return {
    evaluation,
    setWorkerId,
    setPeriod,
    updateCriteriaCheck,
    updateRealEvidence,
    addFiles,
    removeFile,
    saveEvaluation,
    addWorker,
  };
};
