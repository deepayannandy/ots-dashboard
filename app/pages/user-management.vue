<template>
  <UDashboardPanel id="user-management" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar title="User Management" description="Create and manage time-limited guest users.">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <div class="flex justify-between gap-4 items-center w-full">
          <UTabs
            v-model="filter"
            :items="filterItems"
            :content="false"
            size="sm"
          />
          <div class="flex gap-4 items-center">
            <UButton
              :loading="isFetching"
              icon="i-lucide-refresh-ccw"
              variant="outline"
              @click="fetchUsers"
            />
            <UButton
              icon="i-lucide-user-plus"
              label="Add Guest"
              @click="openCreateModal"
            />
          </div>
        </div>

        <UTable
          :data="filteredUsers"
          :columns="columns"
          :loading="isFetching"
          class="flex-1 elevation-1 rounded-lg overflow-hidden bg-white!"
        />
      </div>

      <!-- Create guest / update validity -->
      <UModal
        v-model:open="isModalOpen"
        :ui="{ content: 'max-w-xl' }"
        :title="isEditing ? 'Update Validity' : 'Add Guest User'"
        :description="isEditing
          ? `Extend or unlock access for ${formState.fullName}.`
          : 'A random password will be generated and shown once after creation.'"
      >
        <template #body>
          <UForm
            id="guest-form"
            class="space-y-6"
            @submit.prevent="handleSave"
          >
            <div v-if="!isEditing" class="space-y-3">
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                User Details
              </p>

              <div class="grid gap-3">
                <UFieldGroup class="grid grid-cols-2 w-full">
                  <div variant="outline" class="text-xl">
                    Full Name
                  </div>
                  <UInput
                    v-model="formState.fullName"
                    placeholder="e.g., John Doe"
                  />
                </UFieldGroup>

                <UFieldGroup class="grid grid-cols-2 w-full">
                  <div variant="outline" class="text-xl">
                    Email
                  </div>
                  <UInput
                    v-model="formState.email"
                    type="email"
                    placeholder="e.g., guest@company.com"
                  />
                </UFieldGroup>
              </div>
            </div>

            <div class="space-y-3">
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                Validity
              </p>

              <div class="grid gap-3">
                <UFieldGroup class="grid grid-cols-2 w-full">
                  <div variant="outline" class="text-xl">
                    Access For
                  </div>
                  <USelect
                    v-model="formState.validity"
                    :items="validityOptions"
                  />
                </UFieldGroup>

                <UFieldGroup v-if="formState.validity === 'custom'" class="grid grid-cols-2 w-full">
                  <div variant="outline" class="text-xl">
                    Valid Till
                  </div>
                  <UInput
                    v-model="formState.customValidTill"
                    type="datetime-local"
                    :min="minCustomDate"
                  />
                </UFieldGroup>

                <p v-if="computedValidTill" class="text-sm text-muted">
                  Access ends on
                  <span class="font-medium text-highlighted">{{ formatDate(computedValidTill.toISOString()) }}</span>.
                  The user will be logged out automatically after this.
                </p>
              </div>
            </div>
          </UForm>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3 w-full">
            <UButton
              type="button"
              variant="ghost"
              color="neutral"
              @click="closeModal"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              form="guest-form"
              color="primary"
              :loading="isSaving"
              :disabled="!isFormValid"
            >
              {{ isEditing ? 'Update Validity' : 'Create Guest' }}
            </UButton>
          </div>
        </template>
      </UModal>

      <!-- Login details (shown once after create / password reset) -->
      <UModal
        v-model:open="isCredentialsOpen"
        :ui="{ content: 'max-w-xl' }"
        :dismissible="false"
        :title="credentials?.title"
        description="Share these login details with the user. The password cannot be viewed again after closing."
      >
        <template #body>
          <div v-if="credentials" class="space-y-6">
            <div class="flex items-center gap-3 rounded-lg bg-success/10 p-3 text-success">
              <UIcon name="i-lucide-circle-check" class="size-5 shrink-0" />
              <span class="text-sm font-medium">{{ credentials.message }}</span>
            </div>

            <div class="space-y-3">
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                Login Details
              </p>

              <div class="grid gap-3">
                <UFieldGroup
                  v-for="field in credentialFields"
                  :key="field.label"
                  class="grid grid-cols-2 w-full"
                >
                  <div variant="outline" class="text-xl">
                    {{ field.label }}
                  </div>
                  <UInput
                    :model-value="field.value"
                    readonly
                    :class="field.mono && 'font-mono'"
                    :ui="{ trailing: 'pe-1' }"
                  >
                    <template v-if="field.copy" #trailing>
                      <UButton
                        :icon="copiedField === field.label ? 'i-lucide-check' : 'i-lucide-copy'"
                        :color="copiedField === field.label ? 'success' : 'neutral'"
                        variant="link"
                        size="sm"
                        aria-label="Copy"
                        @click="copy(field.value, field.label)"
                      />
                    </template>
                  </UInput>
                </UFieldGroup>
              </div>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-between gap-3 w-full">
            <UButton
              icon="i-lucide-copy"
              variant="outline"
              color="neutral"
              @click="copy(credentialsText, 'all')"
            >
              {{ copiedField === 'all' ? 'Copied!' : 'Copy All' }}
            </UButton>
            <div class="flex gap-3">
              <UButton
                icon="i-lucide-mail"
                variant="outline"
                color="primary"
                :to="mailtoLink"
                external
              >
                Share via Mail
              </UButton>
              <UButton
                color="primary"
                @click="isCredentialsOpen = false"
              >
                Done
              </UButton>
            </div>
          </div>
        </template>
      </UModal>

      <!-- Confirm destructive actions -->
      <UModal
        v-model:open="isConfirmOpen"
        :title="confirmState.title"
        :description="confirmState.description"
      >
        <template #footer>
          <div class="flex justify-end gap-3 w-full">
            <UButton
              variant="ghost"
              color="neutral"
              @click="isConfirmOpen = false"
            >
              Cancel
            </UButton>
            <UButton
              color="error"
              :loading="isSaving"
              @click="runConfirmed"
            >
              {{ confirmState.confirmLabel }}
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { ManagedUser } from '@/types'

