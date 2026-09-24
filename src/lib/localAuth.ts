import { storageGetItem, storageSetItem, storageRemoveItem } from "./safeStorage";

const ACCOUNTS_KEY = "civicleader.auth.accounts.v1";
const SESSION_KEY = "civicleader.auth.session.v1";

export type LocalAccount = {
  username: string;
  /** Salted hash — never store raw password. */
  passwordHash: string;
  salt: string;
  displayName: string;
  createdAt: string;
};

export type AuthSession = {
  username: string;
};

function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "");
}

function randomSalt(): string {
  return `${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`;
}

/** Local-only hash gate (not for server auth). */
function hashPassword(password: string, salt: string): string {
  const input = `civicleader.v1:${salt}:${password}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    h1 ^= input.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= input.charCodeAt(input.length - 1 - i);
    h2 = Math.imul(h2, 0x01000193);
  }
  let h3 = 0x811c9dc5;
  for (let r = 0; r < 64; r++) {
    h3 ^= (h1 + r) >>> 0;
    h3 = Math.imul(h3, 0x01000193);
    h3 ^= (h2 + r * 17) >>> 0;
    h3 = Math.imul(h3, 0x01000193);
  }
  return (
    (h1 >>> 0).toString(16).padStart(8, "0") +
    (h2 >>> 0).toString(16).padStart(8, "0") +
    (h3 >>> 0).toString(16).padStart(8, "0")
  );
}

async function readAccounts(): Promise<LocalAccount[]> {
  const raw = await storageGetItem(ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as LocalAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAccounts(rows: LocalAccount[]): Promise<void> {
  await storageSetItem(ACCOUNTS_KEY, JSON.stringify(rows));
}

export async function getSession(): Promise<AuthSession | null> {
  const raw = await storageGetItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.username) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setSession(session: AuthSession | null): Promise<void> {
  if (!session) {
    await storageRemoveItem(SESSION_KEY);
    return;
  }
  await storageSetItem(SESSION_KEY, JSON.stringify(session));
}

export function validateUsername(username: string): string | null {
  const u = normalizeUsername(username);
  if (u.length < 3) return "Username needs at least 3 characters.";
  if (u.length > 24) return "Username is too long.";
  if (!/^[a-z0-9._]+$/.test(u)) {
    return "Use letters, numbers, dots or underscores only.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) return "Password needs at least 6 characters.";
  if (password.length > 72) return "Password is too long.";
  return null;
}

export async function createAccount(
  usernameRaw: string,
  password: string,
  displayName?: string
): Promise<{ ok: true; account: LocalAccount } | { ok: false; error: string }> {
  const userErr = validateUsername(usernameRaw);
  if (userErr) return { ok: false, error: userErr };
  const passErr = validatePassword(password);
  if (passErr) return { ok: false, error: passErr };

  const username = normalizeUsername(usernameRaw);
  const accounts = await readAccounts();
  if (accounts.some((a) => a.username === username)) {
    return { ok: false, error: "That username is already taken on this phone." };
  }

  const salt = randomSalt();
  const account: LocalAccount = {
    username,
    salt,
    passwordHash: hashPassword(password, salt),
    displayName: (displayName ?? "").trim() || username,
    createdAt: new Date().toISOString(),
  };
  await writeAccounts([...accounts, account]);
  await setSession({ username });
  return { ok: true, account };
}

export async function signIn(
  usernameRaw: string,
  password: string
): Promise<{ ok: true; account: LocalAccount } | { ok: false; error: string }> {
  const username = normalizeUsername(usernameRaw);
  if (!username || !password) {
    return { ok: false, error: "Enter your username and password." };
  }
  const accounts = await readAccounts();
  const account = accounts.find((a) => a.username === username);
  if (!account) return { ok: false, error: "No account with that username on this phone." };
  const hash = hashPassword(password, account.salt);
  if (hash !== account.passwordHash) {
    return { ok: false, error: "Wrong password." };
  }
  await setSession({ username });
  return { ok: true, account };
}

export async function getAccount(
  username: string
): Promise<LocalAccount | null> {
  const accounts = await readAccounts();
  return accounts.find((a) => a.username === username) ?? null;
}

export async function updateDisplayName(
  username: string,
  displayName: string
): Promise<void> {
  const accounts = await readAccounts();
  const next = accounts.map((a) =>
    a.username === username
      ? { ...a, displayName: displayName.trim() || a.username }
      : a
  );
  await writeAccounts(next);
}

export async function signOut(): Promise<void> {
  await setSession(null);
}
