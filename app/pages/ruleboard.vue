<template>
  <UDashboardPanel id="ruleboard" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar title="Ruleboard" description="Map survey phases to living color rules.">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UPageGrid class="gap-5">
          <UPageCard
            class="flex min-h-[220px] cursor-pointer items-center justify-center border-2 border-dashed border-neutral-300 dark:border-neutral-600 text-center transition hover:border-primary/60 hover:bg-primary/5 interactive-lift"
            @click="openCreateModal"
          >
            <div class="space-y-3">
              <span class="inline-flex size-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 elevation-1">
                <UIcon name="i-lucide-plus" class="size-7" />
              </span>
              <div class="space-y-1">
                <p class="text-lg font-semibold">
                  Add phase rule
                </p>
                <p class="text-sm text-muted">
                  Set up the palette before survey crews head out.
                </p>
              </div>
            </div>
          </UPageCard>

          <template v-if="isFetchingRules">
            <UPageCard
              v-for="s in 3"
              :key="`skeleton-${s}`"
              class="space-y-3"
            >
              <USkeleton class="h-6 w-2/3" />
              <USkeleton class="h-4 w-1/2" />
              <USkeleton class="h-4 w-full" />
            </UPageCard>
          </template>

          <template v-else-if="phaseRules.length">
            <UPageCard
              v-for="rule in phaseRules"
              :key="rule._id || rule.phaseName"
              class="flex flex-col gap-4 interactive-lift"
              :spotlight="true"
              :spotlight-color="getColorSwatch(rule?.configs?.baseColor || rule?.configs?.fsdEntry)
                || 'var(--color-primary)'"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-[11px] uppercase tracking-[0.3em] text-muted">
                    Phase
                  </p>
                  <h3 class="text-lg font-semibold">
                    {{ getPhaseLabel(rule.phaseName) }}
                  </h3>
                </div>
                <div class="flex items-center gap-2">
                  <UButton
                    v-if="rule._id"
                    size="xs"
                    variant="ghost"
                    icon="i-lucide-pencil"
                    @click="openEditModal(rule)"
                  >
                    Edit
                  </UButton>
                </div>
              </div>

              <div v-if="rule.configs && Object.keys(rule.configs).length" class="space-y-2">
                <div
                  v-for="(value, key) in rule.configs"
                  :key="`${rule._id}-${key}`"
                  class="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
                >
                  <span class="font-medium">
                    {{ configLabelMap[key] || startCase(key) }}
                  </span>
                  <span class="flex items-center gap-2 font-semibold">
                    <span
                      class="size-3 rounded-full border border-black/5 dark:border-white/40"
                      :style="{ backgroundColor: getColorSwatch(value) }"
                    />
                    {{ value || '—' }}
                  </span>
                </div>
              </div>
              <p v-else class="rounded-lg border border-dashed border-neutral-200 px-3 py-2 text-sm text-muted dark:border-neutral-800">
                No colors configured for this phase yet.
              </p>

              <p class="text-xs text-muted">
                Updated {{ formatTimestamp(rule.updatedAt || rule.createdAt) }}
              </p>
            </UPageCard>
          </template>
        </UPageGrid>
      </div>

      <UModal
        v-model:open="isModalOpen"
        :ui="{ content: 'max-w-xl' }"
        :title="modalTitle"
        :description="modalDescription"
      >
        <template #body>
          <UForm
            id="phase-rule-form"
            class="space-y-6"
            @submit.prevent="handleSaveRule"
          >
            <UFieldGroup label="Phase type" description="Pick one of the standardized phases.">
              <USelect
                v-model="formState.phaseName"
                placeholder="Select phase"
                :items="typeOfPhases"
                value-key="value"
                :ui="{ content: 'min-w-[320px]' }"
              />
            </UFieldGroup>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                  {{ formState.phaseName === 'COLOR_CAP_TRACKING' ? 'Cap colors' : 'Detection colors' }}
                </p>
                <span v-if="formState.phaseName" class="text-xs text-muted">
                  {{ activeConfigFields.length }} swatches
                </span>
              </div>

              <div class="grid gap-3">
                <p v-if="!formState.phaseName" class="text-sm text-muted">
                  Choose a phase to unlock its color slots.
                </p>

                <UFieldGroup
                  v-for="field in activeConfigFields"
                  v-else
                  :key="field.key"
                  class="grid grid-cols-2 items-center gap-3 w-full"
                >
                  <div class="text-base font-medium">
                    {{ field.label }}
                  </div>
                  <USelect
                    v-model="formState.configs[field.key]"
                    placeholder="Select color"
                    :items="colorOptions"
                    value-key="value"
                    :ui="{ content: 'min-w-[220px]' }"
                  >
                    <template #leading>
                      <span
                        class="size-4 rounded-full border border-black/5 dark:border-white/20"
                        :style="{ backgroundColor: getColorSwatch(formState.configs[field.key]) }"
                      />
                    </template>
                    <template #item-leading="{ item }">
                      <span
                        class="size-4 rounded-full border border-black/5 dark:border-white/20"
                        :style="{ backgroundColor: item.swatch }"
                      />
                    </template>
                  </USelect>
                </UFieldGroup>
              </div>
            </div>
          </UForm>
        </template>

        <template #footer>
          <div class="flex justify-between items-end w-full gap-3">
            <UButton
              v-if="editingRuleId"
              type="button"
              variant="ghost"
              color="error"
              @click="handleDeleteRule"
            >
              Delete
            </UButton>
            <div class="flex gap-3">
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
                form="phase-rule-form"
                color="primary"
                :loading="isSavingRule"
                :disabled="!isFormValid"
              >
                {{ submitLabel }}
              </UButton>
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { phaseColorPalette, typeOfPhases } from '@/utils/tubesheetOptions'

