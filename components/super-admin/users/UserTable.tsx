// components/super-admin/users/UserTable.tsx
'use client'

interface User {
  id: string
  email: string
  full_name?: string
  role: string
  created_at: string
}

interface UserTableProps {
  users: User[] | null
  loading?: boolean
}

export function UserTable({ users, loading }: UserTableProps) {
  if (loading) return <div className="bg-white ring-1 ring-black/8 rounded-2xl p-8 text-center text-sm text-black/50">Loading users...</div>
  if (!users || users.length === 0) return <div className="bg-white ring-1 ring-black/8 rounded-2xl p-8 text-center text-sm text-black/50">No users found</div>

  return (
    <div className="bg-white ring-1 ring-black/8 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-black/8 bg-black/2">
              <th className="px-5 py-3 text-left font-semibold text-black/60 uppercase">User</th>
              <th className="px-5 py-3 text-left font-semibold text-black/60 uppercase">Role</th>
              <th className="px-5 py-3 text-left font-semibold text-black/60 uppercase">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-black/[0.02] transition-colors">
                <td className="px-5 py-3">
                  <div>
                    <p className="font-semibold text-black/80">{user.full_name || 'Unknown'}</p>
                    <p className="text-[10px] text-black/40 mt-0.5">{user.email}</p>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="inline-block font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px]">
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-black/50">{new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}