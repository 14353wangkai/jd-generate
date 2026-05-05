"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, User, Briefcase, Code2, GraduationCap, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ProjectEntry {
  id: string;
  name: string;
  role: string;
  period: string;
  description: string;
  highlights: string;
}

interface EducationEntry {
  school: string;
  degree: string;
  period: string;
}

interface WorkExpEntry {
  company: string;
  role: string;
  period: string;
  description: string;
}

function createEmptyProject(): ProjectEntry {
  return {
    id: crypto.randomUUID(),
    name: "",
    role: "",
    period: "",
    description: "",
    highlights: "",
  };
}

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const [basicInfo, setBasicInfo] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
  });

  const [skills, setSkills] = useState("");
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [workExp, setWorkExp] = useState<WorkExpEntry[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([createEmptyProject()]);

  // 页面加载时从 API 获取数据
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("获取数据失败");
        const data = await res.json();

        setBasicInfo({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          location: data.location || "",
          summary: data.summary || "",
        });
        setSkills(Array.isArray(data.skills) ? data.skills.join(", ") : data.skills || "");
        setEducation(data.education || []);
        setWorkExp(data.workExp || []);

        // 加载项目数据
        if (data.projects && data.projects.length > 0) {
          const loadedProjects: ProjectEntry[] = data.projects.map((p: any, i: number) => ({
            id: p.id || crypto.randomUUID(),
            name: p.name || "",
            role: p.role || "",
            period: p.period || "",
            description: p.description || "",
            highlights: p.highlights || "",
          }));
          setProjects(loadedProjects);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const addProject = () => {
    setProjects((prev) => [...prev, createEmptyProject()]);
  };

  const removeProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const updateProject = (
    id: string,
    field: keyof ProjectEntry,
    value: string
  ) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const payload = {
        ...basicInfo,
        skills,
        education,
        workExp,
        projects: projects.map(({ id, ...rest }) => rest), // 移除 id，只保存数据
      };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "保存失败");
      }

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">履历素材库</h1>
          <p className="text-sm text-muted-foreground">
            在这里维护你的全量简历数据，AI 将从中提取最匹配目标岗位的内容
          </p>
        </div>
        <Button
          className="shadow-sm shadow-indigo-500/20"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : saveStatus === "success" ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
              已保存
            </>
          ) : saveStatus === "error" ? (
            <>
              <AlertCircle className="mr-2 h-4 w-4 text-destructive" />
              保存失败
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              保存全部
            </>
          )}
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (
        <>
      {/* 基本信息 */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <User className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base">基本信息</CardTitle>
              <CardDescription>你的联系方式和个人概述</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">姓名</label>
            <Input
              placeholder="张三"
              value={basicInfo.name}
              onChange={(e) =>
                setBasicInfo((s) => ({ ...s, name: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">邮箱</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={basicInfo.email}
              onChange={(e) =>
                setBasicInfo((s) => ({ ...s, email: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">电话</label>
            <Input
              placeholder="+86 138xxxxxxxx"
              value={basicInfo.phone}
              onChange={(e) =>
                setBasicInfo((s) => ({ ...s, phone: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">所在地</label>
            <Input
              placeholder="北京"
              value={basicInfo.location}
              onChange={(e) =>
                setBasicInfo((s) => ({ ...s, location: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium">个人简介</label>
            <Textarea
              placeholder="用 2-3 句话概述你的职业定位和核心优势..."
              rows={3}
              value={basicInfo.summary}
              onChange={(e) =>
                setBasicInfo((s) => ({ ...s, summary: e.target.value }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 技能标签 */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Code2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base">技能库</CardTitle>
              <CardDescription>列出你掌握的所有技术栈和软技能</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="用逗号分隔技能，如：React, TypeScript, Node.js, PostgreSQL, 团队管理"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
          {skills && (
            <div className="flex flex-wrap gap-2 pt-1">
              {skills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  >
                    {skill}
                  </Badge>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 教育经历 */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <GraduationCap className="h-4.5 w-4.5" />
              </div>
              <div>
                <CardTitle className="text-base">教育经历</CardTitle>
                <CardDescription>
                  填写你的学历信息
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEducation((prev) => [...prev, { school: "", degree: "", period: "" }])}
              className="shadow-sm"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              添加教育
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {education.map((edu, idx) => (
            <div
              key={idx}
              className="space-y-4 rounded-xl border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-100 text-xs font-bold text-violet-600">
                    {idx + 1}
                  </div>
                  <span className="text-sm font-medium">
                    {edu.school || "新教育经历"}
                  </span>
                </div>
                {education.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setEducation((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    学校名称
                  </label>
                  <Input
                    placeholder="XX 大学"
                    value={edu.school}
                    onChange={(e) =>
                      setEducation((prev) =>
                        prev.map((ed, i) => (i === idx ? { ...ed, school: e.target.value } : ed))
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    学历/专业
                  </label>
                  <Input
                    placeholder="本科 - 计算机科学与技术"
                    value={edu.degree}
                    onChange={(e) =>
                      setEducation((prev) =>
                        prev.map((ed, i) => (i === idx ? { ...ed, degree: e.target.value } : ed))
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    时间段
                  </label>
                  <Input
                    placeholder="2018.09 - 2022.06"
                    value={edu.period}
                    onChange={(e) =>
                      setEducation((prev) =>
                        prev.map((ed, i) => (i === idx ? { ...ed, period: e.target.value } : ed))
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))}
          {education.length === 0 && (
            <div className="flex h-24 items-center justify-center rounded-xl border border-dashed bg-muted/20">
              <p className="text-xs text-muted-foreground">暂无教育经历，点击"添加教育"添加</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 工作经历 */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Briefcase className="h-4.5 w-4.5" />
              </div>
              <div>
                <CardTitle className="text-base">工作经历</CardTitle>
                <CardDescription>
                  填写你的工作经历（可选）
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWorkExp((prev) => [...prev, { company: "", role: "", period: "", description: "" }])}
              className="shadow-sm"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              添加工作
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {workExp.map((work, idx) => (
            <div
              key={idx}
              className="space-y-4 rounded-xl border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-xs font-bold text-blue-600">
                    {idx + 1}
                  </div>
                  <span className="text-sm font-medium">
                    {work.company || "新工作经历"}
                  </span>
                </div>
                {workExp.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setWorkExp((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    公司名称
                  </label>
                  <Input
                    placeholder="XX 科技有限公司"
                    value={work.company}
                    onChange={(e) =>
                      setWorkExp((prev) =>
                        prev.map((w, i) => (i === idx ? { ...w, company: e.target.value } : w))
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    担任职位
                  </label>
                  <Input
                    placeholder="前端开发工程师"
                    value={work.role}
                    onChange={(e) =>
                      setWorkExp((prev) =>
                        prev.map((w, i) => (i === idx ? { ...w, role: e.target.value } : w))
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    时间段
                  </label>
                  <Input
                    placeholder="2022.07 - 至今"
                    value={work.period}
                    onChange={(e) =>
                      setWorkExp((prev) =>
                        prev.map((w, i) => (i === idx ? { ...w, period: e.target.value } : w))
                      )
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  工作描述
                </label>
                <Textarea
                  placeholder="描述你的工作职责和主要成就..."
                  rows={2}
                  value={work.description}
                  onChange={(e) =>
                    setWorkExp((prev) =>
                      prev.map((w, i) => (i === idx ? { ...w, description: e.target.value } : w))
                    )
                  }
                />
              </div>
            </div>
          ))}
          {workExp.length === 0 && (
            <div className="flex h-24 items-center justify-center rounded-xl border border-dashed bg-muted/20">
              <p className="text-xs text-muted-foreground">暂无工作经历，点击"添加工作"添加</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 项目经历 */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Briefcase className="h-4.5 w-4.5" />
              </div>
              <div>
                <CardTitle className="text-base">项目经历</CardTitle>
                <CardDescription>
                  尽量多地填写，AI 会自动筛选最匹配的
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addProject}
              className="shadow-sm"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              添加项目
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {projects.map((project, idx) => (
            <div
              key={project.id}
              className="space-y-4 rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-xs font-bold text-indigo-600">
                    {idx + 1}
                  </div>
                  <span className="text-sm font-medium">
                    {project.name || "新项目"}
                  </span>
                </div>
                {projects.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeProject(project.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    项目名称
                  </label>
                  <Input
                    placeholder="智能推荐系统"
                    value={project.name}
                    onChange={(e) =>
                      updateProject(project.id, "name", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    担任角色
                  </label>
                  <Input
                    placeholder="前端负责人"
                    value={project.role}
                    onChange={(e) =>
                      updateProject(project.id, "role", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    时间段
                  </label>
                  <Input
                    placeholder="2023.06 - 2024.03"
                    value={project.period}
                    onChange={(e) =>
                      updateProject(project.id, "period", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  项目描述
                </label>
                <Textarea
                  placeholder="简述项目背景、技术栈和你的核心贡献..."
                  rows={2}
                  value={project.description}
                  onChange={(e) =>
                    updateProject(project.id, "description", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  亮点 / 量化成果
                </label>
                <Textarea
                  placeholder={"每条一行，例如：\n• 将页面加载速度优化 40%\n• 主导从 0 到 1 搭建前端监控体系"}
                  rows={2}
                  value={project.highlights}
                  onChange={(e) =>
                    updateProject(project.id, "highlights", e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}
