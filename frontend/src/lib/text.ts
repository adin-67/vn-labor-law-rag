export function initials(name: string) {
  return name.trim().split(/\s+/).slice(-2).map(s => s[0] ?? '').join('').toUpperCase();
}
