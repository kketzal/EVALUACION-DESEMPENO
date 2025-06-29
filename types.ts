export interface Worker {
  id: string;
  name: string;
}

export interface Conduct {
  id: string;
  description: string;
  exampleEvidence: string;
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
}
