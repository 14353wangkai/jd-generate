"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Clock,
  Send,
  MessageSquare,
  CheckCircle2,
  Building2,
  X,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ApplicationCard {
  id: string;
  company: string;
  role: string;
  status: string;
  date: string;
  jdText?: string;
}

const STATUS_COLUMNS = [
  {
    key: "PREPARING",
    label: "准备中",
    icon: Clock,
    gradient: "from-amber-500 to-orange-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dotColor: "bg-amber-400",
  },
  {
    key: "APPLIED",
    label: "已投递",
    icon: Send,
    gradient: "from-blue-500 to-cyan-500",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dotColor: "bg-blue-400",
  },
  {
    key: "INTERVIEWING",
    label: "面试中",
    icon: MessageSquare,
    gradient: "from-violet-500 to-purple-500",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    dotColor: "bg-violet-400",
  },
  {
    key: "CLOSED",
    label: "已结束",
    icon: CheckCircle2,
    gradient: "from-slate-400 to-slate-500",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dotColor: "bg-slate-400",
  },
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    company: "",
    role: "",
    jdText: "",
  });

  // 加载投递数据
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch("/api/applications");
        if (!res.ok) throw new Error("获取数据失败");
        const data = await res.json();
        setApplications(
          data.map((app: any) => ({
            id: app.id,
            company: app.company,
            role: app.role,
            status: app.status,
            date: app.createdAt.split("T")[0],
            jdText: app.jdText,
          }))
        );
      } catch (err) {
        console.error("Failed to load applications:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const getCardsByStatus = (status: string) =>
    applications.filter((app) => app.status === status);

  const handleSubmit = async () => {
    if (!formData.company || !formData.role) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetCompany: formData.company,
          targetRole: formData.role,
          jdText: formData.jdText,
          status: "PREPARING",
        }),
      });

      if (!res.ok) throw new Error("创建失败");

      const newApp = await res.json();
      setApplications((prev) => [
        ...prev,
        {
          id: newApp.id,
          company: newApp.company,
          role: newApp.role,
          status: newApp.status,
          date: newApp.createdAt.split("T")[0],
        },
      ]);

      setFormData({ company: "", role: "", jdText: "" });
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to create application:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">投递看板</h1>
          <p className="text-sm text-muted-foreground">
            追踪你的每一次投递，直观掌握求职全流程
          </p>
        </div>
        <Button
          className="shadow-sm shadow-indigo-500/20"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          新增投递
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {STATUS_COLUMNS.map((col) => {
          const count = getCardsByStatus(col.key).length;
          return (
            <div
              key={col.key}
              className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${col.gradient} text-white shadow-sm`}
              >
                <col.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{col.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          STATUS_COLUMNS.map((column) => {
            const cards = getCardsByStatus(column.key);
            return (
              <div key={column.key} className="space-y-3">
                {/* Column Header */}
                <div className="flex items-center gap-2.5 px-1">
                  <div className={`h-2 w-2 rounded-full ${column.dotColor}`} />
                  <h2 className="text-sm font-semibold">{column.label}</h2>
                  <Badge
                    variant="secondary"
                    className="ml-auto h-5 rounded-md px-1.5 text-[10px] font-bold"
                  >
                    {cards.length}
                  </Badge>
                </div>

                {/* Cards */}
                <div className="space-y-2.5">
                  {cards.map((app) => (
                    <Card
                      key={app.id}
                      className="cursor-pointer border-transparent bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="truncate text-sm font-semibold">
                              {app.company}
                            </CardTitle>
                            <CardDescription className="truncate text-xs">
                              {app.role}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardFooter className="px-4 pb-3 pt-1">
                        <div className="flex w-full items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">
                            {app.date}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${column.badge}`}
                          >
                            {column.label}
                          </Badge>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}

                  {cards.length === 0 && (
                    <div className="flex h-28 items-center justify-center rounded-xl border border-dashed bg-muted/20">
                      <p className="text-xs text-muted-foreground">暂无记录</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">新增投递</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">公司名称</label>
                <Input
                  placeholder="例如：字节跳动"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, company: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">职位名称</label>
                <Input
                  placeholder="例如：高级前端工程师"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, role: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  JD 描述（可选）
                </label>
                <Textarea
                  placeholder="粘贴职位描述..."
                  rows={4}
                  value={formData.jdText}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, jdText: e.target.value }))
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  取消
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.company || !formData.role}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    "确认添加"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
