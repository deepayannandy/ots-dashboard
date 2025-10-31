<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4 h-dvh w-full">
    <UPageCard class="w-full max-w-md" spotlight-color="primary" spotlight>
      <UAuthForm
        :schema="schema"
        :fields="fields"
        title="Login to your account"
        :submit="{ label: 'Login', loading }"
        @submit="onSubmit"
      >
        <template #title>
          <div class="flex justify-center w-full">
            <img src="/ots.jpeg" class="size-20">
          </div>
          <h1 class="text-xl font-bold text-center">
            Login to your account
          </h1>
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import { useAuth } from '~/stores/auth'
import { useRouter } from '#app'

const loading = ref(false)

definePageMeta({ layout: 'login' })

const router = useRouter()
const auth = useAuth()

const fields: AuthFormField[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'Enter your Email',
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
  }
]

const schema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required')
})

type Schema = z.output<typeof schema>

async function onSubmit({ data }: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    const result = await auth.login({
      id: crypto.randomUUID(),
      email: data.email,
      password: data.password
    })
    if (result?.isLoggedIn) router.push('/')
  } finally {
    loading.value = false
  }
}
</script>
