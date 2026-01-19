<template>
  <UDashboardPanel id="ruleboard" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar
        title="Ruleboard"
        description="Map survey phases to living color rules."
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageGrid class="gap-5">
        <!-- ADD CARD -->
        <UPageCard
          class="flex min-h-[220px] cursor-pointer items-center justify-center border-2 border-dashed"
          @click="openCreateModal"
        >
          <div class="text-center space-y-2">
            <UIcon name="i-lucide-plus" class="size-10" />
            <p class="font-semibold">
              Add phase rule
            </p>
          </div>
        </UPageCard>

        <!-- SKELETON -->
        <template v-if="isFetchingRules">
          <UPageCard v-for="i in 3" :key="i">
            <USkeleton class="h-6 w-2/3 mb-2" />
            <USkeleton class="h-4 w-full" />
          </UPageCard>
        </template>

        <!-- RULE CARDS -->
        <template v-else>
          <UPageCard
            v-for="rule in phaseRules"
            :key="rule._id"
            class="space-y-4"
          >
            <div class="flex justify-between">
              <div>
                <p class="text-xs uppercase text-muted">
                  Phase
                </p>
                <h3 class="font-semibold">
                  {{ getPhaseLabel(rule.phaseName) }}
                </h3>
              </div>
              <UButton
                size="xs"
                variant="ghost"
                icon="i-lucide-pencil"
                @click="openEditModal(rule)"
              />
            </div>

            <!-- CONFIG DISPLAY -->
            <div class="space-y-2">
              <div
                v-for="(value, key) in rule.configs"
                :key="key"
                class="flex justify-between items-center border rounded px-3 py-2 text-sm"
              >
                <span>{{ configLabelMap[key] || startCase(key) }}</span>

                <span class="flex items-center gap-2 font-semibold">
                  {{ value.abbreviation || '—' }}
                  <span
                    class="size-3 rounded-full border"
                    :style="{ backgroundColor: getColorSwatch(value.color) }"
                  />
                </span>
              </div>
            </div>

            <p class="text-xs text-muted">
              Updated {{ formatTimestamp(rule.updatedAt) }}
            </p>
          </UPageCard>
        </template>
      </UPageGrid>

      <!-- MODAL -->
      <UModal
        v-model:open="isModalOpen"
        :ui="{ content: 'max-w-xl' }"
        :title="modalTitle"
        :description="modalDescription"
      >
        <template #body>
          <UForm id="phase-rule-form" class="space-y-6" @submit.prevent="handleSaveRule">
            <UFieldGroup
              label="Phase type"
              description="Pick one of the standardized phases."
            >
              <USelect
                v-model="formState.phaseName"
                :items="typeOfPhases"
                value-key="value"
                class="min-w-40"
                placeholder="Select phase"
                :ui="{ content: 'min-w-96' }"
                :disabled="!!editingRuleId"
              />
            </UFieldGroup>

            <UFieldGroup
              v-for="field in activeConfigFields"
              :key="field.key"
              class="grid grid-cols-2 gap-3 items-center"
            >
              <div class="font-medium">
                {{ field.label }}
              </div>

              <div class="flex">
                <USelect
                  v-model="formState.configs[field.key].color"
                  :items="colorOptions"
                  value-key="value"
                  class="min-w-36"
                  placeholder="Color"
                >
                  <template #leading>
                    <span
                      class="size-4 rounded-full border border-black/5 dark:border-white/20"
                      :style="{
                        backgroundColor: getColorSwatch(
                          formState.configs[field.key].color
                        )
                      }"
                    />
                  </template>
                  <template #item-leading="{ item }">
                    <span
                      class="size-4 rounded-full border border-black/5 dark:border-white/20"
                      :style="{ backgroundColor: item.swatch }"
                    />
                  </template>
                </USelect>
                <UInput
                  v-model="formState.configs[field.key].abbreviation"
                  placeholder="Abbreviation"
                />
              </div>
            </UFieldGroup>
          </UForm>
        </template>

        <template #footer>
          <div class="flex justify-between w-full">
            <UButton
              v-if="editingRuleId"
              color="error"
              variant="ghost"
              @click="handleDeleteRule"
            >
              Delete
            </UButton>

            <div class="flex gap-2">
              <UButton variant="ghost" @click="closeModal">
                Cancel
              </UButton>
              <UButton
                type="submit"
                :loading="isSavingRule"
                :disabled="!isFormValid"
                form="phase-rule-form"
                color="primary"
              >
                {{ editingRuleId ? 'Update' : 'Save' }}
              </UButton>
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { phaseColorPalette, typeOfPhases } from '@/utils/tubesheetOptions'

/* ================= TYPES ================= */
type ColorConfig = {
  color: string
  abbreviation: string
}

type RawConfigValue = string | ColorConfig

type PhaseRule = {
  _id?: string
  phaseName: string
  configs?: Record<string, RawConfigValue>
  createdAt?: string
  updatedAt?: string
}

/* ================= STATE ================= */
const axios = useAxios()
const toast = useToast()

