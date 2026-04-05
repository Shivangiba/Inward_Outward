import { prisma } from "./prisma";

/**
 * Generates the next sequential number for Inward/Outward entries.
 * Format: [PREFIX]/[YEAR]/[SEQUENCE]
 * Example: INW/2026/001
 */
export async function getNextSequence(
  type: "INW" | "OUT",
  officeId: number,
  date: Date
): Promise<string> {
  // 1. Determine Financial Year (Starts April)
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth(); // 0-indexed, 3 = April
  const finYear = currentMonth >= 3 ? currentYear : currentYear - 1;

  // 2. Get the latest record for this office and financial year
  let lastNo: string | null = null;

  if (type === "INW") {
    const lastEntry = await prisma.inward.findFirst({
      where: {
        ToInwardOutwardOfficeID: officeId,
        InwardDate: {
          gte: new Date(finYear, 3, 1), // April 1st
          lt: new Date(finYear + 1, 3, 1), // Next April 1st
        },
      },
      orderBy: { InwardID: "desc" },
    });
    lastNo = lastEntry?.InwardNo || null;
  } else {
    const lastEntry = await prisma.outward.findFirst({
      where: {
        FromInwardOutwardOfficeID: officeId,
        OutwardDate: {
          gte: new Date(finYear, 3, 1),
          lt: new Date(finYear + 1, 3, 1),
        },
      },
      orderBy: { OutwardID: "desc" },
    });
    lastNo = lastEntry?.OutwardNo || null;
  }

  let nextSeq = 1;

  if (lastNo && lastNo.includes("/")) {
    // Parse existing number: PREFIX/YEAR/SEQ
    const parts = lastNo.split("/");
    const lastSeq = parseInt(parts[parts.length - 1]);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  } else {
    // If no last record, check Opening Numbers from Office Master
    const office = await prisma.inwardOutwardOffice.findUnique({
      where: { InwardOutwardOfficeID: officeId },
    });

    if (office) {
      const openingNo = type === "INW" ? office.OpeningInwardNo : office.OpeningOutwardNo;
      nextSeq = openingNo > 0 ? openingNo : 1;
    }
  }

  // 3. Format with leading zeros (e.g., 001)
  const seqString = nextSeq.toString().padStart(3, "0");
  return `${type}/${finYear}/${seqString}`;
}
