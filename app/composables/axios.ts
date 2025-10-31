export function useAxios() {
  const axios = useNuxtApp().$axios
  return axios
}
