import { useAuth } from '~/stores/auth'

/** Role-based UI permissions. Guests cannot see or use any delete action. */
export function usePermissions() {
  const auth = useAuth()
  return {
    canDelete: computed(() => auth.canDelete),
    isAdmin: computed(() => auth.isAdmin),
    isGuest: computed(() => auth.isGuest)
  }
}