type PhaseRule = {
  _id?: string
  phaseName: string
  configs?: Record<string, string>
  createdAt?: string
  updatedAt?: string
}

type PhaseRuleApiResponse = {
  Success?: boolean
  data?: PhaseRule[]
}

type ConfigField = { key: string, label: string }

const axios = useAxios()
const toast = useToast()

const phaseRules = ref<PhaseRule[]>([])
const isFetchingRules = ref(true)
const isSavingRule = ref(false)
const isModalOpen = ref(false)
const editingRuleId = ref<string | null>(null)

const colorTrackingSchema: ConfigField[] = [
  { key: 'colorA', label: 'Color A' },
  { key: 'colorB', label: 'Color B' },
  { key: 'colorC', label: 'Color C' },
  { key: 'colorD', label: 'Color D' },
  { key: 'baseColor', label: 'Base color' }
]

const detectionSchema: ConfigField[] = [
  { key: 'fsdEntry', label: 'Front side detection entry' },
  { key: 'bsd', label: 'Back side Lifection' },
  { key: 'bsdExit', label: 'Front side detection exit' },
  { key: 'baseColor', label: 'Not detected / Idle' }
]

const configLabelMap: Record<string, string> = [...colorTrackingSchema, ...detectionSchema]
  .reduce<Record<string, string>>((acc, field) => {
    acc[field.key] = field.label
    return acc
  }, {})

const formState = reactive<{ phaseName: string | null, configs: Record<string, string> }>(
  {
    phaseName: null,
    configs: {}
  }
)

const modalTitle = computed(() => editingRuleId.value ? 'Edit phase rule' : 'Create phase rule')
const modalDescription = computed(() => editingRuleId.value ? 'Update this phase palette to keep teams in sync.' : 'Bind a survey phase to a shared palette. Every swatch is required.')
const submitLabel = computed(() => editingRuleId.value ? 'Update rule' : 'Save rule')

const getSchemaForPhase = (phase: string) => phase === 'COLOR_CAP_TRACKING'
  ? colorTrackingSchema
  : detectionSchema

