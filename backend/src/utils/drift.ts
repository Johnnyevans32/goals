import { GoalStatus } from "../types";

export function computeGoalStatus(
  currentValue: number,
  targetValue: number,
  dueDate: Date
): GoalStatus {
  const now = new Date();
  const isPastDue = now > dueDate;

  if (isPastDue) {
    return GoalStatus.OFF_TRACK;
  }

  const ratio = currentValue / targetValue;

  if (ratio >= 0.8) {
    return GoalStatus.ON_TRACK;
  } else if (ratio >= 0.5) {
    return GoalStatus.AT_RISK;
  } else {
    return GoalStatus.OFF_TRACK;
  }
}
