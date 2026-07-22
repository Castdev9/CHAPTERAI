"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Bot, User, Sparkles, StopCircle, Loader2, Copy, Check, Pencil, Trash2, RefreshCw, X, CheckCheck } from "lucide-react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Message } from "@/types"
import { cn } from "@/lib/utils"

interface ChatAreaProps {
  projectId: string
  chapterNumber: number
}

export function ChatArea({ projectId, chapterNumber }: ChatAreaProps) {
  const [input, setInput] = useState("")
  const [streamingContent, setStreamingContent] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)
  const queryClient = useQueryClient()
  const [nearBottom, setNearBottom] = useState(true)

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["messages", projectId, chapterNumber],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/messages?chapter=${chapterNumber}`)
      if (!res.ok) return []
      return res.json()
    },
  })

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/messages/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", projectId, chapterNumber] })
      toast.success("Message deleted")
    },
    onError: () => toast.error("Failed to delete message"),
  })

  const editMessage = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const res = await fetch(`/api/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error("Failed to edit")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", projectId, chapterNumber] })
      setEditingId(null)
      toast.success("Message updated")
    },
    onError: () => toast.error("Failed to edit message"),
  })

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight
      })
    }
  }, [])

  useEffect(() => {
    if (nearBottom || isStreaming) {
      scrollToBottom()
    }
  }, [messages, streamingContent, scrollToBottom, nearBottom, isStreaming])

  const autoResize = useCallback(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = "auto"
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
    }
  }, [])

  useEffect(() => { autoResize() }, [input, autoResize])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (el) {
      const threshold = 100
      setNearBottom(el.scrollHeight - el.scrollTop - el.clientHeight < threshold)
    }
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.addEventListener("scroll", handleScroll)
      return () => el.removeEventListener("scroll", handleScroll)
    }
  }, [handleScroll])

  const handleStreamingSubmit = async (content: string, parentId?: string) => {
    setIsStreaming(true)
    setStreamingContent("")

    const abortController = new AbortController()
    abortRef.current = abortController

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, chapterNumber, content, parentId }),
        signal: abortController.signal,
      })

      if (!res.ok) {
        let errorMsg = "Failed to send message"
        try {
          const errData = await res.json()
          if (errData.error) errorMsg = errData.error
        } catch {
          // Could not parse error response
        }
        throw new Error(errorMsg)
      }

      const contentType = res.headers.get("Content-Type") || ""

      if (contentType.includes("text/event-stream")) {
        const reader = res.body?.getReader()
        const decoder = new TextDecoder()

        if (reader) {
          let fullText = ""
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split("\n").filter(Boolean)

            for (const line of lines) {
              try {
                const parsed = JSON.parse(line)
                if (parsed.type === "text") {
                  fullText += parsed.content
                  setStreamingContent(fullText)
                } else if (parsed.type === "error") {
                  toast.error(parsed.content || "AI generation failed")
                  break
                } else if (parsed.type === "done") {
                  queryClient.invalidateQueries({
                    queryKey: ["messages", projectId, chapterNumber],
                  })
                }
              } catch {
                continue
              }
            }
          }
        }
      } else {
        const data = await res.json()
        if (data.content) {
          setStreamingContent(data.content)
        }
        queryClient.invalidateQueries({
          queryKey: ["messages", projectId, chapterNumber],
        })
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Stream error:", err)
        toast.error("Failed to generate response")
      }
    } finally {
      setIsStreaming(false)
      setStreamingContent("")
      abortRef.current = null
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return
    handleStreamingSubmit(input.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current.abort()
      setIsStreaming(false)
    }
  }

  const handleCopy = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      toast.success("Copied to clipboard")
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error("Failed to copy")
    }
  }

  const handleStartEdit = (msg: Message) => {
    setEditingId(msg.id)
    setEditContent(msg.content)
    setTimeout(() => {
      const ta = editTextareaRef.current
      if (ta) {
        ta.focus()
        ta.setSelectionRange(ta.value.length, ta.value.length)
      }
    }, 50)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editContent.trim()) return
    editMessage.mutate({ id: editingId, content: editContent.trim() })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent("")
  }

  const handleRegenerate = (msg: Message) => {
    handleStreamingSubmit(msg.content)
  }

  const handleGenerateSection = (section: string) => {
    handleStreamingSubmit(section)
  }

  const suggestionButtons: Record<number, string[]> = {
    1: [
      "Generate complete Chapter 1 (Introduction)",
      "Write the Background of the Study",
      "Formulate research questions and hypotheses",
      "Write the Statement of the Problem",
    ],
    2: [
      "Generate complete Chapter 2 (Literature Review)",
      "Suggest a theoretical framework",
      "Review empirical literature on this topic",
      "Identify research gaps",
    ],
    3: [
      "Generate complete Chapter 3 (Methodology)",
      "Suggest an appropriate research design",
      "Calculate sample size",
      "Describe data collection methods",
    ],
    4: [
      "Generate complete Chapter 4 (Data Analysis)",
      "Create frequency distribution tables",
      "Guide me through hypothesis testing",
      "Interpret statistical results",
    ],
    5: [
      "Generate complete Chapter 5",
      "Summarize key findings",
      "Write recommendations",
      "State contributions to knowledge",
    ],
  }

  const suggestions = suggestionButtons[chapterNumber] || ["Generate content for this chapter"]

  const renderContent = (content: string) => {
    return (
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-1">{children}</h3>,
          h4: ({ children }) => <h4 className="text-sm font-semibold mt-2 mb-1">{children}</h4>,
          p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-6 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 italic my-2 text-muted-foreground">{children}</blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
          th: ({ children }) => <th className="px-3 py-2 text-left font-medium border-b">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 border-b">{children}</td>,
          code: ({ className, children, ...props }) => {
            const isInline = !className
            if (isInline) {
              return <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono" {...props}>{children}</code>
            }
            return <code className={className} {...props}>{children}</code>
          },
          pre: ({ children }) => (
            <pre className="my-2 rounded-lg bg-muted p-4 overflow-x-auto text-xs">{children}</pre>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">{children}</a>
          ),
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          hr: () => <hr className="my-4 border-muted" />,
        }}
      >
        {content}
      </Markdown>
    )
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 && !streamingContent && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center max-w-md">
              <Sparkles className="h-8 w-8 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-xl mb-2">
                Chapter {chapterNumber} Assistant
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {chapterNumber === 4
                  ? "Switch to the analysis view above or ask me to help analyze your data."
                  : "Tell me about your research topic and I'll help you write this chapter."}
              </p>
              <div className="grid gap-2">
                {suggestions.slice(0, 4).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleGenerateSection(s)}
                    disabled={isStreaming}
                    className="rounded-lg border p-3 text-sm text-left hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 rounded-lg p-4 relative group",
              msg.role === "assistant" ? "bg-muted/50" : "bg-primary/5"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                msg.role === "assistant" ? "bg-primary" : "bg-secondary"
              )}
            >
              {msg.role === "assistant" ? (
                <Bot className="h-4 w-4 text-primary-foreground" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {editingId === msg.id ? (
                <div className="space-y-2">
                  <textarea
                    ref={editTextareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring resize-none"
                    rows={4}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSaveEdit()
                      }
                      if (e.key === "Escape") handleCancelEdit()
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={editMessage.isPending || !editContent.trim()}
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      <CheckCheck className="h-3 w-3" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="inline-flex items-center gap-1 rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm leading-relaxed">
                  {msg.role === "assistant" ? renderContent(msg.content) : <div className="whitespace-pre-wrap">{msg.content}</div>}
                </div>
              )}

              <div className="mt-1 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-muted-foreground">{formatTime(msg.createdAt)}</span>
                {msg.role === "assistant" && (
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition-colors"
                    title="Copy"
                  >
                    {copiedId === msg.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </button>
                )}
                {msg.role === "user" && (
                  <button
                    onClick={() => handleStartEdit(msg)}
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
                {msg.role === "assistant" && (
                  <button
                    onClick={() => handleRegenerate(msg)}
                    disabled={isStreaming}
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    title="Regenerate"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm("Delete this message?")) deleteMessage.mutate(msg.id)
                  }}
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {streamingContent && (
          <div className="flex gap-3 rounded-lg p-4 bg-muted/50">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1 text-sm leading-relaxed">
              {renderContent(streamingContent)}
              <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isStreaming
                  ? "Generating response..."
                  : `Ask about Chapter ${chapterNumber}...`
              }
              rows={1}
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-ring resize-none overflow-hidden"
              disabled={isStreaming}
            />
          </div>
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStop}
              className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 shrink-0"
            >
              <StopCircle className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shrink-0"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
