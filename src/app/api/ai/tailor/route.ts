import { NextRequest, NextResponse } from "next/server";
import { generateObject, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import {
  tailorResultSchema,
  tailorRequestSchema,
  type TailorResult,
} from "@/lib/schemas/tailor";
import { z } from "zod";

// ---------------------------------------------------------------------------
// System Prompt
// ---------------------------------------------------------------------------

const TAILOR_SYSTEM_PROMPT = `你是一个顶级的互联网大厂资深 HR 与技术面霸导师。你的任务是根据用户的【全量履历库】和【目标岗位描述(JD)】，为用户量身定制一份最具竞争力的简历结构，并提供面试预测。

绝对遵守以下规则，违反任何一条将导致生成失败：

1. **反幻觉红线**：绝对不准捏造用户没有的经历、技能或数据。你只能做"选择"、"裁剪"、"重组"和"话术包装"。如果用户的经历完全不匹配 JD，请基于用户原有经历提炼可迁移能力（如：沟通、学习能力），切勿无中生有。

2. **STAR 法则重写**：在 tailoredBullets 中，必须用包含具体动作和结果的专业术语重写经历（情境-任务-行动-结果），突出与 JD 中要求相关的数据或关键词。

3. **精准裁剪**：无论用户提供了多少项目，你最多只挑选出最能匹配 JD 核心诉求的 3 个项目。

4. **针对性面试预测**：精准找出用户履历和 JD 之间的"契合点"与"薄弱点"，以此生成面试题。
   - highFrequencyQuestions：基于契合点生成，帮助用户准备自己的强项。
   - weaknessQuestions：基于薄弱点生成，帮助用户准备可能被追问的短板。

5. **语言风格**：所有输出使用中文，技术术语保留英文原文（如 React、Kubernetes）。`;

// ---------------------------------------------------------------------------
// Model factory — 通过环境变量 AI_PROVIDER 切换底层模型
// ---------------------------------------------------------------------------

function getModel() {
  const provider = process.env.AI_PROVIDER ?? "openai";
  const baseURL = process.env.OPENAI_BASE_URL;
  // 检测需要使用兼容模式的模型
  const isQwen = baseURL?.includes("dashscope") || baseURL?.includes("aliyun");
  const isDeepSeek = baseURL?.includes("deepseek");
  const needsCompatibleMode = isQwen || isDeepSeek;

  if (provider === "anthropic") {
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "",
      baseURL: process.env.ANTHROPIC_BASE_URL,
    });
    return anthropic(process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20240620");
  }

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? "",
    baseURL: process.env.OPENAI_BASE_URL,
  });
  return openai(process.env.OPENAI_MODEL ?? "gpt-4o");
}

// ---------------------------------------------------------------------------
// 将 MasterProfile 组装为 user prompt
// ---------------------------------------------------------------------------

function buildUserPrompt(masterProfile: string, targetJd: string): string {
  return `## 我的全量履历库

${masterProfile}

---

## 目标岗位 JD

${targetJd}

---

请根据以上信息，为我生成一份高度匹配目标岗位的定制化简历结构和面试预测。`;
}

// ---------------------------------------------------------------------------
// Qwen JSON 格式示例
// ---------------------------------------------------------------------------

const QWEN_JSON_FORMAT = `{
  "tailoredSummary": "一段 100 字左右的个人优势总结",
  "matchedSkills": ["技能 1", "技能 2"],
  "selectedProjects": [
    {
      "projectName": "项目名称",
      "role": "项目角色",
      "tailoredBullets": ["Bullet 1", "Bullet 2", "Bullet 3"]
    }
  ],
  "interviewPreparation": {
    "highFrequencyQuestions": ["问题 1", "问题 2", "问题 3"],
    "weaknessQuestions": ["问题 1", "问题 2"],
    "tips": "面试策略建议"
  }
}`;

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = tailorRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "参数校验失败",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { masterProfile, targetJd } = parsed.data;
    const model = getModel();
    const baseURL = process.env.OPENAI_BASE_URL;
    // 检测需要使用兼容模式的模型（Qwen、DeepSeek 等）
    const isQwen = baseURL?.includes("dashscope") || baseURL?.includes("aliyun");
    const isDeepSeek = baseURL?.includes("deepseek");
    const needsCompatibleMode = isQwen || isDeepSeek;

    // 兼容模式：使用 generateText + 手动 JSON 解析（适用于 Qwen、DeepSeek 等）
    if (needsCompatibleMode) {
      const { text } = await generateText({
        model,
        system: TAILOR_SYSTEM_PROMPT + "\n\n请以严格的 JSON 格式返回结果，不要包含任何其他说明文字。",
        prompt: buildUserPrompt(masterProfile, targetJd) + `\n\n请直接返回 JSON 对象，格式如下：
\`\`\`json
${QWEN_JSON_FORMAT}
\`\`\`
不要有任何其他文字，只返回 JSON。`,
      });

      // 尝试提取 JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;

      try {
        const parsed = JSON.parse(jsonStr);
        const result = tailorResultSchema.parse(parsed);
        return NextResponse.json(result);
      } catch (parseErr) {
        console.error("[tailor] JSON parse failed:", parseErr, "Raw text:", text);
        return NextResponse.json(
          { error: "AI 返回的格式无法解析，请重试或更换模型" },
          { status: 500 }
        );
      }
    }

    // 非 Qwen 使用 generateObject
    const { object } = await generateObject({
      model,
      schema: tailorResultSchema,
      system: TAILOR_SYSTEM_PROMPT,
      prompt: buildUserPrompt(masterProfile, targetJd),
    });

    const result: TailorResult = object;
    return NextResponse.json(result);
  } catch (err) {
    console.error("[tailor] AI generation failed:", err);

    const message =
      err instanceof Error ? err.message : "AI 生成失败，请稍后重试";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
