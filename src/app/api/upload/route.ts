import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const projectId = formData.get("projectId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!projectId) {
      return NextResponse.json({ error: "No project ID provided" }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()

    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const storagePath = `${projectId}/${filename}`

    let fileUrl = ""
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { error: uploadError } = await supabase.storage
          .from("uploads")
          .upload(storagePath, file, {
            contentType: file.type,
            upsert: false,
          })

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("uploads")
            .getPublicUrl(storagePath)
          fileUrl = urlData.publicUrl
        }
      }
    } catch {
      // Supabase storage unavailable - fall through to data URL
    }

    if (!fileUrl) {
      const arrayBuffer = await file.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString("base64")
      fileUrl = `data:${file.type || "application/octet-stream"};base64,${base64}`
    }

    const upload = await prisma.upload.create({
      data: {
        projectId,
        filename: file.name,
        fileUrl,
        fileType: file.type,
        fileSize: file.size,
      },
    })

    return NextResponse.json(upload, { status: 201 })
  } catch (error) {
    console.error("Upload failed:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
