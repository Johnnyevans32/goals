export enum GoalStatus {
  ON_TRACK = "on_track",
  AT_RISK = "at_risk",
  OFF_TRACK = "off_track",
}

export enum ActionStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  DONE = "done",
}

export enum EffortLevel {
  SMALL = "S",
  MEDIUM = "M",
  LARGE = "L",
}

export type AIActionSuggestion = {
  title: string;
  rationale: string;
  effort: EffortLevel;
};
export type AICheckInSummary = {
  bullets: string[];
  confidence: number;
  risk_tag: GoalStatus;
};
