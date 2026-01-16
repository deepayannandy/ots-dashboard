<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4 h-dvh w-full bg-linear-to-br from-neutral-100 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
    <UPageCard class="w-full max-w-2xl elevation-4" spotlight-color="primary" spotlight>
      <div class="space-y-2">
        <div class="flex justify-center w-full">
          <div v-if="logoPreview" class="size-20 rounded-xl elevation-2 overflow-hidden">
            <img :src="logoPreview" class="w-full h-full object-cover">
          </div>
          <div v-else class="size-20 rounded-xl elevation-2 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <UIcon name="i-lucide-building-2" class="text-3xl text-neutral-400" />
          </div>
        </div>
        <h1 class="text-2xl font-bold text-center">
          Company Setup
        </h1>
        <p class="text-center text-sm text-neutral-600 dark:text-neutral-400">
          Setup your company details to get started
        </p>

        <UForm :schema="schema" :state="formState" @submit="onSubmit">
          <div class="grid grid-cols-2 gap-4 w-full">
            <UFormField
              name="companyName"
              label="Company Name"
              required
            >
              <UInput
                v-model="formState.companyName"
                class="w-full"
                placeholder="Enter company name"
                size="lg"
              />
            </UFormField>

            <UFormField
              name="email"
              label="Email"
              required
            >
              <UInput
                v-model="formState.email"
                class="w-full"
                type="email"
                placeholder="Enter email address"
                size="lg"
              />
            </UFormField>

            <UFormField
              class="col-span-2"
              name="address"
              label="Address"
              required
            >
              <UTextarea
                v-model="formState.address"
                class="w-full"
                placeholder="Enter company address"
                :rows="3"
              />
            </UFormField>

            <UFormField
              name="numberOfLayouts"
              label="Number of Layouts"
              required
            >
              <UInput
                v-model="formState.numberOfLayouts"
                class="w-full"
                type="number"
                placeholder="Enter number of layouts"
                :min="1"
              />
            </UFormField>

            <UFormField
              name="endDate"
              label="End Date"
              required
            >
              <UInput
                v-model="formState.endDate"
                class="w-full"
                type="date"
                size="lg"
              />
            </UFormField>

            <UFormField
              class="col-span-2"
              name="logo"
              label="Company Logo"
              required
            >
              <UFileUpload
                v-model="formState.logo"
                accept="image/*"
                :max-file-size="5 * 1024 * 1024"
                help="Upload company logo (max 5MB)"
              />
            </UFormField>

            <UButton
              class="col-span-2"
              type="submit"
              color="primary"
              size="lg"
              block
              :loading="loading"
              :disabled="!isFormValid"
            >
              Continue to Signup
            </UButton>
          </div>
        </UForm>
      </div>
    </UPageCard>
  </div>
</template>

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({ layout: 'login' })

const loading = ref(false)
const router = useRouter()
const toast = useToast()
const axios = useAxios()

const formState = reactive({
  companyName: '',
  email: '',
  address: '',
  numberOfLayouts: 1,
  endDate: '',
  logo: undefined as File | undefined
})

const logoPreview = ref<string | null>(null)

watch(() => formState.logo, (newLogo) => {
  if (newLogo) {
    logoPreview.value = URL.createObjectURL(newLogo)
  } else {
    logoPreview.value = null
  }
})

const schema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  address: z.string().min(1, 'Address is required'),
  numberOfLayouts: z.number().min(1, 'Number of layouts must be at least 1'),
  endDate: z.string().min(1, 'End date is required'),
  logo: z.instanceof(File)
})

const isFormValid = computed(() => {
  return formState.companyName.trim()
    && formState.email.trim()
    && formState.address.trim()
    && formState.numberOfLayouts >= 1
    && formState.endDate
    && formState.logo
})

async function onSubmit(event: FormSubmitEvent<z.output<typeof schema>>) {
  loading.value = true
  try {
    const formData = new FormData()
    formData.append('companyName', event.data.companyName)
    formData.append('email', event.data.email)
    formData.append('address', event.data.address)
    formData.append('numberOfLayouts', event.data.numberOfLayouts.toString())
    formData.append('endDate', event.data.endDate)
    formData.append('logo', event.data.logo)

    const response = await axios.$post('/api/v2/company/createCompany', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response?.Success || response?.success) {
      toast.add({
        title: 'Company created successfully',
        description: 'Please create your account',
        color: 'success'
      })
      // Store logo path for later use
      if (response.data?.logo) {
        localStorage.setItem('companyLogo', response.data.logo)
      }
      router.push('/signup')
    }
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }
    toast.add({
      title: 'Failed to create company',
      description: err?.response?.data?.message || 'Something went wrong',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>
