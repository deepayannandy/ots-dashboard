import { useAuth } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuth()

  const publicRoutes = ['/auth/login', '/company-setup', '/signup']
  const isPublicRoute = publicRoutes.includes(to.path)

  if (!auth.isLoggedIn && !isPublicRoute) {
    return navigateTo('/auth/login')
  }

  if (auth.isLoggedIn && to.path === '/auth/login') {
    return navigateTo('/')
  }

  return
})
