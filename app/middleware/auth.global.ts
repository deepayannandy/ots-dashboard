import { useAuth } from '~/stores/auth'

// Routes only admins / super admins may open.
const adminRoutes = ['/user-management']

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuth()

  const publicRoutes = ['/auth/login', '/company-setup', '/signup']
  const isPublicRoute = publicRoutes.includes(to.path)

  if (auth.isLoggedIn && auth.hasGuestExpired()) {
    return auth.logout('expired')
  }

  if (!auth.isLoggedIn && !isPublicRoute) {
    return navigateTo('/auth/login')
  }

  if (auth.isLoggedIn && to.path === '/auth/login') {
    return navigateTo('/')
  }

  if (adminRoutes.some(r => to.path.startsWith(r)) && !auth.isAdmin) {
    return navigateTo('/')
  }

  return
})
