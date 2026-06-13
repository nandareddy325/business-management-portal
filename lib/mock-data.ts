// @ts-nocheck
import type { StatCard, Lead, Activity, Project } from '@/types'

export const statCards: StatCard[] = [
  { id: '1', label: 'Total Leads', value: '248', change: '+14% from last month', changeType: 'up', icon: 'target', colorClass: 'blue' },
  { id: '2', label: 'Total Clients', value: '86', change: '+8% from last month', changeType: 'up', icon: 'users', colorClass: 'green' },
  { id: '3', label: 'Employees', value: '34', change: 'No change', changeType: 'neutral', icon: 'user-check', colorClass: 'purple' },
  { id: '4', label: 'Active Projects', value: '19', change: '+3 new this week', changeType: 'up', icon: 'folder-kanban', colorClass: 'amber' },
  { id: '5', label: 'Revenue (Jun)', value: '₹4.2L', change: '+22% vs last month', changeType: 'up', icon: 'indian-rupee', colorClass: 'green' },
  { id: '6', label: 'Expenses (Jun)', value: '₹1.1L', change: '-5% vs last month', changeType: 'down', icon: 'trending-down', colorClass: 'red' },
]

export const recentLeads: Lead[] = [
  { id: '1', name: 'Ravi Kumar', initials: 'RK', source: 'Instagram', value: 45000, status: 'hot', createdAt: '2026-06-03' },
  { id: '2', name: 'Sunitha P.', initials: 'SP', source: 'Referral', value: 72000, status: 'warm', createdAt: '2026-06-03' },
  { id: '3', name: 'Mohammed R.', initials: 'MR', source: 'Facebook', value: 28000, status: 'new', createdAt: '2026-06-02' },
  { id: '4', name: 'Priya Asha', initials: 'PA', source: 'Google Ads', value: 60000, status: 'hot', createdAt: '2026-06-02' },
  { id: '5', name: 'Venkat N.', initials: 'VN', source: 'Walk-in', value: 15000, status: 'cold', createdAt: '2026-06-01' },
]

export const recentActivities: Activity[] = [
  { id: '1', type: 'payment', title: 'Payment received', description: 'Shiva Sai Creations — ₹18,000', time: '2m ago' },
  { id: '2', type: 'lead', title: 'New lead added', description: 'Ravi Kumar via Instagram', time: '18m ago' },
  { id: '3', type: 'attendance', title: 'Employee checked in', description: 'Anjali Sharma — 9:02 AM', time: '1h ago' },
  { id: '4', type: 'project', title: 'Project milestone', description: 'Website project — 92% done', time: '2h ago' },
]

export const projects: Project[] = [
  { id: '1', name: 'Shiva Sai Sarees — SMM', progress: 78, color: '#2D7D52' },
  { id: '2', name: 'GK Digital — Rebranding', progress: 55, color: '#1A5F9E' },
  { id: '3', name: 'Client A — Website', progress: 92, color: '#B8860B' },
  { id: '4', name: 'AI Voice Agent — Build', progress: 30, color: '#6B3FA0' },
]

export const revenueData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  revenue: [180000, 210000, 195000, 280000, 320000, 420000],
  expenses: [95000, 88000, 102000, 115000, 118000, 110000],
}

export const conversionData = [
  { name: 'New', value: 45, color: '#1A5F9E' },
  { name: 'Contacted', value: 25, color: '#B8860B' },
  { name: 'Qualified', value: 20, color: '#6B3FA0' },
  { name: 'Converted', value: 10, color: '#2D7D52' },
]