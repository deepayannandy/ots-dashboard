<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4 h-dvh w-full bg-linear-to-br from-neutral-100 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
    <UPageCard class="w-full max-w-md elevation-4" spotlight-color="primary" spotlight>
      <UAuthForm
        :schema="schema"
        :fields="fields"
        title="Create your account"
        :submit="{ label: 'Sign Up', loading }"
        @submit="onSubmit"
      >
        <template #title>
          <div class="flex justify-center w-full">
            <img :src="companyLogo" class="size-20 rounded-xl elevation-2">
          </div>
          <h1 class="text-xl font-bold text-center">
            Create your account
          </h1>
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import { useCompany } from '~/stores/company'
import { useRouter } from '#app'

const loading = ref(false)

definePageMeta({ layout: 'login' })

const router = useRouter()
const toast = useToast()
const axios = useAxios()
const companyStore = useCompany()

const companyLogo = computed(() => companyStore.logoUrl)

onMounted(async () => {
  await companyStore.fetchCompanyDetails()
})

const fields: AuthFormField[] = [
  {
    name: 'fullName',
    type: 'text',
    label: 'Full Name',
    placeholder: 'Enter your full name',
    required: true,
    eagerValidation: true
  },
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'Enter your email',
    required: true,
    eagerValidation: true
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    required: true,
    eagerValidation: true
  },
  {
    name: 'confirmPassword',
    label: 'Confirm Password',
    type: 'password',
    placeholder: 'Confirm your password',
    required: true,
    eagerValidation: true
  }
]

const schema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

type Schema = z.output<typeof schema>

async function onSubmit({ data }: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    const response = await axios.$post('/api/v2/auth/createAccount', {
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      role: 'superAdmin'
    })

    if (response?.Success === true || response?.success === true) {
      toast.add({
        title: 'Account created successfully',
        description: 'Please login to continue',
        color: 'success'
      })
      router.push('/auth/login')
    }
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }
    toast.add({
      title: 'Failed to create account',
      description: err?.response?.data?.message || 'Something went wrong',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>
