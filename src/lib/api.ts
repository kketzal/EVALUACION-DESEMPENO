export interface Worker {
  id: number;
  name: string;
  position: string;
  department: string;
  created_at: string;
}

export interface Evaluation {
  id: number;
  worker_id: number;
  worker_name: string;
  position: string;
  department: string;
  evaluation_date: string;
  total_score: number;
  status: string;
}

export interface EvidenceFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface CriteriaCheck {
  id: number;
  evaluation_id: number;
  conduct_id: string;
  tramo: string;
  criterion_index: number;
  is_checked: boolean;
}

export interface Score {
  id: number;
  evaluation_id: number;
  conduct_id: string;
  score: number;
}

export interface RealEvidence {
  id: number;
  evaluation_id: number;
  conduct_id: string;
  evidence_text: string;
}

class ApiService {
  private baseUrl = '/api';

  // Trabajadores
  async getWorkers(): Promise<Worker[]> {
    const response = await fetch(`${this.baseUrl}/workers`);
    if (!response.ok) {
      throw new Error('Error al obtener trabajadores');
    }
    return response.json();
  }

  async createWorker(worker: Omit<Worker, 'id' | 'created_at'>): Promise<Worker> {
    const response = await fetch(`${this.baseUrl}/workers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(worker),
    });
    if (!response.ok) {
      throw new Error('Error al crear trabajador');
    }
    return response.json();
  }

  // Evaluaciones
  async getEvaluations(): Promise<Evaluation[]> {
    const response = await fetch(`${this.baseUrl}/evaluations`);
    if (!response.ok) {
      throw new Error('Error al obtener evaluaciones');
    }
    return response.json();
  }

  async createEvaluation(workerId: number): Promise<{ id: number; workerId: number }> {
    const response = await fetch(`${this.baseUrl}/evaluations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workerId }),
    });
    if (!response.ok) {
      throw new Error('Error al crear evaluación');
    }
    return response.json();
  }

  // Criterios
  async getCriteria(evaluationId: number): Promise<CriteriaCheck[]> {
    const response = await fetch(`${this.baseUrl}/evaluations/${evaluationId}/criteria`);
    if (!response.ok) {
      throw new Error('Error al obtener criterios');
    }
    return response.json();
  }

  async updateCriteria(
    evaluationId: number,
    conductId: string,
    tramo: 't1' | 't2',
    criterionIndex: number,
    isChecked: boolean
  ): Promise<{ id: number; isChecked: boolean }> {
    const response = await fetch(`${this.baseUrl}/evaluations/${evaluationId}/criteria`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conductId,
        tramo,
        criterionIndex,
        isChecked,
      }),
    });
    if (!response.ok) {
      throw new Error('Error al actualizar criterio');
    }
    return response.json();
  }

  // Puntuaciones
  async getScores(evaluationId: number): Promise<Score[]> {
    const response = await fetch(`${this.baseUrl}/evaluations/${evaluationId}/scores`);
    if (!response.ok) {
      throw new Error('Error al obtener puntuaciones');
    }
    return response.json();
  }

  async updateScore(
    evaluationId: number,
    conductId: string,
    score: number
  ): Promise<{ id: number; score: number }> {
    const response = await fetch(`${this.baseUrl}/evaluations/${evaluationId}/scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conductId,
        score,
      }),
    });
    if (!response.ok) {
      throw new Error('Error al actualizar puntuación');
    }
    return response.json();
  }

  // Evidencias reales
  async getEvidence(evaluationId: number): Promise<RealEvidence[]> {
    const response = await fetch(`${this.baseUrl}/evaluations/${evaluationId}/evidence`);
    if (!response.ok) {
      throw new Error('Error al obtener evidencias');
    }
    return response.json();
  }

  async updateEvidence(
    evaluationId: number,
    conductId: string,
    evidenceText: string
  ): Promise<{ id: number; evidenceText: string }> {
    const response = await fetch(`${this.baseUrl}/evaluations/${evaluationId}/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conductId,
        evidenceText,
      }),
    });
    if (!response.ok) {
      throw new Error('Error al actualizar evidencia');
    }
    return response.json();
  }

  // Archivos de evidencia
  async getFiles(
    evaluationId: number,
    competencyId?: string,
    conductId?: string
  ): Promise<EvidenceFile[]> {
    const params = new URLSearchParams();
    if (competencyId) params.append('competencyId', competencyId);
    if (conductId) params.append('conductId', conductId);

    const response = await fetch(
      `${this.baseUrl}/evaluations/${evaluationId}/files?${params.toString()}`
    );
    if (!response.ok) {
      throw new Error('Error al obtener archivos');
    }
    return response.json();
  }

  async uploadFiles(
    evaluationId: number,
    files: FileList,
    competencyId: string,
    conductId: string
  ): Promise<{ files: EvidenceFile[] }> {
    const formData = new FormData();
    formData.append('evaluationId', evaluationId.toString());
    formData.append('competencyId', competencyId);
    formData.append('conductId', conductId);

    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Error al subir archivos');
    }
    return response.json();
  }

  async deleteFile(fileId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/files/dummy?id=${fileId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error al eliminar archivo');
    }
    return response.json();
  }
}

export const apiService = new ApiService(); 