const activeConfigFields = computed<ConfigField[]>(() => {
  if (!formState.phaseName) return []
  return getSchemaForPhase(formState.phaseName)
})

const colorOptions = computed(() => {
  const extras: { label: string, value: string }[] = []
  const seen = new Set(phaseColorPalette.map(color => color.value))

  const addExtra = (value?: string) => {
    if (!value || seen.has(value)) return
    seen.add(value)
    extras.push({ label: value, value })
  }

  phaseRules.value.forEach((rule) => {
    Object.values(rule.configs || {}).forEach(addExtra)
  })

  Object.values(formState.configs).forEach(addExtra)

  return [...phaseColorPalette, ...extras]
})

const isFormValid = computed(() => {
  if (!formState.phaseName) return false
  return activeConfigFields.value.every(field => !!formState.configs[field.key])
})

watch(
  () => formState.phaseName,
  (phase) => {
    if (!phase) {
      formState.configs = {}
      return
    }

    formState.configs = buildConfigsForPhase(phase, formState.configs)
  },
  { immediate: true }
)

function buildConfigsForPhase(phase: string, seed: Record<string, string> = {}) {
  const schema = getSchemaForPhase(phase)
  const nextConfigs: Record<string, string> = {}
  schema.forEach((field) => {
    nextConfigs[field.key] = seed[field.key] || ''
  })
  return nextConfigs
}

function resetForm() {
  formState.phaseName = null
  formState.configs = {}
  editingRuleId.value = null
}

function openCreateModal() {
  resetForm()
  isModalOpen.value = true
}

function openEditModal(rule: PhaseRule) {
  editingRuleId.value = rule._id || null
  formState.configs = buildConfigsForPhase(rule.phaseName, rule.configs || {})
  formState.phaseName = rule.phaseName
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  resetForm()
}

async function fetchPhaseRules() {
  isFetchingRules.value = true
  try {
    const response = await axios.$get<PhaseRule[] | PhaseRuleApiResponse>('/api/v2/phase/getAllPhases')
    const rules = Array.isArray(response)
      ? response
      : response?.data || []
    phaseRules.value = rules
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Unable to load rules', color: 'error' })
  } finally {
    isFetchingRules.value = false
  }
}

await fetchPhaseRules()

async function handleSaveRule() {
  if (!isFormValid.value || !formState.phaseName) {
    toast.add({ title: 'Choose a phase and colors', color: 'warning' })
    return
  }

  isSavingRule.value = true
  try {
    if (editingRuleId.value) {
      await axios.$patch(`/api/v2/phase/updatePhase/${editingRuleId.value}`, {
        configs: formState.configs
      })
      toast.add({ title: 'Rule updated', color: 'success' })
    } else {
      await axios.$post('/api/v2/phase/createPhase', {
        phaseName: formState.phaseName,
        configs: formState.configs
      })
      toast.add({ title: 'Rule created', color: 'success' })
    }

    closeModal()
    await fetchPhaseRules()
  } catch (error) {
    toast.add({ title: error as string, color: 'error' })
  } finally {
    isSavingRule.value = false
  }
}

async function handleDeleteRule() {
  if (!editingRuleId.value) return

  try {
    await axios.$delete(`/api/v2/phase/removePhase/${editingRuleId.value}`)
    toast.add({ title: 'Rule deleted', color: 'success' })
    closeModal()
    await fetchPhaseRules()
  } catch { // s
  }
}

function getPhaseLabel(value?: string) {
  if (!value) return 'Unknown phase'
  return typeOfPhases.find(phase => phase.value === value)?.label || value
}

function getColorSwatch(value?: string) {
  if (!value) return '#475569'
  const option = colorOptions.value.find(color => color.value === value)
  if (option && 'swatch' in option && option.swatch) {
    return option.swatch as string
  }
  return option?.value || value
}

function startCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, char => char.toUpperCase())
}

function formatTimestamp(value?: string) {
  if (!value) return 'just now'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'just now'

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}
</script>
