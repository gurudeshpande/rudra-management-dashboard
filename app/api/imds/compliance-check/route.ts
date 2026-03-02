import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Deterministic Rules Engine ────────────────────────────────────────────────

type Regulation = "REACH" | "ROHS" | "ELV";

interface SubstanceRule {
  casNumber: string;
  name: string;
  regulation: Regulation;
  thresholdPct: number;
  isSVHC: boolean;
}

// Core restricted substance rules (deterministic, no AI required)
const SUBSTANCE_RULES: SubstanceRule[] = [
  // RoHS Annex II (EU 2011/65/EU + 2015/863)
  {
    casNumber: "7439-92-1",
    name: "Lead (Pb)",
    regulation: "ROHS",
    thresholdPct: 0.1,
    isSVHC: false,
  },
  {
    casNumber: "7440-43-9",
    name: "Cadmium (Cd)",
    regulation: "ROHS",
    thresholdPct: 0.01,
    isSVHC: false,
  },
  {
    casNumber: "7439-97-6",
    name: "Mercury (Hg)",
    regulation: "ROHS",
    thresholdPct: 0.1,
    isSVHC: false,
  },
  {
    casNumber: "18540-29-9",
    name: "Hexavalent Chromium Cr(VI)",
    regulation: "ROHS",
    thresholdPct: 0.1,
    isSVHC: false,
  },
  {
    casNumber: "36355-01-8",
    name: "Polybrominated Biphenyls (PBB)",
    regulation: "ROHS",
    thresholdPct: 0.1,
    isSVHC: false,
  },
  {
    casNumber: "32534-81-9",
    name: "Polybrominated Diphenyl Ethers (PBDE)",
    regulation: "ROHS",
    thresholdPct: 0.1,
    isSVHC: false,
  },
  {
    casNumber: "117-81-7",
    name: "Di(2-ethylhexyl) phthalate (DEHP)",
    regulation: "ROHS",
    thresholdPct: 0.1,
    isSVHC: true,
  },
  {
    casNumber: "84-74-2",
    name: "Dibutyl phthalate (DBP)",
    regulation: "ROHS",
    thresholdPct: 0.1,
    isSVHC: true,
  },
  {
    casNumber: "85-68-7",
    name: "Benzyl butyl phthalate (BBP)",
    regulation: "ROHS",
    thresholdPct: 0.1,
    isSVHC: true,
  },
  {
    casNumber: "26761-40-0",
    name: "Diisobutyl phthalate (DIBP)",
    regulation: "ROHS",
    thresholdPct: 0.1,
    isSVHC: true,
  },

  // ELV Annex II (EU 2000/53/EC)
  {
    casNumber: "7439-92-1",
    name: "Lead (Pb)",
    regulation: "ELV",
    thresholdPct: 0.1,
    isSVHC: false,
  },
  {
    casNumber: "7440-43-9",
    name: "Cadmium (Cd)",
    regulation: "ELV",
    thresholdPct: 0.01,
    isSVHC: false,
  },
  {
    casNumber: "7439-97-6",
    name: "Mercury (Hg)",
    regulation: "ELV",
    thresholdPct: 0.1,
    isSVHC: false,
  },
  {
    casNumber: "18540-29-9",
    name: "Hexavalent Chromium Cr(VI)",
    regulation: "ELV",
    thresholdPct: 0.1,
    isSVHC: false,
  },

  // REACH SVHC (Aug 2024 - representative sample)
  {
    casNumber: "117-81-7",
    name: "DEHP",
    regulation: "REACH",
    thresholdPct: 0.1,
    isSVHC: true,
  },
  {
    casNumber: "85-68-7",
    name: "BBP (Benzyl Butyl Phthalate)",
    regulation: "REACH",
    thresholdPct: 0.1,
    isSVHC: true,
  },
  {
    casNumber: "84-74-2",
    name: "DBP (Dibutyl Phthalate)",
    regulation: "REACH",
    thresholdPct: 0.1,
    isSVHC: true,
  },
  {
    casNumber: "9036-19-5",
    name: "Octylphenol ethoxylates (OPEO)",
    regulation: "REACH",
    thresholdPct: 0.1,
    isSVHC: true,
  },
  {
    casNumber: "1309-64-4",
    name: "Antimony Trioxide (Sb2O3)",
    regulation: "REACH",
    thresholdPct: 0.1,
    isSVHC: false,
  },
];

// ── Main API Handler ──────────────────────────────────────────────────────────

