export function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function nowIsoTimestamp(): string {
  return new Date().toISOString();
}
