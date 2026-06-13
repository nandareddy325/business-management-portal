'use client'

const leads = [
  { id: '1', name: 'Ravi Kumar', initials: 'RK', source: 'Instagram', value: 45000, status: 'hot' },
  { id: '2', name: 'Sunitha P.', initials: 'SP', source: 'Referral', value: 72000, status: 'warm' },
  { id: '3', name: 'Mohammed R.', initials: 'MR', source: 'Facebook', value: 28000, status: 'new' },
  { id: '4', name: 'Priya Asha', initials: 'PA', source: 'Google Ads', value: 60000, status: 'hot' },
  { id: '5', name: 'Venkat N.', initials: 'VN', source: 'Walk-in', value: 15000, status: 'cold' },
]

const statusStyles: Record<string, string> = {
  hot: 'bg-emerald-50 text-emerald-700',
  warm: 'bg-amber-50 text-amber-700',
  new: 'bg-blue-50 text-blue-700',
  cold: 'bg-[#F0EBE0] text-[#7A6E60]',
}

const avatarStyles: Record<string, string> = {
  RK: 'bg-blue-50 text-blue-700',
  SP: 'bg-amber-50 text-amber-700',
  MR: 'bg-purple-50 text-purple-700',
  PA: 'bg-emerald-50 text-emerald-700',
  VN: 'bg-red-50 text-red-700',
}

export function LeadsTable() {
  return (
    <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-serif text-base text-[#1C1712]">Recent Leads</h3>
          <p className="text-xs text-[#7A6E60] mt-0.5">Last 5 leads added</p>
        </div>
        <button className="border border-[#E2D9C8] text-[#1C1712] px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#F0EBE0] transition-colors">
          View All
        </button>
      </div>
      <table className="w-full">
        <thead>
          <tr>
            {['Name', 'Source', 'Value', 'Status'].map((h) => (
              <th
                key={h}
                className="text-left text-[11px] tracking-wide font-semibold text-[#7A6E60] uppercase pb-2 border-b border-[#E2D9C8]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-[#F5F0E8] transition-colors">
              <td className="py-2.5 text-sm text-[#1C1712]">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold mr-2 ${avatarStyles[lead.initials]}`}>
                  {lead.initials}
                </span>
                {lead.name}
              </td>
              <td className="py-2.5 text-sm text-[#7A6E60]">{lead.source}</td>
              <td className="py-2.5 text-sm text-[#1C1712]">
                ₹{lead.value.toLocaleString('en-IN')}
              </td>
              <td className="py-2.5">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${statusStyles[lead.status]}`}>
                  {lead.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}