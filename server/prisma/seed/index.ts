import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Core reference seed from APPLY_ALL_CIVIC Phase 1 (no invented contacts). */
async function main() {
  await prisma.caseIdCounter.upsert({
    where: { id: 1 },
    create: { id: 1, value: BigInt(0) },
    update: {},
  });

  const categories = [
    { slug: "building", name: "Building", shortDescription: "Possible building or property issue", sortOrder: 1 },
    { slug: "fire_safety", name: "Fire Safety", shortDescription: "Fire risk, blocked exit or safety concern", sortOrder: 2 },
    { slug: "construction", name: "Construction", shortDescription: "Construction, demolition or site concern", sortOrder: 3 },
    { slug: "electricity", name: "Electricity", shortDescription: "Exposed wires, unsafe connection or electrical issue", sortOrder: 4 },
    { slug: "water_drainage", name: "Water & Drainage", shortDescription: "Leakage, flooding, drainage or water issue", sortOrder: 5 },
    { slug: "waste_garbage", name: "Waste & Garbage", shortDescription: "Garbage, dumping or waste-management issue", sortOrder: 6 },
    { slug: "roads_public_spaces", name: "Roads & Public Spaces", shortDescription: "Road, footpath, streetlight or public-space issue", sortOrder: 7 },
    { slug: "environment", name: "Environment", shortDescription: "Pollution or environmental concern", sortOrder: 8 },
    { slug: "something_else", name: "Something Else", shortDescription: "I don't see my issue", sortOrder: 9 },
  ];

  for (const c of categories) {
    await prisma.issueCategory.upsert({
      where: { slug: c.slug },
      create: c,
      update: {
        name: c.name,
        shortDescription: c.shortDescription,
        sortOrder: c.sortOrder,
        active: true,
      },
    });
  }

  const contacts = [
    {
      region: "delhi",
      number: "112",
      label: "All Emergencies",
      description: "National emergency response support system",
      sortOrder: 1,
      sourceName: "112 India",
      sourceUrl: "https://112.gov.in/",
    },
    {
      region: "delhi",
      number: "101",
      label: "Fire",
      description: "Delhi Fire Service / Fire Control Room",
      sortOrder: 2,
      sourceName: "Delhi Fire Service",
      sourceUrl: "https://dfs.delhi.gov.in/",
    },
    {
      region: "delhi",
      number: "102",
      label: "Ambulance",
      description: "Ambulance emergency service",
      sortOrder: 3,
      sourceName: "District Magistrate New Delhi — Helpline",
      sourceUrl: "https://dmnewdelhi.delhi.gov.in/helpline/",
    },
  ];

  for (const row of contacts) {
    await prisma.emergencyContact.upsert({
      where: { region_number: { region: row.region, number: row.number } },
      create: { ...row, lastVerifiedAt: new Date() },
      update: {
        label: row.label,
        description: row.description,
        sourceName: row.sourceName,
        sourceUrl: row.sourceUrl,
        sortOrder: row.sortOrder,
        active: true,
        lastVerifiedAt: new Date(),
      },
    });
  }

  const dfs = await prisma.authority.upsert({
    where: { slug: "delhi_fire_service" },
    create: {
      slug: "delhi_fire_service",
      name: "Delhi Fire Service",
      department: "Delhi Fire Service",
      government: "Government of NCT of Delhi",
      officialWebsite: "https://dfs.delhi.gov.in/",
      emergencyNumber: "101",
      sourceName: "Delhi Fire Service",
      sourceUrl: "https://dfs.delhi.gov.in/",
      lastVerifiedAt: new Date(),
    },
    update: {
      name: "Delhi Fire Service",
      officialWebsite: "https://dfs.delhi.gov.in/",
      emergencyNumber: "101",
      active: true,
      lastVerifiedAt: new Date(),
    },
  });

  const fireCat = await prisma.issueCategory.findUniqueOrThrow({
    where: { slug: "fire_safety" },
  });

  const fireTypes = [
    { slug: "blocked_emergency_exit", name: "Blocked emergency exit", shortDescription: "An emergency exit appears blocked or inaccessible", sortOrder: 1 },
    { slug: "missing_fire_extinguisher", name: "Missing fire extinguisher", shortDescription: "Required fire extinguisher appears missing", sortOrder: 2 },
    { slug: "non_functional_fire_extinguisher", name: "Non-functional fire extinguisher", shortDescription: "Fire extinguisher appears damaged or unusable", sortOrder: 3 },
    { slug: "unsafe_fire_exit", name: "Unsafe fire exit", shortDescription: "Fire exit appears unsafe or poorly marked", sortOrder: 4 },
  ];

  for (const t of fireTypes) {
    await prisma.issueType.upsert({
      where: { slug: t.slug },
      create: {
        ...t,
        categoryId: fireCat.id,
        emergencyRelevant: true,
      },
      update: {
        name: t.name,
        shortDescription: t.shortDescription,
        sortOrder: t.sortOrder,
        categoryId: fireCat.id,
        active: true,
        emergencyRelevant: true,
      },
    });
  }

  const existingPhone = await prisma.authorityChannel.findFirst({
    where: {
      authorityId: dfs.id,
      channelType: "phone",
      value: "101",
    },
  });
  if (!existingPhone) {
    await prisma.authorityChannel.create({
      data: {
        authorityId: dfs.id,
        channelType: "phone",
        label: "Fire Control Room",
        value: "101",
        sourceName: "Delhi Fire Service",
        sourceUrl: "https://dfs.delhi.gov.in/",
        lastVerifiedAt: new Date(),
      },
    });
  }

  const existingWeb = await prisma.authorityChannel.findFirst({
    where: { authorityId: dfs.id, channelType: "website" },
  });
  if (!existingWeb) {
    await prisma.authorityChannel.create({
      data: {
        authorityId: dfs.id,
        channelType: "website",
        label: "Official website",
        value: "https://dfs.delhi.gov.in/",
        sourceName: "Delhi Fire Service",
        sourceUrl: "https://dfs.delhi.gov.in/",
        lastVerifiedAt: new Date(),
      },
    });
  }

  const existingRoute = await prisma.routingRule.findFirst({
    where: { categoryId: fireCat.id, authorityId: dfs.id },
  });
  if (!existingRoute) {
    await prisma.routingRule.create({
      data: {
        categoryId: fireCat.id,
        authorityId: dfs.id,
        confidence: "likely",
        notes: "Fire safety concerns in Delhi often involve Delhi Fire Service",
        sourceName: "Delhi Fire Service",
        sourceUrl: "https://dfs.delhi.gov.in/",
        lastVerifiedAt: new Date(),
      },
    });
  }

  console.log("Seed complete (core Phase-1 reference data).");
  console.log(
    "For full category catalogs, import remaining rows from backend/ legacy SQL into MySQL (see docs/MIGRATION_FROM_SUPABASE.md)."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
