import { storageGetItem, storageSetItem, storageRemoveItem } from "./safeStorage";

const ACCOUNTS_KEY = "civicleader.auth.accounts.v1";
const SESSION_KEY = "civicleader.auth.session.v1";

export type LocalAccount = {
  username: string;
  /** Salted hash — never store raw password. */
  passwordHash: string;
  salt: string;
  displayName: string;
  /** 10-digit Indian mobile (digits only). */
  phone: string;
  address: string;
  createdAt: string;
};

export type AuthSession = {
  username: string;
};

export type CreateAccountInput = {
  username: string;
  password: string;
  phone: string;
  address: string;
  displayName?: string;
};

function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "");
}

export function normalizePhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return d.slice(2);
  if (d.length === 11 && d.startsWith("0")) return d.slice(1);
  return d;
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
    if (!Array.isArray(parsed)) return [];
    // Migrate older accounts missing phone/address.
    return parsed.map((a) => ({
      ...a,
      phone: a.phone ?? "",
      address: a.address ?? "",
    }));
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

export function validatePhone(phone: string): string | null {
  const d = normalizePhone(phone);
  if (d.length !== 10) return "Enter a valid 10-digit mobile number.";
  if (!/^[6-9]\d{9}$/.test(d)) return "Enter a valid Indian mobile number.";
  return null;
}

export function validateAddress(address: string): string | null {
  const a = address.trim();
  if (a.length < 5) return "Enter your address (area / locality).";
  if (a.length > 200) return "Address is too long.";
  return null;
}

export async function createAccount(
  input: CreateAccountInput
): Promise<{ ok: true; account: LocalAccount } | { ok: false; error: string }> {
  const userErr = validateUsername(input.username);
  if (userErr) return { ok: false, error: userErr };
  const passErr = validatePassword(input.password);
  if (passErr) return { ok: false, error: passErr };
  const phoneErr = validatePhone(input.phone);
  if (phoneErr) return { ok: false, error: phoneErr };
  const addrErr = validateAddress(input.address);
  if (addrErr) return { ok: false, error: addrErr };

  const username = normalizeUsername(input.username);
  const phone = normalizePhone(input.phone);
  const address = input.address.trim();
  const accounts = await readAccounts();
  if (accounts.some((a) => a.username === username)) {
    return { ok: false, error: "That username is already taken on this phone." };
  }
  if (accounts.some((a) => a.phone && a.phone === phone)) {
    return { ok: false, error: "That mobile number is already used on this phone." };
  }

  const salt = randomSalt();
  const account: LocalAccount = {
    username,
    salt,
    passwordHash: hashPassword(input.password, salt),
    displayName: (input.displayName ?? "").trim() || username,
    phone,
    address,
    createdAt: new Date().toISOString(),
  };
  await writeAccounts([...accounts, account]);
  await setSession({ username });
  return { ok: true, account };
}

/** Sign in with username or mobile number + password. */
export async function signIn(
  loginRaw: string,
  password: string
): Promise<{ ok: true; account: LocalAccount } | { ok: false; error: string }> {
  const login = loginRaw.trim();
  if (!login || !password) {
    return { ok: false, error: "Enter mobile / username and password." };
  }
  const accounts = await readAccounts();
  const asPhone = normalizePhone(login);
  const asUser = normalizeUsername(login);
  const account =
    accounts.find((a) => a.phone && a.phone === asPhone) ??
    accounts.find((a) => a.username === asUser);
  if (!account) {
    return { ok: false, error: "No profile with that mobile or username." };
  }
  const hash = hashPassword(password, account.salt);
  if (hash !== account.passwordHash) {
    return { ok: false, error: "Wrong password." };
  }
  await setSession({ username: account.username });
  return { ok: true, account };
}

export async function getAccount(
  username: string
): Promise<LocalAccount | null> {
  const accounts = await readAccounts();
  return accounts.find((a) => a.username === username) ?? null;
}

/** Find local profile by phone (for Circle matching on this device only). */
export async function findAccountByPhone(
  phoneRaw: string
): Promise<LocalAccount | null> {
  const phone = normalizePhone(phoneRaw);
  if (phone.length !== 10) return null;
  const accounts = await readAccounts();
  return accounts.find((a) => a.phone === phone) ?? null;
}

export async function updateProfileFields(
  username: string,
  patch: { displayName?: string; phone?: string; address?: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const accounts = await readAccounts();
  const idx = accounts.findIndex((a) => a.username === username);
  if (idx < 0) return { ok: false, error: "Profile not found." };
  const cur = accounts[idx]!;
  let phone = cur.phone;
  let address = cur.address;
  if (patch.phone !== undefined) {
    const err = validatePhone(patch.phone);
    if (err) return { ok: false, error: err };
    phone = normalizePhone(patch.phone);
    if (accounts.some((a, i) => i !== idx && a.phone === phone)) {
      return { ok: false, error: "That mobile is already used on this phone." };
    }
  }
  if (patch.address !== undefined) {
    const err = validateAddress(patch.address);
    if (err) return { ok: false, error: err };
    address = patch.address.trim();
  }
  const next = [...accounts];
  next[idx] = {
    ...cur,
    displayName:
      patch.displayName !== undefined
        ? patch.displayName.trim() || cur.username
        : cur.displayName,
    phone,
    address,
  };
  await writeAccounts(next);
  return { ok: true };
}

/** Rename local username (same phone session). Public alerts never use this. */
export async function renameUsername(
  currentUsername: string,
  nextUsernameRaw: string
): Promise<{ ok: true; account: LocalAccount } | { ok: false; error: string }> {
  const userErr = validateUsername(nextUsernameRaw);
  if (userErr) return { ok: false, error: userErr };
  const nextName = normalizeUsername(nextUsernameRaw);
  const accounts = await readAccounts();
  const idx = accounts.findIndex((a) => a.username === currentUsername);
  if (idx < 0) return { ok: false, error: "Profile not found." };
  if (
    nextName !== currentUsername &&
    accounts.some((a) => a.username === nextName)
  ) {
    return { ok: false, error: "That username is already taken on this phone." };
  }
  const cur = accounts[idx]!;
  const updated: LocalAccount = {
    ...cur,
    username: nextName,
    displayName:
      cur.displayName === cur.username ? nextName : cur.displayName,
  };
  const next = [...accounts];
  next[idx] = updated;
  await writeAccounts(next);
  await setSession({ username: nextName });
  return { ok: true, account: updated };
}

export async function updateDisplayName(
  username: string,
  displayName: string
): Promise<void> {
  await updateProfileFields(username, { displayName });
}

export async function signOut(): Promise<void> {
  await setSession(null);
}
