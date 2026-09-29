"use client"

import { useState } from "react"
import { X, Settings, Mic, HelpCircle } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { ResearchMethodology, CitationStyle, AcademicLevel } from "@/types"
import { MicrophonePermissionDialog } from "@/components/ui/microphone-permission-dialog"

interface ProjectSettingsModalProps {
  project: {
    id: string
    topic: string
    academicLevel: string
    department: string
    institution: string
    country: string
    methodology: string
    citationStyle: string
  }
  onClose: () => void
}

const methodologies = [
  { value: "QUANTITATIVE", label: "Quantitative Research" },
  { value: "QUALITATIVE", label: "Qualitative Research" },
  { value: "MIXED_METHODS", label: "Mixed Methods Research" },
  { value: "EXPERIMENTAL", label: "Experimental Research" },
  { value: "SURVEY", label: "Survey Research" },
  { value: "CASE_STUDY", label: "Case Study Research" },
  { value: "ACTION_RESEARCH", label: "Action Research" },
  { value: "DESCRIPTIVE", label: "Descriptive Research" },
  { value: "CORRELATIONAL", label: "Correlational Research" },
  { value: "COMPARATIVE", label: "Comparative Research" },
  { value: "SYSTEMATIC_REVIEW", label: "Systematic Literature Review" },
]

const citationStyles = [
  { value: "APA", label: "APA 7th Edition" },
  { value: "MLA", label: "MLA" },
  { value: "CHICAGO", label: "Chicago" },
  { value: "HARVARD", label: "Harvard" },
  { value: "IEEE", label: "IEEE" },
]

const academicLevels = [
  { value: "UNDERGRADUATE", label: "Undergraduate" },
  { value: "MASTERS", label: "Master's" },
  { value: "PHD", label: "PhD / Doctoral" },
]

export function ProjectSettingsModal({ project, onClose }: ProjectSettingsModalProps) {
  const queryClient = useQueryClient()
  const [topic, setTopic] = useState(project.topic)
  const [academicLevel, setAcademicLevel] = useState(project.academicLevel)
  const [department, setDepartment] = useState(project.department)
  const [institution, setInstitution] = useState(project.institution)
  const [country, setCountry] = useState(project.country)
  const [methodology, setMethodology] = useState(project.methodology)
  const [citationStyle, setCitationStyle] = useState(project.citationStyle)
  const [showMicTroubleshoot, setShowMicTroubleshoot] = useState(false)

  const updateProject = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", project.id] })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Project settings updated")
      onClose()
    },
    onError: () => toast.error("Failed to update project settings"),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProject.mutate({
      topic,
      title: topic,
      academicLevel,
      department,
      institution,
      country,
      methodology,
      citationStyle,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg rounded-xl bg-background p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-1">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Project Settings</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Update your research project details
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Research Topic</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring min-h-[80px]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Academic Level</label>
              <select
                value={academicLevel}
                onChange={(e) => setAcademicLevel(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              >
                {academicLevels.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Citation Style</label>
              <select
                value={citationStyle}
                onChange={(e) => setCitationStyle(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              >
                {citationStyles.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Methodology</label>
            <select
              value={methodology}
              onChange={(e) => setMethodology(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
            >
              {methodologies.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Department</label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Institution</label>
              <input
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Country</label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
            />
          </div>

          {/* Microphone & Voice Input Troubleshooting */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <Mic className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold leading-tight">Microphone & Voice Dictation</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Troubleshoot browser permissions if voice-to-text is blocked
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMicTroubleshoot(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-semibold shadow-xs hover:bg-muted transition-colors shrink-0"
              >
                <HelpCircle className="h-3.5 w-3.5 text-primary" />
                Troubleshoot Microphone
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProject.isPending}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {updateProject.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        <MicrophonePermissionDialog
          isOpen={showMicTroubleshoot}
          onClose={() => setShowMicTroubleshoot(false)}
          onRetry={async () => {
            if (typeof window !== "undefined" && navigator.mediaDevices?.getUserMedia) {
              try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                stream.getTracks().forEach((track) => track.stop())
                toast.success("Microphone permission granted successfully!")
                return true
              } catch (err: any) {
                console.warn("[Microphone] Access denied:", err)
                return false
              }
            }
            return false
          }}
        />
      </div>
    </div>
  )
}
