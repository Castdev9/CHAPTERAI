import { PrismaClient } from "@prisma/client"

interface ProjectRecord {
  id: string
  title: string
  topic: string
  academicLevel: any
  department: string
  institution: string
  country: string
  methodology: any
  citationStyle: any
  createdAt: Date
  updatedAt: Date
  chapters?: ChapterRecord[]
  messages?: MessageRecord[]
}

interface ChapterRecord {
  id: string
  projectId: string
  chapterNumber: number
  title: string
  content: string
  status: "DRAFT" | "GENERATING" | "COMPLETE"
  createdAt: Date
  updatedAt: Date
}

interface MessageRecord {
  id: string
  projectId: string
  chapterNumber: number
  role: string
  content: string
  createdAt: Date
}

interface AnalysisRecord {
  id: string
  projectId: string
  type: any
  data: any
  results: any
  createdAt: Date
  updatedAt: Date
}

interface UploadRecord {
  id: string
  projectId: string
  filename: string
  fileUrl: string
  fileType: string
  fileSize: number
  createdAt: Date
}

interface ReferenceRecord {
  id: string
  projectId: string
  citation: string
  style: any
  source: string
  createdAt: Date
}

interface ExportRecord {
  id: string
  projectId: string
  format: string
  fileUrl: string
  createdAt: Date
}

// In-Memory Database Store
class InMemoryPrismaStore {
  private projects: Map<string, ProjectRecord> = new Map()
  private chapters: Map<string, ChapterRecord> = new Map()
  private messages: Map<string, MessageRecord> = new Map()
  private analyses: Map<string, AnalysisRecord> = new Map()
  private uploads: Map<string, UploadRecord> = new Map()
  private references: Map<string, ReferenceRecord> = new Map()
  private exports: Map<string, ExportRecord> = new Map()

  constructor() {
    this.seedSampleData()
  }

