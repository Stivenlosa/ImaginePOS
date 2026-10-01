const DEFAULT_TIME_ZONE = process.env.BUSINESS_TIMEZONE ?? "America/Bogota";

/** Calendar date for the business day (YYYY-MM-DD) in the configured timezone. */
export function todayBusinessDate(timeZone = DEFAULT_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}
