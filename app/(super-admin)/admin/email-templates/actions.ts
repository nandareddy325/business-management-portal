// app/(super-admin)/admin/email-templates/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  createEmailTemplate, updateEmailTemplate, deleteEmailTemplate, logAdminAction,
} from '@/lib/supabase/queries/admin'
import type { EmailTemplateCategory } from '@/types/admin'

async function requireSuperAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', supabase: null, userId: null, companyId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    return { error: 'Forbidden', supabase: null, userId: null, companyId: null }
  }

  return { error: null, supabase, userId: user.id, companyId: profile.company_id as string }
}

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export interface TemplateFormInput {
  name: string
  category: EmailTemplateCategory
  subject: string
  body: string
}

// ─── Create a new template ─────────────────────────────────────────────────
export async function createEmailTemplateAction(
  input: TemplateFormInput
): Promise<{ error?: string; success?: boolean }> {
  const { error: authErr, supabase, userId, companyId } = await requireSuperAdmin()
  if (authErr || !supabase || !userId) return { error: authErr ?? 'Unauthorized' }

  const name = input.name.trim()
  const subject = input.subject.trim()
  const body = input.body.trim()
  if (!name) return { error: 'Give the template a name' }
  if (!subject) return { error: 'Subject is required' }
  if (!body) return { error: 'Email body is required' }

  const variables = Array.from(new Set(
    (body + ' ' + subject).match(/\{\{[^}]+\}\}/g) ?? []
  ))

  const templateKey = `${slugify(name)}_${Date.now().toString(36)}`

  const { data, error } = await createEmailTemplate(supabase, {
    template_key: templateKey,
    name,
    category: input.category,
    subject,
    body,
    variables,
    is_active: true,
  })

  if (error || !data) return { error: error?.message ?? 'Failed to create template' }

  if (companyId) {
    await logAdminAction(
      supabase, companyId, userId,
      `Created email template "${name}"`,
      'create', 'template', data.id
    )
  }

  revalidatePath('/admin/email-templates')
  return { success: true }
}

// ─── Update an existing template ───────────────────────────────────────────
export async function updateEmailTemplateAction(
  templateId: string,
  input: TemplateFormInput
): Promise<{ error?: string; success?: boolean }> {
  const { error: authErr, supabase, userId, companyId } = await requireSuperAdmin()
  if (authErr || !supabase || !userId) return { error: authErr ?? 'Unauthorized' }

  const name = input.name.trim()
  const subject = input.subject.trim()
  const body = input.body.trim()
  if (!name) return { error: 'Give the template a name' }
  if (!subject) return { error: 'Subject is required' }
  if (!body) return { error: 'Email body is required' }

  const variables = Array.from(new Set(
    (body + ' ' + subject).match(/\{\{[^}]+\}\}/g) ?? []
  ))

  const { error } = await updateEmailTemplate(supabase, templateId, {
    name, subject, body, variables,
  })

  if (error) return { error: error.message }

  if (companyId) {
    await logAdminAction(
      supabase, companyId, userId,
      `Updated email template "${name}"`,
      'update', 'template', templateId
    )
  }

  revalidatePath('/admin/email-templates')
  return { success: true }
}

// ─── Duplicate a template ──────────────────────────────────────────────────
export async function duplicateEmailTemplateAction(
  templateId: string
): Promise<{ error?: string; success?: boolean }> {
  const { error: authErr, supabase, userId, companyId } = await requireSuperAdmin()
  if (authErr || !supabase || !userId) return { error: authErr ?? 'Unauthorized' }

  const { data: original, error: fetchErr } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (fetchErr || !original) return { error: fetchErr?.message ?? 'Template not found' }

  const name = `${original.name} (Copy)`
  const templateKey = `${slugify(name)}_${Date.now().toString(36)}`

  const { data, error } = await createEmailTemplate(supabase, {
    template_key: templateKey,
    name,
    category: original.category,
    subject: original.subject,
    body: original.body,
    variables: original.variables ?? [],
    is_active: true,
  })

  if (error || !data) return { error: error?.message ?? 'Failed to duplicate template' }

  if (companyId) {
    await logAdminAction(
      supabase, companyId, userId,
      `Duplicated email template "${original.name}"`,
      'create', 'template', data.id
    )
  }

  revalidatePath('/admin/email-templates')
  return { success: true }
}

// ─── Delete (soft) a template ───────────────────────────────────────────────
export async function deleteEmailTemplateAction(
  templateId: string,
  templateName: string
): Promise<{ error?: string; success?: boolean }> {
  const { error: authErr, supabase, userId, companyId } = await requireSuperAdmin()
  if (authErr || !supabase || !userId) return { error: authErr ?? 'Unauthorized' }

  const { error } = await deleteEmailTemplate(supabase, templateId)
  if (error) return { error: error.message }

  if (companyId) {
    await logAdminAction(
      supabase, companyId, userId,
      `Deleted email template "${templateName}"`,
      'delete', 'template', templateId
    )
  }

  revalidatePath('/admin/email-templates')
  return { success: true }
}
