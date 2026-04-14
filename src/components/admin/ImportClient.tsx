'use client'

import { useRef, useState } from 'react'
import type { ImportPreviewRow } from '@/app/api/admin/import/parse/route'
import { useToast } from '@/hooks/useToast'
import ToastContainer from '@/components/ui/ToastContainer'

interface ParseResult {
  filename: string
  totalRows: number
  matchedRows: number
  rows: ImportPreviewRow[]
}

const STATUS_COLOUR: Record<string, string> = {
  // workshop stages
  AWAITING_TEST: 'bg-blue-50 text-blue-700',
  RETEST: 'bg-blue-50 text-blue-700',
  REWORK: 'bg-indigo-50 text-indigo-700',
  FINAL_TEST: 'bg-purple-50 text-purple-700',
  CLEAN_AND_LABEL: 'bg-teal-50 text-teal-700',
  INSPECTION: 'bg-cyan-50 text-cyan-700',
  WORKSHOP_COMPLETE: 'bg-emerald-50 text-emerald-700',
  // holds
  AWAITING_PARTS: 'bg-amber-50 text-amber-700',
  WITH_SUPPORT: 'bg-amber-50 text-amber-700',
  WITH_ENGINEERING: 'bg-amber-50 text-amber-700',
  AWAITING_CUSTOMER: 'bg-orange-50 text-orange-700',
  CREDIT_HELD: 'bg-red-50 text-red-700',
}

function StatusBadge({ stage, hold, label }: { stage: string | null; hold: string | null; label: string | null }) {
  if (!label) return <span className="text-grey-400 text-[12px]">—</span>
  const key = stage ?? hold ?? ''
  const colour = STATUS_COLOUR[key] ?? 'bg-grey-100 text-grey-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${colour}`}>
      {label}
    </span>
  )
}

export default function ImportClient() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState<ParseResult | null>(null)
  const [done, setDone] = useState(false)
  const { toasts, addToast, removeToast } = useToast()

  async function handleFile(file: File) {
    setParsing(true)
    setResult(null)
    setDone(false)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/import/parse', { method: 'POST', body: formData })
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
      const res = await fetch('/api/admin/import/confirm', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: result.filename, rows: result.rows }),
      })
      const data = await res.json()
      if (!res.ok) { addToast(data.message ?? 'Failed to apply import', 'error'); return }
      addToast(`Import complete — ${data.updatedRows} case${data.updatedRows !== 1 ? 's' : ''} updated`, 'success')
      setDone(true)
      setResult(null)
    } catch {
      addToast('Failed to apply import', 'error')
    } finally {
      setConfirming(false)
    }
  }

  function resetImport() {
    setResult(null)
    setDone(false)
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
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            )}
          </div>
          <div className="text-center">
            <p className="font-semibold text-[14px] text-text mb-1">
              {parsing ? 'Parsing spreadsheet…' : 'Upload Power BI export'}
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
              <p className="text-[11px] font-semibold text-grey-400 uppercase tracking-[0.06em] mb-0.5">Matched</p>
              <p className="text-[18px] font-bold text-emerald-600">{result.matchedRows}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-grey-400 uppercase tracking-[0.06em] mb-0.5">Unmatched</p>
              <p className="text-[18px] font-bold text-grey-400">{result.totalRows - result.matchedRows}</p>
            </div>
            <div className="ml-auto flex gap-2">
              <button
                onClick={resetImport}
                className="px-4 py-2 rounded-lg text-[12.5px] font-semibold text-grey-600 bg-grey-100 hover:bg-grey-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming || result.matchedRows === 0}
                className="px-5 py-2 rounded-lg text-[12.5px] font-semibold bg-navy text-white hover:bg-navy-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {confirming ? 'Applying…' : `Apply ${result.matchedRows} update${result.matchedRows !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>

          {/* Preview table */}
          <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="bg-grey-50 border-b border-grey-200">
                    <th className="px-4 py-3 text-left font-semibold text-grey-500 text-[11px] uppercase tracking-[0.06em]">RMA</th>
                    <th className="px-4 py-3 text-left font-semibold text-grey-500 text-[11px] uppercase tracking-[0.06em]">Case</th>
                    <th className="px-4 py-3 text-left font-semibold text-grey-500 text-[11px] uppercase tracking-[0.06em]">Planner Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-grey-500 text-[11px] uppercase tracking-[0.06em]">Maps to</th>
                    <th className="px-4 py-3 text-left font-semibold text-grey-500 text-[11px] uppercase tracking-[0.06em]">Sales Order</th>
                    <th className="px-4 py-3 text-left font-semibold text-grey-500 text-[11px] uppercase tracking-[0.06em]">Works Order</th>
                    <th className="px-4 py-3 text-left font-semibold text-grey-500 text-[11px] uppercase tracking-[0.06em]">Est. Completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-grey-100">
                  {result.rows.map((row, i) => (
                    <tr
                      key={i}
                      className={`${row.matched ? '' : 'opacity-40'} hover:bg-grey-50`}
                    >
                      <td className="px-4 py-3 font-mono text-[12px] text-text font-medium">
                        {row.rmaNumber || <span className="text-grey-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {row.caseNumber ? (
                          <span className="font-mono text-[12px] text-text">{row.caseNumber}</span>
                        ) : (
                          <span className="text-[11px] text-red-500 font-semibold">Not found</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-grey-600">
                        {row.plannerStatus || <span className="text-grey-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge stage={row.workshopStage} hold={row.holdReason} label={row.mappedStatus} />
                        {row.plannerStatus && !row.mappedStatus && (
                          <span className="text-[11px] text-amber-600 font-semibold">Unknown bucket</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-grey-600">{row.sapSalesOrder ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-[12px] text-grey-600">{row.sapWorksOrder ?? '—'}</td>
                      <td className="px-4 py-3 text-grey-600">{row.sapEstimatedCompletion ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.totalRows > result.matchedRows && (
              <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
                <p className="text-[12px] text-amber-700">
                  {result.totalRows - result.matchedRows} row{result.totalRows - result.matchedRows !== 1 ? 's' : ''} could not be matched to a case and will be skipped.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Done state */}
      {done && (
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm p-8 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="font-semibold text-[14px] text-text">Import complete</p>
          <button
            onClick={resetImport}
            className="px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-navy text-white hover:bg-navy-mid transition-colors"
          >
            Import another file
          </button>
        </div>
      )}
    </>
  )
}
