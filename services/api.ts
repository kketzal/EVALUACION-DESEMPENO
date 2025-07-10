import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export interface Worker {
  id: string;
  name: string;
  worker_group: 'GRUPO 1-2' | 'GRUPO 3-4';
  created_at: string;
}

export interface Evaluation {
  id: number;
  worker_id: string;
  period: string;
  created_at: string;
  updated_at: string;
  useT1SevenPoints?: boolean;
  autoSave?: boolean;
  version?: number;
}

export interface CriteriaCheck {
  id: number;
  evaluation_id: number;
  conduct_id: string;
  tramo: string;
  criterion_index: number;
  is_checked: boolean;
}

export interface RealEvidence {
  id: number;
  evaluation_id: number;
  conduct_id: string;
  evidence_text: string;
}

export interface EvidenceFile {
  id: string | number;
  name?: string;
  original_name: string;
  file_name?: string;
  file_type: string;
  file_size: number;
  url?: string;
  evaluation_id: number;
  competency_id: string;
  conduct_id: string;
  uploaded_at: string;
}

export interface Score {
  id: number;
  evaluation_id: number;
  conduct_id: string;
  t1_score: number | null;
  t2_score: number | null;
  final_score: number;
}

export interface EvaluationData {
  evaluation: Evaluation;
  criteriaChecks: CriteriaCheck[];
  realEvidence: RealEvidence[];
  evidenceFiles: EvidenceFile[];
  scores: Score[];
}

class ApiService {
  // Trabajadores
  async getWorkers(): Promise<Worker[]> {
    const response = await fetch(`${API_BASE_URL}/workers`);
    if (!response.ok) throw new Error('Error al obtener trabajadores');
    return response.json();
  }

