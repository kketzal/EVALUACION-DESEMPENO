import { useState, useCallback, useEffect } from 'react';
import { EvaluationState, Score, Worker, CriteriaCheckState, EvidenceFile } from '../types';
import { competencies } from '../data/evaluationData';
import { t1Criteria, t1Criteria7Points, t2Criteria } from '../data/criteriaData';
import { apiService, EvaluationData, EvidenceFile as ApiEvidenceFile } from '../services/api';

const calculateScores = (checks: CriteriaCheckState, useT1SevenPoints: boolean = false): Score => {
    const t1CheckedCount = checks.t1.filter(Boolean).length;
    const t2CheckedCount = checks.t2.filter(Boolean).length;

    let t1Score: number | null = null;
    if (t1CheckedCount > 0) {
        // Siempre contar todos los criterios activos del TRAMO 1
        // El modo 7 puntos solo afecta la puntuación inicial, no el cálculo
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

// Leer openAccordions inicial de localStorage si existe
function getInitialOpenAccordions() {
  try {
    const stored = localStorage.getItem('openAccordions');
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

const getInitialState = (): EvaluationState => {
  const initialState = {
    workerId: null,
    period: "2023-2024",
    scores: {},
    criteriaChecks: {},
    realEvidences: {},
    files: {},
    workers: [],
    evaluationId: null,
    useT1SevenPoints: true, // Por defecto usar TRAMO 1 de 7 puntos
    autoSave: true, // Por defecto activar guardado automático
    openAccordions: getInitialOpenAccordions(), // Estado de accordions abiertos
    isSaving: false,
    lastSavedAt: null,
  };
  console.log('Initial state created:', initialState);
  return initialState;
};

export const getVisibleCompetencies = (workerGroup: 'GRUPO 1-2' | 'GRUPO 3-4' | null) => {
  if (!workerGroup) return competencies;
  // Para grupo 1-2: oculta A y E. Para grupo 3-4: oculta B y D
  return competencies.filter(comp => {
    if (workerGroup === 'GRUPO 1-2') {
      return !['A', 'E'].includes(comp.id);
    } else if (workerGroup === 'GRUPO 3-4') {
      return !['B', 'D'].includes(comp.id);
    }
    return true;
  });
};

// Función para limpiar archivos sin ID válido
const cleanInvalidFiles = (files: Record<string, EvidenceFile[]>): Record<string, EvidenceFile[]> => {
  const cleanedFiles: Record<string, EvidenceFile[]> = {};
  
  Object.entries(files).forEach(([conductId, fileList]) => {
    const validFiles = fileList.filter(file => {
      if (!file.id || file.id === 'undefined' || file.id === 'null' || file.id === '') {
        console.warn('Archivo sin ID válido encontrado y removido:', {
          conductId,
          file,
          fileName: file.name
        });
        return false;
      }
      return true;
    });
    
    if (validFiles.length > 0) {
      cleanedFiles[conductId] = validFiles;
    }
  });
  
  return cleanedFiles;
};

export const useEvaluationState = () => {
  const [evaluation, setEvaluation] = useState<EvaluationState>(getInitialState);
  const [isLoading, setIsLoading] = useState(false);
  const [workersLoaded, setWorkersLoaded] = useState(false);
  const [workerEvaluations, setWorkerEvaluations] = useState<any[]>([]);

  // LOG de depuración para cada llamada a setEvaluation
  const setEvaluationWithLog = (updater: (prev: EvaluationState) => EvaluationState) => {
    setEvaluation((prev: EvaluationState) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // Clon profundo de criteriaChecks para forzar re-render
      const deepClonedCriteriaChecks = JSON.parse(JSON.stringify(next.criteriaChecks));
      const nextWithClone = { ...next, criteriaChecks: deepClonedCriteriaChecks };
      console.log('setEvaluation called:', { prev, next: nextWithClone });
      return nextWithClone;
    });
  };

  // Cargar trabajadores al inicializar
  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = useCallback(async () => {
    try {
      console.log('Loading workers...');
      setIsLoading(true);
      const workers = await apiService.getWorkers();
      console.log('Workers loaded:', workers);
      setEvaluationWithLog(prev => ({
        ...prev,
        workers: workers // Guardar todos los campos
      }));
      setWorkersLoaded(true);
      console.log('Workers state updated');
    } catch (error) {
      console.error('Error al cargar trabajadores:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar evaluaciones históricas del trabajador seleccionado
  const loadWorkerEvaluations = useCallback(async (workerId: string) => {
    if (!workerId) {
      setWorkerEvaluations([]);
      return;
    }
    try {
      const evals = await apiService.getEvaluationsByWorker(workerId);
      setWorkerEvaluations(evals);
    } catch (error) {
      setWorkerEvaluations([]);
    }
  }, []);

  // Cargar evaluaciones cuando cambia el trabajador
  useEffect(() => {
    if (evaluation.workerId) {
      loadWorkerEvaluations(evaluation.workerId);
    } else {
      setWorkerEvaluations([]);
    }
  }, [evaluation.workerId, loadWorkerEvaluations]);

  const setWorkerId = useCallback(async (workerId: string | null, periodOverride?: string) => {
    if (!workersLoaded) {
      console.warn('Intento de cargar evaluación antes de que los trabajadores estén listos.');
      return;
    }
    if (!workerId) {
      setEvaluationWithLog(prev => ({
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
      const periodToUse = periodOverride ?? evaluation.period;
      const evaluationData = await apiService.getEvaluation(workerId, periodToUse);
      
      console.log('Datos recibidos de la API:', {
        evaluation: evaluationData.evaluation,
        criteriaChecksCount: evaluationData.criteriaChecks.length,
        realEvidenceCount: evaluationData.realEvidence.length,
        evidenceFilesCount: evaluationData.evidenceFiles.length,
        scoresCount: evaluationData.scores.length,
        evidenceFiles: evaluationData.evidenceFiles
      });
      
      // Convertir datos de la API al formato interno
      const criteriaChecks: Record<string, CriteriaCheckState> = {};
      const realEvidences: Record<string, string> = {};
      const scores: Record<string, Score> = {};
      const files: Record<string, EvidenceFile[]> = {};

      // Procesar criterios
      evaluationData.criteriaChecks.forEach(check => {
        if (!criteriaChecks[check.conduct_id]) {
          const t1CriteriaToUse = evaluation.useT1SevenPoints ? t1Criteria7Points : t1Criteria;
          criteriaChecks[check.conduct_id] = {
            t1: Array(t1CriteriaToUse.length).fill(null), // Usar null para distinguir no inicializado
            t2: Array(t2Criteria.length).fill(null),
          };
        }
        criteriaChecks[check.conduct_id][check.tramo as 't1' | 't2'][check.criterion_index] = !!check.is_checked;
      });

      // Rellenar criterios no guardados con valor por defecto (true)
      for (const competency of competencies) {
        for (const conduct of competency.conducts) {
          const t1CriteriaToUse = evaluation.useT1SevenPoints ? t1Criteria7Points : t1Criteria;
          if (!criteriaChecks[conduct.id]) {
            // Si no hay nada guardado, inicializar por defecto
            criteriaChecks[conduct.id] = {
              t1: evaluation.useT1SevenPoints ? [true, true, true, false] : Array(t1Criteria.length).fill(true),
              t2: Array(t2Criteria.length).fill(false),
            };
          } else {
            // Si hay parcialmente guardado, completar los nulls
            if (criteriaChecks[conduct.id].t1) {
              criteriaChecks[conduct.id].t1 = criteriaChecks[conduct.id].t1.map((v, idx) =>
                v === null || v === undefined
                  ? (evaluation.useT1SevenPoints
                      ? ([0, 1, 2].includes(idx) ? true : false)
                      : true)
                  : v
              );
            }
            if (criteriaChecks[conduct.id].t2) {
              criteriaChecks[conduct.id].t2 = criteriaChecks[conduct.id].t2.map(v =>
                v === null || v === undefined ? false : v
              );
            }
          }
        }
      }

      // Si no hay criterios guardados, inicializar con TRAMO 1 activado por defecto y calcular puntuación
      for (const competency of competencies) {
        for (const conduct of competency.conducts) {
          if (!criteriaChecks[conduct.id]) {
            if (evaluation.useT1SevenPoints) {
              criteriaChecks[conduct.id] = {
                t1: [true, true, true, false],
                t2: Array(t2Criteria.length).fill(false),
              };
            } else {
              criteriaChecks[conduct.id] = {
                t1: Array(t1Criteria.length).fill(true),
                t2: Array(t2Criteria.length).fill(false),
              };
            }
            // Calcular y guardar la puntuación inicial
            scores[conduct.id] = calculateScores(criteriaChecks[conduct.id], evaluation.useT1SevenPoints);
          } else {
            // Si ya hay criterios, también calcular la puntuación
            scores[conduct.id] = calculateScores(criteriaChecks[conduct.id], evaluation.useT1SevenPoints);
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
      console.log('Procesando archivos de evidencia:', evaluationData.evidenceFiles);
      evaluationData.evidenceFiles.forEach(file => {
        if (!files[file.conduct_id]) {
          files[file.conduct_id] = [];
        }
        const fileObject = {
          id: file.id.toString(),
          name: file.original_name,
          type: file.file_type || '',
          content: '',
          url: file.url || `/uploads/evidence/${file.name || file.original_name}`,
        };
        files[file.conduct_id].push(fileObject);
        console.log('Archivo agregado al estado:', { conductId: file.conduct_id, file: fileObject });
      });

      // Verificar que cada conducta tenga su array de archivos inicializado
      competencies.forEach(competency => {
        competency.conducts.forEach(conduct => {
          if (!files[conduct.id]) {
            files[conduct.id] = [];
          }
        });
      });

      // Limpiar archivos sin ID válido
      const cleanedFiles = cleanInvalidFiles(files);
      if (Object.keys(cleanedFiles).length !== Object.keys(files).length) {
        console.log('Archivos limpiados - archivos sin ID removidos');
      }

      console.log('Estado final de archivos:', cleanedFiles);
      console.log('Verificando archivos por conducta:');
      Object.keys(cleanedFiles).forEach(conductId => {
        console.log(`  ${conductId}: ${cleanedFiles[conductId].length} archivos`);
      });

      setEvaluationWithLog(prev => {
        const newState = {
          ...prev,
          workerId,
          evaluationId: evaluationData.evaluation.id,
          criteriaChecks,
          realEvidences,
          scores,
          files: cleanedFiles,
          period: periodToUse,
          useT1SevenPoints: Boolean(evaluationData.evaluation.useT1SevenPoints),
          autoSave: Boolean(evaluationData.evaluation.autoSave),
        };
        
        console.log('Estado actualizado después de cargar evaluación:', {
          workerId,
          evaluationId: evaluationData.evaluation.id,
          filesCount: Object.keys(cleanedFiles).length,
          files: cleanedFiles,
          newStateFiles: newState.files
        });
        
        return newState;
      });
    } catch (error) {
      console.error('Error al cargar evaluación:', error);
    } finally {
      setIsLoading(false);
    }
  }, [evaluation.period, evaluation.useT1SevenPoints, workersLoaded]);

  // Cargar una evaluación concreta por id
  const loadEvaluationById = useCallback(async (evaluationId: number) => {
    try {
      setIsLoading(true);
      const evaluationData = await apiService.getEvaluationById(evaluationId);
      // (Reutilizar la lógica de mapeo de datos de setWorkerId)
      const criteriaChecks: Record<string, CriteriaCheckState> = {};
      const realEvidences: Record<string, string> = {};
      const scores: Record<string, Score> = {};
      const files: Record<string, EvidenceFile[]> = {};
      evaluationData.criteriaChecks.forEach(check => {
        if (!criteriaChecks[check.conduct_id]) {
          const t1CriteriaToUse = evaluation.useT1SevenPoints ? t1Criteria7Points : t1Criteria;
          criteriaChecks[check.conduct_id] = {
            t1: Array(t1CriteriaToUse.length).fill(null),
            t2: Array(t2Criteria.length).fill(null),
          };
        }
        criteriaChecks[check.conduct_id][check.tramo as 't1' | 't2'][check.criterion_index] = !!check.is_checked;
      });
      for (const competency of competencies) {
        for (const conduct of competency.conducts) {
          const t1CriteriaToUse = evaluation.useT1SevenPoints ? t1Criteria7Points : t1Criteria;
          if (!criteriaChecks[conduct.id]) {
            criteriaChecks[conduct.id] = {
              t1: evaluation.useT1SevenPoints ? [true, true, true, false] : Array(t1Criteria.length).fill(true),
              t2: Array(t2Criteria.length).fill(false),
            };
          } else {
            if (criteriaChecks[conduct.id].t1) {
              criteriaChecks[conduct.id].t1 = criteriaChecks[conduct.id].t1.map((v, idx) =>
                v === null || v === undefined
                  ? (evaluation.useT1SevenPoints
                      ? ([0, 1, 2].includes(idx) ? true : false)
                      : true)
                  : v
              );
            }
            if (criteriaChecks[conduct.id].t2) {
              criteriaChecks[conduct.id].t2 = criteriaChecks[conduct.id].t2.map(v =>
                v === null || v === undefined ? false : v
              );
            }
          }
        }
      }
      evaluationData.realEvidence.forEach(evidence => {
        realEvidences[evidence.conduct_id] = evidence.evidence_text;
      });
      evaluationData.scores.forEach(score => {
        scores[score.conduct_id] = {
          t1: score.t1_score,
          t2: score.t2_score,
          final: score.final_score,
        };
      });
      evaluationData.evidenceFiles.forEach(file => {
        if (!files[file.conduct_id]) {
          files[file.conduct_id] = [];
        }
        const fileObject = {
          id: file.id.toString(),
          name: file.original_name,
          type: file.file_type || '',
          content: '',
          url: file.url || `/uploads/evidence/${file.name || file.original_name}`,
        };
        files[file.conduct_id].push(fileObject);
      });
      competencies.forEach(competency => {
        competency.conducts.forEach(conduct => {
          if (!files[conduct.id]) {
            files[conduct.id] = [];
          }
        });
      });
      const cleanedFiles = cleanInvalidFiles(files);
      setEvaluationWithLog(prev => {
        const newState = {
          ...prev,
          workerId: evaluationData.evaluation.worker_id,
          evaluationId: evaluationData.evaluation.id,
          criteriaChecks,
          realEvidences,
          scores,
          files: cleanedFiles,
          period: evaluationData.evaluation.period,
          useT1SevenPoints: Boolean(evaluationData.evaluation.useT1SevenPoints),
          autoSave: Boolean(evaluationData.evaluation.autoSave),
        };
        return newState;
      });
    } catch (error) {
      console.error('Error al cargar evaluación por id:', error);
    } finally {
      setIsLoading(false);
    }
  }, [evaluation.useT1SevenPoints]);

  const setPeriod = useCallback(async (period: string) => {
    setEvaluationWithLog(prev => ({ ...prev, period }));
    // Recargar evaluación si hay un trabajador seleccionado
    if (evaluation.workerId) {
      await setWorkerId(evaluation.workerId, period); // Usar el nuevo periodo
    }
  }, [evaluation.workerId, setWorkerId]);

  // Función para guardado automático
  const autoSaveEvaluation = useCallback(async () => {
    if (!evaluation.evaluationId || !evaluation.autoSave) return;

    try {
      await apiService.updateEvaluation(evaluation.evaluationId);
      
      // Actualizar estado con timestamp de guardado automático
      const now = new Date().toLocaleString('es-ES');
      setEvaluationWithLog(prev => ({
        ...prev,
        lastSavedAt: now
      }));

      console.log('Guardado automático realizado:', now);
    } catch (error) {
      console.error('Error en guardado automático:', error);
    }
  }, [evaluation.evaluationId, evaluation.autoSave]);

  const updateCriteriaCheck = useCallback(async (conductId: string, tramo: 't1' | 't2', criterionIndex: number, isChecked: boolean) => {
    if (!evaluation.evaluationId) return;
    console.log('updateCriteriaCheck called:', { conductId, tramo, criterionIndex, isChecked });
    setEvaluationWithLog(prev => {
      console.log('Antes de updateCriteriaCheck, criteriaChecks:', JSON.stringify(prev.criteriaChecks));
      // Obtener el estado actual de criterios para esta conducta
      const currentConductChecks = prev.criteriaChecks[conductId] || {
        t1: Array(evaluation.useT1SevenPoints ? t1Criteria7Points.length : t1Criteria.length).fill(false),
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
      const newScore = calculateScores(newConductChecks, evaluation.useT1SevenPoints);
      const newScores = {
        ...prev.scores,
        [conductId]: newScore
      };
      
      console.log('Después de updateCriteriaCheck, criteriaChecks:', JSON.stringify(newCriteriaChecks));
      
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
      const newScore = calculateScores(updatedConductChecks, evaluation.useT1SevenPoints);
      
      await apiService.saveScore(evaluation.evaluationId, {
        conductId,
        t1Score: newScore.t1,
        t2Score: newScore.t2,
        finalScore: newScore.final,
      });
    }

    // Guardado automático si está habilitado
    if (evaluation.autoSave) {
      await autoSaveEvaluation();
    }
  }, [evaluation.evaluationId, evaluation.criteriaChecks, evaluation.useT1SevenPoints, evaluation.autoSave, autoSaveEvaluation]);

  const updateRealEvidence = useCallback(async (conductId: string, text: string) => {
    if (!evaluation.evaluationId) return;

    try {
      await apiService.saveEvidence(evaluation.evaluationId, {
        conductId,
        evidenceText: text,
      });

      setEvaluationWithLog(prev => ({
        ...prev,
        realEvidences: {
          ...prev.realEvidences,
          [conductId]: text,
        },
      }));

      // Guardado automático si está habilitado
      if (evaluation.autoSave) {
        await autoSaveEvaluation();
      }
    } catch (error) {
      console.error('Error al guardar evidencia:', error);
    }
  }, [evaluation.evaluationId, evaluation.autoSave, autoSaveEvaluation]);

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
      setEvaluationWithLog(prev => {
        const currentFiles = prev.files[conductId] || [];
        
        // Convertir del formato de la API al formato interno
        const newFilesList = uploadedFiles.map((file: any) => ({
          id: file.id.toString(),
          name: file.original_name,
          type: file.file_type || '',
          content: '',
          url: file.url || `/uploads/evidence/${file.name || file.original_name}`,
        }));
        
        console.log('Actualizando estado con archivos:', {
          conductId,
          currentFiles: currentFiles.length,
          newFiles: newFilesList.length,
          totalFiles: currentFiles.length + newFilesList.length
        });
        
        const allFiles = [...currentFiles, ...newFilesList];
        const cleanedFiles = cleanInvalidFiles({ [conductId]: allFiles });
        
        return {
          ...prev,
          files: {
            ...prev.files,
            [conductId]: cleanedFiles[conductId] || []
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
      
      setEvaluationWithLog(prev => {
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

  const addWorker = useCallback(async (name: string, group: 'GRUPO 1-2' | 'GRUPO 3-4', password: string) => {
    try {
      const newWorker = {
        id: new Date().getTime().toString(),
        name,
        worker_group: group,
        password,
      };
      // Crear en backend y obtener el worker real (con ID real si lo asigna el backend)
      const created = await apiService.createWorker(newWorker);
      // Recargar lista de trabajadores
      await loadWorkers();
      // Devolver el ID real del trabajador creado
      return created.id;
    } catch (error) {
      console.error('Error al crear trabajador:', error);
      return null;
    }
  }, [loadWorkers]);

  const updateWorkerGroup = useCallback(async (workerId: string, group: 'GRUPO 1-2' | 'GRUPO 3-4') => {
    try {
      const updatedWorker = await apiService.updateWorkerGroup(workerId, group);
      
      setEvaluationWithLog(prev => ({
        ...prev,
        workers: prev.workers.map(w => 
          w.id === workerId ? { ...w, worker_group: group } : w
        )
      }));
    } catch (error) {
      console.error('Error al actualizar grupo del trabajador:', error);
    }
  }, [setEvaluationWithLog]);

  const saveEvaluation = useCallback(async () => {
    if (!evaluation.evaluationId) return;

    try {
      // Marcar como guardando
      setEvaluationWithLog(prev => ({
        ...prev,
        isSaving: true
      }));

      await apiService.updateEvaluation(evaluation.evaluationId);
      
      // Actualizar estado con timestamp de guardado
      const now = new Date().toLocaleString('es-ES');
      setEvaluationWithLog(prev => ({
        ...prev,
        isSaving: false,
        lastSavedAt: now
      }));

      // No mostrar alert de éxito - ya tenemos la notificación visual
    } catch (error) {
      console.error('Error al guardar evaluación:', error);
      
      // Resetear estado de guardado en caso de error
      setEvaluationWithLog(prev => ({
        ...prev,
        isSaving: false
      }));
      
      alert('Error al guardar la evaluación.');
    }
  }, [evaluation.evaluationId]);

  const setAutoSave = useCallback(async (autoSave: boolean) => {
    setEvaluationWithLog(prev => ({
      ...prev,
      autoSave
    }));

    // Guardar en la API el valor de autoSave si hay evaluación activa
    if (evaluation.evaluationId) {
      try {
        await apiService.updateEvaluationSettings(evaluation.evaluationId, { autoSave });
        console.log('Configuración de guardado automático actualizada en la base de datos');
      } catch (error) {
        console.error('Error al guardar configuración de autoSave:', error);
      }
    }
  }, [evaluation.evaluationId]);

  const toggleAccordion = useCallback((conductId: string, isOpen: boolean) => {
    setEvaluationWithLog(prev => ({
      ...prev,
      openAccordions: {
        ...prev.openAccordions,
        [conductId]: isOpen
      }
    }));
  }, []);

  const setUseT1SevenPoints = useCallback(async (useT1SevenPoints: boolean) => {
    console.log('Cambiando opción TRAMO 1 de 7 puntos:', useT1SevenPoints);
    setEvaluationWithLog(prev => {
      console.log('Antes de cambiar TRAMO 1, criteriaChecks:', JSON.stringify(prev.criteriaChecks));
      // Actualizar la opción
      const newState = {
        ...prev,
        useT1SevenPoints
      };

      // Si se activa la opción de 7 puntos, activar los tres primeros criterios y desactivar el cuarto de todas las conductas
      // Si se desactiva la opción de 7 puntos, activar todos los criterios del TRAMO 1
      const newCriteriaChecks: Record<string, CriteriaCheckState> = {};
      for (const competency of competencies) {
        for (const conduct of competency.conducts) {
          const currentChecks = prev.criteriaChecks[conduct.id];
          if (currentChecks) {
            if (useT1SevenPoints) {
              // Activar los tres primeros criterios, desactivar el cuarto
              newCriteriaChecks[conduct.id] = {
                t1: [true, true, true, false],
                t2: [...currentChecks.t2]
              };
            } else {
              // Activar todos los criterios del TRAMO 1
              newCriteriaChecks[conduct.id] = {
                t1: Array(t1Criteria.length).fill(true),
                t2: [...currentChecks.t2]
              };
            }
          } else {
            // Si no hay estado previo, inicializar según la opción
            if (useT1SevenPoints) {
              newCriteriaChecks[conduct.id] = {
                t1: [true, true, true, false],
                t2: Array(t2Criteria.length).fill(false)
              };
            } else {
              newCriteriaChecks[conduct.id] = {
                t1: Array(t1Criteria.length).fill(true),
                t2: Array(t2Criteria.length).fill(false)
              };
            }
          }
        }
      }

      // Recalcular todas las puntuaciones con la nueva configuración
      const newScores: Record<string, Score> = {};
      for (const competency of competencies) {
        for (const conduct of competency.conducts) {
          const conductChecks = newCriteriaChecks[conduct.id] || prev.criteriaChecks[conduct.id];
          if (conductChecks) {
            newScores[conduct.id] = calculateScores(conductChecks, useT1SevenPoints);
          }
        }
      }

      console.log('Después de cambiar TRAMO 1, criteriaChecks:', JSON.stringify(newCriteriaChecks));
      return {
        ...newState,
        criteriaChecks: newCriteriaChecks,
        scores: newScores
      };
    });

    // Guardar en la API el valor de useT1SevenPoints si hay evaluación activa
    if (evaluation.evaluationId) {
      try {
        await apiService.updateEvaluationSettings(evaluation.evaluationId, { useT1SevenPoints });
        console.log('Configuración de TRAMO 1 actualizada en la base de datos');
      } catch (error) {
        console.error('Error al guardar configuración:', error);
      }
    }
  }, [evaluation.evaluationId]);

  const updateWorker = useCallback(async (workerId: string, group: 'GRUPO 1-2' | 'GRUPO 3-4', name: string) => {
    try {
      const updatedWorker = await apiService.updateWorker(workerId, name, group);
      setEvaluationWithLog(prev => ({
        ...prev,
        workers: prev.workers.map(w =>
          w.id === workerId ? { ...w, name, worker_group: group } : w
        )
      }));
    } catch (error) {
      console.error('Error al actualizar trabajador:', error);
    }
  }, [setEvaluationWithLog]);

  // Nuevo método para guardar workerId y token juntos
  const setWorkerSession = useCallback(({ workerId, token }: { workerId: string | null, token: string | null }) => {
    if (workerId === null) {
      setEvaluation(getInitialState());
    } else {
      setEvaluationWithLog(prev => ({
        ...prev,
        workerId,
        token
      }));
    }
  }, []);

  // Guardar openAccordions en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem('openAccordions', JSON.stringify(evaluation.openAccordions));
  }, [evaluation.openAccordions]);

  // Recargar trabajadores cuando se cierra sesión (workerId pasa a null)
  useEffect(() => {
    if (evaluation.workerId === null) {
      loadWorkers();
    }
  }, [evaluation.workerId, loadWorkers]);

  return {
    evaluation,
    isLoading,
    setWorkerId,
    setWorkerSession,
    setPeriod,
    updateCriteriaCheck,
    updateRealEvidence,
    addFiles,
    removeFile,
    saveEvaluation,
    addWorker,
    updateWorkerGroup,
    setUseT1SevenPoints,
    setAutoSave,
    toggleAccordion,
    updateWorker,
    getVisibleCompetencies: () => {
      const worker = evaluation.workers.find(w => w.id === evaluation.workerId);
      return getVisibleCompetencies(worker?.worker_group || null);
    },
    setEvaluation,
    workerEvaluations, // <-- Exponer evaluaciones históricas
    loadWorkerEvaluations, // <-- Exponer función para recargar
    loadEvaluationById,
  };
};
