export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: number;
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  unit: string;
  due_date?: string;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
  user_id: number;
  actions?: Action[];
  goal_updates?: GoalUpdate[];
}

export enum GoalStatus {
  ON_TRACK = "on_track",
  AT_RISK = "at_risk",
  OFF_TRACK = "off_track",
}

export enum EffortLevel {
  SMALL = "S",
  MEDIUM = "M",
  LARGE = "L",
}

export interface GoalUpdate {
  id?: number;
  new_value: number;
  previous_value: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  target_value: number;
  current_value?: number;
  unit: string;
  due_date?: string;
}

export interface Action {
  id: number;
  title: string;
  description?: string;
  status: ActionStatus;
  effort?: EffortLevel;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export enum ActionStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  DONE = "done",
}

export interface CreateActionRequest {
  title: string;
  description?: string;
  effort?: EffortLevel;
  due_date?: string;
}

export interface AIActionSuggestion {
  title: string;
  rationale: string;
  effort?: EffortLevel;
}

export interface AICheckInSummary {
  confidence: string;
  bullets: string[];
  risk_tag: GoalStatus;
}

export interface DashboardStats {
  totalGoals: number;
  onTrackGoals: number;
  offTrackGoals: number;
  atRiskGoals: number;

  activeActions: number;
  completedActions: number;
  inProgressActions: number;
  totalActions: number;
}

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
}