type UsersApiResponse = {
  Success?: boolean
  data?: ManagedUser[]
}

type CredentialsResponse = {
  message?: string
  credentials?: { email: string, password: string, validTill: string }
  data?: ManagedUser
}

type CredentialsView = {
  title: string
  message: string
  fullName: string
  email: string
  password: string
  validTill: string
}

type ValidityPreset = '1h' | '8h' | '1d' | '7d' | '30d' | 'custom'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const PRESET_MS: Record<Exclude<ValidityPreset, 'custom'>, number> = {
  '1h': HOUR,
  '8h': 8 * HOUR,
  '1d': DAY,
  '7d': 7 * DAY,
  '30d': 30 * DAY
}

const validityOptions = [
  { label: '1 Hour', value: '1h' },
  { label: '8 Hours', value: '8h' },
  { label: '1 Day', value: '1d' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: 'Custom date & time', value: 'custom' }
]

const filterItems = [
  { label: 'All Users', value: 'all' },
  { label: 'Guests', value: 'guests' }
]

const axios = useAxios()
const toast = useToast()

const users = ref<ManagedUser[]>([])
const filter = ref<'all' | 'guests'>('guests')
const isFetching = ref(false)
const isSaving = ref(false)
const isModalOpen = ref(false)
const isConfirmOpen = ref(false)
const isCredentialsOpen = ref(false)
const credentials = ref<CredentialsView | null>(null)
const copiedField = ref<string | null>(null)

// Drop the plain password from memory once the modal is closed.
watch(isCredentialsOpen, (open) => {
  if (!open) credentials.value = null
})

const loginUrl = computed(() => `${window.location.origin}/auth/login`)

const credentialFields = computed(() => {
  const c = credentials.value
  if (!c) return []
  return [
    { label: 'Name', value: c.fullName, copy: false, mono: false },
    { label: 'Email', value: c.email, copy: true, mono: false },
    { label: 'Password', value: c.password, copy: true, mono: true },
    { label: 'Valid Till', value: formatDate(c.validTill), copy: false, mono: false },
    { label: 'Login URL', value: loginUrl.value, copy: true, mono: false }
  ]
})

const credentialsText = computed(() => {
  const c = credentials.value
  if (!c) return ''
  return [
    `Hello ${c.fullName},`,
    '',
    'Here are your login details for the OTS Dashboard:',
    '',
    `Login URL: ${loginUrl.value}`,
    `Email: ${c.email}`,
    `Password: ${c.password}`,
    `Valid till: ${formatDate(c.validTill)}`,
    '',
    'Your account will be locked automatically after this time. Please contact the administrator to unlock it.'
  ].join('\n')
})

