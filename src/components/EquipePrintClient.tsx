"use client"

import { useEffect } from "react"

interface ClubInfo {
  name: string
  logo: string | null
  creationDate: string
  address: string
  stadiumName: string
  stadiumCapacity: string
  phone: string
}

interface Category {
  name: string
  coach: string
  league: string
  maxPlayers: number
}

interface StaffRoleGroup {
  roleName: string
  count: number
  names: string[]
}

interface EquipePrintClientProps {
  club: ClubInfo
  categories: Category[]
  staffRoles: StaffRoleGroup[]
  totalStaffCount: number
}

export default function EquipePrintClient({
  club,
  categories,
  staffRoles,
  totalStaffCount
}: EquipePrintClientProps) {
  
  // Format creation date for display (e.g. DD/MM/YYYY)
  const formatCreationDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      })
    } catch {
      return dateString
    }
  }

  // Today's Date formatted beautifully for the fiche header
  const sheetGenerationDate = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })

  // Auto print on load
  useEffect(() => {
    // Wait a brief moment to ensure all styles and fonts load properly
    const timer = setTimeout(() => {
      window.print()
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-white text-zinc-900 p-0 sm:p-6 print:p-0 font-sans">
      
      {/* A4 Sheet Container */}
      <div className="a4-sheet mx-auto p-12 bg-white print:p-0" style={{ maxWidth: "210mm" }}>
        
        {/* Section 1: Header Row */}
        <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-6 mb-8">
          {/* Top Left: EVO Sports Logo */}
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="EVO SPORTS Logo" 
              className="h-12 w-auto object-contain" 
            />
          </div>

          {/* Top Right: Fiche Creation Date */}
          <div className="text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Date d&apos;édition</p>
            <p className="text-xs font-black text-zinc-800 mt-0.5">{sheetGenerationDate}</p>
          </div>
        </div>

        {/* Section 2: Bold Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black uppercase tracking-widest text-zinc-950 border-y-2 border-zinc-900 py-3 inline-block px-10">
            Fiche de Club
          </h1>
        </div>

        {/* Section 3: Club Info in Two Columns */}
        <div className="grid grid-cols-2 gap-8 border-b-2 border-zinc-200 pb-8 mb-8">
          
          {/* Left Column: Logo, Club Name, Creation Date */}
          <div className="flex items-start gap-6 border-r border-zinc-150 pr-8">
            {club.logo ? (
              <img 
                src={club.logo} 
                alt="Logo Club" 
                className="h-28 w-28 object-cover rounded-2xl border-2 border-zinc-200 shadow-md shrink-0 bg-white" 
              />
            ) : (
              <span className="h-28 w-28 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 flex items-center justify-center font-black text-white text-4xl shadow-md shrink-0">
                {club.name.substring(0, 2).toUpperCase()}
              </span>
            )}
            
            <div className="space-y-3 flex-1 min-w-0">
              <div>
                <span className="text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">Club</span>
                <h2 className="text-2xl font-black text-zinc-950 uppercase tracking-wide mt-1.5 break-words">{club.name}</h2>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Date de création</p>
                <p className="text-sm font-bold text-zinc-800 mt-0.5">
                  📅 {formatCreationDate(club.creationDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Ground, Capacity, Address, Phone */}
          <div className="space-y-4 flex flex-col justify-center">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 border-b border-zinc-100 pb-1.5 select-none">
              Installations & Contacts
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs font-medium">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Terrain d&apos;honneur</p>
                <p className="text-zinc-800 font-extrabold mt-0.5">🏟️ {club.stadiumName}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Capacité du terrain</p>
                <p className="text-zinc-800 font-extrabold mt-0.5">👥 {club.stadiumCapacity}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Adresse</p>
                <p className="text-zinc-800 font-extrabold mt-0.5">📍 {club.address}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Numéro de téléphone</p>
                <p className="text-zinc-800 font-extrabold mt-0.5">📞 {club.phone}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Section 4: Tables Section (Teams & Staff) */}
        <div className="space-y-8">
          
          {/* Table 1: Teams (Équipes) with Squad Size */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b-2 border-zinc-900 pb-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-950">
                Équipes & Catégories
              </h3>
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-250">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-250 text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    <th className="py-3 px-4">Équipe / Catégorie</th>
                    <th className="py-3 px-4">Championnat / Division</th>
                    <th className="py-3 px-4">Entraîneur Référent</th>
                    <th className="py-3 px-4 text-center">Effectif Max</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {categories.map((cat) => (
                    <tr key={cat.name} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-extrabold text-zinc-950 uppercase">{cat.name}</td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-500">{cat.league}</td>
                      <td className="py-3.5 px-4 font-bold text-zinc-700">{cat.coach}</td>
                      <td className="py-3.5 px-4 text-center font-black text-emerald-600 bg-emerald-500/5 text-sm">
                        {cat.maxPlayers} max
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Staff Roles & Counts */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b-2 border-zinc-900 pb-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-950">
                Staff Technique & Administratif
              </h3>
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-250">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-250 text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    <th className="py-3 px-4">Fonction / Rôle</th>
                    <th className="py-3 px-4">Membres Assignés</th>
                    <th className="py-3 px-4 text-center">Effectif (Nombre)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {staffRoles.map((role) => (
                    <tr key={role.roleName} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-extrabold text-zinc-950 uppercase">{role.roleName}</td>
                      <td className="py-3.5 px-4 font-bold text-zinc-750">
                        {role.names.length > 0 ? role.names.join(", ") : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-zinc-800 text-sm">
                        {role.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-950 text-white font-black text-xs">
                    <td colSpan={2} className="py-3.5 px-4 uppercase tracking-wider text-right">
                      Total Effectif du Staff :
                    </td>
                    <td className="py-3.5 px-4 text-center text-emerald-400 text-sm font-black border-l border-zinc-800">
                      {totalStaffCount} membres
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* Embedded style for A4 print specs */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 12mm 15mm;
          }
          .a4-sheet {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  )
}
