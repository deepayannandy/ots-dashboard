import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  CreateAxiosDefaults,
  InternalAxiosRequestConfig
} from 'axios'
import axios from 'axios'
import { useAuth } from '~/stores/auth'

export default defineNuxtPlugin(() => {
  const { logout } = useAuth()
  const {
    public: { axios: axiosPublicConfig }
  } = useRuntimeConfig()

  const defaultAxios: CreateAxiosDefaults = { ...axiosPublicConfig }
  const Axios: AxiosInstance = axios.create(defaultAxios)

  Axios.interceptors.request.use(onRequest, onRequestError)
  Axios.interceptors.response.use(onResponse, onResponseError)

  /* ----------------------------- Interceptors ----------------------------- */

  function onRequest(request: InternalAxiosRequestConfig) {
    if (!request.headers.Authorization)
      request.headers.Authorization = `Bearer ${useAuth().token}`

    request.headers.forSupport = 'mailto:shubhamedu.01@gmail.com'
    request.headers.getToknowMe = 'https://www.shubhamgupta.dev/'

    return request
  }

  interface ErrorResponseData {
    error?: string
    message?: string
  }

  async function onError(error: AxiosError) {
    if (!axios.isAxiosError(error) || !error.config)
      return Promise.reject(error)

    if (error?.response?.status === 401) {
      useToast().add({ title: 'Logging Out…', color: 'success' })
      logout()
    }
    console.log({ error })

    const errorData = error.response?.data as ErrorResponseData | undefined

    useToast().add({
      title: errorData?.error || errorData?.message || error.message || 'Something went wrong',
      color: 'error'
    })

    return Promise.reject(error)
  }

  function onResponse(axiosResponse: AxiosResponse) {
    return axiosResponse
  }

  async function onResponseError(error: AxiosError) {
    return await onError(error)
  }

  async function onRequestError(error: AxiosError) {
    return await onError(error)
  }

  function $getGenerator(
    axiosInstanceObj: AxiosInstance
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return async function $get<T = any>(
      url: string,
      config?: AxiosRequestConfig<unknown>
    ): Promise<T> {
      try {
        const { data } = await axiosInstanceObj.get<T>(url, config)
        return data
      } catch (error) {
        return Promise.reject(error)
      }
    }
  }

  function $postGenerator(
    axiosInstanceObj: AxiosInstance
  ) {
    return async function $post<T = unknown>(
      url: string,
      data?: unknown,
      config?: AxiosRequestConfig<unknown>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<any> {
      try {
        const { data: responseData } = await axiosInstanceObj.post<T>(url, data, config)
        return responseData
      } catch (error) {
        return Promise.reject(error)
      }
    }
  }

  function $patchGenerator(axiosInstanceObj: AxiosInstance) {
    return async function $patch<T = unknown>(
      url: string,
      data?: unknown,
      config?: AxiosRequestConfig<unknown>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<any> {
      try {
        const { data: responseData } = await axiosInstanceObj.patch<T>(url, data, config)
        return responseData
      } catch (error) {
        return Promise.reject(error)
      }
    }
  }

  function $deleteGenerator(axiosInstanceObj: AxiosInstance) {
    return async function <T = unknown>(
      url: string,
      data?: unknown,
      config?: AxiosRequestConfig<unknown>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<any> {
      try {
        const { data } = await axiosInstanceObj.delete<T>(url, config)
        return data
      } catch (error) {
        return Promise.reject(error)
      }
    }
  }

  /* ---------------------------- Provided API ---------------------------- */

  return {
    provide: {
      axios: {
        ...Axios,
        get: Axios.get,
        post: Axios.post,
        patch: Axios.patch,
        delete: Axios.delete,

        $get: $getGenerator(Axios),
        $post: $postGenerator(Axios),
        $patch: $patchGenerator(Axios),
        $delete: $deleteGenerator(Axios)
      }
    }
  }
})