// Opens the admin's own mail client pre-filled; no email API is called.
const mailtoLink = computed(() => {
  const c = credentials.value
  if (!c) return undefined
  const subject = encodeURIComponent('Your OTS Dashboard login details')
  const body = encodeURIComponent(credentialsText.value)
  return `mailto:${encodeURIComponent(c.email)}?subject=${subject}&body=${body}`
})

async function copy(text: string, field: string) {
  try {
    await navigator.clipboard.writeText(text)
    copiedField.value = field
    setTimeout(() => {
      if (copiedField.value === field) copiedField.value = null
    }, 1500)
  } catch {
    toast.add({ title: 'Could not copy to clipboard', color: 'error' })
  }
}

function showCredentials(res: CredentialsResponse, fullName: string, title: string, message: string) {
  if (!res?.credentials) return
  credentials.value = { title, message, fullName, ...res.credentials }
  isCredentialsOpen.value = true
}

const formState = reactive<{
  _id?: string
  fullName: string
  email: string
  validity: ValidityPreset
  customValidTill: string
}>({
  fullName: '',
  email: '',
  validity: '1d',
  customValidTill: ''
})

const confirmState = reactive<{
  title: string
  description: string
  confirmLabel: string
  action: (() => Promise<void>) | null
}>({ title: '', description: '', confirmLabel: '', action: null })

const isEditing = computed(() => !!formState._id)

const filteredUsers = computed(() =>
  filter.value === 'guests' ? users.value.filter(u => u.isGuest) : users.value
)

// datetime-local wants "YYYY-MM-DDTHH:mm" in local time
const minCustomDate = computed(() => toLocalInputValue(new Date(Date.now() + 5 * 60 * 1000)))

const computedValidTill = computed<Date | null>(() => {
  if (formState.validity === 'custom') {
    if (!formState.customValidTill) return null
    const d = new Date(formState.customValidTill)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return new Date(Date.now() + PRESET_MS[formState.validity])
})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isFormValid = computed(() => {
  const validTill = computedValidTill.value
  const validDate = !!validTill && validTill.getTime() > Date.now()
  if (isEditing.value) return validDate
  return !!formState.fullName.trim() && EMAIL_RE.test(formState.email.trim()) && validDate
})

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function statusOf(user: ManagedUser): { label: string, color: 'success' | 'error' | 'neutral' } {
  if (!user.isGuest) return { label: 'Permanent', color: 'neutral' }
  if (user.isExpired || (user.validTill && new Date(user.validTill).getTime() <= Date.now()))
    return { label: 'Expired', color: 'error' }
  return { label: 'Active', color: 'success' }
}

const columns: TableColumn<ManagedUser>[] = [
  {
    accessorKey: 'fullName',
    header: 'Name'
  },
  {
    accessorKey: 'email',
    header: 'Email'
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => h(resolveComponent('UBadge'), {
      label: row.original.role,
      variant: 'subtle',
      color: row.original.role === 'guest' ? 'primary' : 'neutral',
      class: 'capitalize'
    })
  },
  {
    accessorKey: 'validTill',
    header: 'Valid Till',
    cell: ({ row }) => row.original.isGuest ? formatDate(row.original.validTill) : '—'
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = statusOf(row.original)
      return h(resolveComponent('UBadge'), {
        label: status.label,
        color: status.color,
        variant: 'subtle'
      })
    }
  },
  {
    accessorKey: 'lastLoginTime',
    header: 'Last Login',
    cell: ({ row }) => formatDate(row.original.lastLoginTime)
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const user = row.original
      if (!user.isGuest) return null

      const expired = statusOf(user).label === 'Expired'
      const UButton = resolveComponent('UButton')
      const UTooltip = resolveComponent('UTooltip')
      const action = (text: string, props: Record<string, unknown>) =>
        h(UTooltip, { text }, () => h(UButton, { size: 'xs', variant: 'ghost', ...props }))

      return h('div', { class: 'flex gap-2' }, [
        action(expired ? 'Unlock / extend' : 'Extend validity', {
          icon: expired ? 'i-lucide-lock-open' : 'i-lucide-calendar-clock',
          color: 'primary',
          onClick: () => openValidityModal(user)
        }),
        action('Reset password', {
          icon: 'i-lucide-key-round',
          color: 'neutral',
          onClick: () => confirmResend(user)
        }),
        ...(!expired
          ? [action('Revoke access now', {
              icon: 'i-lucide-lock',
              color: 'warning',
              onClick: () => confirmRevoke(user)
            })]
          : []),
        action('Delete user', {
          icon: 'i-lucide-trash-2',
          color: 'error',
          onClick: () => confirmDelete(user)
        })
      ])
    }
  }
]

