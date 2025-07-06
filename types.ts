export interface Worker {
  id: string;
  name: string;
  worker_group: 'GRUPO 1-2' | 'GRUPO 3-4';
}

export interface Conduct {
  id: string;
  description: string;
  exampleEvidence?: string;
}

export interface Competency {
  id: string;
  title: string;
  description: string;
  conducts: Conduct[];
}

export interface Score {
  t1: number | null;
  t2: number | null;
  final: number;
}

export interface CriteriaCheckState {
  t1: boolean[];
  t2: boolean[];
}

export interface EvidenceFile {
  id: string;
  name: string;
  type: string;
  content: string; // Base64 data URL
  file_name?: string; // Full relative path for evidence file
  url?: string; // URL for accessing the file
  file_size?: number; // File size in bytes
}

export interface Evaluation {
  id: number;
  worker_id: string;
  period: string;
  created_at: string;
  updated_at: string;
  useT1SevenPoints: boolean;
  autoSave: boolean;
  version?: number;
  worker_name?: string;
}

export interface EvaluationState {
  workerId: string | null;
  period: string;
  scores: Record<string, Score>;
  criteriaChecks: Record<string, CriteriaCheckState>;
  realEvidences: Record<string, string>;
  files: Record<string, EvidenceFile[]>;
  workers: Worker[];
  evaluationId: number | null;
  useT1SevenPoints: boolean;
  autoSave: boolean;
  openAccordions: Record<string, boolean>;
  isSaving: boolean;
  lastSavedAt: string | null;
  lastSavedAtFull: string | null;
  version: number | null;
  isNewEvaluation?: boolean;
  token?: string | null;
}
