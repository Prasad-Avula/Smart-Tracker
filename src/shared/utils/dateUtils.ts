import { format, startOfDay, endOfDay, isToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addDays, subDays, parseISO, differenceInDays } from 'date-fns'

export const DATE_FORMAT = 'yyyy-MM-dd'
export const DISPLAY_DATE_FORMAT = 'MMM d, yyyy'
export const DISPLAY_DATE_SHORT = 'MMM d'
export const WEEK_FORMAT = "yyyy-'W'ww"
export const MONTH_FORMAT = 'yyyy-MM'
export const YEAR_FORMAT = 'yyyy'

export function formatDate(date: Date | string, formatStr: string = DISPLAY_DATE_FORMAT): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, formatStr)
}

export function formatDateKey(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, DATE_FORMAT)
}

export function getTodayKey(): string {
  return formatDateKey(new Date())
}

export function getYesterdayKey(): string {
  return formatDateKey(subDays(new Date(), 1))
}

export function getWeekKey(date: Date = new Date()): string {
  return format(date, WEEK_FORMAT)
}

export function getMonthKey(date: Date = new Date()): string {
  return format(date, MONTH_FORMAT)
}

export function getYearKey(date: Date = new Date()): string {
  return format(date, YEAR_FORMAT)
}

export function isDateToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date
  return isToday(d)
}

export { isToday } from 'date-fns'

export function getDateRange(start: Date, end: Date): string[] {
  const dates: string[] = []
  let current = startOfDay(start)
  const endDay = endOfDay(end)
  
  while (current <= endDay) {
    dates.push(formatDateKey(current))
    current = addDays(current, 1)
  }
  
  return dates
}

export function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(date, { weekStartsOn: 1 })
  }
}

export function getMonthRange(date: Date = new Date()): { start: Date; end: Date } {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date)
  }
}

export function getYearRange(date: Date = new Date()): { start: Date; end: Date } {
  return {
    start: startOfYear(date),
    end: endOfYear(date)
  }
}

export function daysBetween(start: Date | string, end: Date | string): number {
  const s = typeof start === 'string' ? parseISO(start) : start
  const e = typeof end === 'string' ? parseISO(end) : end
  return differenceInDays(e, s)
}

export function parseDateKey(key: string): Date {
  return parseISO(key)
}

export function getDayName(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'EEEE')
}