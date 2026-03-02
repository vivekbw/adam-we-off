'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Plane,
  Sparkles,
  Syringe,
  User,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

const SUGGESTED_PROMPTS = [
  { icon: Plane, label: "Best time to visit Japan?" },
  { icon: Sparkles, label: "Plan a 3-week Asia trip" },
  { icon: Syringe, label: "What vaccinations do I need?" },
];

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatPanelProps {
  tripContext?: string;
}

export function ChatPanel({ tripContext }: ChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

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
          tripContext,
        }),
      });

      if (!res.ok) throw new Error('Chat request failed');

      const reply = await res.text();
      if (!reply.trim()) throw new Error('Empty response');
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <>
      {!open && (
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-[900] h-12 w-12 rounded-full shadow-lg"
          onClick={() => setOpen(true)}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col p-0 sm:max-w-[480px]"
      >
        <SheetHeader className="shrink-0 border-b px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base">Travel Assistant</SheetTitle>
              <p className="text-xs text-muted-foreground">Powered by Claude</p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea ref={scrollRef} className="flex-1">
          <div className="flex flex-col p-5">
            {!hasMessages && (
              <div className="flex flex-col items-center gap-6 py-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    How can I help with your trip?
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ask anything about destinations, packing, visas, or logistics.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2">
                  {SUGGESTED_PROMPTS.map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => sendMessage(label)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm",
                        "transition-colors hover:bg-accent hover:text-accent-foreground",
                        "text-muted-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasMessages && (
              <div className="flex flex-col gap-5">
                {messages.map((m, i) => (
                  <div key={i} className="flex gap-3">
                    <div className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      m.role === 'user'
                        ? "bg-foreground text-background"
                        : "bg-primary/10 text-primary"
                    )}>
                      {m.role === 'user'
                        ? <User className="h-3.5 w-3.5" />
                        : <Bot className="h-3.5 w-3.5" />
                      }
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        {m.role === 'user' ? 'You' : 'Assistant'}
                      </p>
                      {m.role === 'user' ? (
                        <p className="text-sm leading-relaxed text-foreground">
                          {m.content}
                        </p>
                      ) : (
                        <div className="chat-markdown text-sm leading-relaxed text-foreground">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      )}
                      {i < messages.length - 1 && (
                        <Separator className="mt-5" />
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {hasMessages && (
          <div className="shrink-0 px-5 pb-1">
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_PROMPTS.map(({ label }) => (
                <Badge
                  key={label}
                  variant="outline"
                  className="cursor-pointer text-xs transition-colors hover:bg-accent"
                  onClick={() => sendMessage(label)}
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="shrink-0 border-t p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="flex gap-2"
          >
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your trip..."
              rows={1}
              disabled={isLoading}
              className="min-h-[40px] max-h-[120px] resize-none"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="h-10 w-10 shrink-0"
            >
              {isLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />
              }
            </Button>
          </form>
        </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
