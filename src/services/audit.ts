import { supabase } from '@/integrations/supabase/client'

export interface AuditService {
  writeAudit(
    entity: string,
    entityId: string,
    action: string,
    before: any,
    after: any
  ): Promise<void>
}

export const auditService: AuditService = {
  async writeAudit(
    entity: string,
    entityId: string,
    action: string,
    before: any,
    after: any
  ) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return // Don't throw, just skip audit if not authenticated

    try {
      const { error } = await supabase
        .from('audit_log')
        .insert({
          user_id: user.id,
          entity,
          entity_id: entityId,
          action,
          before,
          after,
        })

      if (error) {
        console.error('Failed to write audit log:', error)
      }
    } catch (error) {
      console.error('Failed to write audit log:', error)
    }
  }
}