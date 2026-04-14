import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const BUCKET = 'case-attachments'

async function requireStaff() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('users')
    .select('id, role')
    .eq('email', session.user.email)
    .single()

  const profile = data as { id: string; role: string } | null
  if (!profile || !['staff_uk', 'staff_us', 'admin'].includes(profile.role)) return null

  return { ...session.user, canonicalId: profile.id }
}

// GET — list attachments for a case with signed download URLs
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const user = await requireStaff()
    if (!user) return NextResponse.json({ message: 'Unauthorised' }, { status: 403 })

    const { caseId } = await params
    const supabase = createServiceClient()

    const { data: attachments, error } = await supabase
      .from('case_attachments')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Attachments GET failed:', error)
      return NextResponse.json({ message: 'Failed to fetch attachments' }, { status: 500 })
    }

    // Generate signed URLs (60 min expiry)
    const withUrls = await Promise.all(
      (attachments ?? []).map(async (a) => {
        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(a.storage_path, 3600)
        return { ...a, downloadUrl: signed?.signedUrl ?? null }
      })
    )

    return NextResponse.json({ attachments: withUrls })
  } catch (err) {
    console.error('Attachments GET error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// POST — upload a file (multipart/form-data), store in Supabase Storage, record in DB
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const user = await requireStaff()
    if (!user) return NextResponse.json({ message: 'Unauthorised' }, { status: 403 })

    const { caseId } = await params
    const supabase = createServiceClient()

    // Verify case exists
    const { data: caseRow } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .single()

    if (!caseRow) return NextResponse.json({ message: 'Case not found' }, { status: 404 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ message: 'No file provided' }, { status: 400 })
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ message: 'File exceeds 20 MB limit' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${caseId}/${Date.now()}-${safeFileName}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload failed:', uploadError)
      return NextResponse.json({ message: 'Failed to upload file' }, { status: 500 })
    }

    const { data: attachment, error: dbError } = await supabase
      .from('case_attachments')
      .insert({
        case_id: caseId,
        uploaded_by: user.canonicalId,
        file_name: file.name,
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.type || null,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Attachment DB insert failed:', dbError)
      // Clean up storage upload
      await supabase.storage.from(BUCKET).remove([storagePath])
      return NextResponse.json({ message: 'Failed to save attachment record' }, { status: 500 })
    }

    return NextResponse.json({ attachment }, { status: 201 })
  } catch (err) {
    console.error('Attachments POST error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
