'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ChatPanel.module.css';

const DEFAULT_PROMPTS = [
  "What's the best time to visit Japan?",
  'Help me plan a 3-week Asia trip',
  'What vaccinations do I need?',
];

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatPanelProps {
  tripContext?: string;
}

export function ChatPanel({ tripContext }: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const contextPrompts = tripContext ? [tripContext, ...DEFAULT_PROMPTS] : DEFAULT_PROMPTS;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: trimmed }],
        }),
      });

      if (!res.ok) {
        throw new Error('Chat request failed');
      }

      const data = await res.json();
      const reply = data.message ?? data.content ?? data.reply ?? 'No response.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, the chat service is not available right now.' },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={`${styles.toggleBtn} ${isOpen ? styles.toggleBtnOpen : ''}`}
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        🤖
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.header}>Travel Assistant</div>
            <div className={styles.contextPrompts}>
              {contextPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className={styles.contextBtn}
                  onClick={() => sendMessage(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className={styles.messages}>
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`${styles.message} ${m.role === 'user' ? styles.messageUser : styles.messageAssistant}`}
                >
                  {m.content}
                </div>
              ))}
              {isLoading && <div className={styles.loading}>Thinking...</div>}
              <div ref={messagesEndRef} />
            </div>
            <form className={styles.inputBar} onSubmit={handleSubmit}>
              <textarea
                ref={inputRef}
                className={styles.input}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your trip..."
                rows={1}
                disabled={isLoading}
              />
              <button
                type="submit"
                className={styles.sendBtn}
                disabled={!input.trim() || isLoading}
              >
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
