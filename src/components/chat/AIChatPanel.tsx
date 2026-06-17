import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { streamDrLab, type DrLabMessage } from '@/lib/llm';
import type { ChatMessage as AppChatMessage } from '@/types';

interface AIChatPanelProps {
  messages: AppChatMessage[];
  onAddMessage: (msg: AppChatMessage) => void;
  onUpdateMessage: (id: string, content: string, done?: boolean) => void;
  onInteractionCount: () => void;
  isThinking: boolean;
  setIsThinking: (v: boolean) => void;
}

function nanoid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="thinking-dot" />
      <span className="thinking-dot" />
      <span className="thinking-dot" />
    </span>
  );
}

export default function AIChatPanel({
  messages, onAddMessage, onUpdateMessage, onInteractionCount, isThinking, setIsThinking,
}: AIChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const accRef = useRef<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const buildDrLabHistory = useCallback((msgs: AppChatMessage[]): DrLabMessage[] => {
    return msgs
      .filter((m) => !m.isStreaming || m.content.length > 0)
      .map((m): DrLabMessage => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content || '...' }));
  }, []);

  const sendAIMessage = useCallback((userPrompt: string, existingHistory: AppChatMessage[], retryCount = 0) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setIsThinking(true);

    const aiMsgId = nanoid();
    accRef.current[aiMsgId] = '';
    onAddMessage({ id: aiMsgId, role: 'ai', content: '', timestamp: Date.now(), isStreaming: true });

    try {
      streamDrLab({
        userPrompt,
        history: buildDrLabHistory(existingHistory),
        onChunk: (chunk) => {
          accRef.current[aiMsgId] = (accRef.current[aiMsgId] ?? '') + chunk;
          onUpdateMessage(aiMsgId, accRef.current[aiMsgId], false);
          setIsThinking(false);
        },
        onComplete: () => {
          onUpdateMessage(aiMsgId, accRef.current[aiMsgId] ?? '', true);
          delete accRef.current[aiMsgId];
          setIsThinking(false);
          onInteractionCount();
        },
        onError: (err) => {
          const is429 = (err as { code?: number }).code === 429 ||
            err.message === 'rate_limit';

          if (is429 && retryCount < 2) {
            // Auto-retry after short back-off: 1.5s first, 3s second
            const delay = retryCount === 0 ? 1500 : 3000;
            const waitMsg = retryCount === 0
              ? '⏳ One moment — retrying…'
              : '⏳ Almost there — one more try…';
            onUpdateMessage(aiMsgId, waitMsg, false);
            setTimeout(() => {
              delete accRef.current[aiMsgId];
              // Remove the placeholder message and re-send cleanly
              sendAIMessage(userPrompt, existingHistory, retryCount + 1);
            }, delay);
            return;
          }

          // All retries exhausted or non-429 error — show friendly fallback
          const fallback = accRef.current[aiMsgId] ||
            (is429
              ? "I'm a bit busy right now — please ask again in a moment! 🧪"
              : 'What do you observe happening in the simulation right now?');
          onUpdateMessage(aiMsgId, fallback, true);
          delete accRef.current[aiMsgId];
          setIsThinking(false);
        },
        signal: abortRef.current.signal,
      });
    } catch (err) {
      console.warn('Dr. Lab call error:', err);
      onUpdateMessage(aiMsgId, 'What observations are you making in the simulation?', true);
      setIsThinking(false);
    }
  }, [buildDrLabHistory, onAddMessage, onUpdateMessage, onInteractionCount, setIsThinking]);

  (window as unknown as Record<string, unknown>)._labaiSendAI = sendAIMessage;

  const handleSend = () => {
    const text = input.trim();
    if (!text || isThinking) return;
    setInput('');
    const userMsg: AppChatMessage = { id: nanoid(), role: 'student', content: text, timestamp: Date.now() };
    onAddMessage(userMsg);
    sendAIMessage(text, [...messages, userMsg]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-glass shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-lab/20 border border-indigo-lab/30">
          <Bot size={16} className="text-indigo-lab" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-sora font-semibold text-sm text-white">AI Lab Supervisor</span>
            <span className="pulse-dot" />
          </div>
          <span className="font-sora text-xs emerald-glow font-semibold">Dr. Lab</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-3 ${msg.role === 'student' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                msg.role === 'ai' ? 'bg-indigo-lab/20 border border-indigo-lab/30' : 'bg-indigo-lab/40 border border-indigo-lab/50'
              }`}>
                {msg.role === 'ai' ? <Bot size={13} className="text-indigo-lab" /> : <User size={13} className="text-white" />}
              </div>
              <div className={`max-w-[80%] ${msg.role === 'student' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {msg.role === 'ai' && <span className="font-sora text-xs emerald-glow font-semibold ml-1">Dr. Lab</span>}
                <div className={`rounded-xl px-3 py-2.5 ${msg.role === 'ai' ? 'chat-bubble-ai' : 'chat-bubble-student'}`}>
                  {msg.isStreaming && msg.content === '' ? (
                    <ThinkingDots />
                  ) : (
                    <p className="font-inter text-sm text-slate/90 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                      {msg.isStreaming && <span className="inline-block w-1 h-3 bg-emerald-lab ml-0.5 animate-pulse" />}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isThinking && messages.every(m => !m.isStreaming) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
            <div className="shrink-0 w-7 h-7 rounded-full bg-indigo-lab/20 border border-indigo-lab/30 flex items-center justify-center">
              <Bot size={13} className="text-indigo-lab" />
            </div>
            <div className="chat-bubble-ai rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate/60 font-inter mr-1">Dr. Lab is thinking</span>
                <ThinkingDots />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="shrink-0 px-4 py-3 border-t border-glass">
        <div className="flex items-center gap-2 glass-panel-lighter rounded-xl px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Dr. Lab anything..."
            disabled={isThinking}
            className="flex-1 bg-transparent text-sm font-inter text-white placeholder-slate/40 focus:outline-none disabled:opacity-50 min-w-0"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="shrink-0 w-8 h-8 rounded-lg bg-indigo-lab hover:bg-indigo-dark disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
        <p className="text-xs text-slate/35 font-inter mt-1.5 text-center">
          Dr. Lab uses Socratic questioning — no direct answers!
        </p>
      </div>
    </div>
  );
}
