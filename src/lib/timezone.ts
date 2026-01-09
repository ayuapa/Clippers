import { formatInTimeZone, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'
import { parse, startOfDay, endOfDay, addDays } from 'date-fns'

/**
 * TIMEZONE STRICTNESS (CRITICAL)
 * The source of truth for ALL time is Australia/Sydney.
 * Never use `new Date()` directly for business logic.
 */

export const APP_TIMEZONE = 'Australia/Sydney'

/**
 * Get the current date/time in Sydney timezone
 */
export function nowInSydney(): Date {
  return utcToZonedTime(new Date(), APP_TIMEZONE)
}

/**
 * Format a date to Sydney timezone
 */
export function formatInSydney(date: Date, formatStr: string): string {
  return formatInTimeZone(date, APP_TIMEZONE, formatStr)
}

/**
 * Convert a date to Sydney timezone (for display/calculations)
 */
export function toSydneyTime(date: Date): Date {
  return utcToZonedTime(date, APP_TIMEZONE)
}

/**
 * Convert a Sydney local time to UTC (for storing in DB)
 */
export function fromSydneyTime(date: Date): Date {
  return zonedTimeToUtc(date, APP_TIMEZONE)
}

/**
 * Get start of day in Sydney timezone
 */
export function startOfDayInSydney(date: Date): Date {
  const sydneyDate = toSydneyTime(date)
  return startOfDay(sydneyDate)
}

/**
 * Get end of day in Sydney timezone
 */
export function endOfDayInSydney(date: Date): Date {
  const sydneyDate = toSydneyTime(date)
  return endOfDay(sydneyDate)
}

/**
 * Add days in Sydney timezone
 */
export function addDaysInSydney(date: Date, days: number): Date {
  const sydneyDate = toSydneyTime(date)
  return addDays(sydneyDate, days)
}

/**
 * Parse a time string (e.g., "14:30") on a specific date in Sydney timezone
 */
export function parseTimeInSydney(dateStr: string, timeStr: string): Date {
  // Parse date and time as if they're in Sydney
  const localDateTime = parse(`${dateStr} ${timeStr}`, 'yyyy-MM-dd HH:mm', new Date())
  return fromSydneyTime(localDateTime)
}

/**
 * Format time for display (e.g., "2:30 PM")
 */
export function formatTimeForDisplay(date: Date): string {
  return formatInSydney(date, 'h:mm a')
}

/**
 * Format date for display (e.g., "Mon, Jan 7")
 */
export function formatDateForDisplay(date: Date): string {
  return formatInSydney(date, 'EEE, MMM d')
}

/**
 * Format full date and time for display
 */
export function formatDateTimeForDisplay(date: Date): string {
  return formatInSydney(date, 'EEE, MMM d • h:mm a')
}