  private seedSampleData() {
    const sampleId = "sample-proj-1"
    this.projects.set(sampleId, {
      id: sampleId,
      title: "Impact of Artificial Intelligence on Higher Education Pedagogy: A Mixed-Methods Study",
      topic: "Impact of Artificial Intelligence on Higher Education Pedagogy: A Mixed-Methods Study",
      academicLevel: "MASTERS",
      department: "Educational Technology & Curriculum Studies",
      institution: "University of Oxford",
      country: "United Kingdom",
      methodology: "MIXED_METHODS",
      citationStyle: "APA",
      createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
      updatedAt: new Date(),
    })

    const initialChapters: ChapterRecord[] = [
      {
        id: "ch-1",
        projectId: sampleId,
        chapterNumber: 1,
        title: "Introduction",
        content: `# Chapter 1: Introduction

## 1.1 Background of the Study
The integration of Artificial Intelligence (AI) technologies into higher education has accelerated significantly in recent years (Zawacki-Richter et al., 2019). Large language models and automated instructional tools are reshaping academic delivery, assessment frameworks, and research workflows across tertiary institutions worldwide (Holmes & Tuomi, 2022). Higher education institutions face the challenge of harnessing pedagogical affordances while managing critical considerations including academic integrity, cognitive autonomy, and institutional policy alignment (Selwyn, 2020).

## 1.2 Statement of the Problem
While generative AI presents unprecedented opportunities for personalized tutoring and rapid literature synthesis, faculty readiness and empirical assessment strategies remain fragmented (Cotton et al., 2024). Many universities lack cohesive pedagogical guidelines, resulting in inconsistent student outcomes and supervisory challenges (Dwivedi et al., 2023).

## 1.3 Research Objectives
1. To evaluate current faculty and student adoption rates of generative AI tools in academic workflows.
2. To examine the perceived efficacy and ethical concerns associated with AI-assisted learning interventions.
3. To develop an empirically validated pedagogical framework for ethical AI integration in university curricula.

## 1.4 Research Questions
1. What patterns characterize student and faculty utilization of generative AI tools across diverse academic disciplines?
2. To what extent does structured AI assistance influence student critical thinking and assignment quality?
3. What institutional policy measures are essential to safeguard academic rigor while fostering innovation?

## 1.5 Significance of the Study
This study provides empirical grounding for academic deans, curriculum committees, and instructional designers seeking to formulate evidence-based AI adoption strategies (Bozkurt et al., 2023).`,
        status: "COMPLETE",
        createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      },
      {
        id: "ch-2",
        projectId: sampleId,
        chapterNumber: 2,
        title: "Literature Review",
        content: `# Chapter 2: Literature Review

## 2.1 Theoretical Foundations
This investigation is conceptualized through the Technological Pedagogical Content Knowledge (TPACK) framework (Mishra & Koehler, 2006) alongside Connectivist Learning Theory (Siemens, 2005). The TPACK construct illuminates how educators synthesize technological affordances with domain-specific pedagogical strategies to foster deep conceptual understanding.

## 2.2 Cognitive Scaffolding and AI Tutoring Systems
Recent scholarship characterizes AI dialogue systems as adaptive cognitive scaffolds capable of operating within a student's Zone of Proximal Development (Luckin et al., 2016; Mollick & Mollick, 2023). Formative feedback loops generated by intelligent agents have shown statistically significant improvements in student drafting quality and revision tenacity (Graham et al., 2021).

## 2.3 Ethical Dimensions and Academic Integrity
The rapid proliferation of generative models has catalyzed scholarly debate surrounding authentic assessment design (Perkins, 2023). Researchers argue that traditional recall-based assessments must transition toward process-oriented evaluation and oral defense mechanisms to preserve academic standards (Dawson et al., 2024).

## 2.4 Research Gaps
Existing literature remains heavily skewed toward theoretical commentary and short-term exploratory surveys. There is a marked deficit of longitudinal, mixed-methods empirical studies capturing both psychometric outcomes and qualitative faculty reflections under structured pedagogical interventions (Crompton & Burke, 2023).`,
        status: "COMPLETE",
        createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000),
        updatedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
      },
      {
        id: "ch-3",
        projectId: sampleId,
        chapterNumber: 3,
        title: "Methodology",
        content: `# Chapter 3: Research Methodology

## 3.1 Research Paradigm and Design
This study employs a convergent mixed-methods design (Creswell & Plano Clark, 2018), simultaneously capturing quantitative survey metrics and in-depth qualitative interview insights to facilitate robust triangulation.

## 3.2 Target Population and Sampling
The sample comprises university undergraduate students (N = 340) and faculty members (n = 22) recruited across engineering, social sciences, and humanities faculties. Stratified random sampling was used for the quantitative survey cohort, while purposive sampling guided faculty interviews.

## 3.3 Data Collection Instruments
1. **Validated Survey Scale**: Adapted from the Technology Acceptance Model (Davis, 1989), measuring Perceived Usefulness (PU), Perceived Ease of Use (PEOU), and Behavioral Intention (Cronbach's alpha = 0.91).
2. **Semi-Structured Interview Protocol**: Probing pedagogical adaptation, cognitive delegation, and assessment integrity.

## 3.4 Data Analysis Procedures
Quantitative data are analyzed using SPSS/R for descriptive statistics, Pearson bivariate correlations, and two-tailed independent samples t-tests. Qualitative transcripts undergo 6-phase reflexive thematic analysis (Braun & Clarke, 2006).

## 3.5 Ethical Safeguards
Ethics clearance was granted by the Institutional Ethics Review Board. All respondents provided informed consent with guaranteed data anonymization.`,
        status: "COMPLETE",
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      },
      {
        id: "ch-4",
        projectId: sampleId,
        chapterNumber: 4,
        title: "Data Analysis",
        content: "",
        status: "DRAFT",
        createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
        updatedAt: new Date(),
      },
      {
        id: "ch-5",
        projectId: sampleId,
        chapterNumber: 5,
        title: "Summary, Conclusion, and Recommendations",
        content: "",
        status: "DRAFT",
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
        updatedAt: new Date(),
      },
      {
        id: "ch-6",
        projectId: sampleId,
        chapterNumber: 6,
        title: "References",
        content: "",
        status: "DRAFT",
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        updatedAt: new Date(),
      },
      {
        id: "ch-7",
        projectId: sampleId,
        chapterNumber: 7,
        title: "Appendices",
        content: "",
        status: "DRAFT",
        createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
        updatedAt: new Date(),
      },
    ]

