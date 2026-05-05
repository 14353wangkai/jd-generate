import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const profile = await db.masterProfile.findFirst();

    if (!profile) {
      return NextResponse.json({
        name: "",
        email: "",
        phone: "",
        location: "",
        summary: "",
        skills: "",
        education: [],
        workExp: [],
        projects: [],
      });
    }

    // 解析 skills - 数据库中是 JSON 字符串数组
    let skillsStr = "";
    try {
      const skillsParsed = JSON.parse(profile.skills);
      skillsStr = Array.isArray(skillsParsed) ? skillsParsed.join(", ") : profile.skills;
    } catch {
      skillsStr = profile.skills || "";
    }

    return NextResponse.json({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      summary: profile.summary,
      skills: skillsStr,
      education: JSON.parse(profile.education || "[]"),
      workExp: JSON.parse(profile.workExp || "[]"),
      projects: JSON.parse(profile.projects || "[]"),
    });
  } catch (err) {
    console.error("[profile] GET failed:", err);
    return NextResponse.json(
      { error: "获取履历数据失败" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      email,
      phone,
      location,
      summary,
      skills,
      education,
      workExp,
      projects,
    } = body;

    // 解析并验证 JSON 字段
    const educationJson = JSON.stringify(education || []);
    const workExpJson = JSON.stringify(workExp || []);
    const projectsJson = JSON.stringify(projects || []);
    const skillsJson = JSON.stringify(
      skills
        ? skills.split(",").map((s: string) => s.trim()).filter(Boolean)
        : []
    );

    // 查找是否存在记录，存在则更新，不存在则创建
    const existing = await db.masterProfile.findFirst();

    if (existing) {
      await db.masterProfile.update({
        where: { id: existing.id },
        data: {
          name: name || "",
          email: email || "",
          phone: phone || "",
          location: location || "",
          summary: summary || "",
          skills: skillsJson,
          education: educationJson,
          workExp: workExpJson,
          projects: projectsJson,
        },
      });
    } else {
      await db.masterProfile.create({
        data: {
          name: name || "",
          email: email || "",
          phone: phone || "",
          location: location || "",
          summary: summary || "",
          skills: skillsJson,
          education: educationJson,
          workExp: workExpJson,
          projects: projectsJson,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[profile] PUT failed:", err);
    return NextResponse.json(
      { error: "保存履历数据失败" },
      { status: 500 }
    );
  }
}
