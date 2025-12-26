import { useAuth } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuth()

  if (!auth.isLoggedIn && to.path !== '/auth/login') {
    return navigateTo('/auth/login')
  }

  if (auth.isLoggedIn && to.path === '/auth/login') {
    return navigateTo('/')
  }

  return
})
