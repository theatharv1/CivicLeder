/**
 * Soft safety for public alert text.
 * Instant check — no extra steps for honest civic posts.
 * Blocks phones, emails, clear abuse/hate, and "naming a person" patterns.
 */

const PHONE =
  /(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}|\b\d{10}\b/;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
/** Social / handle that often outs someone. */
const HANDLE = /(?:^|\s)@[a-zA-Z0-9_]{3,}/;
const URL_CHAT =
  /(?:wa\.me|t\.me|telegram\.me|instagram\.com|facebook\.com|fb\.com)\/\S+/i;

/** Short blocklist — English + common Hindi romanizations. Keep tight to avoid false blocks. */
const ABUSE =
  /\b(kill\s+(him|her|them)|rape|molest|terrorist|jihadist|go\s+die|should\s+die|hang\s+(him|her)|lynch|chutiya|madarchod|behanchod|bhosd|harami|randi|prostitut|nigger|retard)\b/i;

const NAMING_PERSON =
  /\b(his\s+name\s+is|her\s+name\s+is|called\s+[A-Z][a-z]+\s+[A-Z][a-z]+|mobile\s*(no|number)|phone\s*(no|number)|contact\s+(him|her|them))\b/i;

export function publicAlertSafetyMessage(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  if (PHONE.test(t) || EMAIL.test(t)) {
    return "Remove phone numbers and emails. Keep it about the place, not a person.";
  }
  if (HANDLE.test(t) || URL_CHAT.test(t)) {
    return "Don't add social handles or chat links. Describe the spot only.";
  }
  if (ABUSE.test(t)) {
    return "That language isn't allowed. Describe the hazard calmly — no hate or abuse.";
  }
  if (NAMING_PERSON.test(t)) {
    return "Don't name or identify a person. Say what is wrong at the place.";
  }
  return null;
}
