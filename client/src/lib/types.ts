// Auth
export interface MeResponse {
  isAuthenticated: boolean;
  username: string | null;
  weightUnit: string;
  heightUnit: string;
  onboardingComplete: boolean;
  displayName: string | null;
}

// Exercises
export type Modality = "strength" | "cardio" | "timed";

export interface Exercise {
  id: number;
  name: string;
  category: string;
  isCustom: boolean;
  modality: Modality;
}

// Workouts
export interface WorkoutSession {
  id: number;
  startedAt: string;
  finishedAt: string | null;
  notes: string | null;
  setCount: number;
}

export interface WorkoutSet {
  id: number;
  exerciseId: number;
  exerciseName: string;
  exerciseModality: Modality;
  reps: number | null;
  weight: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  setNumber: number;
  rpe: number | null;
  notes: string | null;
  isWarmup: boolean;
}

export interface AddSetResponse {
  id: number;
  setNumber: number;
  isWeightPr: boolean;
  isOneRmPr: boolean;
  isDistancePr: boolean;
  isPacePr: boolean;
  isDurationPr: boolean;
}

export interface SessionDetail {
  id: number;
  startedAt: string;
  finishedAt: string | null;
  notes: string | null;
  sets: WorkoutSet[];
}

// Metrics
export interface Metric {
  id: number;
  date: string;
  bodyWeight: number;
  loggedAt: string;
}

// Plans
export interface PlanSummary {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
}

export interface PlanExercise {
  id: number;
  exerciseId: number;
  exerciseName: string;
  orderIndex: number;
  sets: number;
  reps: number;
  targetWeight: number | null;
}

export interface PlanDetail extends PlanSummary {
  exercises: PlanExercise[];
}

// Schedule
export interface ScheduleEntry {
  dayOfWeek: number;
  planId: number | null;
  planName: string | null;
  planColor: string | null;
}

// Dashboard
export interface DashboardTodayPlanExercise {
  name: string;
  sets: number;
  reps: number;
}

export interface DashboardTodayPlan {
  id: number;
  name: string;
  color: string | null;
  exercises: DashboardTodayPlanExercise[];
}

export interface DashboardLastWorkoutExercise {
  name: string;
  sets: string[];
}

export interface DashboardLastWorkout {
  date: string;
  exercises: DashboardLastWorkoutExercise[];
}

export interface DashboardData {
  todayPlan: DashboardTodayPlan | null;
  lastWorkout: DashboardLastWorkout | null;
  currentWeight: number | null;
  currentStreakDays: number;
  weeklyWorkoutGoal: number | null;
  weeklyWorkoutCount: number;
  weeklyGoalStartDate: string;
  weeklyGoalEndDate: string;
  targetWeightKg: number | null;
  currentWeightKg: number | null;
  weightGoalDeltaKg: number | null;
}

// Progress
export interface ProgressPoint {
  date: string;
  modality: Modality;
  maxWeight: number | null;
  totalVolume: number | null;
  estimatedOneRm: number | null;
  totalDistanceMeters: number | null;
  avgPaceSecondsPerMeter: number | null;
  totalDurationSeconds: number | null;
  maxDurationSeconds: number | null;
}

export interface PrSummary {
  modality: Modality;
  maxWeight: number | null;
  maxWeightDate: string | null;
  estimatedOneRm: number | null;
  oneRmDate: string | null;
  longestDistanceMeters: number | null;
  longestDistanceDate: string | null;
  bestPaceSecondsPerMeter: number | null;
  bestPaceDate: string | null;
  longestDurationSeconds: number | null;
  longestDurationDate: string | null;
}

// Settings
export interface Settings {
  weightUnit: string;
  heightUnit: string;
  heightCm: number | null;
  restSeconds: number;
  weeklyWorkoutGoal: number | null;
  targetWeightKg: number | null;
}
