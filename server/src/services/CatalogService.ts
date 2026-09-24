import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/errors.js";

export async function listEmergencyContacts(region = "delhi") {
  return prisma.emergencyContact.findMany({
    where: { active: true, region },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listCategories() {
  return prisma.issueCategory.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.issueCategory.findUnique({ where: { slug } });
}

export async function listIssueTypesForCategory(categorySlug: string) {
  const category = await prisma.issueCategory.findUnique({
    where: { slug: categorySlug },
  });
  if (!category) return [];
  return prisma.issueType.findMany({
    where: { categoryId: category.id, active: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listAssessmentQuestions(categorySlug: string) {
  const category = await prisma.issueCategory.findUnique({
    where: { slug: categorySlug },
  });
  if (!category) return [];
  return prisma.emergencyRule.findMany({
    where: {
      categoryId: category.id,
      ruleKind: "assessment_question",
      active: true,
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function fetchLikelyAuthorities(input: {
  categorySlug: string;
  issueTypeSlug?: string | null;
}) {
  const category = await prisma.issueCategory.findUnique({
    where: { slug: input.categorySlug },
  });
  if (!category) return { category: null, rules: [], channels: [] };

  let issueTypeId: string | undefined;
  if (input.issueTypeSlug) {
    const it = await prisma.issueType.findUnique({
      where: { slug: input.issueTypeSlug },
    });
    issueTypeId = it?.id;
  }

  const rules = await prisma.routingRule.findMany({
    where: {
      active: true,
      categoryId: category.id,
      OR: issueTypeId
        ? [{ issueTypeId }, { issueTypeId: null }]
        : undefined,
    },
    include: { authority: true },
    orderBy: { confidence: "asc" },
  });

  const authorityIds = [...new Set(rules.map((r) => r.authorityId))];
  const channels = await prisma.authorityChannel.findMany({
    where: { authorityId: { in: authorityIds }, active: true },
  });

  return { category, rules, channels };
}

export async function fetchAuthorityServices(authoritySlug: string) {
  const auth = await prisma.authority.findUnique({
    where: { slug: authoritySlug },
  });
  if (!auth || !auth.active) {
    throw new AppError("NOT_FOUND", "Authority not found", 404);
  }
  const services = await prisma.authorityService.findMany({
    where: { authorityId: auth.id, active: true },
    orderBy: { sortOrder: "asc" },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  });
  return { authority: auth, services };
}

export async function globalSearch(query: string) {
  const q = query.trim();
  if (!q) return { issueTypes: [], officialServices: [], citizenRights: [] };

  const [issueTypes, officialServices, citizenRights] = await Promise.all([
    prisma.issueType.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: q } },
          { slug: { contains: q } },
          { shortDescription: { contains: q } },
        ],
      },
      take: 20,
    }),
    prisma.officialService.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: q } },
          { slug: { contains: q } },
          { description: { contains: q } },
        ],
      },
      take: 20,
    }),
    prisma.citizenRight.findMany({
      where: {
        active: true,
        OR: [
          { title: { contains: q } },
          { slug: { contains: q } },
          { body: { contains: q } },
        ],
      },
      take: 20,
    }),
  ]);

  return { issueTypes, officialServices, citizenRights };
}
