'use client'

const projects = [
  { id: '1', name: 'Shiva Sai Sarees — SMM', progress: 78, color: 'bg-emerald-500' },
  { id: '2', name: 'GK Digital — Rebranding', progress: 55, color: 'bg-blue-500' },
  { id: '3', name: 'Client A — Website', progress: 92, color: 'bg-amber-500' },
  { id: '4', name: 'AI Voice Agent — Build', progress: 30, color: 'bg-purple-500' },
]

export function ProjectProgress() {
  return (
    <div className="bg-[#FDFAF4] border border-[#E2D9C8] rounded-2xl p-5">
      <div className="mb-4">
        <h3 className="font-serif text-base text-[#1C1712]">Project Progress</h3>
        <p className="text-xs text-[#7A6E60] mt-0.5">Active projects status</p>
      </div>

      <div className="flex flex-col gap-3">
        {projects.map((project) => (
          <div key={project.id} className="flex items-center gap-3">
            <p className="text-[12.5px] font-medium text-[#1C1712] flex-1 truncate">
              {project.name}
            </p>
            <div className="flex-[2] h-1.5 bg-[#F0EBE0] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${project.color}`}
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <p className="text-xs font-semibold text-[#7A6E60] w-8 text-right">
              {project.progress}%
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}