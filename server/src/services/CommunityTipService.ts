import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/errors.js";

const BLOCKED =
  /official warning|government order|govt order|we declare|evacuate now by order/i;

const PUBLIC_STATUSES = [
  "needs_more_votes",
  "community_supported",
  "staff_reviewed",
] as const;

function recomputeStatus(
  agree: number,
  disagree: number,
  current: string
): string {
  if (current === "staff_reviewed" || current === "archived") return current;
  const total = agree + disagree;
  if (total === 0) return "pending";
  const ratio = agree / total;
  if (disagree >= 5 && ratio < 0.4) return "rejected";
  if (agree >= 5 && ratio >= 0.7) return "community_supported";
  return "needs_more_votes";
}

export async function listCommunityTips(categorySlug?: string) {
  return prisma.communityTip.findMany({
    where: {
      status: { in: [...PUBLIC_STATUSES] },
      ...(categorySlug ? { categorySlug: categorySlug.toLowerCase() } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function submitCommunityTip(input: {
  deviceHash: string;
  categorySlug: string;
  title: string;
  body: string;
  whenToAct?: string | null;
  channelLabel?: string | null;
  channelUrl?: string | null;
}) {
  const deviceHash = input.deviceHash?.trim() ?? "";
  if (deviceHash.length < 16) {
    throw new AppError("INVALID_DEVICE", "invalid device");
  }
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 8 || title.length > 120) {
    throw new AppError("INVALID_TITLE", "invalid title");
  }
  if (body.length < 20 || body.length > 800) {
    throw new AppError("INVALID_BODY", "invalid body");
  }
  if (BLOCKED.test(`${title} ${body}`)) {
    throw new AppError("BLOCKED_PHRASING", "blocked phrasing");
  }
  let url = input.channelUrl?.trim() || null;
  if (url === "") url = null;
  if (url) {
    if (!/^https?:\/\//i.test(url)) {
      throw new AppError("INVALID_URL", "invalid url");
    }
    if (
      !/\.gov\.in/i.test(url) &&
      !/(play\.google\.com|apps\.apple\.com)/i.test(url)
    ) {
      throw new AppError("URL_NOT_ALLOWED", "url not allowed");
    }
  }

  return prisma.communityTip.create({
    data: {
      categorySlug: input.categorySlug.trim().toLowerCase(),
      title,
      body,
      whenToAct: input.whenToAct?.trim() || null,
      suggestedChannelLabel: input.channelLabel?.trim() || null,
      suggestedChannelUrl: url,
      status: "needs_more_votes",
      contributorDeviceHash: deviceHash,
    },
  });
}

export async function voteCommunityTip(input: {
  tipId: string;
  deviceHash: string;
  vote: "agree" | "disagree";
}) {
  const deviceHash = input.deviceHash?.trim() ?? "";
  if (deviceHash.length < 16) {
    throw new AppError("INVALID_DEVICE", "invalid device");
  }
  if (input.vote !== "agree" && input.vote !== "disagree") {
    throw new AppError("INVALID_VOTE", "invalid vote");
  }

  return prisma.$transaction(async (tx) => {
    const tip = await tx.communityTip.findUnique({
      where: { id: input.tipId },
    });
    if (!tip) throw new AppError("TIP_NOT_FOUND", "tip not found", 404);
    if (tip.status === "rejected" || tip.status === "archived") {
      throw new AppError("TIP_CLOSED", "tip closed");
    }
    if (tip.contributorDeviceHash === deviceHash) {
      throw new AppError("SELF_VOTE", "cannot vote own tip");
    }

    await tx.communityTipVote.upsert({
      where: {
        tipId_deviceHash: { tipId: input.tipId, deviceHash },
      },
      create: {
        tipId: input.tipId,
        deviceHash,
        vote: input.vote,
      },
      update: { vote: input.vote },
    });

    const votes = await tx.communityTipVote.findMany({
      where: { tipId: input.tipId },
    });
    const agree = votes.filter((v) => v.vote === "agree").length;
    const disagree = votes.filter((v) => v.vote === "disagree").length;
    const status = recomputeStatus(agree, disagree, tip.status);

    const updated = await tx.communityTip.update({
      where: { id: input.tipId },
      data: {
        agreeCount: agree,
        disagreeCount: disagree,
        status,
      },
    });

    return {
      status: updated.status,
      agree_count: updated.agreeCount,
      disagree_count: updated.disagreeCount,
    };
  });
}
