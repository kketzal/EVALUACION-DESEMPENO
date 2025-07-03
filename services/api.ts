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

  async createWorker(worker: { id: string; name: string; worker_group: 'GRUPO 1-2' | 'GRUPO 3-4' }): Promise<Worker> {
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

  // Evaluaciones
  async getEvaluation(workerId: string, period: string): Promise<EvaluationData> {
    const response = await fetch(`${API_BASE_URL}/evaluations/${workerId}/${period}`);
    if (!response.ok) throw new Error('Error al obtener evaluación');
    return response.json();
  }

  async saveCriteria(evaluationId: number, criteria: {
    conductId: string;
    tramo: 't1' | 't2';
    criterionIndex: number;
    isChecked: boolean;
  }): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/evaluations/${evaluationId}/criteria`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(criteria),
    });
    if (!response.ok) throw new Error('Error al guardar criterio');
  }

  async saveEvidence(evaluationId: number, evidence: {
    conductId: string;
    evidenceText: string;
  }): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/evaluations/${evaluationId}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evidence),
    });
    if (!response.ok) throw new Error('Error al guardar evidencia');
  }

  async uploadFiles(evaluationId: number, files: FileList, competencyId: string, conductId: string): Promise<EvidenceFile[]> {
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
    Array.from(files).forEach((file, index) => {
      console.log(`Archivo ${index}:`, { 
        name: file.name, 
        type: file.type, 
        size: file.size 
      });
      formData.append('files', file);
    });

    console.log('Enviando request a:', `${API_BASE_URL}/evaluations/${evaluationId}/files`);
    const response = await fetch(`${API_BASE_URL}/evaluations/${evaluationId}/files`, {
      method: 'POST',
      body: formData,
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Error al subir archivos: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Upload result:', result);
    console.log('=== uploadFiles EXIT ===');
    return result;
  }

  async deleteFile(fileId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar archivo');
  }

  async saveScore(evaluationId: number, score: {
    conductId: string;
    t1Score: number | null;
    t2Score: number | null;
    finalScore: number;
  }): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/evaluations/${evaluationId}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(score),
    });
    if (!response.ok) throw new Error('Error al guardar puntuación');
  }

  async updateEvaluation(evaluationId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/evaluations/${evaluationId}`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error('Error al actualizar evaluación');
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

  async updateEvaluationSettings(evaluationId: number, settings: { useT1SevenPoints?: boolean; autoSave?: boolean }): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/evaluations/${evaluationId}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Error al guardar configuración de evaluación');
  }
}

export const apiService = new ApiService(); 