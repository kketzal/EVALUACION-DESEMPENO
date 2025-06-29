import { useState, useEffect, useCallback } from 'react';
import { apiService, Worker, Evaluation, EvidenceFile, CriteriaCheck, Score, RealEvidence } from '@/lib/api';
import { competencies } from '@/data/evaluationData';

export interface EvaluationState {
  workers: Worker[];
  selectedWorkerId: number | null;
  evaluation: Evaluation | null;
  criteriaChecks: Record<string, Record<string, boolean>>;
  scores: Record<string, number>;
  realEvidences: Record<string, string>;
  files: Record<string, EvidenceFile[]>;
  isLoading: boolean;
  error: string | null;
}

const emptyScore = { t1: 0, t2: 0, total: 0 };
const emptyCriteriaChecks = { t1: Array(5).fill(false), t2: Array(5).fill(false) };

export function useEvaluationState() {
  const [state, setState] = useState<EvaluationState>({
    workers: [],
    selectedWorkerId: null,
    evaluation: null,
    criteriaChecks: {},
    scores: {},
    realEvidences: {},
    files: {},
    isLoading: false,
    error: null,
  });

  // Cargar trabajadores
  const loadWorkers = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const workers = await apiService.getWorkers();
      setState(prev => ({ ...prev, workers, isLoading: false }));
    } catch (error) {
      console.error('Error al cargar trabajadores:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Error al cargar trabajadores', 
        isLoading: false 
      }));
    }
  }, []);

  // Cargar evaluación
  const loadEvaluation = useCallback(async (evaluationId: number) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const [evaluations, criteria, scores, evidence, files] = await Promise.all([
        apiService.getEvaluations(),
        apiService.getCriteria(evaluationId),
        apiService.getScores(evaluationId),
        apiService.getEvidence(evaluationId),
        apiService.getFiles(evaluationId),
      ]);

      const evaluation = evaluations.find(e => e.id === evaluationId) || null;
      
      // Procesar criterios
      const criteriaChecks: Record<string, Record<string, boolean>> = {};
      criteria.forEach(c => {
        if (!criteriaChecks[c.conduct_id]) {
          criteriaChecks[c.conduct_id] = { t1: Array(5).fill(false), t2: Array(5).fill(false) };
        }
        criteriaChecks[c.conduct_id][c.tramo][c.criterion_index] = c.is_checked;
      });

      // Procesar puntuaciones
      const scoresMap: Record<string, number> = {};
      scores.forEach(s => {
        scoresMap[s.conduct_id] = s.score;
      });

      // Procesar evidencias reales
      const realEvidences: Record<string, string> = {};
      evidence.forEach(e => {
        realEvidences[e.conduct_id] = e.evidence_text;
      });

      // Procesar archivos
      const filesMap: Record<string, EvidenceFile[]> = {};
      files.forEach(f => {
        const key = f.url.split('/').pop()?.split('-').slice(2).join('-') || '';
        const conductId = key.split('.')[0];
        if (!filesMap[conductId]) {
          filesMap[conductId] = [];
        }
        filesMap[conductId].push(f);
      });

      setState(prev => ({
        ...prev,
        evaluation,
        criteriaChecks,
        scores: scoresMap,
        realEvidences,
        files: filesMap,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error al cargar evaluación:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Error al cargar evaluación', 
        isLoading: false 
      }));
    }
  }, []);

  // Seleccionar trabajador
  const setWorkerId = useCallback(async (workerId: number) => {
    try {
      setState(prev => ({ ...prev, selectedWorkerId: workerId, isLoading: true }));
      
      // Crear nueva evaluación
      const { id: evaluationId } = await apiService.createEvaluation(workerId);
      
      // Cargar la evaluación
      await loadEvaluation(evaluationId);
    } catch (error) {
      console.error('Error al seleccionar trabajador:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Error al crear evaluación', 
        isLoading: false 
      }));
    }
  }, [loadEvaluation]);

  // Actualizar criterio
  const updateCriteria = useCallback(async (
    conductId: string,
    tramo: 't1' | 't2',
    criterionIndex: number,
    isChecked: boolean
  ) => {
    if (!state.evaluation) return;

    try {
      await apiService.updateCriteria(
        state.evaluation.id,
        conductId,
        tramo,
        criterionIndex,
        isChecked
      );

      setState(prev => ({
        ...prev,
        criteriaChecks: {
          ...prev.criteriaChecks,
          [conductId]: {
            ...prev.criteriaChecks[conductId],
            [tramo]: prev.criteriaChecks[conductId]?.[tramo]?.map((checked, index) =>
              index === criterionIndex ? isChecked : checked
            ) || Array(5).fill(false),
          },
        },
      }));
    } catch (error) {
      console.error('Error al actualizar criterio:', error);
    }
  }, [state.evaluation]);

  // Actualizar puntuación
  const updateScore = useCallback(async (conductId: string, score: number) => {
    if (!state.evaluation) return;

    try {
      await apiService.updateScore(state.evaluation.id, conductId, score);
      
      setState(prev => ({
        ...prev,
        scores: {
          ...prev.scores,
          [conductId]: score,
        },
      }));
    } catch (error) {
      console.error('Error al actualizar puntuación:', error);
    }
  }, [state.evaluation]);

  // Actualizar evidencia real
  const updateEvidence = useCallback(async (conductId: string, evidenceText: string) => {
    if (!state.evaluation) return;

    try {
      await apiService.updateEvidence(state.evaluation.id, conductId, evidenceText);
      
      setState(prev => ({
        ...prev,
        realEvidences: {
          ...prev.realEvidences,
          [conductId]: evidenceText,
        },
      }));
    } catch (error) {
      console.error('Error al actualizar evidencia:', error);
    }
  }, [state.evaluation]);

  // Agregar archivos
  const addFiles = useCallback(async ({
    competencyId,
    conductId,
    files,
  }: {
    competencyId: string;
    conductId: string;
    files: FileList;
  }) => {
    if (!state.evaluation) return;

    try {
      const result = await apiService.uploadFiles(
        state.evaluation.id,
        files,
        competencyId,
        conductId
      );

      setState(prev => ({
        ...prev,
        files: {
          ...prev.files,
          [conductId]: [...(prev.files[conductId] || []), ...result.files],
        },
      }));
    } catch (error) {
      console.error('Error al subir archivos:', error);
      throw error;
    }
  }, [state.evaluation]);

  // Eliminar archivo
  const removeFile = useCallback(async (competencyId: string, conductId: string, fileId: string) => {
    try {
      await apiService.deleteFile(fileId);
      
      setState(prev => ({
        ...prev,
        files: {
          ...prev.files,
          [conductId]: prev.files[conductId]?.filter(f => f.id !== fileId) || [],
        },
      }));
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      throw error;
    }
  }, []);

  // Calcular puntuación total
  const calculateTotalScore = useCallback(() => {
    if (!state.evaluation) return 0;

    const totalScore = Object.values(state.scores).reduce((sum, score) => sum + score, 0);
    const maxPossibleScore = competencies.reduce((sum, competency) => {
      return sum + competency.conducts.reduce((conductSum, conduct) => {
        return conductSum + (conduct.maxScore || 0);
      }, 0);
    }, 0);

    return maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
  }, [state.scores, state.evaluation]);

  // Cargar trabajadores al montar el componente
  useEffect(() => {
    loadWorkers();
  }, [loadWorkers]);

  return {
    ...state,
    setWorkerId,
    updateCriteria,
    updateScore,
    updateEvidence,
    addFiles,
    removeFile,
    calculateTotalScore,
    loadEvaluation,
  };
} 