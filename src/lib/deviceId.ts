import { storageGetItem, storageSetItem } from "./safeStorage";

const DEVICE_ID_KEY = "mydelhi.device_id.v1";

function randomUuid(): string {
  // RFC4122-ish UUID without external crypto dependency
  const bytes = new Array(16).fill(0).map(() => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Simple FNV-1a hex digest — enough to avoid sending raw UUID; not cryptographic. */
function fnv1aHex(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // Expand a bit for length >= 16
  let out = (h >>> 0).toString(16).padStart(8, "0");
  let h2 = 0x811c9dc5 ^ input.length;
  for (let i = input.length - 1; i >= 0; i--) {
    h2 ^= input.charCodeAt(i);
    h2 = Math.imul(h2, 0x01000193);
  }
  out += (h2 >>> 0).toString(16).padStart(8, "0");
  let h3 = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 2) {
    h3 ^= input.charCodeAt(i);
    h3 = Math.imul(h3, 0x01000193);
  }
  out += (h3 >>> 0).toString(16).padStart(8, "0");
  return out;
}

/** Stable anonymous device UUID for community contribute / validate. */
export async function getDeviceId(): Promise<string> {
  const existing = await storageGetItem(DEVICE_ID_KEY);
  if (existing && existing.length >= 16) return existing;
  const id = randomUuid();
  await storageSetItem(DEVICE_ID_KEY, id);
  return id;
}

/** Hash before sending — never store raw device UUID when avoidable. */
export async function getDeviceHash(): Promise<string> {
  const id = await getDeviceId();
  return fnv1aHex(`mydelhi:${id}`);
}
