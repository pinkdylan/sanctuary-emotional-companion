export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function chatCompletionsDashscope(
  messages: ChatMessage[],
  options: { apiKey: string; baseUrl: string; model: string },
): Promise<string> {
  const url = `${options.baseUrl.replace(/\/$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      messages,
      temperature: 0.7,
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`LLM HTTP ${res.status}: ${raw.slice(0, 500)}`);
  }
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("LLM 返回非 JSON");
  }
  const obj = data as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };
  if (obj.error?.message) {
    throw new Error(obj.error.message);
  }
  const text = obj.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") {
    throw new Error("LLM 未返回有效文本");
  }
  return text.trim();
}
