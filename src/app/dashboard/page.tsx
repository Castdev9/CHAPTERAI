"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Search, Clock, FileText, Trash2, BookOpen, ArrowRight, GraduationCap, FlaskConical, Loader2 } from "lucide-react"
import { CreateResearchModal } from "@/components/research/create-research-modal"
import { ProjectListSkeleton } from "@/components/ui/loading-skeleton"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Project } from "@/types"

export default function DashboardPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const queryClient = useQueryClient()

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) return []
      return res.json()
    },
  })

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Project deleted")
    },
    onError: () => toast.error("Failed to delete project"),
  })

  const filtered = projects.filter((p) =>
    p.topic.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const methodologyLabel = (m: string) =>
    m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  const levelLabel = (l: string) => {
    if (l === "PHD") return "PhD"
    return l.charAt(0) + l.slice(1).toLowerCase()
  }

  return (
    <ErrorBoundary>
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Research Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Start a new research project or continue where you left off
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Research
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search research projects..."
          className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm outline-none focus:border-ring"
        />
      </div>

      <div className="mb-8">
        <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
          <Clock className="h-4 w-4" />
          {searchQuery ? `Search Results (${filtered.length})` : "Recent Projects"}
        </h2>

        {isLoading ? (
          <ProjectListSkeleton count={3} />
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border p-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">
              {searchQuery ? "No matching projects" : "No research projects yet"}
            </p>
            <p className="text-sm mt-1">
              {searchQuery
                ? "Try a different search term"
                : "Create your first research project to get started"}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((project) => {
              const completedChapters = project.chapters?.filter(
                (c) => c.status === "COMPLETE"
              ).length || 0
              const totalChapters = project.chapters?.length || 5

              return (
                <div
                  key={project.id}
                  className="group rounded-xl border bg-card hover:shadow-md transition-shadow"
                >
                  <Link
                    href={`/dashboard/research/${project.id}`}
                    className="flex items-center gap-4 p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{project.topic}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {levelLabel(project.academicLevel)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FlaskConical className="h-3 w-3" />
                          {methodologyLabel(project.methodology)}
                        </span>
                        <span>
                          {completedChapters}/{totalChapters} chapters
                        </span>
                        <span>
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          deleteProject.mutate(project.id)
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateResearchModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
    </ErrorBoundary>
  )
}
