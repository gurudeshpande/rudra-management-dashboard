import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/imds/submissions - list BOM submissions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 },
      );
    }

    const where: any = { tenantId };
    if (status) where.status = status;

    const [submissions, total] = await Promise.all([
      prisma.iMDSBomSubmission.findMany({
        where,
        include: {
          supplier: {
            select: { name: true, tier: true, complianceScore: true },
          },
          _count: { select: { materialEntries: true, complianceChecks: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.iMDSBomSubmission.count({ where }),
    ]);

    return NextResponse.json({
      submissions,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[IMDS Submissions GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/imds/submissions - create BOM submission record
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenantId,
      supplierId,
      bomId,
      fileName,
      fileUrl,
      fileType,
      rowCount,
    } = body;

    if (!tenantId || !bomId || !fileName || !fileType) {
      return NextResponse.json(
        {
          error: "Missing required fields: tenantId, bomId, fileName, fileType",
        },
        { status: 400 },
      );
    }

    // Check tenant exists
    const tenant = await prisma.iMDSTenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const submission = await prisma.iMDSBomSubmission.create({
      data: {
        tenantId,
        supplierId: supplierId ?? null,
        bomId,
        fileName,
        fileUrl: fileUrl ?? null,
        fileType,
        rowCount: rowCount ?? null,
        status: "QUEUED",
      },
    });

    // Create audit log entry
    await prisma.iMDSAuditLog.create({
      data: {
        tenantId,
        submissionId: submission.id,
        action: "BOM_IMPORTED",
        entity: bomId,
        entityType: "BomSubmission",
        details: `BOM file '${fileName}' imported. ${rowCount ? `${rowCount} rows detected.` : ""} AI extraction job queued.`,
        result: "success",
      },
    });

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "BOM ID already exists" },
        { status: 409 },
      );
    }
    console.error("[IMDS Submissions POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
