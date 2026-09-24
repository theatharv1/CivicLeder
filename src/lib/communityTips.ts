import { APP_NAME } from "./brand";
import { getDeviceHash } from "./deviceId";
import { storageGetItem, storageSetItem } from "./safeStorage";
import { api, apiConfigured } from "./apiClient";

export type CommunityTipStatus =
  | "pending"
  | "needs_more_votes"
  | "community_supported"
  | "staff_reviewed"
  | "rejected"
  | "archived";

export type CommunityTip = {
  id: string;
  categorySlug: string;
  title: string;
  body: string;
  whenToAct: string | null;
  suggestedChannelLabel: string | null;
  suggestedChannelUrl: string | null;
  status: CommunityTipStatus;
  agreeCount: number;
  disagreeCount: number;
  contributorDeviceHash: string;
  createdAt: string;
  /** True when this tip was submitted on this device (local or remote). */
  isMine?: boolean;
  myVote?: "agree" | "disagree" | null;
};

export type SubmitCommunityTipInput = {
  categorySlug: string;
  title: string;
  body: string;
  whenToAct?: string | null;
  channelLabel?: string | null;
  channelUrl?: string | null;
};

const LOCAL_TIPS_KEY = "mydelhi.community_tips.v1";
const LOCAL_VOTES_KEY = "mydelhi.community_votes.v1";
const MY_TIP_IDS_KEY = "mydelhi.community_my_tips.v1";

const BLOCKED =
  /official warning|government order|govt order|we declare|evacuate now by order/i;

const PUBLIC_STATUSES: CommunityTipStatus[] = [
  "needs_more_votes",
  "community_supported",
  "staff_reviewed",
];

export function statusLabel(status: CommunityTipStatus): string {
  switch (status) {
    case "pending":
      return "Your tip - waiting";
    case "needs_more_votes":
      return "Neighbours checking";
    case "community_supported":
      return "Neighbours agree (not official)";
    case "staff_reviewed":
      return `Checked by ${APP_NAME} (not government)`;
    case "rejected":
      return "Removed";
    case "archived":
      return "Archived";
    default:
      return "Community tip";
  }
}

export function validateTipInput(input: SubmitCommunityTipInput): string | null {
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 8 || title.length > 120) {
    return "Title should be 8-120 characters.";
  }
  if (body.length < 20 || body.length > 800) {
    return "Tip should be 20-800 characters.";
  }
  if (BLOCKED.test(`${title} ${body}`)) {
    return "Please do not claim to issue government warnings or orders.";
  }
  const url = input.channelUrl?.trim() || "";
  if (url) {
    if (!/^https?:\/\//i.test(url)) {
      return "Channel link must start with http:// or https://";
    }
    const ok =
      /\.gov\.in/i.test(url) ||
      /play\.google\.com/i.test(url) ||
      /apps\.apple\.com/i.test(url);
    if (!ok) {
      return "Only .gov.in or official app store links are allowed.";
    }
  }
  return null;
}

function recomputeLocalStatus(tip: CommunityTip): CommunityTipStatus {
  if (tip.status === "staff_reviewed" || tip.status === "archived") {
    return tip.status;
  }
  const total = tip.agreeCount + tip.disagreeCount;
  if (total === 0) return "needs_more_votes";
  const ratio = tip.agreeCount / total;
  if (tip.disagreeCount >= 5 && ratio < 0.4) return "rejected";
  if (tip.agreeCount >= 5 && ratio >= 0.7) return "community_supported";
  return "needs_more_votes";
}

async function loadLocalTips(): Promise<CommunityTip[]> {
  const raw = await storageGetItem(LOCAL_TIPS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CommunityTip[];
  } catch {
    return [];
  }
}

async function saveLocalTips(rows: CommunityTip[]): Promise<void> {
  await storageSetItem(LOCAL_TIPS_KEY, JSON.stringify(rows));
}

async function loadLocalVotes(): Promise<
  Record<string, "agree" | "disagree">
> {
  const raw = await storageGetItem(LOCAL_VOTES_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, "agree" | "disagree">;
  } catch {
    return {};
  }
}

