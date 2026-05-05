import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const applications = await db.application.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      applications.map((app) => ({
        id: app.id,
        company: app.targetCompany,
        role: app.targetRole,
        status: app.status,
        jdText: app.jdText,
        tailoredData: JSON.parse(app.tailoredData),
        interviewQA: JSON.parse(app.interviewQA),
        notes: app.notes,
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
      }))
    );
  } catch (err) {
    console.error("[applications] GET failed:", err);
    return NextResponse.json(
      { error: "获取投递记录失败" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      targetCompany,
      targetRole,
      jdText,
      status = "PREPARING",
      notes = "",
    } = body;

    if (!targetCompany || !targetRole) {
      return NextResponse.json(
        { error: "公司和职位不能为空" },
        { status: 400 }
      );
    }

    const application = await db.application.create({
      data: {
        targetCompany,
        targetRole,
        jdText: jdText || "",
        status,
        notes,
        tailoredData: "{}",
        interviewQA: "[]",
      },
    });

    return NextResponse.json({
      id: application.id,
      company: application.targetCompany,
      role: application.targetRole,
      status: application.status,
      createdAt: application.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("[applications] POST failed:", err);
    return NextResponse.json(
      { error: "创建投递记录失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "缺少投递 ID" },
        { status: 400 }
      );
    }

    await db.application.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[applications] DELETE failed:", err);
    return NextResponse.json(
      { error: "删除投递记录失败" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "缺少投递 ID" },
        { status: 400 }
      );
    }

    const application = await db.application.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      id: application.id,
      status: application.status,
    });
  } catch (err) {
    console.error("[applications] PATCH failed:", err);
    return NextResponse.json(
      { error: "更新投递记录失败" },
      { status: 500 }
    );
  }
}
