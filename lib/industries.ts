// @ts-nocheck
import type { IndustryConfig } from '@/types'

export const industries: IndustryConfig[] = [
  {
    id: 'real-estate',
    name: 'Real Estate',
    description: 'Manage properties, leads, site visits and deals',
    icon: '🏢',
    revenue: '₹12,85,400',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    stats: [
      { label: 'Properties', value: '48' },
      { label: 'Leads', value: '124' },
      { label: 'Site Visits', value: '38' },
      { label: 'Revenue', value: '₹12.8L' },
    ],
  },
  {
    id: 'interior-design',
    name: 'Interior Design',
    description: 'Track projects, clients and design approvals',
    icon: '🛋️',
    revenue: '₹8,45,230',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    stats: [
      { label: 'Projects', value: '32' },
      { label: 'Clients', value: '28' },
      { label: 'Pending Designs', value: '12' },
      { label: 'Revenue', value: '₹8.4L' },
    ],
  },
  {
    id: 'hospital',
    name: 'Hospital',
    description: 'Manage patients, doctors and appointments',
    icon: '🏥',
    revenue: '₹25,75,600',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    stats: [
      { label: 'Patients', value: '320' },
      { label: 'Doctors', value: '24' },
      { label: 'Appointments', value: '86' },
      { label: 'Revenue', value: '₹25.7L' },
    ],
  },
  {
    id: 'b2b-business',
    name: 'B2B Business',
    description: 'Handle clients, deals, invoices and pipeline',
    icon: '🤝',
    revenue: '₹15,60,300',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    stats: [
      { label: 'Clients', value: '64' },
      { label: 'Deals', value: '42' },
      { label: 'Invoices', value: '38' },
      { label: 'Revenue', value: '₹15.6L' },
    ],
  },
  {
    id: 'clinics',
    name: 'Clinics',
    description: 'Track patients, appointments and billing',
    icon: '🩺',
    revenue: '₹6,40,800',
    color: 'text-red-700',
    bg: 'bg-red-50',
    stats: [
      { label: 'Patients', value: '180' },
      { label: 'Appointments', value: '54' },
      { label: 'Bills', value: '48' },
      { label: 'Revenue', value: '₹6.4L' },
    ],
  },
]

export const getIndustry = (id: string) =>
  industries.find((i) => i.id === id) || industries[0]