  async createWorker(worker: { id: string; name: string; worker_group: 'GRUPO 1-2' | 'GRUPO 3-4'; password?: string }): Promise<Worker> {
    const response = await fetch(`${API_BASE_URL}/workers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(worker),
    });
    if (!response.ok) throw new Error('Error al crear trabajador');
    return response.json();
  }

  async updateWorkerGroup(workerId: string, group: 'GRUPO 1-2' | 'GRUPO 3-4'): Promise<Worker> {
    const response = await fetch(`${API_BASE_URL}/workers/${workerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ worker_group: group }),
    });
    if (!response.ok) throw new Error('Error al actualizar grupo del trabajador');
    return response.json();
  }

  async updateWorker(workerId: string, name: string, group: 'GRUPO 1-2' | 'GRUPO 3-4', password?: string): Promise<Worker> {
    const body: any = { name, worker_group: group };
    if (password) body.password = password;
    const response = await fetch(`${API_BASE_URL}/workers/${workerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('Error al actualizar trabajador');
    return response.json();
  }

  async deleteWorker(workerId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/workers/${workerId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar trabajador');
    return response.json();
  }

  // Evaluaciones
  async getEvaluation(workerId: string, period: string): Promise<EvaluationData> {
    const response = await fetch(`${API_BASE_URL}/evaluations/${workerId}/${period}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`Error al obtener evaluación: ${response.status}`);
      (error as any).status = response.status;
      (error as any).data = errorData;
      throw error;
    }
    return response.json();
  }

  async saveCriteria(evaluationId: number, criteria: {
    conductId: string;
    tramo: 't1' | 't2';
    criterionIndex: number;
    isChecked: boolean;
  }): Promise<EvaluationData> {
    const response = await fetch(`${API_BASE_URL}/evaluations/${evaluationId}/criteria`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(criteria),
    });
    if (!response.ok) throw new Error('Error al guardar criterio');
    return response.json();
  }

  async saveEvidence(evaluationId: number, evidence: {
    conductId: string;
    evidenceText: string;
  }): Promise<EvaluationData> {
    const response = await fetch(`${API_BASE_URL}/evaluations/${evaluationId}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evidence),
    });
    if (!response.ok) throw new Error('Error al guardar evidencia');
    return response.json();
  }

  async uploadFiles(
    evaluationId: number,
    files: FileList | File[],
    competencyId: string,
    conductId: string,
    onProgress?: (percent: number) => void
  ): Promise<EvidenceFile[]> {
    console.log('=== uploadFiles ENTER ===');
    console.log('uploadFiles called:', { 
      evaluationId, 
      fileCount: files.length, 
      competencyId, 
      conductId 
    });
    
    const formData = new FormData();
    formData.append('competencyId', competencyId);
    formData.append('conductId', conductId);
    
    console.log('Agregando archivos al FormData...');
    // Convertir File[] a array si es necesario
    const filesArray = Array.isArray(files) ? files : Array.from(files);
    
    filesArray.forEach((file, index) => {
      console.log(`Archivo ${index}:`, { 
        originalName: file.name,
        type: file.type, 
        size: file.size 
      });
      formData.append('files', file);
    });

    console.log('Enviando request a:', `${API_BASE_URL}/evaluations/${evaluationId}/files`);
    const response = await axios.post(
      `${API_BASE_URL}/evaluations/${evaluationId}/files`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        }
      }
    );
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.status === 200);
    
    if (response.status !== 200) {
      console.error('Error response:', response.data);
      throw new Error(`Error al subir archivos: ${response.status} ${response.data}`);
    }
    
    const result = response.data;
    console.log('Upload result:', result);
    console.log('=== uploadFiles EXIT ===');
    
    // Asegurar que siempre devolvemos un array
    if (Array.isArray(result)) {
      return result;
    } else {
      console.warn('La API no devolvió un array, devolviendo array vacío:', result);
      return [];
    }
  }

  async deleteFile(fileId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar archivo');
  }

  async deleteAllFilesFromConduct(evaluationId: number, conductId: string): Promise<{ deletedCount: number; message: string }> {
    const response = await fetch(`${API_BASE_URL}/evaluations/${evaluationId}/conducts/${conductId}/files`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar archivos de la conducta');
    return response.json();
  }

  async saveScore(evaluationId: number, score: {
    conductId: string;
    t1Score: number | null;
    t2Score: number | null;
    finalScore: number;
  }): Promise<EvaluationData> {
    const response = await fetch(`${API_BASE_URL}/evaluations/${evaluationId}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(score),
    });
    if (!response.ok) throw new Error('Error al guardar puntuación');
    return response.json();
  }

  async updateEvaluation(evaluationId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/evaluations/${evaluationId}`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error('Error al actualizar evaluación');
  }

  async createNewVersion(evaluationId: number): Promise<Evaluation> {
    const response = await fetch(`${API_BASE_URL}/evaluations/${evaluationId}/version`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Error al crear nueva versión');
    return response.json();
  }

  async authenticateWorker(id: string, password: string): Promise<{ success: boolean; id?: string; name?: string; worker_group?: string; token?: string }> {
    const response = await fetch(`${API_BASE_URL}/workers/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password }),
    });
    if (!response.ok) {
      return { success: false };
    }
    return response.json();
  }

  async updateEvaluationSettings(evaluationId: number, settings: { useT1SevenPoints?: boolean; autoSave?: boolean }): Promise<EvaluationData> {
    const response = await fetch(`${API_BASE_URL}/evaluations/${evaluationId}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Error al guardar configuración de evaluación');
    return response.json();
  }

  async createEvaluation(workerId: string, period: string): Promise<Evaluation> {
    console.log('createEvaluation llamado con:', { workerId, period });
    const response = await fetch(`${API_BASE_URL}/evaluations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workerId, period }),
    });
    if (!response.ok) {
      console.error('Error al crear evaluación:', response.status, response.statusText);
      throw new Error('Error al crear evaluación');
    }
    const result = await response.json();
    console.log('Evaluación creada exitosamente:', result);
    return result;
  }

  // Obtener todas las evaluaciones de un trabajador (todas las versiones y periodos)
  async getEvaluationsByWorker(workerId: string): Promise<any[]> {
    console.log('getEvaluationsByWorker llamado con workerId:', workerId);
    const response = await fetch(`${API_BASE_URL}/evaluations`);
    if (!response.ok) throw new Error('Error al obtener evaluaciones');
    const all = await response.json();
    console.log('Todas las evaluaciones obtenidas:', all);
    const filtered = all.filter((ev: any) => ev.worker_id === workerId);
    console.log('Evaluaciones filtradas para workerId', workerId, ':', filtered);
    return filtered;
  }

  // Obtener una evaluación concreta por id
  async getEvaluationById(evaluationId: number): Promise<EvaluationData> {
    const response = await fetch(`${API_BASE_URL}/evaluations/${evaluationId}`);
    if (!response.ok) throw new Error('Error al obtener evaluación por id');
    return response.json();
  }

  async deleteEvaluation(evaluationId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/evaluations/${evaluationId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar evaluación');
  }

  async getGlobalEvaluationSettings(): Promise<{ useT1SevenPoints: boolean }> {
    const response = await fetch(`${API_BASE_URL}/settings/evaluation`);
    if (!response.ok) throw new Error('Error al obtener configuración global de evaluación');
    return response.json();
  }

  async setGlobalEvaluationSettings(settings: { useT1SevenPoints: boolean }): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/settings/evaluation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Error al guardar configuración global de evaluación');
  }
}

export const apiService = new ApiService(); 