export type StatCard = {
  label: string
  value: string | number
  icon?: string
  change?: string
}

export type Lead = {
  id: string
  name: string
  phone: string
  email?: string
  source: string
  status: string
  pipeline?: string
  budget?: string
  date?: string
}

export type Activity = {
  id: string
  type: string
  message: string
  time: string
}

export type Project = {
  id: string
  name: string
  client: string
  status: string
  progress: number
  budget?: string
  deadline?: string
}
export type Industry = {
  id: string
  slug: string
  name: string
  description?: string
  icon?: string
  color?: string
}
export type IndustryConfig = {
  id: string
  name: string
  description?: string
  icon: string
  revenue?: string
  color: string
  bg: string
  stats: { label: string; value: string }[]
}