async function saveLocalVotes(
  votes: Record<string, "agree" | "disagree">
): Promise<void> {
  await storageSetItem(LOCAL_VOTES_KEY, JSON.stringify(votes));
}

async function loadMyTipIds(): Promise<string[]> {
  const raw = await storageGetItem(MY_TIP_IDS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

async function rememberMyTipId(id: string): Promise<void> {
  const ids = await loadMyTipIds();
  if (!ids.includes(id)) {
    ids.unshift(id);
    await storageSetItem(MY_TIP_IDS_KEY, JSON.stringify(ids.slice(0, 100)));
  }
}

function mapRemote(row: Record<string, unknown>): CommunityTip {
  return {
    id: String(row.id),
    categorySlug: String(row.categorySlug ?? row.category_slug ?? ""),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    whenToAct:
      (row.whenToAct as string | null) ??
      (row.when_to_act as string | null) ??
      null,
    suggestedChannelLabel:
      (row.suggestedChannelLabel as string | null) ??
      (row.suggested_channel_label as string | null) ??
      null,
    suggestedChannelUrl:
      (row.suggestedChannelUrl as string | null) ??
      (row.suggested_channel_url as string | null) ??
      null,
    status: String(row.status ?? "pending") as CommunityTipStatus,
    agreeCount: Number(row.agreeCount ?? row.agree_count ?? 0),
    disagreeCount: Number(row.disagreeCount ?? row.disagree_count ?? 0),
    contributorDeviceHash: String(
      row.contributorDeviceHash ?? row.contributor_device_hash ?? ""
    ),
    createdAt: String(
      row.createdAt ?? row.created_at ?? new Date().toISOString()
    ),
  };
}

/** Seed demo tips so Explore works offline / without migration applied yet. */
const FALLBACK_SEED: CommunityTip[] = [
  {
    id: "local-seed-building-1",
    categorySlug: "building",
    title: "Extra floors on an old PG - ask early",
    body: "If a student PG suddenly adds floors or digs a basement while people still live upstairs, ask the municipal office to inspect before anyone gets hurt. This is a community tip - not an official order.",
    whenToAct:
      "Report the address via MCD 311 / 155305 the same day if it looks unsafe.",
    suggestedChannelLabel: "MCD Online",
    suggestedChannelUrl: "https://mcdonline.nic.in/",
    status: "needs_more_votes",
    agreeCount: 2,
    disagreeCount: 0,
    contributorDeviceHash: "seed",
    createdAt: new Date().toISOString(),
  },
  {
    id: "local-seed-flood-1",
    categorySlug: "water_drainage",
    title: "Do not walk into floodwater",
    body: "Even shallow flowing water can knock people down. Move children and elders to higher ground early when water rises on the road.",
    whenToAct: "If people are trapped - call 112 / 101 / 102 first.",
    suggestedChannelLabel: null,
    suggestedChannelUrl: null,
    status: "community_supported",
    agreeCount: 8,
    disagreeCount: 1,
    contributorDeviceHash: "seed",
    createdAt: new Date().toISOString(),
  },
];

export async function listCommunityTips(options?: {
  categorySlug?: string | null;
  includeMinePending?: boolean;
}): Promise<CommunityTip[]> {
  const hash = await getDeviceHash();
  const myIds = await loadMyTipIds();
  const localVotes = await loadLocalVotes();
  let rows: CommunityTip[] = [];

  if (apiConfigured) {
    const result = await api.listCommunityTips(options?.categorySlug ?? undefined);
    if (result.ok) {
      rows = result.data.map(mapRemote);
    }
  }

  const local = await loadLocalTips();
  const byId = new Map<string, CommunityTip>();
  for (const t of FALLBACK_SEED) byId.set(t.id, t);
  for (const t of local) byId.set(t.id, t);
  for (const t of rows) byId.set(t.id, t);

  let merged = Array.from(byId.values()).filter((t) => {
    if (PUBLIC_STATUSES.includes(t.status)) return true;
    if (options?.includeMinePending && myIds.includes(t.id)) return true;
    if (t.contributorDeviceHash === hash && t.status === "pending") return true;
    return false;
  });

  if (options?.categorySlug) {
    merged = merged.filter((t) => t.categorySlug === options.categorySlug);
  }

  return merged.map((t) => ({
    ...t,
    isMine: myIds.includes(t.id) || t.contributorDeviceHash === hash,
    myVote: localVotes[t.id] ?? null,
  }));
}

export async function submitCommunityTip(
  input: SubmitCommunityTipInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const err = validateTipInput(input);
  if (err) return { ok: false, error: err };

  const hash = await getDeviceHash();
  const title = input.title.trim();
  const body = input.body.trim();
  const whenToAct = input.whenToAct?.trim() || null;
  const channelLabel = input.channelLabel?.trim() || null;
  const channelUrl = input.channelUrl?.trim() || null;

  if (apiConfigured) {
    const result = await api.submitCommunityTip({
      deviceHash: hash,
      categorySlug: input.categorySlug,
      title,
      body,
      whenToAct,
      channelLabel,
      channelUrl,
    });
    if (result.ok && result.data.id) {
      const id = String(result.data.id);
      await rememberMyTipId(id);
      return { ok: true, id };
    }
  }

  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tip: CommunityTip = {
    id,
    categorySlug: input.categorySlug,
    title,
    body,
    whenToAct,
    suggestedChannelLabel: channelLabel,
    suggestedChannelUrl: channelUrl,
    status: "needs_more_votes",
    agreeCount: 0,
    disagreeCount: 0,
    contributorDeviceHash: hash,
    createdAt: new Date().toISOString(),
    isMine: true,
  };
  const local = await loadLocalTips();
  local.unshift(tip);
  await saveLocalTips(local.slice(0, 100));
  await rememberMyTipId(id);
  return { ok: true, id };
}

export async function voteCommunityTip(
  tipId: string,
  vote: "agree" | "disagree"
): Promise<{ ok: true; tip: CommunityTip } | { ok: false; error: string }> {
  const hash = await getDeviceHash();
  const tips = await listCommunityTips({ includeMinePending: true });
  const tip = tips.find((t) => t.id === tipId);
  if (!tip) return { ok: false, error: "Tip not found." };
  if (tip.isMine || tip.contributorDeviceHash === hash) {
    return { ok: false, error: "You cannot validate your own tip." };
  }
  if (tip.status === "rejected" || tip.status === "archived") {
    return { ok: false, error: "This tip is closed." };
  }

  if (apiConfigured && !tipId.startsWith("local-")) {
    const result = await api.voteCommunityTip(tipId, {
      deviceHash: hash,
      vote,
    });
    if (result.ok) {
      const votes = await loadLocalVotes();
      votes[tipId] = vote;
      await saveLocalVotes(votes);
      return {
        ok: true,
        tip: {
          ...tip,
          status: result.data.status as CommunityTipStatus,
          agreeCount: result.data.agree_count,
          disagreeCount: result.data.disagree_count,
          myVote: vote,
        },
      };
    }
  }

  // Local vote path (offline / seed / failed RPC)
  const votes = await loadLocalVotes();
  const prev = votes[tipId];
  let agree = tip.agreeCount;
  let disagree = tip.disagreeCount;
  if (prev === "agree") agree = Math.max(0, agree - 1);
  if (prev === "disagree") disagree = Math.max(0, disagree - 1);
  if (vote === "agree") agree += 1;
  else disagree += 1;
  votes[tipId] = vote;
  await saveLocalVotes(votes);

  const updated: CommunityTip = {
    ...tip,
    agreeCount: agree,
    disagreeCount: disagree,
    myVote: vote,
  };
  updated.status = recomputeLocalStatus(updated);

  const local = await loadLocalTips();
  const idx = local.findIndex((t) => t.id === tipId);
  if (idx >= 0) {
    local[idx] = { ...updated, isMine: false };
    await saveLocalTips(local);
  } else if (tipId.startsWith("local-seed-")) {
    // Persist voted seed copy
    local.unshift({ ...updated, isMine: false });
    await saveLocalTips(local);
  }

  return { ok: true, tip: updated };
}
