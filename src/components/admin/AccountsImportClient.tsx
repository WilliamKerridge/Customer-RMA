'use client'

import { useRef, useState } from 'react'
import type { AccountPreviewRow } from '@/app/api/admin/import/accounts-parse/route'
import { useToast } from '@/hooks/useToast'
import ToastContainer from '@/components/ui/ToastContainer'

interface ParseResult {
  filename: string
  totalRows: number
  validRows: number
  createCount: number
  updateCount: number
  rows: AccountPreviewRow[]
}

function BoolBadge({ value }: { value: boolean }) {
  return value
    ? <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Yes</span>
    : <span className="text-[11px] font-semibold text-grey-400 bg-grey-100 px-2 py-0.5 rounded-full">No</span>
}

export default function AccountsImportClient() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState<ParseResult | null>(null)
  const [done, setDone] = useState<{ created: number; updated: number } | null>(null)
  const { toasts, addToast, removeToast } = useToast()

  async function handleFile(file: File) {
    setParsing(true)
    setResult(null)
    setDone(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/import/accounts-parse', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { addToast(data.message ?? 'Failed to parse file', 'error'); return }
      setResult(data)
    } catch {
      addToast('Failed to parse file', 'error')
    } finally {
      setParsing(false)
    }
  }

  async function handleConfirm() {
    if (!result) return
    setConfirming(true)
    try {
      const res = await fetch('/api/admin/import/accounts-confirm', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: result.filename, rows: result.rows }),
      })
      const data = await res.json()
      if (!res.ok) { addToast(data.message ?? 'Failed to apply import', 'error'); return }
      setDone({ created: data.createdCount, updated: data.updatedCount })
      setResult(null)
    } catch {
      addToast('Failed to apply import', 'error')
    } finally {
      setConfirming(false)
    }
  }

  function reset() {
    setResult(null)
    setDone(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Upload zone */}
      {!result && !done && (
        <div
          className={`bg-white rounded-xl border-2 border-dashed transition-colors p-12 flex flex-col items-center gap-4 cursor-pointer mb-6 ${
            isDragging ? 'border-blue bg-blue-50' : 'border-grey-200 hover:border-grey-300'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => {
            e.preventDefault(); setIsDragging(false)
            const f = e.dataTransfer.files[0]
            if (f) handleFile(f)
          }}
        >
          <div className="w-14 h-14 rounded-full bg-grey-100 flex items-center justify-center">
            {parsing ? (
              <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            )}
          </div>
          <div className="text-center">
            <p className="font-semibold text-[14px] text-text mb-1">
              {parsing ? 'Parsing spreadsheet…' : 'Upload customer accounts file'}
            </p>
            <p className="text-[12.5px] text-grey-500">
              Drag and drop an Excel file here, or click to browse
            </p>
            <p className="text-[11px] text-grey-400 mt-1">.xlsx or .xls · Max 10 MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>
      )}

      {/* Preview */}
      {result && (
        <div className="space-y-5">
          {/* Summary bar */}
          <div className="flex flex-wrap items-center gap-4 bg-white rounded-xl border border-grey-200 shadow-sm px-6 py-4">
            <div>
              <p className="text-[11px] font-semibold text-grey-400 uppercase tracking-[0.06em] mb-0.5">File</p>
              <p className="text-[13px] font-semibold text-text font-mono">{result.filename}</p>
            </div>
            <div className="w-px h-8 bg-grey-200 hidden sm:block" />
            <div>
              <p className="text-[11px] font-semibold text-grey-400 uppercase tracking-[0.06em] mb-0.5">Total rows</p>
              <p className="text-[18px] font-bold text-text">{result.totalRows}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-grey-400 uppercase tracking-[0.06em] mb-0.5">New accounts</p>
              <p className="text-[18px] font-bold text-blue">{result.createCount}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-grey-400 uppercase tracking-[0.06em] mb-0.5">Updates</p>
              <p className="text-[18px] font-bold text-emerald-600">{result.updateCount}</p>
            </div>
            {result.totalRows - result.validRows > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-grey-400 uppercase tracking-[0.06em] mb-0.5">Invalid</p>
                <p className="text-[18px] font-bold text-red-500">{result.totalRows - result.validRows}</p>
              </div>
            )}
            <div className="ml-auto flex gap-2">
              <button onClick={reset}
                className="px-4 py-2 rounded-lg text-[12.5px] font-semibold text-grey-600 bg-grey-100 hover:bg-grey-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming || result.validRows === 0}
                className="px-5 py-2 rounded-lg text-[12.5px] font-semibold bg-navy text-white hover:bg-navy-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {confirming ? 'Applying…' : `Import ${result.validRows} account${result.validRows !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>

          {/* Preview table */}
          <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="bg-grey-50 border-b border-grey-200">
                    <th className="px-4 py-3 text-left font-semibold text-grey-500 text-[11px] uppercase tracking-[0.06em]">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-grey-500 text-[11px] uppercase tracking-[0.06em]">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-grey-500 text-[11px] uppercase tracking-[0.06em]">Company</th>
                    <th className="px-4 py-3 text-left font-semibold text-grey-500 text-[11px] uppercase tracking-[0.06em]">Credit Terms</th>
                    <th className="px-4 py-3 text-left font-semibold text-grey-500 text-[11px] uppercase tracking-[0.06em]">PO Required</th>
                    <th className="px-4 py-3 text-left font-semibold text-grey-500 text-[11px] uppercase tracking-[0.06em]">Active</th>
                    <th className="px-4 py-3 text-left font-semibold text-grey-500 text-[11px] uppercase tracking-[0.06em]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-grey-100">
                  {result.rows.map((row, i) => (
                    <tr key={i} className={`${row.invalid ? 'opacity-40 bg-red-50' : 'hover:bg-grey-50'}`}>
                      <td className="px-4 py-3 text-text">
                        {row.email || <span className="text-red-500 font-semibold text-[11px]">Missing</span>}
                      </td>
                      <td className="px-4 py-3 text-grey-700">{row.fullName ?? '—'}</td>
                      <td className="px-4 py-3 text-grey-700">{row.companyName ?? row.company ?? '—'}</td>
                      <td className="px-4 py-3"><BoolBadge value={row.creditTerms} /></td>
                      <td className="px-4 py-3"><BoolBadge value={row.poRequired} /></td>
                      <td className="px-4 py-3"><BoolBadge value={row.accountActive} /></td>
                      <td className="px-4 py-3">
                        {row.invalid ? (
                          <span className="text-[11px] font-semibold text-red-600">Invalid email</span>
                        ) : row.action === 'create' ? (
                          <span className="text-[11px] font-semibold text-blue bg-blue/10 px-2 py-0.5 rounded-full">New</span>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Update</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.totalRows - result.validRows > 0 && (
              <div className="px-5 py-3 bg-red-50 border-t border-red-100">
                <p className="text-[12px] text-red-700">
                  {result.totalRows - result.validRows} row{result.totalRows - result.validRows !== 1 ? 's have' : ' has'} a missing or invalid email and will be skipped.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Done */}
      {done && (
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm p-8 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="font-semibold text-[14px] text-text">Import complete</p>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-[22px] font-bold text-blue">{done.created}</p>
              <p className="text-[12px] text-grey-500">accounts created</p>
            </div>
            <div>
              <p className="text-[22px] font-bold text-emerald-600">{done.updated}</p>
              <p className="text-[12px] text-grey-500">accounts updated</p>
            </div>
          </div>
          <button onClick={reset}
            className="px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-navy text-white hover:bg-navy-mid transition-colors">
            Import another file
          </button>
        </div>
      )}
    </>
  )
}
