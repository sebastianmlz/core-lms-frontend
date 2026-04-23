import { AxiomVarkProfile, BackendVarkProfile } from '../../../shared/lib/vark/vark.utils';

export interface AdaptivePlanInput {
  studentId: string;
  courseId: string;
  failedTopics: string[];
  varkProfile: BackendVarkProfile | AxiomVarkProfile;
}

export interface AdaptivePlanResource {
  title: string;
  url: string;
  resource_type: string;
}

export interface AdaptivePlanItem {
  topic: string;
  priority: number;
  prerequisite_chain: string[];
  explanation: string;
  resources: AdaptivePlanResource[];
}

export interface AdaptivePlanMeta {
  subgraph_tuples: number;
  topics_processed: number;
  items_generated: number;
  items_after_validation: number;
  llm_latency_ms: number;
  total_latency_ms: number;
}

export interface AdaptivePlanResponse {
  student_id: string;
  course_id: string;
  items: AdaptivePlanItem[];
  _meta: AdaptivePlanMeta;
}

export type DiagnosticExecutionMode = 'sync' | 'async';

export type DiagnosticExecutionStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'fallback'
  | 'pending'
  | 'error';

export interface CognitiveGraphNode {
  id: string;
  label: string;
  status: 'failed' | 'learning' | 'mastered';
}

export interface CognitiveGraphEdge {
  source: string;
  target: string;
  relation: string;
}

export interface CognitiveGraphResponse {
  student_id: string;
  nodes: CognitiveGraphNode[];
  edges: CognitiveGraphEdge[];
}

export interface ReasoningState {
  adaptivePlan: AdaptivePlanResponse | null;
  cognitiveGraph: CognitiveGraphResponse | null;
  isLoadingPlan: boolean;
  isLoadingGraph: boolean;
  diagnosticMode: DiagnosticExecutionMode;
  diagnosticStatus: DiagnosticExecutionStatus;
  lastAttemptId: number | null;
  jobId: string | null;
  fallbackReason: string | null;
  error: string | null;
}