    for (const ch of initialChapters) {
      this.chapters.set(ch.id, ch)
    }
  }

  private generateId(prefix: string = "id"): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  project = {
    findMany: async (args?: { orderBy?: { updatedAt?: string } }) => {
      const list = Array.from(this.projects.values())
      if (args?.orderBy?.updatedAt === "desc") {
        list.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      }
      return list.map((p) => {
        const projectChapters = Array.from(this.chapters.values()).filter(
          (c) => c.projectId === p.id
        )
        return { ...p, chapters: projectChapters }
      })
    },
    findUnique: async (args: {
      where: { id: string }
      include?: { chapters?: { orderBy?: { chapterNumber?: string } }; messages?: { orderBy?: { createdAt?: string } } }
    }) => {
      const p = this.projects.get(args.where.id)
      if (!p) return null
      const result: any = { ...p }
      if (args.include?.chapters) {
        const chs = Array.from(this.chapters.values()).filter(
          (c) => c.projectId === p.id
        )
        chs.sort((a, b) => a.chapterNumber - b.chapterNumber)
        result.chapters = chs
      }
      if (args.include?.messages) {
        const msgs = Array.from(this.messages.values()).filter(
          (m) => m.projectId === p.id
        )
        msgs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        result.messages = msgs
      }
      return result
    },
    create: async (args: { data: any }) => {
      const id = this.generateId("proj")
      const now = new Date()
      const newProj: ProjectRecord = {
        id,
        title: args.data.title || args.data.topic || "",
        topic: args.data.topic || "",
        academicLevel: args.data.academicLevel || "MASTERS",
        department: args.data.department || "",
        institution: args.data.institution || "",
        country: args.data.country || "",
        methodology: args.data.methodology || "QUANTITATIVE",
        citationStyle: args.data.citationStyle || "APA",
        createdAt: now,
        updatedAt: now,
      }
      this.projects.set(id, newProj)
      return newProj
    },
    update: async (args: { where: { id: string }; data: any }) => {
      const p = this.projects.get(args.where.id)
      if (!p) throw new Error("Project not found")
      const updated = {
        ...p,
        ...args.data,
        updatedAt: new Date(),
      }
      this.projects.set(args.where.id, updated)
      return updated
    },
    delete: async (args: { where: { id: string } }) => {
      const id = args.where.id
      this.projects.delete(id)
      // Cascade delete chapters, messages, uploads, analyses
      for (const [k, v] of this.chapters.entries()) {
        if (v.projectId === id) this.chapters.delete(k)
      }
      for (const [k, v] of this.messages.entries()) {
        if (v.projectId === id) this.messages.delete(k)
      }
      for (const [k, v] of this.analyses.entries()) {
        if (v.projectId === id) this.analyses.delete(k)
      }
      for (const [k, v] of this.uploads.entries()) {
        if (v.projectId === id) this.uploads.delete(k)
      }
      return { id }
    },
  }

  chapter = {
    createMany: async (args: { data: any[] }) => {
      const created: ChapterRecord[] = []
      const now = new Date()
      for (const item of args.data) {
        const id = this.generateId("ch")
        const record: ChapterRecord = {
          id,
          projectId: item.projectId,
          chapterNumber: item.chapterNumber,
          title: item.title || "",
          content: item.content || "",
          status: item.status || "DRAFT",
          createdAt: now,
          updatedAt: now,
        }
        this.chapters.set(id, record)
        created.push(record)
      }
      return { count: created.length }
    },
    findMany: async (args?: {
      where?: { projectId?: string; status?: string }
      orderBy?: { chapterNumber?: string }
    }) => {
      let list = Array.from(this.chapters.values())
      if (args?.where?.projectId) {
        list = list.filter((c) => c.projectId === args.where!.projectId)
      }
      if (args?.where?.status) {
        list = list.filter((c) => c.status === args.where!.status)
      }
      list.sort((a, b) => a.chapterNumber - b.chapterNumber)
      return list
    },
    findUnique: async (args: { where: { id?: string; projectId_chapterNumber?: { projectId: string; chapterNumber: number } } }) => {
      if (args.where.id) {
        return this.chapters.get(args.where.id) || null
      }
      if (args.where.projectId_chapterNumber) {
        const { projectId, chapterNumber } = args.where.projectId_chapterNumber
        for (const c of this.chapters.values()) {
          if (c.projectId === projectId && c.chapterNumber === chapterNumber) {
            return c
          }
        }
      }
      return null
    },
    update: async (args: { where: { id: string }; data: any }) => {
      const c = this.chapters.get(args.where.id)
      if (!c) throw new Error("Chapter not found")
      const updated = { ...c, ...args.data, updatedAt: new Date() }
      this.chapters.set(args.where.id, updated)
      return updated
    },
    updateMany: async (args: {
      where: { projectId: string; chapterNumber: number }
      data: any
    }) => {
      let count = 0
      for (const [k, c] of this.chapters.entries()) {
        if (
          c.projectId === args.where.projectId &&
          c.chapterNumber === args.where.chapterNumber
        ) {
          this.chapters.set(k, { ...c, ...args.data, updatedAt: new Date() })
          count++
        }
      }
      return { count }
    },
  }

  message = {
    create: async (args: { data: any }) => {
      const id = this.generateId("msg")
      const now = new Date()
      const record: MessageRecord = {
        id,
        projectId: args.data.projectId,
        chapterNumber: args.data.chapterNumber ?? 1,
        role: args.data.role || "user",
        content: args.data.content || "",
        createdAt: now,
      }
      this.messages.set(id, record)
      return record
    },
    findMany: async (args?: {
      where?: { projectId?: string; chapterNumber?: number }
      orderBy?: { createdAt?: string }
      take?: number
    }) => {
      let list = Array.from(this.messages.values())
      if (args?.where?.projectId) {
        list = list.filter((m) => m.projectId === args.where!.projectId)
      }
      if (args?.where?.chapterNumber !== undefined) {
        list = list.filter((m) => m.chapterNumber === args.where!.chapterNumber)
      }
      list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      if (args?.take && args.take > 0) {
        list = list.slice(-args.take)
      }
      return list
    },
    update: async (args: { where: { id: string }; data: any }) => {
      const m = this.messages.get(args.where.id)
      if (!m) throw new Error("Message not found")
      const updated = { ...m, ...args.data }
      this.messages.set(args.where.id, updated)
      return updated
    },
    delete: async (args: { where: { id: string } }) => {
      this.messages.delete(args.where.id)
      return { id: args.where.id }
    },
  }

  analysis = {
    create: async (args: { data: any }) => {
      const id = this.generateId("an")
      const now = new Date()
      const record: AnalysisRecord = {
        id,
        projectId: args.data.projectId,
        type: args.data.type,
        data: args.data.data || {},
        results: args.data.results || [],
        createdAt: now,
        updatedAt: now,
      }
      this.analyses.set(id, record)
      return record
    },
    findMany: async (args?: { where?: { projectId?: string }; orderBy?: { createdAt?: string } }) => {
      let list = Array.from(this.analyses.values())
      if (args?.where?.projectId) {
        list = list.filter((a) => a.projectId === args.where!.projectId)
      }
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      return list
    },
    findUnique: async (args: { where: { id: string } }) => {
      return this.analyses.get(args.where.id) || null
    },
    delete: async (args: { where: { id: string } }) => {
      this.analyses.delete(args.where.id)
      return { id: args.where.id }
    },
  }

  upload = {
    create: async (args: { data: any }) => {
      const id = this.generateId("up")
      const record: UploadRecord = {
        id,
        projectId: args.data.projectId,
        filename: args.data.filename || "",
        fileUrl: args.data.fileUrl || "",
        fileType: args.data.fileType || "",
        fileSize: args.data.fileSize || 0,
        createdAt: new Date(),
      }
      this.uploads.set(id, record)
      return record
    },
    findMany: async (args?: { where?: { projectId?: string }; orderBy?: { createdAt?: string } }) => {
      let list = Array.from(this.uploads.values())
      if (args?.where?.projectId) {
        list = list.filter((u) => u.projectId === args.where!.projectId)
      }
      list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      return list
    },
    delete: async (args: { where: { id: string } }) => {
      this.uploads.delete(args.where.id)
      return { id: args.where.id }
    },
  }

  reference = {
    create: async (args: { data: any }) => {
      const id = this.generateId("ref")
      const record: ReferenceRecord = {
        id,
        projectId: args.data.projectId,
        citation: args.data.citation || "",
        style: args.data.style || "APA",
        source: args.data.source || "manual",
        createdAt: new Date(),
      }
      this.references.set(id, record)
      return record
    },
    findMany: async (args?: { where?: { projectId?: string }; orderBy?: { createdAt?: string } }) => {
      let list = Array.from(this.references.values())
      if (args?.where?.projectId) {
        list = list.filter((r) => r.projectId === args.where!.projectId)
      }
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      return list
    },
    delete: async (args: { where: { id: string } }) => {
      this.references.delete(args.where.id)
      return { id: args.where.id }
    },
  }

  export = {
    create: async (args: { data: any }) => {
      const id = this.generateId("exp")
      const record: ExportRecord = {
        id,
        projectId: args.data.projectId,
        format: args.data.format || "",
        fileUrl: args.data.fileUrl || "",
        createdAt: new Date(),
      }
      this.exports.set(id, record)
      return record
    },
    findMany: async (args?: { where?: { projectId?: string } }) => {
      let list = Array.from(this.exports.values())
      if (args?.where?.projectId) {
        list = list.filter((e) => e.projectId === args.where!.projectId)
      }
      return list
    },
  }
}