const phaseRules = ref<PhaseRule[]>([])
const isFetchingRules = ref(true)
const isSavingRule = ref(false)
const isModalOpen = ref(false)
const editingRuleId = ref<string | null>(null)

const formState = reactive<{
  phaseName: string | null
  configs: Record<string, ColorConfig>
}>({
  phaseName: null,
  configs: {}
})

const modalTitle = computed(() =>
  editingRuleId.value ? 'Phase Rule' : 'Create Phase Rule'
)
const modalDescription = computed(() =>
  editingRuleId.value
    ? 'Update this phase palette before start the survey.'
    : 'Create phase palette before starting the survey.'
)
const submitLabel = computed(() =>
  editingRuleId.value ? 'Update rule' : 'Save rule'
)
/* ================= SCHEMAS ================= */
const colorTrackingSchema = [
  { key: 'colorA', label: 'Color A' },
  { key: 'colorB', label: 'Color B' },
  { key: 'colorC', label: 'Color C' },
  { key: 'colorD', label: 'Color D' },
  { key: 'baseColor', label: 'Base color' }
]

const detectionSchema = [
  { key: 'fsdEntry', label: 'Front side detection entry' },
  { key: 'bsd', label: 'Back side detection' },
  { key: 'bsdExit', label: 'Front side detection exit' },
  { key: 'baseColor', label: 'Not detected / idle' }
]

const configLabelMap = [...colorTrackingSchema, ...detectionSchema].reduce(
  (acc, f) => {
    acc[f.key] = f.label
    return acc
  },
  {} as Record<string, string>
)

/* ================= COMPUTED ================= */
const activeConfigFields = computed(() => {
  if (!formState.phaseName) return []
  return formState.phaseName === 'COLOR_CAP_TRACKING'
    ? colorTrackingSchema
    : detectionSchema
})

const colorOptions = computed(() => phaseColorPalette)

const isFormValid = computed(() =>
  activeConfigFields.value.every((f) => {
    const c = formState.configs[f.key]
    return !!c?.color
  })
)

/* ================= NORMALIZER ================= */
function normalizeConfigs(
  configs: Record<string, RawConfigValue> = {}
): Record<string, ColorConfig> {
  const out: Record<string, ColorConfig> = {}
  Object.entries(configs).forEach(([k, v]) => {
    out[k]
      = typeof v === 'string'
        ? { color: v, abbreviation: '' }
        : { color: v.color || '', abbreviation: v.abbreviation || '' }
  })
  return out
}

/* ================= WATCH ================= */
watch(
  () => formState.phaseName,
  (phase) => {
    if (!phase) return
    formState.configs = buildConfigsForPhase(phase, formState.configs)
  }
)

/* ================= HELPERS ================= */
function buildConfigsForPhase(
  phase: string,
  seed: Record<string, ColorConfig> = {}
) {
  const schema
    = phase === 'COLOR_CAP_TRACKING'
      ? colorTrackingSchema
      : detectionSchema

  const out: Record<string, ColorConfig> = {}
  schema.forEach((f) => {
    out[f.key] = {
      color: seed[f.key]?.color || '',
      abbreviation: seed[f.key]?.abbreviation || ''
    }
  })
  return out
}

function getColorSwatch(color?: string) {
  return (
    phaseColorPalette.find(c => c.value === color)?.swatch
    || color
    || '#64748b'
  )
}

function getPhaseLabel(value: string) {
  return typeOfPhases.find(p => p.value === value)?.label || value
}

function startCase(v: string) {
  return v.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())
}

function formatTimestamp(v?: string) {
  return v
    ? new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(v))
    : 'just now'
}

/* ================= API ================= */
async function fetchPhaseRules() {
  isFetchingRules.value = true
  const res = await axios.$get<{ data: PhaseRule[] }>('/api/v2/phase/getAllPhases')
  phaseRules.value = res?.data?.map(r => ({
    ...r,
    configs: normalizeConfigs(r.configs)
  }))
  isFetchingRules.value = false
}

await fetchPhaseRules()

/* ================= ACTIONS ================= */
function openCreateModal() {
  editingRuleId.value = null
  formState.phaseName = null
  formState.configs = {}
  isModalOpen.value = true
}

function openEditModal(rule: PhaseRule) {
  editingRuleId.value = rule._id || null
  formState.phaseName = rule.phaseName
  formState.configs = buildConfigsForPhase(
    rule.phaseName,
    normalizeConfigs(rule.configs)
  )
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

async function handleSaveRule() {
  isSavingRule.value = true
  try {
    if (editingRuleId.value) {
      await axios.$patch(
        `/api/v2/phase/updatePhase/${editingRuleId.value}`,
        { configs: formState.configs }
      )
    } else {
      await axios.$post('/api/v2/phase/createPhase', {
        phaseName: formState.phaseName,
        configs: formState.configs
      })
    }
    await fetchPhaseRules()
    closeModal()
  } finally {
    isSavingRule.value = false
  }
}

async function handleDeleteRule() {
  if (!editingRuleId.value) return
  await axios.$delete(`/api/v2/phase/removePhase/${editingRuleId.value}`)
  await fetchPhaseRules()
  closeModal()
}
</script>
