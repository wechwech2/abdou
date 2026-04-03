export function requireNonEmpty(value: string, fieldName: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }
}
