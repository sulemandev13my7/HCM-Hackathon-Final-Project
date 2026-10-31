import { useEffect, useMemo, useRef, useState } from "react";
import API from "../../services/api";
import { useAuth } from "../../contexts/useAuth";
import {
  Bot,
  Check,
  Copy,
  CornerDownLeft,
  Loader2,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";

const suggestionsByRole = {
  admin: [
    "What is our current headcount?",
    "Show payroll summary for this month",
    "Who came late the most this month?",
    "Summarize leave usage across the company",
  ],
  hr: [
    "How many employees are in each department?",
    "Which employees were late this month?",
    "Summarize attendance for this month",
    "How much leave is pending approval?",
  ],
  employee: [
    "How many leave days do I have left?",
    "Summarize my attendance this month",
    "Show my latest payslip details",
    "How many late days do I have?",
  ],
};

const welcomeByRole = {
  admin:
    "I can answer questions about headcount, attendance, leave, and payroll using live company data.",
  hr:
    "Ask me about attendance, leave balances, late-comers, or department headcount. I only use the data you are allowed to see.",
  employee:
    "Ask me about your own attendance, leave balance, or payslips. I can only access your records.",
};

export default function AIChat() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const suggestions = useMemo(
    () => suggestionsByRole[role] || suggestionsByRole.employee,
    [role],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const submitMessage = async (text = input) => {
    const content = text.trim();
    if (!content || loading) return;

    const history = messages.slice(-6).map(({ role: messageRole, content: messageContent }) => ({
      role: messageRole,
      content: messageContent,
    }));
    setMessages((current) => [
      ...current,
      { role: "user", content },
    ]);
    setInput("");
    setLoading(true);

    try {
      const response = await API.post("/ai/chat", {
        message: content,
        history,
      });
      setMessages((current) => [
        ...current,
        { role: "assistant", content: response.data.response },
      ]);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to get a response",
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const copyMessage = async (content, index) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      toast.error("Could not copy this message");
    }
  };

  return (
    <div className="flex h-[calc(100dvh-9.5rem)] min-h-[24rem] flex-col overflow-hidden rounded-2xl border border-hcm-line bg-white shadow-sm sm:min-h-[32rem]">
      <header className="hcm-chat-header shrink-0 px-5 py-4 sm:px-6">
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/10 text-hcm-lime ring-1 ring-white/15">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight text-white">
                AI Assistant
              </h1>
              <p className="flex items-center gap-1.5 text-sm text-white/75">
                <ShieldCheck className="h-3.5 w-3.5 text-hcm-lime" />
                Live data · {role} scope
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setCopiedIndex(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-white/10 px-3 py-2 text-xs font-semibold text-white/75 transition hover:bg-white/15 hover:text-white"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-hcm-surface-soft px-4 py-5 sm:px-6">
        {messages.length === 0 ? (
          <div className="mx-auto flex h-full max-w-2xl flex-col justify-center">
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-hcm-accent text-white shadow-lg">
                <Bot className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-xl font-semibold text-hcm-ink">
                How can I help today?
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-hcm-muted">
                {welcomeByRole[role] || welcomeByRole.employee}
              </p>
            </div>
            <div className="mt-7 grid gap-2 sm:grid-cols-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => submitMessage(suggestion)}
                  className="flex items-start gap-2.5 rounded-xl border border-hcm-line bg-white p-3 text-left text-sm text-hcm-ink shadow-sm transition hover:border-hcm-accent/25 hover:bg-hcm-accent-soft/50"
                >
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-hcm-accent" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-5">
            {messages.map((message, index) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hcm-accent text-white">
                      <Bot className="h-4 w-4" />
                    </span>
                  )}
                  <div
                    className={`group max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[75%] ${
                      isUser
                        ? "rounded-br-md bg-hcm-accent text-white"
                        : "rounded-bl-md border border-hcm-line bg-white text-hcm-ink"
                    }`}
                  >
                    {!isUser && (
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-hcm-muted">
                        <Sparkles className="h-3 w-3 text-hcm-accent" />
                        AI-generated
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => copyMessage(message.content, index)}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-hcm-muted opacity-100 transition hover:text-hcm-ink sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="h-3 w-3" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {isUser && (
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hcm-accent-soft text-hcm-accent">
                      <UserRound className="h-4 w-4" />
                    </span>
                  )}
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start gap-3">
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hcm-accent text-white">
                  <Bot className="h-4 w-4" />
                </span>
                <div className="rounded-2xl rounded-bl-md border border-hcm-line bg-white px-4 py-3">
                  <p className="flex items-center gap-2 text-sm text-hcm-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking live data...
                  </p>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitMessage();
        }}
        className="shrink-0 border-t border-hcm-line bg-white p-3 sm:p-4"
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-hcm-line bg-hcm-surface-soft p-2 focus-within:border-hcm-accent/50 focus-within:bg-white focus-within:ring-4 focus-within:ring-hcm-accent/10">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submitMessage();
              }
            }}
            placeholder="Ask about attendance, leave, payroll..."
            className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-hcm-ink outline-none placeholder:text-hcm-muted"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hcm-accent text-white transition hover:bg-hcm-accent-strong disabled:opacity-40"
            aria-label="Send message"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mx-auto mt-2 flex max-w-3xl items-center justify-center gap-1 text-[11px] text-hcm-muted">
          <CornerDownLeft className="h-3 w-3" />
          Enter to send · Shift + Enter for a new line · Verify important
          decisions
        </p>
      </form>
    </div>
  );
}
