import { searchPsychologyKb, formatKbForPrompt } from "./psychologyKbSearch";
import { chatCompletionsDashscope, type ChatMessage } from "./llmDashscope";

function riskFromUserText(userContent: string) {
  const low = userContent.toLowerCase();
  const hasAnxietySignal =
    /(睡|焦虑|心慌|担心|累|难受)/.test(userContent) ||
    /(sleep|anx|worry|panic|tired)/.test(low);
  const anxiety = hasAnxietySignal ? 65 : 35;
  const depression = hasAnxietySignal ? 42 : 26;
  const bipolar = hasAnxietySignal ? 22 : 16;
  const level: "low" | "medium" | "high" =
    anxiety >= 70 ? "high" : anxiety >= 45 ? "medium" : "low";
  const reassessTriggered = Math.random() > 0.65;
  const emotionTag = hasAnxietySignal ? "care" : "calm";
  return {
    anxiety,
    depression,
    bipolar,
    level,
    reassessTriggered,
    emotionTag,
    hasAnxietySignal,
  };
}

function mockReply(userContent: string, hasAnxietySignal: boolean) {
  return hasAnxietySignal
    ? "听到您提到睡眠和心慌，我能理解这会让人很辛苦。我们先慢慢来，先做三次深呼吸，再说说最近哪段时间最难受。"
    : `谢谢您告诉我这些感受。关于“${userContent || "这件事"}”，我在认真听。我们可以一起找一个今天就能做到的小步骤。`;
}

const SYSTEM_BASE = `你是「心聆」里的中文心理陪伴助手，语气温暖、具体、不评判。
重要边界：你不能做医学或精神科诊断，不能替代持证心理咨询师或医生。若用户提及自伤自杀、伤人或急性危机，应明确建议立即联系当地紧急援助或专业机构。
回复要简洁可读，可适当给出一两个小步骤建议，避免说教与空泛鸡汤。`;

function normalizeHistory(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: string }).role;
    const content = String((item as { content?: string }).content ?? "").trim();
    if (!content) continue;
    if (role === "user" || role === "assistant") {
      out.push({ role, content });
    }
  }
  return out.slice(-24);
}

export async function handleChatMessage(body: {
  content?: string;
  message?: string;
  sessionId?: string;
  psychologyMentor?: boolean;
  history?: unknown;
}): Promise<{
  id: string;
  sessionId: string;
  replyText: string;
  emotionTag: string;
  risk: {
    anxiety: number;
    depression: number;
    bipolar: number;
    level: "low" | "medium" | "high";
    reassessTriggered: boolean;
  };
  reassessTriggered: boolean;
  timestamp: string;
  kbEntryIds?: string[];
  usedLlm: boolean;
}> {
  const userContent = String(body.content || body.message || "").trim();
  const sessionId = body.sessionId || `s_${Date.now()}`;
  const psychologyMentor = Boolean(body.psychologyMentor);
  const history = normalizeHistory(body.history);

  const riskMeta = riskFromUserText(userContent);
  const { emotionTag, hasAnxietySignal } = riskMeta;
  const risk = {
    anxiety: riskMeta.anxiety,
    depression: riskMeta.depression,
    bipolar: riskMeta.bipolar,
    level: riskMeta.level,
    reassessTriggered: riskMeta.reassessTriggered,
  };

  const rawKey = process.env.AI_API_KEY || process.env.DASHSCOPE_API_KEY || "";
  const apiKey = rawKey
    .trim()
    .replace(/^["'\s]+|["'\s]+$/g, "");
  const baseUrl = (
    process.env.AI_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1"
  ).trim();
  const model = (process.env.AI_MODEL || "qwen-turbo").trim();

  if (!apiKey) {
    const replyText = mockReply(userContent, hasAnxietySignal);
    return {
      id: Date.now().toString(),
      sessionId,
      replyText,
      emotionTag,
      risk,
      reassessTriggered: riskMeta.reassessTriggered,
      timestamp: new Date().toISOString(),
      usedLlm: false,
    };
  }

  let systemContent = SYSTEM_BASE;
  let kbEntryIds: string[] | undefined;

  if (psychologyMentor) {
    const entries = searchPsychologyKb(userContent, 5);
    kbEntryIds = entries.map((e) => e.id);
    const kbBlock = formatKbForPrompt(entries);
    systemContent += `

【心理学知识库检索结果】以下条目已通过关键词与语义片段匹配检索得到，请你先内化要点，再结合用户具体叙述回应；引用时用自己的话概括，不要大段复述原文。

${kbBlock}`;
  }

  const llmMessages: ChatMessage[] = [{ role: "system", content: systemContent }, ...history];

  if (llmMessages.length === 1) {
    llmMessages.push({ role: "user", content: userContent || "你好" });
  }

  const replyText = await chatCompletionsDashscope(llmMessages, {
    apiKey,
    baseUrl,
    model,
  });

  return {
    id: Date.now().toString(),
    sessionId,
    replyText,
    emotionTag,
    risk,
    reassessTriggered: riskMeta.reassessTriggered,
    timestamp: new Date().toISOString(),
    kbEntryIds,
    usedLlm: true,
  };
}
