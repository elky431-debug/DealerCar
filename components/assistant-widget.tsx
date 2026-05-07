"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Sparkles, Send, X, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Quel est mon véhicule le plus rentable ?",
  "Quels prospects relancer aujourd'hui ?",
  "Véhicules au stock depuis +60 jours",
  "Récapitulatif de mon activité ce mois",
];

const STORAGE_KEY = "dealerlink-assistant-history-v1";

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Restaure l'historique
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persiste l'historique
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Focus l'input à l'ouverture
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => textareaRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Annule le stream à la fermeture
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      setError(null);
      const userMsg: ChatMessage = { role: "user", content: trimmed };
      const newMessages = [...messages, userMsg];
      setMessages([...newMessages, { role: "assistant", content: "" }]);
      setInput("");
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMessages }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => "");
          throw new Error(errText || `Erreur serveur (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);
            if (payload === "[DONE]") continue;
            try {
              const parsed = JSON.parse(payload);
              if (parsed.error) throw new Error(parsed.error);
              if (typeof parsed.text === "string") {
                accumulated += parsed.text;
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = {
                    role: "assistant",
                    content: accumulated,
                  };
                  return next;
                });
              }
            } catch (e) {
              if (e instanceof Error) throw e;
            }
          }
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        const msg = e instanceof Error ? e.message : "Erreur inconnue";
        setError(msg);
        setMessages((prev) => {
          const next = [...prev];
          if (next.length > 0 && next[next.length - 1].content === "") {
            next.pop();
          }
          return next;
        });
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming],
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function clearHistory() {
    if (streaming || messages.length === 0) return;
    if (!confirm("Effacer la conversation ?")) return;
    setMessages([]);
    setError(null);
  }

  return (
    <>
      {/* Bouton flottant */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group fixed bottom-5 right-5 z-40 flex h-12 items-center gap-2 rounded-full bg-foreground px-4 text-background shadow-[0_8px_28px_-8px_hsl(var(--foreground)/0.5)] transition-all hover:scale-105 hover:shadow-[0_12px_32px_-8px_hsl(var(--foreground)/0.6)] sm:bottom-6 sm:right-6"
          aria-label="Ouvrir l'assistant IA"
        >
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20">
            <Bot className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="absolute inset-0 rounded-full bg-emerald-400" />
            </span>
          </span>
          <span className="text-[13px] font-medium tracking-tight">Assistant IA</span>
        </button>
      )}

      {/* Panneau */}
      {open && (
        <div className="fixed inset-0 z-50 sm:inset-auto sm:bottom-5 sm:right-5 sm:top-auto sm:left-auto">
          {/* Overlay (mobile) */}
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm sm:hidden"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "relative z-[51] flex h-full w-full flex-col overflow-hidden border border-border/60 bg-card shadow-2xl",
              "sm:h-[640px] sm:max-h-[calc(100vh-2.5rem)] sm:w-[400px] sm:rounded-2xl",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 bg-foreground px-4 py-3 text-background">
              <div className="flex items-center gap-3">
                <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold leading-tight tracking-tight">
                    Assistant DealerLink
                  </p>
                  <p className="text-[11px] text-background/60">
                    Propulsé par Claude · contexte garage en temps réel
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={clearHistory}
                  disabled={streaming || messages.length === 0}
                  title="Effacer la conversation"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-background/70 transition-colors hover:bg-background/10 hover:text-background disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-background/70 transition-colors hover:bg-background/10 hover:text-background"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto bg-background/60 px-4 py-4"
            >
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-border/60 bg-card p-3.5">
                    <p className="flex items-center gap-2 text-[13.5px] font-semibold tracking-tight">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                      Bonjour, je suis votre copilote
                    </p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                      Je connais votre stock, vos dépôts-vente, vos clients et
                      vos ventes. Posez-moi une question ou choisissez une
                      suggestion.
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Suggestions
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => sendMessage(s)}
                          className="rounded-full border border-border/70 bg-card px-3 py-1.5 text-[12px] font-medium text-foreground/80 transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:bg-foreground hover:text-background"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <MessageBubble
                  key={i}
                  message={m}
                  showCursor={
                    streaming &&
                    i === messages.length - 1 &&
                    m.role === "assistant"
                  }
                />
              ))}

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50/70 p-2.5 text-[12.5px] text-rose-900">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border/60 bg-card p-3">
              <div className="flex items-end gap-2 rounded-xl border border-border/70 bg-background p-1.5 transition-colors focus-within:border-foreground/30 focus-within:ring-2 focus-within:ring-foreground/10">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={streaming}
                  placeholder={
                    streaming
                      ? "Réponse en cours…"
                      : "Posez votre question…"
                  }
                  className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent px-2.5 py-2 text-[13.5px] outline-none placeholder:text-muted-foreground/70 disabled:opacity-50"
                  style={{ scrollbarWidth: "thin" }}
                />
                <button
                  type="button"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || streaming}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-all hover:bg-foreground/90 disabled:opacity-30"
                  aria-label="Envoyer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-1.5 px-1 text-[10.5px] text-muted-foreground/70">
                Réponses générées par IA — vérifiez toujours les chiffres clés.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MessageBubble({
  message,
  showCursor,
}: {
  message: ChatMessage;
  showCursor?: boolean;
}) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed",
          isUser
            ? "rounded-br-md bg-foreground text-background"
            : "rounded-bl-md border border-border/60 bg-card text-foreground",
        )}
      >
        {message.content || (showCursor && <ThinkingDots />)}
        {showCursor && message.content && (
          <span className="ml-0.5 inline-block h-3.5 w-1 animate-pulse rounded-sm bg-current align-middle" />
        )}
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "120ms" }} />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "240ms" }} />
    </span>
  );
}
