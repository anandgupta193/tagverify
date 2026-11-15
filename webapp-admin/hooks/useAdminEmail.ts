'use client'

import { useAuthContext } from '@/app/providers'

/** The signed-in admin's email, for createdBy fields. */
export function useAdminEmail(): string {
  return useAuthContext().profile?.email ?? ''
}
