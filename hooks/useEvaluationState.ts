import { useState, useCallback, useEffect, useRef } from 'react';
import { EvaluationState as BaseEvaluationState, Score, Worker, CriteriaCheckState, EvidenceFile } from '../types';
import { competencies } from '../data/evaluationData';
import { t1Criteria, t1Criteria7Points, t2Criteria } from '../data/criteriaData';
import { apiService, EvaluationData, EvidenceFile as ApiEvidenceFile } from '../services/api';

export interface EvaluationState extends BaseEvaluationState {
  workerEvaluations: any[];
}

const calculateScores = (checks: CriteriaCheckState, useT1SevenPoints: boolean = false): Score => {
    const t1CheckedCount = checks.t1.filter(Boolean).length;
    const t2CheckedCount = checks.t2.filter(Boolean).length;

    let t1Score: number | null = null;
    if (t1CheckedCount > 0) {
        if (useT1SevenPoints) {
            // En modo 7 puntos, la puntuación mínima es 7
            t1Score = 6 + t1CheckedCount;
        } else {
            // En modo normal, la puntuación mínima es 5
            t1Score = 4 + t1CheckedCount;
        }
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

const getInitialState = (defaultT1SevenPoints: boolean = true): EvaluationState => {
  const initialState = {
    workerId: null,
    period: "2023-2024",
    scores: {},
    criteriaChecks: {},
    realEvidences: {},
    files: {},
    workers: [],
    evaluationId: null,
    useT1SevenPoints: defaultT1SevenPoints, // Por defecto usar TRAMO 1 de 7 puntos
    autoSave: true, // Por defecto activar guardado automático
    openAccordions: getInitialOpenAccordions(), // Estado de accordions abiertos
    isSaving: false,
    lastSavedAt: null,
    lastSavedAtFull: null,
    version: null,
    workerEvaluations: [],
    hasUnsavedChanges: false, // Nuevo estado para trackear cambios
    originalEvaluationSnapshot: null, // Snapshot de la evaluación original
    versionAlreadyIncremented: false, // Evitar múltiples incrementos en la misma sesión
    originalVersionId: null, // ID de la versión original de la que viene
    versionFlow: '', // Flujo de versiones: "v1 -> v5", "v5 -> v6", etc.
  };
  console.log('Initial state created:', initialState);
  return initialState;
};

export { getInitialState };
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

export const useEvaluationState = (defaultT1SevenPoints: boolean = true) => {
  const [evaluation, setEvaluation] = useState<EvaluationState>(getInitialState(defaultT1SevenPoints));
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEvaluations, setIsLoadingEvaluations] = useState(false);
  const [workersLoaded, setWorkersLoaded] = useState(false);
  const [workerEvaluations, setWorkerEvaluations] = useState<any[]>([]);
  // Ref para almacenar el timeout de debounce
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // LOG de depuración para cada llamada a setEvaluation
  const setEvaluationWithLog = (updater: (prev: EvaluationState) => EvaluationState) => {
    setEvaluation((prev: EvaluationState) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // Clon profundo de criteriaChecks para forzar re-render
      const deepClonedCriteriaChecks = JSON.parse(JSON.stringify(next.criteriaChecks));
      const nextWithClone = { ...next, criteriaChecks: deepClonedCriteriaChecks };
      console.log('setEvaluation called:', { 
        workerId: nextWithClone.workerId,
        evaluationId: nextWithClone.evaluationId,
        isNewEvaluation: nextWithClone.isNewEvaluation,
        workerEvaluationsLength: nextWithClone.workerEvaluations.length,
        workerEvaluationsIds: nextWithClone.workerEvaluations.map(e => e.id),
        lastSavedAt: nextWithClone.lastSavedAt
      });
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
    console.log('=== loadWorkerEvaluations ENTER ===');
    console.log('loadWorkerEvaluations llamado con workerId:', workerId);
    if (!workerId) {
      console.log('No hay workerId, limpiando evaluaciones');
      setWorkerEvaluations([]);
      // También limpiar el estado global
      setEvaluationWithLog(prev => ({
        ...prev,
        workerEvaluations: []
      }));
      return;
    }
    try {
      setIsLoadingEvaluations(true);
      console.log('Cargando evaluaciones del trabajador desde API...');
      const evals = await apiService.getEvaluationsByWorker(workerId);
      console.log('Evaluaciones cargadas desde API:', evals);
      console.log('Número de evaluaciones encontradas:', evals.length);
      setWorkerEvaluations(evals);
      // Sincronizar con el estado global
      setEvaluationWithLog(prev => ({
        ...prev,
        workerEvaluations: evals
      }));
      console.log('Estado workerEvaluations actualizado con:', {
        count: evals.length,
        ids: evals.map(e => e.id),
        periods: evals.map(e => e.period)
      });
    } catch (error) {
      console.error('Error al cargar evaluaciones del trabajador:', error);
      setWorkerEvaluations([]);
      // También limpiar el estado global en caso de error
      setEvaluationWithLog(prev => ({
        ...prev,
        workerEvaluations: []
      }));
    } finally {
      setIsLoadingEvaluations(false);
      console.log('=== loadWorkerEvaluations EXIT ===');
    }
  }, []);

  // Cargar evaluaciones cuando cambia el trabajador
  useEffect(() => {
    console.log('useEffect para cargar evaluaciones - Estado actual:', {
      workerId: evaluation.workerId,
      period: evaluation.period,
      workerEvaluationsLength: evaluation.workerEvaluations.length
    });
    
    // Limpiar timeout anterior si existe
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Solo recargar evaluaciones si hay workerId y periodo definido (no usar el periodo por defecto si hay uno seleccionado)
    if (evaluation.workerId && evaluation.period) {
      console.log('Programando carga de evaluaciones para workerId:', evaluation.workerId);
      // Usar un timeout para evitar múltiples llamadas simultáneas
      debounceTimeoutRef.current = setTimeout(() => {
        if (evaluation.workerId) { // Verificar nuevamente que no sea null
          console.log('Ejecutando carga de evaluaciones para workerId:', evaluation.workerId);
          loadWorkerEvaluations(evaluation.workerId);
        }
      }, 150); // Aumentar el delay para mayor estabilidad
    } else {
      console.log('Limpiando evaluaciones - no hay workerId o period');
      setWorkerEvaluations([]);
      // También limpiar el estado global
      setEvaluationWithLog(prev => ({
        ...prev,
        workerEvaluations: []
      }));
    }
    
    // Cleanup function
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [evaluation.workerId, evaluation.period, loadWorkerEvaluations]);

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
      // Si se pasa un periodoOverride, úsalo SIEMPRE (aunque evaluation.period tenga valor por defecto)
      const periodToUse = periodOverride !== undefined ? periodOverride : evaluation.period;
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

      // Procesar criterios guardados en la base de datos
      evaluationData.criteriaChecks.forEach(check => {
        if (!criteriaChecks[check.conduct_id]) {
          const t1CriteriaToUse = evaluation.useT1SevenPoints ? t1Criteria7Points : t1Criteria;
          criteriaChecks[check.conduct_id] = {
            t1: Array(t1CriteriaToUse.length).fill(false),
            t2: Array(t2Criteria.length).fill(false),
          };
        }
        criteriaChecks[check.conduct_id][check.tramo as 't1' | 't2'][check.criterion_index] = !!check.is_checked;
      });

      // Inicializar criterios para todas las conductas que no tengan datos guardados
      for (const competency of competencies) {
        for (const conduct of competency.conducts) {
          const t1CriteriaToUse = evaluation.useT1SevenPoints ? t1Criteria7Points : t1Criteria;
          if (!criteriaChecks[conduct.id]) {
            // Si no hay datos guardados, inicializar todo a false
            criteriaChecks[conduct.id] = {
              t1: Array(t1CriteriaToUse.length).fill(false),
              t2: Array(t2Criteria.length).fill(false),
            };
          } else {
            // Si hay datos parciales, completar solo con false
            const currentT1 = criteriaChecks[conduct.id].t1 || [];
            const currentT2 = criteriaChecks[conduct.id].t2 || [];
            criteriaChecks[conduct.id].t1 = Array(t1CriteriaToUse.length).fill(false).map((_, idx) => {
              if (idx < currentT1.length && currentT1[idx] !== null && currentT1[idx] !== undefined) {
                return currentT1[idx];
              }
              return false;
            });
            criteriaChecks[conduct.id].t2 = Array(t2Criteria.length).fill(false).map((_, idx) => {
              return idx < currentT2.length && currentT2[idx] !== null && currentT2[idx] !== undefined 
                ? currentT2[idx] 
                : false;
            });
          }
          // Calcular puntuación para esta conducta
          scores[conduct.id] = calculateScores(criteriaChecks[conduct.id], evaluation.useT1SevenPoints);
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
        const conductKey = String(file.conduct_id).toUpperCase();
        if (!files[conductKey]) {
          files[conductKey] = [];
        }
        const fileObject: EvidenceFile & { file_name: string } = {
          id: file.id.toString(),
          name: file.original_name,
          type: file.file_type || '',
          content: '',
          url: file.url || `/api/files/${file.file_name || file.original_name}`,
          file_name: file.file_name || '',
          file_size: file.file_size || 0,
        };
        files[conductKey].push(fileObject);
        console.log('Archivo agregado al estado:', { conductId: file.conduct_id, conductKey, file: fileObject });
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
        // Detectar si la evaluación es nueva
        const isNew = (evaluationData.evaluation as any).is_new || false;
        const hasUpdatedAt = !!evaluationData.evaluation.updated_at;
        const hasBackendData = evaluationData.criteriaChecks.length > 0 || evaluationData.realEvidence.length > 0 || evaluationData.evidenceFiles.length > 0;
        
        console.log('setWorkerId - Detección de evaluación nueva:', {
          evaluationId: evaluationData.evaluation.id,
          isNew,
          hasUpdatedAt,
          updatedAt: evaluationData.evaluation.updated_at,
          backendCriteriaChecks: evaluationData.criteriaChecks.length,
          backendRealEvidence: evaluationData.realEvidence.length,
          backendEvidenceFiles: evaluationData.evidenceFiles.length,
          hasBackendData
        });
        
        // Una evaluación es nueva si NO tiene updated_at y NO tiene datos en el backend
        const isActuallyNew = !hasUpdatedAt && !hasBackendData;
        
        console.log('setWorkerId - Evaluación realmente nueva:', {
          isNew,
          hasUpdatedAt,
          isActuallyNew
        });
        
        const newState = {
          ...prev,
          workerId,
          evaluationId: evaluationData.evaluation.id,
          criteriaChecks,
          realEvidences,
          scores,
          files: cleanedFiles,
          period: periodToUse,
          useT1SevenPoints: isActuallyNew
            ? defaultT1SevenPoints
            : (evaluationData.evaluation.useT1SevenPoints === null || evaluationData.evaluation.useT1SevenPoints === undefined
                ? defaultT1SevenPoints
                : Boolean(evaluationData.evaluation.useT1SevenPoints)),
          autoSave: isActuallyNew ? prev.autoSave : Boolean(evaluationData.evaluation.autoSave),
          openAccordions: isActuallyNew ? {} : prev.openAccordions,
          lastSavedAt: isActuallyNew ? null : (evaluationData.evaluation.updated_at ? new Date(evaluationData.evaluation.updated_at).toLocaleDateString('es-ES') : null),
          lastSavedAtFull: isActuallyNew ? null : (evaluationData.evaluation.updated_at ? new Date(evaluationData.evaluation.updated_at).toLocaleString('es-ES') : null),
          version: evaluationData.evaluation.version || null,
          isNewEvaluation: isActuallyNew,
        };
        
        console.log('Estado actualizado después de cargar evaluación:', {
          workerId,
          evaluationId: evaluationData.evaluation.id,
          filesCount: Object.keys(cleanedFiles).length,
          files: cleanedFiles,
          newStateFiles: newState.files,
          lastSavedAt: newState.lastSavedAt,
          version: newState.version,
          isActuallyNew
        });
        
        return newState;
      });
    } catch (error: any) {
      console.error('Error al cargar evaluación:', error);
      
      // Si es un error 404 (no existe evaluación), lanzar un error específico
      if (error.status === 404) {
        // Inicializar estado de evaluación nueva en frontend con el periodo seleccionado (sin fallback)
        // Inicializar criteriaChecks y scores para todas las conductas según TRAMO 1
        const criteriaChecks: Record<string, CriteriaCheckState> = {};
        const scores: Record<string, Score> = {};
        const useT1Seven = defaultT1SevenPoints;
        const t1CriteriaToUse = useT1Seven ? t1Criteria7Points : t1Criteria;
        for (const competency of competencies) {
          for (const conduct of competency.conducts) {
            criteriaChecks[conduct.id] = {
              t1: useT1Seven ? [true, true, true, false] : Array(t1Criteria.length).fill(true),
              t2: Array(t2Criteria.length).fill(false),
            };
            scores[conduct.id] = calculateScores(criteriaChecks[conduct.id], useT1Seven);
          }
        }
        setEvaluationWithLog(prev => ({
          ...prev,
          workerId,
          evaluationId: null,
          period: periodOverride !== undefined ? periodOverride : evaluation.period,
          scores,
          criteriaChecks,
          realEvidences: {},
          files: {},
          isNewEvaluation: true,
          lastSavedAt: null,
          lastSavedAtFull: null,
          version: null,
          useT1SevenPoints: defaultT1SevenPoints,
          openAccordions: {},
        }));
        // Actualizar localStorage para reflejar el periodo seleccionado
        try {
          if (workerId && (periodOverride !== undefined ? periodOverride : evaluation.period)) {
            localStorage.setItem('userEvaluation', JSON.stringify({ workerId, period: periodOverride !== undefined ? periodOverride : evaluation.period, evaluationId: null }));
          }
        } catch {}
        return;
      }
      
      // Para otros errores, mantener el comportamiento actual
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [evaluation.period, evaluation.useT1SevenPoints, workersLoaded, defaultT1SevenPoints]);

  // Cargar una evaluación concreta por id
  const loadEvaluationById = useCallback(async (evaluationId: number) => {
    try {
      setIsLoading(true);
      console.log('loadEvaluationById - Iniciando carga de evaluación:', evaluationId);
      
      const evaluationData = await apiService.getEvaluationById(evaluationId);
      console.log('loadEvaluationById - Datos recibidos del backend:', {
        evaluation: evaluationData.evaluation,
        criteriaChecksCount: evaluationData.criteriaChecks?.length || 0,
        realEvidenceCount: evaluationData.realEvidence?.length || 0,
        evidenceFilesCount: evaluationData.evidenceFiles?.length || 0,
        scoresCount: evaluationData.scores?.length || 0
      });
      
      // (Reutilizar la lógica de mapeo de datos de setWorkerId)
      const criteriaChecks: Record<string, CriteriaCheckState> = {};
      const realEvidences: Record<string, string> = {};
      const scores: Record<string, Score> = {};
      const files: Record<string, EvidenceFile[]> = {};
      evaluationData.criteriaChecks.forEach(check => {
        if (!criteriaChecks[check.conduct_id]) {
          const t1CriteriaToUse = evaluation.useT1SevenPoints ? t1Criteria7Points : t1Criteria;
          criteriaChecks[check.conduct_id] = {
            t1: Array(t1CriteriaToUse.length).fill(false),
            t2: Array(t2Criteria.length).fill(false),
          };
        }
        criteriaChecks[check.conduct_id][check.tramo as 't1' | 't2'][check.criterion_index] = !!check.is_checked;
      });
      
      // Inicializar criterios para todas las conductas
      for (const competency of competencies) {
        for (const conduct of competency.conducts) {
          const t1CriteriaToUse = evaluation.useT1SevenPoints ? t1Criteria7Points : t1Criteria;
          
          if (!criteriaChecks[conduct.id]) {
            // Si no hay datos guardados, inicializar todo a false
            criteriaChecks[conduct.id] = {
              t1: Array(t1CriteriaToUse.length).fill(false),
              t2: Array(t2Criteria.length).fill(false),
            };
          } else {
            // Si hay datos parciales, completar solo con false
            const currentT1 = criteriaChecks[conduct.id].t1 || [];
            const currentT2 = criteriaChecks[conduct.id].t2 || [];
            criteriaChecks[conduct.id].t1 = Array(t1CriteriaToUse.length).fill(false).map((_, idx) => {
              if (idx < currentT1.length && currentT1[idx] !== null && currentT1[idx] !== undefined) {
                return currentT1[idx];
              }
              return false;
            });
            criteriaChecks[conduct.id].t2 = Array(t2Criteria.length).fill(false).map((_, idx) => {
              return idx < currentT2.length && currentT2[idx] !== null && currentT2[idx] !== undefined 
                ? currentT2[idx] 
                : false;
            });
          }
          
          // Calcular puntuación para esta conducta
          scores[conduct.id] = calculateScores(criteriaChecks[conduct.id], evaluation.useT1SevenPoints);
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
        const fileObject: EvidenceFile & { file_name: string } = {
          id: file.id.toString(),
          name: file.original_name,
          type: file.file_type || '',
          content: '',
          url: file.url || `/api/files/${file.file_name || file.original_name}`,
          file_name: file.file_name || '',
          file_size: file.file_size || 0,
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
        // Detectar si la evaluación es nueva
        const isNew = (evaluationData.evaluation as any).is_new || false;
        const hasUpdatedAt = !!evaluationData.evaluation.updated_at;
        const hasBackendData = evaluationData.criteriaChecks.length > 0 || evaluationData.realEvidence.length > 0 || evaluationData.evidenceFiles.length > 0;
        
        console.log('loadEvaluationById - Detección de evaluación nueva:', {
          evaluationId: evaluationData.evaluation.id,
          isNew,
          hasUpdatedAt,
          updatedAt: evaluationData.evaluation.updated_at,
          backendCriteriaChecks: evaluationData.criteriaChecks.length,
          backendRealEvidence: evaluationData.realEvidence.length,
          backendEvidenceFiles: evaluationData.evidenceFiles.length,
          hasBackendData
        });
        
        // Una evaluación es nueva si NO tiene updated_at y NO tiene datos en el backend
        const isActuallyNew = !hasUpdatedAt && !hasBackendData;
        
        console.log('loadEvaluationById - Evaluación realmente nueva:', {
          isNew,
          hasUpdatedAt,
          isActuallyNew
        });
        
        const lastSavedAt = isActuallyNew ? null : (evaluationData.evaluation.updated_at ? new Date(evaluationData.evaluation.updated_at).toLocaleString('es-ES', { 
          timeZone: 'Europe/Madrid',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }) : null);
        const lastSavedAtFull = isActuallyNew ? null : (evaluationData.evaluation.updated_at ? new Date(evaluationData.evaluation.updated_at).toLocaleString('es-ES', {
          timeZone: 'Europe/Madrid',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) : null);
        
        console.log('🔍 Timestamps calculados:', {
          updated_at: evaluationData.evaluation.updated_at,
          lastSavedAt,
          lastSavedAtFull,
          isActuallyNew
        });
        
        const newState = {
          ...prev,
          workerId: evaluationData.evaluation.worker_id,
          evaluationId: evaluationData.evaluation.id,
          criteriaChecks,
          realEvidences,
          scores,
          files: cleanedFiles,
          period: evaluationData.evaluation.period,
          useT1SevenPoints: isActuallyNew ? defaultT1SevenPoints : Boolean(evaluationData.evaluation.useT1SevenPoints),
          autoSave: isActuallyNew ? prev.autoSave : Boolean(evaluationData.evaluation.autoSave),
          lastSavedAt,
          lastSavedAtFull,
          version: evaluationData.evaluation.version || null,
          isNewEvaluation: isActuallyNew,
          // Crear snapshot de la evaluación original para detectar cambios
          originalEvaluationSnapshot: isActuallyNew ? null : {
            criteriaChecks,
            realEvidences,
            scores,
            files: cleanedFiles
          },
          hasUnsavedChanges: false,
          // Resetear estado de versiones al cargar una evaluación diferente
          versionAlreadyIncremented: false,
          originalVersionId: null,
          versionFlow: '',
        };
        
        console.log('loadEvaluationById - Estado final:', {
          lastSavedAt: newState.lastSavedAt,
          lastSavedAtFull: newState.lastSavedAtFull,
          isNewEvaluation: newState.isNewEvaluation,
          version: newState.version
        });
        
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
    if (!evaluation.autoSave) return;

    // Si no hay evaluationId, no podemos hacer guardado automático
    if (!evaluation.evaluationId) {
      console.log('No hay evaluationId para guardado automático');
      return;
    }

    try {
      await apiService.updateEvaluation(evaluation.evaluationId);
      
      // Actualizar estado con timestamp de guardado automático
      const now = new Date().toLocaleString('es-ES', {
        timeZone: 'Europe/Madrid',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      const nowFull = new Date().toLocaleString('es-ES', {
        timeZone: 'Europe/Madrid',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setEvaluationWithLog(prev => ({
        ...prev,
        lastSavedAt: now,
        lastSavedAtFull: nowFull,
        isNewEvaluation: false // Marcar como no nueva después del primer guardado
      }));

      console.log('Guardado automático realizado:', now);
    } catch (error) {
      console.error('Error en guardado automático:', error);
    }
  }, [evaluation.evaluationId, evaluation.autoSave]);

  const updateCriteriaCheck = useCallback(async (conductId: string, tramo: 't1' | 't2', criterionIndex: number, isChecked: boolean) => {
    let evalId = evaluation.evaluationId;
    let usedPeriod = evaluation.period;
    if (!evalId) {
      if (!evaluation.workerId || !evaluation.period) {
        throw new Error('No hay workerId o periodo definido para crear la evaluación');
      }
      // Crear evaluación en la base de datos usando SIEMPRE el periodo actual del estado
      const created = await apiService.createEvaluation(evaluation.workerId, evaluation.period);
      evalId = created.id;
      usedPeriod = created.period;
      setEvaluationWithLog(prev => ({ 
        ...prev, 
        evaluationId: evalId, 
        isNewEvaluation: true, 
        lastSavedAt: null,
        lastSavedAtFull: null,
        period: usedPeriod 
      }));
      
      // Recargar la lista de evaluaciones del trabajador para que aparezca en la página de gestión
      if (evaluation.workerId) {
        console.log('Recargando evaluaciones después de crear evaluación nueva para workerId:', evaluation.workerId);
        await loadWorkerEvaluations(evaluation.workerId);
        console.log('Evaluaciones recargadas después de crear evaluación nueva');
      }
      
      // Guardar automáticamente todos los toggles activados del TRAMO 1 para la nueva evaluación
      const currentCriteriaChecks = evaluation.criteriaChecks;
      await saveAllActiveT1Toggles(evalId, currentCriteriaChecks);
    } else {
      // Verificar si necesitamos crear una nueva versión
      const newEvalId = await createNewVersionIfNeeded();
      if (newEvalId) {
        evalId = newEvalId;
      }
    }

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
      
      const newState = {
        ...prev,
        criteriaChecks: newCriteriaChecks,
        scores: newScores
      };

      // Detectar cambios
      const hasChanges = detectChanges(newState);
      if (hasChanges) {
        newState.hasUnsavedChanges = true;
      }

      return newState;
    });

    // Guardar en la API de forma asíncrona
    const updatedEval = await apiService.saveCriteria(evalId, {
      conductId,
      tramo,
      criterionIndex,
      isChecked,
    });

    // Actualizar el estado con la evaluación devuelta
    setEvaluationWithLog(prev => ({
      ...prev,
      ...updatedEval.evaluation,
      criteriaChecks: arrayToCriteriaChecksObj(updatedEval.criteriaChecks),
      realEvidences: arrayToRealEvidencesObj(updatedEval.realEvidence),
      files: arrayToEvidenceFilesObj(updatedEval.evidenceFiles),
      scores: arrayToScoresObj(updatedEval.scores),
      version: updatedEval.evaluation.version ?? null,
      lastSavedAt: updatedEval.evaluation.updated_at ?? null,
      lastSavedAtFull: updatedEval.evaluation.updated_at ?? null,
      isNewEvaluation: false
    }));

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
      
      await apiService.saveScore(evalId, {
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
  }, [evaluation.evaluationId, evaluation.criteriaChecks, evaluation.useT1SevenPoints, evaluation.autoSave, autoSaveEvaluation, evaluation.workerId, evaluation.period]);

  // Función para guardar automáticamente todos los toggles activados del TRAMO 1
  const saveAllActiveT1Toggles = useCallback(async (evalId: number, criteriaChecks: Record<string, CriteriaCheckState>) => {
    console.log('Guardando todos los toggles activados del TRAMO 1...');
    
    for (const competency of competencies) {
      for (const conduct of competency.conducts) {
        const conductChecks = criteriaChecks[conduct.id];
        if (conductChecks && conductChecks.t1) {
          // Guardar todos los toggles activados del TRAMO 1
          for (let i = 0; i < conductChecks.t1.length; i++) {
            if (conductChecks.t1[i]) {
              try {
                await apiService.saveCriteria(evalId, {
                  conductId: conduct.id,
                  tramo: 't1',
                  criterionIndex: i,
                  isChecked: true,
                });
                console.log(`Guardado toggle TRAMO 1 activado: ${conduct.id}, criterio ${i}`);
              } catch (error) {
                console.error(`Error al guardar toggle TRAMO 1: ${conduct.id}, criterio ${i}`, error);
              }
            }
          }
        }
      }
    }
  }, []);

  const updateRealEvidence = useCallback(async (conductId: string, text: string) => {
    let evalId = evaluation.evaluationId;
    let usedPeriod = evaluation.period;
    if (!evalId) {
      if (!evaluation.workerId || !evaluation.period) {
        throw new Error('No hay workerId o periodo definido para crear la evaluación');
      }
      // Crear evaluación en la base de datos usando SIEMPRE el periodo actual del estado
      const created = await apiService.createEvaluation(evaluation.workerId, evaluation.period);
      evalId = created.id;
      usedPeriod = created.period;
      setEvaluationWithLog(prev => ({ 
        ...prev, 
        evaluationId: evalId, 
        isNewEvaluation: true, 
        lastSavedAt: null,
        lastSavedAtFull: null,
        period: usedPeriod 
      }));
      
      // Recargar la lista de evaluaciones del trabajador para que aparezca en la página de gestión
      if (evaluation.workerId) {
        console.log('Recargando evaluaciones después de crear evaluación nueva para workerId:', evaluation.workerId);
        await loadWorkerEvaluations(evaluation.workerId);
        console.log('Evaluaciones recargadas después de crear evaluación nueva');
      }
    } else {
      // Verificar si necesitamos crear una nueva versión
      const newEvalId = await createNewVersionIfNeeded();
      if (newEvalId) {
        evalId = newEvalId;
      }
    }

    try {
      await apiService.saveEvidence(evalId, {
        conductId,
        evidenceText: text,
      });

      setEvaluationWithLog(prev => {
        const newState = {
          ...prev,
          realEvidences: {
            ...prev.realEvidences,
            [conductId]: text,
          },
        };

        // Detectar cambios
        const hasChanges = detectChanges(newState);
        if (hasChanges) {
          newState.hasUnsavedChanges = true;
        }

        return newState;
      });

      // Guardado automático si está habilitado
      if (evaluation.autoSave) {
        await autoSaveEvaluation();
      }
    } catch (error) {
      console.error('Error al guardar evidencia:', error);
    }
  }, [evaluation.evaluationId, evaluation.autoSave, autoSaveEvaluation, evaluation.workerId, evaluation.period]);

  const addFiles = useCallback(async ({ competencyId, conductId, fileCount, evaluationId, files }: {
    competencyId: string;
    conductId: string;
    fileCount: number;
    evaluationId: number | null;
    files: FileList | File[];
  }) => {
    let evalId = evaluationId;
    let usedPeriod = evaluation.period;
    if (!evalId || evalId === 0) {
      if (!evaluation.workerId || !evaluation.period) {
        throw new Error('No hay workerId o periodo definido para crear la evaluación');
      }
      // Crear evaluación en la base de datos usando SIEMPRE el periodo actual del estado
      const created = await apiService.createEvaluation(evaluation.workerId, evaluation.period);
      evalId = created.id;
      usedPeriod = created.period;
      setEvaluationWithLog(prev => ({ 
        ...prev, 
        evaluationId: evalId, 
        isNewEvaluation: true, 
        lastSavedAt: null,
        lastSavedAtFull: null,
        period: usedPeriod 
      }));
      
      // Recargar la lista de evaluaciones del trabajador para que aparezca en la página de gestión
      if (evaluation.workerId) {
        console.log('Recargando evaluaciones después de crear evaluación nueva para workerId:', evaluation.workerId);
        await loadWorkerEvaluations(evaluation.workerId);
        console.log('Evaluaciones recargadas después de crear evaluación nueva');
      }
    } else {
      // Verificar si necesitamos crear una nueva versión
      // Para archivos, verificamos si la evaluación ya tiene contenido (criterios, evidencias, archivos, etc.)
      const hasExistingContent = 
        Object.keys(evaluation.criteriaChecks).length > 0 ||
        Object.keys(evaluation.realEvidences).length > 0 ||
        Object.keys(evaluation.files).length > 0 ||
        evaluation.hasUnsavedChanges;
      
      if (hasExistingContent) {
        console.log('🔄 Evaluación con contenido existente detectada, verificando si necesita nueva versión');
        const newEvalId = await createNewVersionIfNeeded();
        if (newEvalId) {
          evalId = newEvalId;
        }
      }
    }

    console.log('Procesando archivos para:', { competencyId, conductId, evaluationId: evalId });

    try {
      // Subir archivos al servidor
      const uploadedFiles = await apiService.uploadFiles(evalId, files, competencyId, conductId);
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
          url: file.url || `/api/files/${file.file_name || file.original_name}`,
          file_name: file.file_name || '',
          file_size: file.file_size || 0,
        }) as EvidenceFile & { file_name: string });
        
        console.log('Actualizando estado con archivos:', {
          conductId,
          currentFiles: currentFiles.length,
          newFiles: newFilesList.length,
          totalFiles: currentFiles.length + newFilesList.length
        });
        
        const allFiles = [...currentFiles, ...newFilesList];
        const cleanedFiles = cleanInvalidFiles({ [conductId]: allFiles });
        
        const newState = {
          ...prev,
          files: {
            ...prev.files,
            [conductId]: cleanedFiles[conductId] || []
          }
        };

        // Detectar cambios
        const hasChanges = detectChanges(newState);
        if (hasChanges) {
          newState.hasUnsavedChanges = true;
        }

        return newState;
      });

      console.log('Estado actualizado con archivos reales');
    } catch (error) {
      console.error('Error al subir archivos:', error);
      throw error;
    }
  }, [evaluation.evaluationId, evaluation.workerId, evaluation.period]);
  
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
        
        const newState = {
          ...prev,
          files: {
            ...prev.files,
            [conductId]: updatedFiles,
          },
        };

        // Detectar cambios
        const hasChanges = detectChanges(newState);
        if (hasChanges) {
          newState.hasUnsavedChanges = true;
        }

        return newState;
      });
      
      console.log('Estado actualizado después de eliminar archivo');
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      throw error;
    }
  }, []);

  const removeAllFilesFromConduct = useCallback(async (competencyId: string, conductId: string) => {
    console.log('=== removeAllFilesFromConduct ENTER ===');
    console.log('removeAllFilesFromConduct called:', { competencyId, conductId });
    
    if (!evaluation.evaluationId) {
      throw new Error('No hay evaluación activa');
    }
    
    try {
      const result = await apiService.deleteAllFilesFromConduct(evaluation.evaluationId, conductId);
      console.log('Archivos eliminados del servidor:', result);
      
      setEvaluationWithLog(prev => {
        const newState = {
          ...prev,
          files: {
            ...prev.files,
            [conductId]: [], // Vaciar la lista de archivos de esta conducta
          },
        };

        // Detectar cambios
        const hasChanges = detectChanges(newState);
        if (hasChanges) {
          newState.hasUnsavedChanges = true;
        }

        return newState;
      });
      
      console.log('Estado actualizado después de eliminar todos los archivos');
      return result;
    } catch (error) {
      console.error('Error al eliminar archivos de la conducta:', error);
      throw error;
    }
  }, [evaluation.evaluationId]);

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
      const nowDate = new Date().toLocaleDateString('es-ES');
      setEvaluationWithLog(prev => ({
        ...prev,
        isSaving: false,
        lastSavedAt: nowDate,
        lastSavedAtFull: now,
        hasUnsavedChanges: false,
        originalEvaluationSnapshot: {
          criteriaChecks: prev.criteriaChecks,
          realEvidences: prev.realEvidences,
          scores: prev.scores,
          files: prev.files
        }
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

    // Guardar automáticamente todos los toggles activados del TRAMO 1 si hay evaluación activa
    if (evaluation.evaluationId) {
      try {
        await apiService.updateEvaluationSettings(evaluation.evaluationId, { useT1SevenPoints });
        console.log('Configuración de TRAMO 1 actualizada en la base de datos');
        
        // Obtener el estado actualizado para guardar los toggles
        const currentState = evaluation;
        const updatedCriteriaChecks = currentState.criteriaChecks;
        
        // Guardar automáticamente todos los toggles activados del TRAMO 1
        await saveAllActiveT1Toggles(evaluation.evaluationId, updatedCriteriaChecks);
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
      setEvaluation(getInitialState(evaluation.useT1SevenPoints));
    } else {
      setEvaluationWithLog(prev => ({
        ...prev,
        workerId,
        token
      }));
    }
  }, [evaluation.useT1SevenPoints]);

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

  // Sincronizar workerEvaluations con el objeto principal de evaluación
  useEffect(() => {
    setEvaluationWithLog(prev => ({
      ...prev,
      workerEvaluations
    }));
  }, [workerEvaluations]);

  // Función para crear automáticamente una nueva versión si hay cambios
  const createNewVersionIfNeeded = useCallback(async () => {
    if (!evaluation.evaluationId || evaluation.isNewEvaluation || evaluation.versionAlreadyIncremented) {
      return evaluation.evaluationId;
    }

    // Verificar si hay cambios sin guardar
    const hasChanges = evaluation.hasUnsavedChanges || detectChanges(evaluation);
    if (!hasChanges) {
      return evaluation.evaluationId;
    }

    try {
      console.log('🔄 Creando nueva versión automáticamente debido a cambios detectados');
      const newVersion = await apiService.createNewVersion(evaluation.evaluationId);
      
      // Calcular el flujo de versiones
      const originalVersion = evaluation.version || 0;
      const newVersionNumber = newVersion.version || 0;
      const versionFlow = `v${originalVersion} → v${newVersionNumber}`;
      
      // Actualizar el estado con la nueva evaluación
      setEvaluationWithLog(prev => ({
        ...prev,
        evaluationId: newVersion.id,
        version: newVersion.version || null,
        hasUnsavedChanges: false,
        originalEvaluationSnapshot: null,
        isNewEvaluation: false,
        versionAlreadyIncremented: true, // Marcar que ya se incrementó en esta sesión
        originalVersionId: evaluation.evaluationId, // Guardar el ID de la versión original
        versionFlow: versionFlow, // Guardar el flujo de versiones
      }));

      // Recargar la lista de evaluaciones del trabajador
      if (evaluation.workerId) {
        await loadWorkerEvaluations(evaluation.workerId);
      }

      console.log('✅ Nueva versión creada:', newVersion, 'Flujo:', versionFlow);
      return newVersion.id;
    } catch (error) {
      console.error('❌ Error al crear nueva versión:', error);
      return evaluation.evaluationId;
    }
  }, [evaluation.evaluationId, evaluation.isNewEvaluation, evaluation.hasUnsavedChanges, evaluation.versionAlreadyIncremented, evaluation.version, evaluation.workerId, loadWorkerEvaluations]);

  // Función para detectar cambios en la evaluación
  const detectChanges = useCallback((currentState: any) => {
    if (!evaluation.originalEvaluationSnapshot) return false;
    
    const original = evaluation.originalEvaluationSnapshot;
    const current = {
      criteriaChecks: currentState.criteriaChecks,
      realEvidences: currentState.realEvidences,
      scores: currentState.scores,
      files: currentState.files
    };

    // Comparar criterios
    const criteriaChanged = JSON.stringify(original.criteriaChecks) !== JSON.stringify(current.criteriaChecks);
    const evidenceChanged = JSON.stringify(original.realEvidences) !== JSON.stringify(current.realEvidences);
    const scoresChanged = JSON.stringify(original.scores) !== JSON.stringify(current.scores);
    const filesChanged = JSON.stringify(original.files) !== JSON.stringify(current.files);

    const hasChanges = criteriaChanged || evidenceChanged || scoresChanged || filesChanged;
    
    console.log('🔍 Detección de cambios:', {
      criteriaChanged,
      evidenceChanged,
      scoresChanged,
      filesChanged,
      hasChanges
    });

    return hasChanges;
  }, [evaluation.originalEvaluationSnapshot]);

  // Utilidades para transformar arrays a objetos
  function arrayToCriteriaChecksObj(arr: any[]): Record<string, CriteriaCheckState> {
    const obj: Record<string, CriteriaCheckState> = {};
    arr.forEach(item => {
      if (!obj[item.conduct_id]) obj[item.conduct_id] = { t1: [], t2: [] };
      if (item.tramo === 't1') obj[item.conduct_id].t1[item.criterion_index] = !!item.is_checked;
      if (item.tramo === 't2') obj[item.conduct_id].t2[item.criterion_index] = !!item.is_checked;
    });
    return obj;
  }
  function arrayToRealEvidencesObj(arr: any[]): Record<string, string> {
    const obj: Record<string, string> = {};
    arr.forEach(item => { obj[item.conduct_id] = item.evidence_text; });
    return obj;
  }
  function arrayToEvidenceFilesObj(arr: any[]): Record<string, EvidenceFile[]> {
    const obj: Record<string, EvidenceFile[]> = {};
    arr.forEach(file => {
      if (!obj[file.conduct_id]) obj[file.conduct_id] = [];
      obj[file.conduct_id].push(file);
    });
    return obj;
  }
  function arrayToScoresObj(arr: any[]): Record<string, Score> {
    const obj: Record<string, Score> = {};
    arr.forEach(score => { obj[score.conduct_id] = { t1: score.t1_score, t2: score.t2_score, final: score.final_score }; });
    return obj;
  }

  return {
    evaluation,
    isLoading,
    isLoadingEvaluations,
    setWorkerId,
    setWorkerSession,
    setPeriod,
    updateCriteriaCheck,
    updateRealEvidence,
    addFiles,
    removeFile,
    removeAllFilesFromConduct,
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
    createNewVersionIfNeeded,
    detectChanges,
  };
};
