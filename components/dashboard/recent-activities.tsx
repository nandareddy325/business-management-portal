'use client'

const activities = [
  { id: '1', type: 'payment', title: 'Payment received', description: 'Shiva Sai Creations — ₹18,000', time: '2m ago', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '₹' },
  { id: '2', type: 'lead', title: 'New lead added', description: 'Ravi Kumar via Instagram', time: '18m ago', bg: 'bg-blue-50', text: 'text-blue-700', icon: '◎' },
  { id: '3', type: 'attendance', title: 'Employee checked in', description: 'Anjali Sharma — 9:02 AM', time: '1h ago', bg: 'bg-purple-50', text: 'text-purple-700', icon: '⚇' },
  { id: '4', type: 'project', title: 'Project milestone', description: 'Website project — 92% done', time: '2h ago', bg: 'bg-amber-50', text: 'text-amber-700', icon: '◈' },
]

export function RecentActivities() {
  return (
    <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
      <div className="mb-4">
        <h3 className="font-serif text-base text-[#1C1712]">Recent Activity</h3>
      </div>

      <div className="flex flex-col">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={`flex items-center gap-3 py-2.5 ${index !== activities.length - 1 ? 'border-b border-[#E2D9C8]' : ''}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${activity.bg} ${activity.text}`}>
              {activity.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold text-[#1C1712] truncate">
                {activity.title}
              </p>
              <p className="text-xs text-[#7A6E60] mt-0.5">{activity.description}</p>
            </div>
            <p className="text-[11px] text-[#7A6E60] whitespace-nowrap ml-auto">
              {activity.time}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}