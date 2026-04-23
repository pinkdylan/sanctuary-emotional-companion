import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

export interface PsychologyKbEntry {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  content: string;
}

let cached: PsychologyKbEntry[] | null = null;

function loadKb(): PsychologyKbEntry[] {
  if (cached) return cached;
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const raw = readFileSync(path.join(dir, "data", "psychology-kb.json"), "utf-8");
  cached = JSON.parse(raw) as PsychologyKbEntry[];
  return cached;
}

function tokenizeQuery(q: string): string[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const out = new Set<string>();
  for (const w of s.split(/[\s,，。；;、!！?？'"“”]+/)) {
    if (w.length >= 2) out.add(w);
  }
  for (let i = 0; i < s.length - 1; i++) {
    const bi = s.slice(i, i + 2);
    if (/[\u4e00-\u9fff]{2}/.test(bi)) out.add(bi);
  }
  return [...out];
}

/**
 * 按用户问题与关键词重叠检索知识库条目（轻量 RAG，无向量）
 */
export function searchPsychologyKb(query: string, limit = 5): PsychologyKbEntry[] {
  const kb = loadKb();
  const tokens = new Set(tokenizeQuery(query));
  if (tokens.size === 0) return kb.slice(0, limit);

  const scored = kb.map((entry) => {
    let score = 0;
    const titleLower = entry.title.toLowerCase();
    const contentLower = entry.content.toLowerCase();
    for (const kw of entry.keywords) {
      const k = kw.toLowerCase();
      if (query.toLowerCase().includes(k)) score += 4;
      for (const t of tokens) {
        if (k.includes(t) || t.includes(k)) score += 2;
      }
      if (titleLower.includes(k)) score += 1;
      if (contentLower.includes(k)) score += 0.5;
    }
    for (const t of tokens) {
      if (titleLower.includes(t)) score += 1.5;
      if (contentLower.includes(t)) score += 0.3;
    }
    return { entry, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const picked = scored.filter((x) => x.score > 0).slice(0, limit);
  if (picked.length > 0) return picked.map((x) => x.entry);
  return kb.slice(0, Math.min(3, kb.length));
}

export function formatKbForPrompt(entries: PsychologyKbEntry[]): string {
  if (entries.length === 0) return "";
  return entries
    .map(
      (e, i) =>
        `【条目${i + 1}｜${e.category}｜${e.title}】\n${e.content}`,
    )
    .join("\n\n");
}