function resetForm() {
  formState._id = undefined
  formState.fullName = ''
  formState.email = ''
  formState.validity = '1d'
  formState.customValidTill = ''
}

function openCreateModal() {
  resetForm()
  isModalOpen.value = true
}

function openValidityModal(user: ManagedUser) {
  resetForm()
  formState._id = user._id
  formState.fullName = user.fullName
  formState.email = user.email
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  resetForm()
}

function openConfirm(title: string, description: string, confirmLabel: string, action: () => Promise<void>) {
  confirmState.title = title
  confirmState.description = description
  confirmState.confirmLabel = confirmLabel
  confirmState.action = action
  isConfirmOpen.value = true
}

async function runConfirmed() {
  if (!confirmState.action) return
  isSaving.value = true
  try {
    await confirmState.action()
    isConfirmOpen.value = false
    await fetchUsers()
  } catch {
    // the axios interceptor already shows the server error
  } finally {
    isSaving.value = false
  }
}

function confirmResend(user: ManagedUser) {
  openConfirm(
    'Reset password?',
    `A new random password will be generated for ${user.email}. The old password will stop working.`,
    'Reset Password',
    async () => {
      const res: CredentialsResponse = await axios.$post(`/api/v2/users/resetPassword/${user._id}`)
      showCredentials(res, user.fullName, 'Password Reset', `New password generated for ${user.fullName}.`)
    }
  )
}

function confirmRevoke(user: ManagedUser) {
  openConfirm(
    'Revoke access?',
    `${user.fullName} will be logged out and locked immediately. You can unlock the account later by extending its validity.`,
    'Revoke',
    async () => {
      await axios.$patch(`/api/v2/users/revokeAccess/${user._id}`)
      toast.add({ title: 'Access revoked', color: 'success' })
    }
  )
}

function confirmDelete(user: ManagedUser) {
  openConfirm(
    'Delete user?',
    `${user.fullName} (${user.email}) will be permanently deleted.`,
    'Delete',
    async () => {
      await axios.$delete(`/api/v2/users/deleteUser/${user._id}`)
      toast.add({ title: 'User deleted', color: 'success' })
    }
  )
}

async function fetchUsers() {
  isFetching.value = true
  try {
    const response = await axios.$get<ManagedUser[] | UsersApiResponse>('/api/v2/users/getAllUsers')
    users.value = Array.isArray(response) ? response : response?.data || []
  } catch {
    // the axios interceptor already shows the server error
  } finally {
    isFetching.value = false
  }
}

await fetchUsers()

async function handleSave() {
  // Presets count from the moment of submit, not from when the modal opened.
  const validTill = formState.validity === 'custom'
    ? computedValidTill.value
    : new Date(Date.now() + PRESET_MS[formState.validity])
  if (!isFormValid.value || !validTill) {
    toast.add({ title: 'Please fill all fields with a future validity', color: 'warning' })
    return
  }

  isSaving.value = true
  try {
    if (isEditing.value) {
      await axios.$patch(`/api/v2/users/updateValidity/${formState._id}`, {
        validTill: validTill.toISOString()
      })
      toast.add({ title: 'Validity updated', color: 'success' })
    } else {
      const fullName = formState.fullName.trim()
      const res: CredentialsResponse = await axios.$post('/api/v2/users/createGuestUser', {
        fullName,
        email: formState.email.trim(),
        validTill: validTill.toISOString()
      })
      closeModal()
      showCredentials(res, fullName, 'Guest User Created', `${fullName} can now log in until the validity ends.`)
    }
    closeModal()
    await fetchUsers()
  } catch {
    // the axios interceptor already shows the server error
  } finally {
    isSaving.value = false
  }
}
</script>
