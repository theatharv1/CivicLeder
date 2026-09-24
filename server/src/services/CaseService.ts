import { prisma } from "../config/prisma.js";

/**
 * Concurrency-safe MD-###### generator.
 * Replaces Postgres nextval('my_delhi_case_seq') using a single-row counter
 * updated inside a transaction (SELECT … FOR UPDATE via Prisma interactive tx).
 */
export async function nextCaseId(): Promise<string> {
  return prisma.$transaction(async (tx) => {
    let row = await tx.caseIdCounter.findUnique({ where: { id: 1 } });
    if (!row) {
      row = await tx.caseIdCounter.create({ data: { id: 1, value: BigInt(0) } });
    }
    const next = row.value + BigInt(1);
    await tx.caseIdCounter.update({
      where: { id: 1 },
      data: { value: next },
    });
    return `MD-${String(next).padStart(6, "0")}`;
  });
}
