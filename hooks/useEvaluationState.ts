import { useState, useCallback, useEffect } from 'react';
import { EvaluationState, Score, Worker, CriteriaCheckState, EvidenceFile } from '../types';
import { competencies } from '../data/evaluationData';
import { t1Criteria, t2Criteria } from '../data/criteriaData';
import { apiService, EvaluationData, EvidenceFile as ApiEvidenceFile } from '../services/api';

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
  return {
    workerId: null,
    period: "2023-2024",
    scores: {},
    criteriaChecks: {},
    realEvidences: {},
    files: {},
    workers: [],
    evaluationId: null,
  };
};

export const useEvaluationState = () => {
  const [evaluation, setEvaluation] = useState<EvaluationState>(getInitialState);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar trabajadores al inicializar
  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = useCallback(async () => {
    try {
      setIsLoading(true);
      const workers = await apiService.getWorkers();
      setEvaluation(prev => ({
        ...prev,
        workers: workers.map(w => ({ id: w.id, name: w.name }))
      }));
    } catch (error) {
      console.error('Error al cargar trabajadores:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setWorkerId = useCallback(async (workerId: string | null) => {
    if (!workerId) {
      setEvaluation(prev => ({
        ...prev,
        workerId: null,
        evaluationId: null,
        scores: {},
        criteriaChecks: {},
        realEvidences: {},
        files: {},
      }));
      return;
    }

    try {
      setIsLoading(true);
      const evaluationData = await apiService.getEvaluation(workerId, evaluation.period);
      
      // Convertir datos de la API al formato interno
      const criteriaChecks: Record<string, CriteriaCheckState> = {};
      const realEvidences: Record<string, string> = {};
      const scores: Record<string, Score> = {};
      const files: Record<string, EvidenceFile[]> = {};

      // Procesar criterios
      evaluationData.criteriaChecks.forEach(check => {
        if (!criteriaChecks[check.conduct_id]) {
          criteriaChecks[check.conduct_id] = {
            t1: Array(t1Criteria.length).fill(false),
            t2: Array(t2Criteria.length).fill(false),
          };
        }
        criteriaChecks[check.conduct_id][check.tramo as 't1' | 't2'][check.criterion_index] = check.is_checked;
      });

      // Si no hay criterios guardados, inicializar con TRAMO 1 activado por defecto y calcular puntuación
      for (const competency of competencies) {
        for (const conduct of competency.conducts) {
          if (!criteriaChecks[conduct.id]) {
            criteriaChecks[conduct.id] = {
              t1: Array(t1Criteria.length).fill(true), // TRAMO 1 activado por defecto
              t2: Array(t2Criteria.length).fill(false),
            };
            // Calcular y guardar la puntuación inicial
            scores[conduct.id] = calculateScores(criteriaChecks[conduct.id]);
          } else {
            // Si ya hay criterios, también calcular la puntuación
            scores[conduct.id] = calculateScores(criteriaChecks[conduct.id]);
          }
        }
      }

      // Procesar evidencia real
      evaluationData.realEvidence.forEach(evidence => {
        realEvidences[evidence.conduct_id] = evidence.evidence_text;
      });

      // Procesar puntuaciones de la base de datos (sobrescribe si existen)
      evaluationData.scores.forEach(score => {
        scores[score.conduct_id] = {
          t1: score.t1_score,
          t2: score.t2_score,
          final: score.final_score,
        };
      });

      // Procesar archivos por conducta
      evaluationData.evidenceFiles.forEach(file => {
        if (!files[file.conduct_id]) {
          files[file.conduct_id] = [];
        }
        files[file.conduct_id].push({
          id: file.id.toString(),
          name: file.original_name,
          type: file.file_type,
          content: file.url || '',
        });
      });

      setEvaluation(prev => ({
        ...prev,
        workerId,
        evaluationId: evaluationData.evaluation.id,
        criteriaChecks,
        realEvidences,
        scores,
        files,
      }));
      
      console.log('Estado actualizado después de cargar evaluación:', {
        workerId,
        evaluationId: evaluationData.evaluation.id,
        filesCount: Object.keys(files).length,
        files
      });
    } catch (error) {
      console.error('Error al cargar evaluación:', error);
    } finally {
      setIsLoading(false);
    }
  }, [evaluation.period]);

  const setPeriod = useCallback(async (period: string) => {
    setEvaluation(prev => ({ ...prev, period }));
    
    // Recargar evaluación si hay un trabajador seleccionado
    if (evaluation.workerId) {
      await setWorkerId(evaluation.workerId);
    }
  }, [evaluation.workerId, setWorkerId]);

  const updateCriteriaCheck = useCallback(async (conductId: string, tramo: 't1' | 't2', criterionIndex: number, isChecked: boolean) => {
    if (!evaluation.evaluationId) return;

    console.log('updateCriteriaCheck called:', { conductId, tramo, criterionIndex, isChecked });

    try {
      // Actualizar el estado inmediatamente para UI responsiva
      setEvaluation(prev => {
        console.log('Updating state for:', conductId, 'tramo:', tramo, 'index:', criterionIndex, 'checked:', isChecked);
        
        // Obtener el estado actual de criterios para esta conducta
        const currentConductChecks = prev.criteriaChecks[conductId] || {
          t1: Array(t1Criteria.length).fill(false),
          t2: Array(t2Criteria.length).fill(false)
        };
        
        // Crear una copia profunda del estado
        const newCriteriaChecks = { ...prev.criteriaChecks };
        const newConductChecks = {
          t1: [...currentConductChecks.t1],
          t2: [...currentConductChecks.t2]
        };
        
        // Actualizar el criterio específico
        newConductChecks[tramo][criterionIndex] = isChecked;
        newCriteriaChecks[conductId] = newConductChecks;
        
        // Calcular nueva puntuación
        const newScore = calculateScores(newConductChecks);
        const newScores = {
          ...prev.scores,
          [conductId]: newScore
        };
        
        console.log('New state calculated:', { newConductChecks, newScore });
        
        return {
          ...prev,
          criteriaChecks: newCriteriaChecks,
          scores: newScores
        };
      });

      // Guardar en la API de forma asíncrona
      await apiService.saveCriteria(evaluation.evaluationId, {
        conductId,
        tramo,
        criterionIndex,
        isChecked,
      });

      // Guardar puntuación actualizada
      const currentConductChecks = evaluation.criteriaChecks[conductId];
      if (currentConductChecks) {
        const updatedConductChecks = {
          ...currentConductChecks,
          [tramo]: [
            ...currentConductChecks[tramo].slice(0, criterionIndex),
            isChecked,
            ...currentConductChecks[tramo].slice(criterionIndex + 1)
          ]
        };
        const newScore = calculateScores(updatedConductChecks);
        
        await apiService.saveScore(evaluation.evaluationId, {
          conductId,
          t1Score: newScore.t1,
          t2Score: newScore.t2,
          finalScore: newScore.final,
        });
      }
    } catch (error) {
      console.error('Error al guardar criterio:', error);
    }
  }, [evaluation.evaluationId, evaluation.criteriaChecks]);

  const updateRealEvidence = useCallback(async (conductId: string, text: string) => {
    if (!evaluation.evaluationId) return;

    try {
      await apiService.saveEvidence(evaluation.evaluationId, {
        conductId,
        evidenceText: text,
      });

      setEvaluation(prev => ({
        ...prev,
        realEvidences: {
          ...prev.realEvidences,
          [conductId]: text,
        },
      }));
    } catch (error) {
      console.error('Error al guardar evidencia:', error);
    }
  }, [evaluation.evaluationId]);

  const addFiles = useCallback(async ({ competencyId, conductId, fileCount, evaluationId, files }: {
    competencyId: string;
    conductId: string;
    fileCount: number;
    evaluationId: number | null;
    files: FileList;
  }) => {
    console.log('=== addFiles ENTER ===');
    console.log('addFiles called:', { competencyId, conductId, fileCount, evaluationId });
    
    // Verificar que tenemos un evaluationId válido (no null y no 0)
    if (!evaluationId || evaluationId === 0) {
      console.log('No hay evaluationId disponible');
      return;
    }

    console.log('Procesando archivos para:', { competencyId, conductId, evaluationId });

    try {
      // Subir archivos al servidor
      const uploadedFiles = await apiService.uploadFiles(evaluationId, files, competencyId, conductId);
      console.log('Archivos subidos al servidor:', uploadedFiles);

      // Actualizar el estado con los archivos reales
      setEvaluation(prev => {
        const currentFiles = prev.files[conductId] || [];
        
        // Convertir del formato de la API al formato interno
        const newFilesList = uploadedFiles.map(file => ({
          id: file.id.toString(),
          name: file.original_name,
          type: file.file_type,
          content: file.url || '',
        }));
        
        console.log('Actualizando estado con archivos:', {
          conductId,
          currentFiles: currentFiles.length,
          newFiles: newFilesList.length,
          totalFiles: currentFiles.length + newFilesList.length
        });
        
        return {
          ...prev,
          files: {
            ...prev.files,
            [conductId]: [...currentFiles, ...newFilesList]
          }
        };
      });

      console.log('Estado actualizado con archivos reales');
    } catch (error) {
      console.error('Error al subir archivos:', error);
      throw error;
    }
  }, []);
  
  const removeFile = useCallback(async (competencyId: string, conductId: string, fileIdToRemove: string) => {
    console.log('=== removeFile ENTER ===');
    console.log('removeFile called:', { competencyId, conductId, fileIdToRemove });
    
    try {
      await apiService.deleteFile(parseInt(fileIdToRemove));
      console.log('Archivo eliminado del servidor');
      
      setEvaluation(prev => {
        const conductFiles = prev.files[conductId] || [];
        const updatedFiles = conductFiles.filter(file => file.id !== fileIdToRemove);
        
        console.log('Actualizando estado después de eliminar:', {
          conductId,
          originalFiles: conductFiles.length,
          remainingFiles: updatedFiles.length
        });
        
        return {
          ...prev,
          files: {
            ...prev.files,
            [conductId]: updatedFiles,
          },
        };
      });
      
      console.log('Estado actualizado después de eliminar archivo');
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      throw error;
    }
  }, []);

  const addWorker = useCallback(async (name: string) => {
    try {
      const newWorker = {
        id: new Date().getTime().toString(),
        name,
      };
      
      await apiService.createWorker(newWorker);
      
      setEvaluation(prev => ({
        ...prev,
        workers: [...prev.workers, newWorker]
      }));
    } catch (error) {
      console.error('Error al crear trabajador:', error);
    }
  }, []);

  const saveEvaluation = useCallback(async () => {
    if (!evaluation.evaluationId) return;

    try {
      await apiService.updateEvaluation(evaluation.evaluationId);
      alert('Evaluación guardada exitosamente.');
    } catch (error) {
      console.error('Error al guardar evaluación:', error);
      alert('Error al guardar la evaluación.');
    }
  }, [evaluation.evaluationId]);

  return {
    evaluation,
    isLoading,
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
