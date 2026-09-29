"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BookOpen,
  Plus,
  Clock,
  History,
  Settings,
  Search,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Sun,
  Moon,
  Command,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTheme } from "@/lib/theme-provider"
import type { Project } from "@/types"

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { theme, toggle: toggleTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const { data: projects = [] } = useQuery<Project[]>({
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
    },
  })

  const createProject = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: "New Research Project",
          academicLevel: "UNDERGRADUATE",
          department: "",
          institution: "",
          country: "",
          methodology: "QUANTITATIVE",
          citationStyle: "APA",
        }),
      })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      onMobileClose?.()
      router.push(`/dashboard/research/${data.id}`)
    },
  })

  const isInProject = pathname.startsWith("/dashboard/research/")
  const currentProjectId = isInProject ? pathname.split("/dashboard/research/")[1] : null

  const filteredProjects = projects.filter((p) =>
    p.topic.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sidebarContent = (isMobile: boolean) => {
    const effectiveCollapsed = isMobile ? false : collapsed

    if (effectiveCollapsed && !isMobile) {
      return (
        <aside className="flex w-14 flex-col border-r bg-sidebar-background items-center py-3 gap-3 shrink-0">
          <button
            onClick={() => setCollapsed(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
          <div className="w-8 border-t" />
          <button
            onClick={() => createProject.mutate()}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <Link
            href="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"
            onClick={() => onMobileClose?.()}
          >
            <Settings className="h-5 w-5" />
          </Link>
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <div className="flex h-9 w-9 items-center justify-center text-[10px] text-sidebar-foreground/50 font-mono">
            <Command className="h-3 w-3" />
          </div>
        </aside>
      )
    }

    return (
      <aside className={cn(
        "flex flex-col bg-sidebar-background",
        isMobile
          ? "w-72 h-full"
          : "w-64 border-r shrink-0"
      )}>
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-lg"
            onClick={() => onMobileClose?.()}
          >
            <BookOpen className="h-5 w-5 text-primary" />
            ChapterAI
          </Link>
          <div className="flex items-center gap-1">
            {!isMobile && (
              <button
                onClick={() => setCollapsed(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}
            {isMobile && (
              <button
                onClick={onMobileClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="p-3">
          <button
            onClick={() => createProject.mutate()}
            disabled={createProject.isPending}
            className="flex w-full items-center gap-3 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Research
          </button>
        </div>

        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-xs outline-none focus:border-ring"
            />
          </div>
        </div>

        <div className="px-3 pb-1">
          <Link
            href="/dashboard"
            onClick={() => onMobileClose?.()}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/dashboard" || pathname === "/"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <Clock className="h-4 w-4 shrink-0" />
            Recent Projects
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
          {filteredProjects.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <History className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">
                {searchQuery ? "No matching projects" : "No projects yet"}
              </p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div key={project.id} className="group relative">
                <Link
                  href={`/dashboard/research/${project.id}`}
                  onClick={() => onMobileClose?.()}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    currentProjectId === project.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <BookOpen className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="truncate flex-1">{project.topic}</span>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    deleteProject.mutate(project.id)
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-destructive transition-all"
                  title="Delete project"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </nav>

        <div className="border-t p-3 space-y-1">
          <Link
            href="/dashboard"
            onClick={() => onMobileClose?.()}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button
            onClick={toggleTheme}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] text-sidebar-foreground/50">
            <Command className="h-3 w-3" />
            <span>K to search</span>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        {sidebarContent(false)}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onMobileClose}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar-background shadow-xl animate-in slide-in-from-left">
            {sidebarContent(true)}
          </div>
        </div>
      )}
    </>
  )
}
