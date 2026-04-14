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
export interface Exercise {
  id: number;
  name: string;
  category: string;
  isCustom: boolean;
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
  reps: number;
  weight: number;
  setNumber: number;
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
}

// Progress
export interface ProgressPoint {
  date: string;
  maxWeight: number;
  totalVolume: number;
}

// Settings
export interface Settings {
  weightUnit: string;
  heightUnit: string;
  heightCm: number | null;
}
