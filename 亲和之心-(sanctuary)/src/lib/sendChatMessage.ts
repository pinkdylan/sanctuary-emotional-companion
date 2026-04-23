import axios from 'axios';
import { useChatStore } from '../store/useChatStore';
import { startAssistantTts } from './assistantTts';

export type ChatInputType = 'text' | 'voice' | 'call';

export type SendChatOptions = {
  /** 为 true 时服务端检索心理学知识库再调用大模型 */
  psychologyMentor?: boolean;
  /**
   * 输入框为空时点心理导师：不新增用户气泡，用「最后一条用户消息」做知识库检索主题，
   * 并在请求历史中追加一条说明性 user，让模型结合上文再出一版导师回复。
   */
  mentorFollowUp?: boolean;
};

const MENTOR_FOLLOWUP_PROMPT =
  '请结合心理学知识库，针对我上面关心的问题再做一轮更专业、可执行的回应与安慰。';

/**
 * 发送用户消息并拉取助手回复 + TTS（聊天 / 按住说话 / 电话模式共用）
 */
export async function sendChatMessage(
  content: string,
  inputType: ChatInputType,
  options?: SendChatOptions,
): Promise<void> {
  const psychologyMentor = Boolean(options?.psychologyMentor);
  const mentorFollowUp = Boolean(options?.mentorFollowUp);

  const {
    sessionId,
    setSessionState,
    addMessage,
    setRisk,
    setError,
    clearError,
    setKbScanActive,
    messages,
  } = useChatStore.getState();

  /** 空框点心理导师：基于上轮用户话检索知识库，不重复插入用户气泡 */
  if (mentorFollowUp) {
    if (!psychologyMentor) {
      setError('心理导师模式参数异常，请重试。');
      setTimeout(() => clearError(), 3000);
      return;
    }
    const thread = messages.filter((m) => m.role === 'user' || m.role === 'assistant');
    const lastUser = [...thread].reverse().find((m) => m.role === 'user');
    const kbTopic = lastUser?.content?.trim() ?? '';
    if (!kbTopic) {
      setError('还没有您的发言记录，请先输入并发送一条消息，之后可随时点心理导师深入分析。');
      setTimeout(() => clearError(), 4500);
      return;
    }

    clearError();
    setSessionState('processing');
    setKbScanActive(true);

    const history = [
      ...thread.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: MENTOR_FOLLOWUP_PROMPT },
    ];

    try {
      const res = await axios.post('/api/chat/message', {
        sessionId,
        content: kbTopic,
        inputType,
        psychologyMentor: true,
        history,
      });
      setKbScanActive(false);
      const data = res.data;
      if (data.reassessTriggered) {
        setSessionState('reassessing');
      }
      setSessionState('speaking');
      addMessage({
        id: data.id ?? `${Date.now()}_assistant`,
        role: 'assistant',
        content: data.replyText ?? data.content,
        timestamp: new Date().toISOString(),
      });
      if (data.risk) {
        setRisk(data.risk);
      }
      if (data.reassessTriggered) {
        addMessage({
          id: `${Date.now()}_system`,
          role: 'system',
          content: '复评完成，策略已更新。',
          timestamp: new Date().toISOString(),
        });
      }
      const replyText = data.replyText ?? data.content ?? '';
      await startAssistantTts(replyText);
    } catch (err) {
      setKbScanActive(false);
      setSessionState('error');
      let detail = '';
      if (axios.isAxiosError(err)) {
        if (err.response?.data) {
          const errorData = err.response.data;
          if (typeof errorData === 'object' && 'error' in errorData) {
            detail = ` ${String(errorData.error)}`;
          } else {
            detail = ` ${JSON.stringify(errorData)}`;
          }
        } else if (err.message) {
          detail = ` ${err.message}`;
        }
      } else if (err instanceof Error) {
        detail = ` ${err.message}`;
      }
      setError(`心理导师请求失败，请重试。${detail}`.trim());
      setTimeout(() => setSessionState('idle'), 2000);
    }
    return;
  }

  const text = content.trim();
  if (!text) return;

  clearError();
  addMessage({
    id: Date.now().toString(),
    role: 'user',
    content: text,
    timestamp: new Date().toISOString(),
  });
  setSessionState('processing');
  if (psychologyMentor) setKbScanActive(true);

  const history = useChatStore
    .getState()
    .messages.filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  try {
    const res = await axios.post('/api/chat/message', {
      sessionId,
      content: text,
      inputType,
      psychologyMentor,
      history,
    });
    if (psychologyMentor) setKbScanActive(false);
    const data = res.data;
    if (data.reassessTriggered) {
      setSessionState('reassessing');
    }
    setSessionState('speaking');
    addMessage({
      id: data.id ?? `${Date.now()}_assistant`,
      role: 'assistant',
      content: data.replyText ?? data.content,
      timestamp: new Date().toISOString(),
    });
    if (data.risk) {
      setRisk(data.risk);
    }
    if (data.reassessTriggered) {
      addMessage({
        id: `${Date.now()}_system`,
        role: 'system',
        content: '复评完成，策略已更新。',
        timestamp: new Date().toISOString(),
      });
    }
    const replyText = data.replyText ?? data.content ?? '';
    await startAssistantTts(replyText);
  } catch (err) {
    setKbScanActive(false);
    setSessionState('error');
    let detail = '';
    if (axios.isAxiosError(err)) {
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object' && 'error' in errorData) {
          detail = ` ${String(errorData.error)}`;
        } else {
          detail = ` ${JSON.stringify(errorData)}`;
        }
      } else if (err.message) {
        detail = ` ${err.message}`;
      }
    } else if (err instanceof Error) {
      detail = ` ${err.message}`;
    }
    setError(
      inputType === 'call'
        ? `电话模式发送失败，请检查网络或稍后再试。${detail}`.trim()
        : `消息发送失败，请重试。${detail}`.trim(),
    );
    setTimeout(() => setSessionState('idle'), 2000);
  }
}
