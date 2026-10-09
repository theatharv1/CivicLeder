/**
 * Stable, non-identifying neighbour mark for anonymous public alerts.
 * Derived from alert id only — never username.
 */

const PALETTE = [
  "#1A6DFF",
  "#0B2C5E",
  "#1B7A3E",
  "#7C3AED",
  "#0E7490",
  "#B45309",
  "#BE185D",
  "#4338CA",
] as const;

export function neighbourMark(alertId: string): {
  color: string;
  letter: string;
  label: string;
} {
  let h = 0;
  for (let i = 0; i < alertId.length; i++) {
    h = (Math.imul(31, h) + alertId.charCodeAt(i)) >>> 0;
  }
  const color = PALETTE[h % PALETTE.length]!;
  // Soft letter A–H — looks like an avatar, not a real name.
  const letter = String.fromCharCode(65 + (h % 8));
  return { color, letter, label: "Neighbour" };
}
