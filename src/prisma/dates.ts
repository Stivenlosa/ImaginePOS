import "temporal-polyfill/types/global";

// Timestamp columns carry no time zone; stored values are UTC.
export function timestampFromDate(value: Date): Temporal.PlainDateTime {
  return Temporal.Instant.fromEpochMilliseconds(value.getTime())
    .toZonedDateTimeISO("UTC")
    .toPlainDateTime();
}

export function nowTimestamp(): Temporal.PlainDateTime {
  return timestampFromDate(new Date());
}

export function timestampToDate(value: Temporal.PlainDateTime): Date {
  return new Date(value.toZonedDateTime("UTC").epochMilliseconds);
}

export function timestampToIso(value: Temporal.PlainDateTime): string {
  return timestampToDate(value).toISOString();
}
