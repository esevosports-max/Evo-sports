"use client"

import { useState } from "react"
import { useLanguage } from "@/components/LanguageProvider"

interface ClubRequest {
  id: string
  clubName: string
  clubLogo: string | null
  creationDate: string
  address: string
  stadiumName: string
  pdfFilename: string | null
  phone: string | null
  status: string
  rejectionReason?: string | null
  createdAt: string
  user: {
    name: string | null
    email: string | null
  }
}

export default function ManagerRequestsList({ initialRequests }: { initialRequests: ClubRequest[] }) {
  const [requests, setRequests] = useState<ClubRequest[]>(initialRequests)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("ALL") // ALL, PENDING, APPROVED, REJECTED
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null)
  const { t, language } = useLanguage()
  
  // Rejection Modal States
  const [rejectingReq, setRejectingReq] = useState<ClubRequest | null>(null)
  const [rejectionReasonInput, setRejectionReasonInput] = useState("")

  const handleUpdateStatus = async (id: string, status: "APPROVED" | "REJECTED" | "PENDING", reason?: string) => {
    setLoadingId(id)
    try {
      const res = await fetch("/api/club-request", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, rejectionReason: reason }),
      })

      if (res.ok) {
        setRequests((prev) =>
          prev.map((req) => (req.id === id ? { ...req, status, rejectionReason: status === "REJECTED" ? (reason || null) : null } : req))
        )
      } else {
        const data = await res.json()
        alert(data.error || "Une erreur est survenue.")
      }
    } catch (err) {
      console.error(err)
      alert("Erreur réseau.")
    } finally {
      setLoadingId(null)
    }
  }

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = filter === "ALL" || req.status === filter
    const matchesSearch = req.clubName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-zinc-200/50 dark:border-zinc-800/50 pb-5">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
            {t("mgr_req_title").replace("{count}", filteredRequests.length.toString())}
          </h3>
          <p className="text-xs text-zinc-500">
            {t("mgr_req_desc")}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
          {/* Search Input bar */}
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("mgr_req_search_placeholder")}
              className="w-full sm:w-64 rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-4 py-2.5 text-xs font-semibold shadow-inner outline-none focus:bg-white focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
            />
            <svg
              className="absolute left-3 top-3 h-4 w-4 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Status Filters buttons */}
          <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-850 p-1 rounded-xl shrink-0 overflow-x-auto">
            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer shrink-0 ${
                  filter === f
                    ? "bg-gradient-to-b from-emerald-500 to-teal-600 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {f === "ALL"
                  ? t("mgr_req_filter_all")
                  : f === "PENDING"
                  ? t("mgr_req_filter_pending")
                  : f === "APPROVED"
                  ? t("mgr_req_filter_approved")
                  : t("mgr_req_filter_rejected")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <svg className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.375c.9 0 1.625-.725 1.625-1.625V13.5c0-.9-.725-1.625-1.625-1.625H9M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
          </svg>
          <p className="mt-2 text-xs font-semibold text-zinc-500">{t("mgr_req_none")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className={`rounded-2xl border p-6 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-200 ${
                req.status === "PENDING"
                  ? "border-amber-500/30 dark:border-amber-500/20"
                  : req.status === "APPROVED"
                  ? "border-emerald-500/20 dark:border-emerald-500/10"
                  : "border-red-500/20 dark:border-red-500/10"
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                
                {/* Left details */}
                <div className="flex items-start gap-4">
                  {req.clubLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={req.clubLogo} alt="Logo" className="h-16 w-16 object-contain rounded-xl border border-zinc-200/50 bg-zinc-50/50 p-1 shadow-sm" />
                  ) : (
                    <div className="h-16 w-16 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-400 text-[9px] font-black uppercase">
                      {t("mgr_req_no_logo")}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-extrabold text-zinc-900 dark:text-white">{req.clubName}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        req.status === "PENDING"
                          ? "bg-amber-500/10 text-amber-600"
                          : req.status === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-red-500/10 text-red-600"
                      }`}>
                        {req.status === "PENDING"
                          ? t("mgr_req_filter_pending")
                          : req.status === "APPROVED"
                          ? t("mgr_req_filter_approved")
                          : t("mgr_req_filter_rejected")}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500">
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">{t("mgr_req_president")}</span> {req.user?.name || t("mgr_req_unknown")} ({req.user?.email || t("mgr_req_no_email")})
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-1.5 text-[11px] text-zinc-500">
                      <div><span className="font-semibold text-zinc-700 dark:text-zinc-400">{t("mgr_req_stadium")}</span> {req.stadiumName}</div>
                      <div>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-400">{t("mgr_req_date")}</span> {
                          new Date(req.creationDate).toLocaleDateString(
                            language === "FR" ? "fr-FR" : language === "EN" ? "en-US" : "ar-EG"
                          )
                        }
                      </div>
                      <div><span className="font-semibold text-zinc-700 dark:text-zinc-400">{t("mgr_req_phone")}</span> {req.phone || t("mgr_req_not_specified")}</div>
                      <div className="sm:col-span-2"><span className="font-semibold text-zinc-700 dark:text-zinc-400">{t("mgr_req_address")}</span> {req.address}</div>
                    </div>
                    {req.status === "REJECTED" && req.rejectionReason && (
                      <div className="mt-3 bg-red-500/5 dark:bg-red-950/20 border border-red-500/10 rounded-xl p-3 text-xs max-w-lg">
                        <span className="font-black text-red-650 dark:text-red-400 uppercase text-[9px] block mb-1">{t("mgr_req_rejection_reason")}</span>
                        <p className="text-zinc-700 dark:text-zinc-300 font-bold leading-relaxed">{req.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right actions */}
                <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  
                  {/* PDF Viewer / Downloader */}
                  {req.pdfFilename && (
                    <button
                      onClick={() => setSelectedPdf(req.pdfFilename)}
                      className="px-4 py-2 rounded-xl border border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    >
                      <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                        <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                      </svg>
                      {t("mgr_req_view_pdf")}
                    </button>
                  )}

                  {req.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(req.id, "APPROVED")}
                        disabled={loadingId !== null}
                        className="px-4 py-2 rounded-xl bg-gradient-to-b from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black uppercase text-[10px] tracking-wider shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
                      >
                        {loadingId === req.id ? t("mgr_req_accepting") : t("mgr_req_accept")}
                      </button>

                      <button
                        onClick={() => {
                          setRejectingReq(req)
                          setRejectionReasonInput("")
                        }}
                        disabled={loadingId !== null}
                        className="px-4 py-2 rounded-xl bg-gradient-to-b from-red-500 to-red-660 hover:from-red-450 hover:to-red-550 text-white font-black uppercase text-[10px] tracking-wider shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
                      >
                        {t("mgr_req_reject")}
                      </button>
                    </>
                  )}

                  {req.status !== "PENDING" && (
                    <button
                      onClick={() => handleUpdateStatus(req.id, "PENDING")}
                      disabled={loadingId !== null}
                      className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 font-black uppercase text-[9px] tracking-wider active:scale-95 transition-all cursor-pointer"
                    >
                      {t("mgr_req_reset_pending")}
                    </button>
                  )}

                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF Modal Preview */}
      {selectedPdf && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">
                {t("mgr_req_pdf_title")}
              </h4>
              <button
                onClick={() => setSelectedPdf(null)}
                className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 bg-zinc-100 dark:bg-zinc-950 p-2">
              <iframe
                src={selectedPdf}
                className="w-full h-full rounded-lg border-0 shadow-inner"
                title="PDF Document Preview"
              />
            </div>
            <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
              <a
                href={selectedPdf}
                download="declaration_sur_lhonneur.pdf"
                className="px-4 py-2 rounded-xl bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-300 border border-zinc-300/80 text-emerald-800 font-black uppercase text-[10px] tracking-wider shadow-sm hover:from-white hover:via-zinc-100 hover:to-zinc-200 hover:text-emerald-600 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                {t("mgr_req_download")}
              </a>
              <button
                onClick={() => setSelectedPdf(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 text-white font-black uppercase text-[10px] tracking-wider shadow-sm hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer"
              >
                {t("mgr_req_close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingReq && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h4 className="text-sm font-black text-red-650 dark:text-red-400 uppercase tracking-wider">
                {t("mgr_req_modal_reject_title")}
              </h4>
              <button
                onClick={() => setRejectingReq(null)}
                className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!rejectionReasonInput.trim()) {
                alert("Veuillez saisir un motif de refus.");
                return;
              }
              await handleUpdateStatus(rejectingReq.id, "REJECTED", rejectionReasonInput.trim());
              setRejectingReq(null);
            }} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                  {t("mgr_req_modal_reason_label")}
                </label>
                <textarea
                  required
                  rows={4}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder={t("mgr_req_modal_reason_placeholder")}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold shadow-inner outline-none focus:bg-white focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRejectingReq(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold uppercase text-[10px] tracking-wider active:scale-95 transition-all cursor-pointer"
                >
                  {t("mgr_req_cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-b from-red-500 to-red-650 hover:from-red-450 hover:to-red-550 text-white font-black uppercase text-[10px] tracking-wider shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  {t("mgr_req_confirm_reject")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
