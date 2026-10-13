import { daysBetween, startOfMonth, startOfWeek, weekday } from './dates';
import type { Habit, HabitEntry } from './types';

export function isDueOn(h: Habit, date: string): boolean {
  if (h.archived_at) return false;
  switch (h.frequency_kind) {
    case 'daily':
    case 'times_per_week':
      return true;
    case 'weekdays':
      return (h.frequency_days ?? []).includes(weekday(date));
    case 'every_n_days': {
      const start = h.created_at.slice(0, 10);
      const n = Math.max(1, h.frequency_n ?? 1);
      const diff = daysBetween(start, date);
      return diff >= 0 && diff % n === 0;
    }
  }
}

export function goalOf(h: Habit): number {
  if (h.kind === 'bool') return 1;
  return Number(h.goal_value ?? 1);
}

export function windowStart(h: Habit, date: string): string {
  switch (h.goal_window) {
    case 'week':
      return startOfWeek(date);
    case 'month':
      return startOfMonth(date);
    default:
      return date;
  }
}

export interface HabitStatus {
  /** total da janela da meta (dia, semana ou mês) */
  total: number;
  /** total só de hoje */
  todayTotal: number;
  goal: number;
  ratio: number;
  done: boolean;
  /** para times_per_week: dias cumpridos / dias alvo na semana */
  daysDone?: number;
  daysTarget?: number;
}

export function statusOf(h: Habit, entries: HabitEntry[], date: string): HabitStatus {
  const mine = entries.filter((e) => e.habit_id === h.id);
  const goal = goalOf(h);
  const sum = (list: HabitEntry[]) => list.reduce((acc, e) => acc + Number(e.value), 0);
  const todayTotal = sum(mine.filter((e) => e.local_date === date));

  if (h.negative) {
    const ws = windowStart(h, date);
    const slips = sum(mine.filter((e) => e.local_date >= ws && e.local_date <= date));
    return { total: slips, todayTotal, goal: 0, ratio: slips > 0 ? 0 : 1, done: slips === 0 };
  }

  if (h.frequency_kind === 'times_per_week') {
    const ws = startOfWeek(date);
    const byDay = new Map<string, number>();
    for (const e of mine) {
      if (e.local_date >= ws && e.local_date <= date) {
        byDay.set(e.local_date, (byDay.get(e.local_date) ?? 0) + Number(e.value));
      }
    }
    const daysDone = [...byDay.values()].filter((v) => v >= goal).length;
    const daysTarget = h.frequency_n ?? 1;
    return {
      total: todayTotal,
      todayTotal,
      goal,
      ratio: goal > 0 ? Math.min(todayTotal / goal, 1) : 0,
      done: todayTotal >= goal,
      daysDone,
      daysTarget,
    };
  }

  const ws = windowStart(h, date);
  const total = sum(mine.filter((e) => e.local_date >= ws && e.local_date <= date));
  return {
    total,
    todayTotal,
    goal,
    ratio: goal > 0 ? Math.min(total / goal, 1) : 0,
    done: total >= goal,
  };
}

export function formatAmount(value: number, unit: string | null): string {
  const n = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return unit ? `${n} ${unit}` : n;
}

export const HABIT_ICONS = [
  'water', 'barbell', 'book', 'school', 'leaf', 'walk', 'bicycle', 'bed', 'medkit',
  'fast-food', 'cafe', 'musical-notes', 'brush', 'code-slash', 'language', 'heart',
  'sunny', 'moon', 'wallet', 'ban', 'ellipse-outline',
] as const;

export const HABIT_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6',
] as const;