const globalStore = (globalThis as any).__inMemoryPrismaStore || new InMemoryPrismaStore()
if (process.env.NODE_ENV !== "production") {
  ;(globalThis as any).__inMemoryPrismaStore = globalStore
}

const isPlaceholderDb =
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes("[PASSWORD]") ||
  process.env.DATABASE_URL.includes("[REF]") ||
  process.env.DATABASE_URL.includes("placeholder") ||
  !process.env.DATABASE_URL.startsWith("postgres")

function createResilientPrismaClient(): any {
  if (isPlaceholderDb) {
    return globalStore
  }

  try {
    const realClient = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    })

    return new Proxy(globalStore, {
      get(target, prop: string) {
        if (typeof prop === "string" && prop in realClient) {
          const realModel = (realClient as any)[prop]
          const fallbackModel = (target as any)[prop]
          if (typeof realModel === "object" && realModel !== null) {
            return new Proxy(fallbackModel || {}, {
              get(_mTarget, method: string) {
                return async (...args: any[]) => {
                  try {
                    return await realModel[method](...args)
                  } catch (err: any) {
                    console.warn(
                      `[AI Studio] Real DB call ${prop}.${method} failed, using in-memory store:`,
                      err?.message
                    )
                    if (fallbackModel && typeof fallbackModel[method] === "function") {
                      return await fallbackModel[method](...args)
                    }
                    throw err
                  }
                }
              },
            })
          }
          if (typeof realModel === "function") {
            return realModel.bind(realClient)
          }
        }
        return (target as any)[prop]
      },
    })
  } catch {
    console.warn("[AI Studio] Real database initialization failed — using in-memory store")
    return globalStore
  }
}

export const prisma: any = createResilientPrismaClient()

