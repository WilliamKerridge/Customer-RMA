'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Paperclip, Download, Upload, FileText, X } from 'lucide-react'

interface Attachment {
  id: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  created_at: string
  downloadUrl: string | null
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function AdminAttachmentsCard({
  caseId,
  initialAttachments,
}: {
  caseId: string
  initialAttachments: Attachment[]
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  async function uploadFile(file: File) {
    setUploading(true)
    setUploadError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`/api/cases/${caseId}/attachments`, {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) {
        setUploadError(json.message ?? 'Upload failed')
      } else {
        router.refresh()
      }
    } catch {
      setUploadError('Network error — please try again')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  return (
    <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3.5 border-b border-grey-100 flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold text-text flex items-center gap-2">
          <Paperclip className="w-3.5 h-3.5 text-grey-400" />
          Attachments
          {initialAttachments.length > 0 && (
            <span className="text-[10px] font-bold text-grey-400 bg-grey-100 px-1.5 py-0.5 rounded-full">
              {initialAttachments.length}
            </span>
          )}
        </h2>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue hover:text-blue-light transition-colors disabled:opacity-50"
        >
          <Upload className="w-3 h-3" />
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>

      {/* Drop zone / file list */}
      <div
        className={`px-4 py-3 transition-colors ${dragOver ? 'bg-blue/5' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {initialAttachments.length === 0 ? (
          <div
            className={`border-2 border-dashed rounded-lg px-4 py-5 text-center transition-colors ${
              dragOver ? 'border-blue bg-blue/5' : 'border-grey-200'
            }`}
          >
            <Paperclip className="w-4 h-4 text-grey-300 mx-auto mb-1.5" />
            <p className="text-[12px] text-grey-400">
              {uploading ? 'Uploading…' : 'Drop a file here or use Upload'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {initialAttachments.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-grey-50 transition-colors group"
              >
                <FileText className="w-3.5 h-3.5 text-grey-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-text truncate">{a.file_name}</div>
                  <div className="text-[10px] text-grey-400">
                    {formatBytes(a.file_size)}{a.file_size ? ' · ' : ''}{formatDate(a.created_at)}
                  </div>
                </div>
                {a.downloadUrl && (
                  <a
                    href={a.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={a.file_name}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-grey-100"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5 text-grey-500" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {uploadError && (
          <div className="mt-2 flex items-center gap-2 text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <X className="w-3 h-3 flex-shrink-0" />
            {uploadError}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileInput}
        accept="*/*"
      />
    </div>
  )
}