// POST /api/imds/compliance-check
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { submissionId, tenantId, materialEntries } = body;

    if (!submissionId || !tenantId || !materialEntries?.length) {
      return NextResponse.json(
        { error: "submissionId, tenantId, and materialEntries are required" },
        { status: 400 },
      );
    }

    // Verify submission exists
    const submission = await prisma.iMDSBomSubmission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) {
      return NextResponse.json(
        { error: "BOM submission not found" },
        { status: 404 },
      );
    }

    const results = [];
    let violationCount = 0;
    let warnCount = 0;

    for (const entry of materialEntries) {
      const { casNumber, substanceName, weightPercent } = entry;

      if (!casNumber) continue;

      // Run deterministic rules engine
      const matchingRules = SUBSTANCE_RULES.filter(
        (r) => r.casNumber === casNumber,
      );

      for (const rule of matchingRules) {
        const detected = parseFloat(weightPercent);
        const threshold = rule.thresholdPct;

        let status: "PASS" | "FAIL" | "WARN";
        if (detected > threshold) {
          status = "FAIL";
          violationCount++;
        } else if (detected >= threshold * 0.85) {
          // Within 15% of threshold → warn
          status = "WARN";
          warnCount++;
        } else {
          status = "PASS";
        }

        const checkId = `CHK-${submissionId.slice(-6)}-${rule.casNumber.replace(/[^0-9]/g, "")}-${rule.regulation}`;

        // Generate AI reasoning placeholder (in production, call GPT-4 here)
        const aiReasoning = generateDeterministicReasoning(
          rule,
          detected,
          status,
        );

        const check = await prisma.iMDSComplianceCheck.upsert({
          where: { checkId },
          update: { status, detectedValue: detected, aiReasoning },
          create: {
            submissionId,
            checkId,
            substanceName: substanceName || rule.name,
            casNumber: rule.casNumber,
            regulation: rule.regulation as any,
            thresholdLimit: threshold,
            thresholdUnit: "%",
            detectedValue: detected,
            status: status as any,
            aiReasoning,
          },
        });

        results.push({
          checkId: check.checkId,
          substance: rule.name,
          regulation: rule.regulation,
          threshold: `${threshold}%`,
          detected: `${detected}%`,
          status,
          isSVHC: rule.isSVHC,
        });
      }
    }

    // Update submission with compliance results
    const complianceScore = Math.max(
      0,
      100 - violationCount * 20 - warnCount * 5,
    );

    await prisma.iMDSBomSubmission.update({
      where: { id: submissionId },
      data: {
        status:
          violationCount > 0 ? "COMPLIANCE_CHECKED" : "COMPLIANCE_CHECKED",
        hasViolations: violationCount > 0,
        violationCount,
        complianceScore,
      },
    });

    // Audit log
    await prisma.iMDSAuditLog.create({
      data: {
        tenantId,
        submissionId,
        action: "COMPLIANCE_CHECK",
        entity: submissionId,
        entityType: "BomSubmission",
        details: `Full compliance check executed: ${results.length} checks run. Violations: ${violationCount}. Warnings: ${warnCount}. Score: ${complianceScore}%.`,
        result: violationCount > 0 ? "warning" : "success",
      },
    });

    return NextResponse.json({
      submissionId,
      summary: {
        totalChecks: results.length,
        violations: violationCount,
        warnings: warnCount,
        passed: results.filter((r) => r.status === "PASS").length,
        complianceScore,
      },
      results,
    });
  } catch (error) {
    console.error("[IMDS Compliance Check POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateDeterministicReasoning(
  rule: SubstanceRule,
  detected: number,
  status: "PASS" | "FAIL" | "WARN",
): string {
  const directiveMap: Record<Regulation, string> = {
    REACH: "REACH Regulation (EC) No 1907/2006",
    ROHS: "RoHS Directive 2011/65/EU (as amended by 2015/863/EU)",
    ELV: "End-of-Life Vehicles Directive 2000/53/EC Annex II",
  };

  const directive = directiveMap[rule.regulation];
  const threshold = `${rule.thresholdPct}%`;
  const detectedStr = `${detected.toFixed(4)}%`;

  if (status === "FAIL") {
    return `${rule.name} is restricted under ${directive}. Maximum permissible concentration is ${threshold} by weight in homogeneous material. Detected concentration of ${detectedStr} exceeds this threshold. This constitutes a direct regulatory violation requiring immediate corrective action or a documented exemption claim.`;
  } else if (status === "WARN") {
    return `${rule.name} is restricted under ${directive} at ${threshold}. Detected value of ${detectedStr} is within limit but within 15% of threshold — designated as Near-Limit. Proactive supplier engagement and continuous monitoring recommended. Ensure current test certificates are on file.`;
  } else {
    return `${rule.name} is restricted under ${directive}. Detected concentration of ${detectedStr} is below the maximum permissible threshold of ${threshold}. Substance is compliant.${rule.isSVHC ? " Note: This substance appears on the REACH SVHC Candidate List — Article 33 communication to customers may be required." : ""}`;
  }
}
