<template>
  <UDashboardPanel id="create-tubesheet" :ui="{ body: '!p-0' }">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #title>
          <div class="flex flex-col">
            <span class="font-semibold text-xl text-primary-500">
              {{ tubeSheetDetails?.equipmentId }}
              {{ currentSurvey ? `- ${currentSurvey}` : "" }}
            </span>
          </div>
        </template>
        <template #right>
          <UFieldGroup>
            <UInput
              value="Individual Tube Address"
              disabled
              class="cursor-grab! font-bold w-full"
            />
            <UInput
              v-model="searchValue"
              placeholder="Search Tubes"
              leading-icon="i-lucide-search"
              class="min-w-96 max-w-60"
              @update:model-value="searchValue = $event.toUpperCase()"
            />

            <UButton
              color="neutral"
              variant="subtle"
              label="Search"
              @click="searchTubes"
            />
            <UButton
              color="neutral"
              variant="subtle"
              label="Reset"
              @click="
                searchValue = '';
                deselectAll();
                resetView();
              "
            />
          </UFieldGroup>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #right>
          <UFieldGroup>
            <UInput
              value="Phases:"
              disabled
              class="cursor-grab! font-bold max-w-18"
            />
            <USelectMenu
              v-model="selectedPhase"
              placeholder="Select Phase"
              :items="typeOfPhasesItems"
              value-key="value"
              class="min-w-64"
              :disabled="loading"
            />
          </UFieldGroup>
          <UButton
            v-if="!viewMode"
            :label="loading ? 'Stop Survey' : 'Start Survey'"
            color="primary"
            :icon="loading ? 'i-lucide-stop-circle' : 'i-lucide-target'"
            :disabled="!selectedPhase"
            @click="loading ? openStopModal() : stratSurvey()"
          />
          <UButton
            color="neutral"
            variant="subtle"
            :icon="
              isRightOpen
                ? 'i-lucide-panel-right-close'
                : 'i-lucide-panel-right-open'
            "
            @click="isRightOpen = !isRightOpen"
          />
        </template>
        <template #left>
          <UButton
            color="neutral"
            variant="subtle"
            label="Info"
            @click="showDetails = !showDetails"
          />
          <URadioGroup
            v-model="viewDisplay"
            indicator="hidden"
            variant="card"
            size="xs"
            orientation="horizontal"
            default-value=""
            :items="items"
          />
          <ZoomControls
            hide-rotation
            @zoom-in="zoomIn"
            @zoom-out="zoomOut"
            @pan="panXY"
            @reset="resetView"
          />
        </template>
      </UDashboardToolbar>
    </template>
    <template #body>
      <UPage class="flex gap-0" :ui="pageUi">
        <UPageBody
          class="select-none bg-[linear-gradient(to_right,#e5e7eb_.5px,transparent_.5px),linear-gradient(to_bottom,#e5e7eb_.5px,transparent_.5px)] bg-size-[20px_20px] dark:bg-[linear-gradient(to_right,#2d2d2d_.5px,transparent_.5px),linear-gradient(to_bottom,#2d2d2d_.5px,transparent_.5px)] dark:bg-size-[20px_20px] dark:bg-neutral-950 bg-white max-h-[calc(100dvh-var(--ui-header-height)-49px)] min-h-[calc(100dvh-var(--ui-header-height)-49px)] w-full flex justify-center items-center z-10"
          :class="bodyClass"
        >
          <!--  @click="deselectAll"
            @contextmenu.prevent -->
          <div
            class="absolute top-0 size-full -z-10 left-0 opacity-20"
            style="
              background-image: url(&quot;/ots_background.png&quot;);
              background-size: cover;
              background-position: center;
            "
          />

          <div class="h-full p-10 w-full flex justify-center items-center">
            <!-- SVG Canvas -->
            <svg
              ref="svgRef"
              :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMinYMin meet"
              :style="{
                width: '100%',
                height: '100%',
                ...(viewDisplay === 'Back View'
                  ? {
                    transform: 'scale(-1,1)',
                    transformOrigin: 'center',
                    transformBox: 'fill-box'
                  }
                  : {})
              }"
              :class="viewDisplay === 'Back View' ? 'invert' : ''"
              @wheel.prevent="handleWheel"
            >
              <g id="viewport" :transform="transformStr">
                <!-- Compass overlay on reactor (plus sign lines) - inside viewport to move/zoom with reactor -->
                <g :transform="`rotate(${rotation} ${centerX} ${centerY})`">
                  <!-- Vertical line (North-South) -->
                  <line
                    :x1="centerX"
                    :y1="centerY - compassSize.vertical - 40"
                    :x2="centerX"
                    :y2="centerY + compassSize.vertical + 40"
                    stroke="#dc2626"
                    stroke-width="2"
                    opacity="0.7"
                  />

                  <!-- Horizontal line (East-West) -->
                  <line
                    :x1="centerX - compassSize.horizontal - 40"
                    :y1="centerY"
                    :x2="centerX + compassSize.horizontal + 40"
                    :y2="centerY"
                    stroke="#dc2626"
                    stroke-width="2"
                    opacity="0.7"
                  />

                  <!-- North indicator -->
                  <g
                    :transform="`translate(${centerX}, ${centerY - compassSize.vertical - 50})`"
                  >
                    <polygon points="0,-12 -8,8 0,4 8,8" fill="#dc2626" />
                    <text
                      y="-18"
                      text-anchor="middle"
                      fill="#dc2626"
                      font-weight="bold"
                      font-size="18"
                    >
                      N
                    </text>
                  </g>

                  <!-- South indicator -->
                  <g
                    :transform="`translate(${centerX}, ${centerY + compassSize.vertical + 50})`"
                  >
                    <polygon
                      points="0,12 -8,-8 0,-4 8,-8"
                      fill="#dc2626"
                      opacity="0.6"
                    />
                    <text
                      y="32"
                      text-anchor="middle"
                      fill="#dc2626"
                      font-weight="bold"
                      font-size="18"
                    >
                      S
                    </text>
                  </g>

                  <!-- East indicator -->
                  <g
                    :transform="`translate(${centerX + compassSize.horizontal + 50}, ${centerY})`"
                  >
                    <polygon
                      points="12,0 -8,-8 -4,0 -8,8"
                      fill="#dc2626"
                      opacity="0.6"
                    />
                    <text
                      x="22"
                      text-anchor="start"
                      dominant-baseline="middle"
                      fill="#dc2626"
                      font-weight="bold"
                      font-size="18"
                    >
                      E
                    </text>
                  </g>

                  <!-- West indicator -->
                  <g
                    :transform="`translate(${centerX - compassSize.horizontal - 50}, ${centerY})`"
                  >
                    <polygon
                      points="-12,0 8,-8 4,0 8,8"
                      fill="#dc2626"
                      opacity="0.6"
                    />
                    <text
                      x="-22"
                      text-anchor="end"
                      dominant-baseline="middle"
                      fill="#dc2626"
                      font-weight="bold"
                      font-size="18"
                    >
                      W
                    </text>
                  </g>
                </g>
              </g>
            </svg>
          </div>
          <!-- Backend Progress Indicator -->
          <!-- Tubesheet Details Card -->
          <UPageCard
            v-if="tubeSheetDetails && showDetails"
            spotlight
            spotlight-color="secondary"
            class="absolute top-6 left-6 z-50 bg-white/90 dark:bg-black/90 p-0 rounded-2xl max-w-sm"
          >
            <div class="space-y-3">
              <h3
                class="font-bold text-lg text-neutral-900 dark:text-neutral-100"
              >
                {{ tubeSheetDetails.clientName }}
              </h3>
              <div
                class="space-y-2 text-xs text-neutral-600 dark:text-neutral-400"
              >
                <p>
                  <span class="font-medium">Equipment ID:</span>
                  {{ tubeSheetDetails.equipmentId || "N/A" }}
                </p>
                <p>
                  <span class="font-medium">Type:</span>
                  {{ getEquipmentTypeLabel(tubeSheetDetails.type) }}
                </p>
                <p>
                  <span class="font-medium">Site:</span>
                  {{ tubeSheetDetails.clientAddress }}
                </p>
                <p>
                  <span class="font-medium">Material:</span>
                  {{ tubeSheetDetails.material || "N/A" }}
                </p>
                <p>
                  <span class="font-medium">Total Tubes:</span>
                  {{ tubeSheetDetails.totalNoOfTubes || 0 }}
                </p>
                <p>
                  <span class="font-medium">Cameras:</span>
                  {{ tubeSheetDetails.numberOfCameras || 0 }}
                </p>
                <div
                  v-if="
                    getPhaseLabels(tubeSheetDetails.typeOfPhases).length > 0
                  "
                >
                  <p class="font-medium mb-1">
                    Phases:
                  </p>
                  <ul class="list-disc list-inside space-y-0.5 ml-2">
                    <li
                      v-for="(phase, idx) in getPhaseLabels(
                        tubeSheetDetails.typeOfPhases
                      )"
                      :key="idx"
                      class="text-[11px]"
                    >
                      {{ phase }}
                    </li>
                  </ul>
                </div>
                <p>
                  <span class="font-medium">Status:</span>
                  <span
                    class="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="{
                      'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300':
                        tubeSheetDetails.status === 'TUBE_SHEET_CREATED',
                      'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300':
                        tubeSheetDetails.status === 'CAMERA_CONFIGURED',
                      'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300':
                        tubeSheetDetails.status === 'REACTOR_CREATED',
                      'bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-300':
                        tubeSheetDetails.status === 'CAMERA_CALIBRATED',
                      'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300':
                        tubeSheetDetails.status === 'UNDER_SURVEY'
                    }"
                  >
                    {{
                      tubeSheetStatusLabels[tubeSheetDetails.status] || "N/A"
                    }}
                  </span>
                </p>
              </div>
            </div>
          </UPageCard>

          <div class="w-20 h-20 top-0 absolute right-0 m-4">
            <svg viewBox="0 0 64 64" class="w-full h-full">
              <!-- Rotating compass needle group -->
              <g
                :style="{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: 'center'
                }"
              >
                <!-- North needle (red) -->
                <polygon points="32,8 28,32 32,28 36,32" fill="#dc2626" />
                <!-- South needle (gray) -->
                <polygon points="32,56 28,32 32,36 36,32" fill="#9ca3af" />
              </g>

              <!-- Fixed direction labels -->
              <text
                x="32"
                y="7"
                text-anchor="middle"
                fill="#dc2626"
                font-weight="bold"
                font-size="8"
              >
                N
              </text>
              <text
                x="32"
                y="63"
                text-anchor="middle"
                fill="#6b7280"
                font-size="8"
              >
                S
              </text>
              <text
                x="58"
                y="34"
                text-anchor="middle"
                fill="#6b7280"
                font-size="8"
              >
                E
              </text>
              <text
                x="6"
                y="34"
                text-anchor="middle"
                fill="#6b7280"
                font-size="8"
              >
                W
              </text>
            </svg>
            <div class="text-center mt-2">
              <span class="text-lg font-bold text-red-600 dark:text-red-500">{{ rotation }}°</span>
            </div>
          </div>
        </UPageBody>
        <template v-if="isRightOpen" #right>
          <div
            class="w-full max-h-[calc(100dvh-var(--ui-header-height)-49px)] overflow-y-auto p-4 space-y-4 relative"
            :class="{
              'opacity-30 pointer-events-none bg-gray-200 dark:bg-gray-700':
                !loading && !viewMode
            }"
          >
            <div
              v-if="!loading && !viewMode"
              class="absolute inset-0 bg-gray-200 dark:bg-gray-700 opacity-50 z-10 flex items-center justify-center"
            />

            <!-- Survey Progress Card with Pie Chart and Stats -->
            <UPageCard
              spotlight
              spotlight-color="primary"
              class="h-fit"
              title="Survey Progress"
              :ui="{ container: 'sm:p-2 gap-2!' }"
            >
              <div class="grid grid-cols-2">
                <div>
                  <Pie
                    :data="chartData"
                    :options="chartOptions"
                    class="max-h-40"
                  />
                </div>
                <div class="w-full grid grid-cols-2 gap-2 text-center">
                  <div
                    class="text-sm text-neutral-700 dark:text-neutral-200 flex justify-center"
                  >
                    <div>
                      <h1>Total Tube Count</h1>
                      <span class="font-semibold">{{ totalCount }}</span>
                    </div>
                  </div>
                  <div
                    class="text-sm text-neutral-700 dark:text-neutral-200 flex justify-center"
                  >
                    <div>
                      <h1>Special Tubes</h1>
                      <span class="font-semibold">{{ specialTubes }}</span>
                    </div>
                  </div>
                  <div
                    class="text-sm text-neutral-700 dark:text-neutral-200 flex justify-center"
                  >
                    <div>
                      <h1>Progress</h1>
                      <span class="font-semibold">{{
                        viewDisplay === "Back View"
                          ? backBackendUpdatedCount
                          : backendUpdatedCount
                      }}</span>
                      /
                      <span class="font-semibold">{{
                        totalCount - specialTubes
                      }}</span>
                    </div>
                  </div>
                  <div
                    class="flex justify-center text-center text-sm text-neutral-700 dark:text-neutral-200"
                  >
                    <div>
                      Repeat
                      <br>
                      {{ repeatCount }}
                    </div>
                  </div>
                  <div
                    class="flex justify-center text-center text-sm text-neutral-700 dark:text-neutral-200"
                  >
                    <div>
                      Start Time
                      <br>
                      {{ currentSurveyTime }}
                    </div>
                  </div>
                  <div
                    class="flex justify-center text-center text-sm text-neutral-700 dark:text-neutral-200"
                  >
                    <div>
                      Last Time
                      <br>
                      {{ lastSurveyTime }}
                    </div>
                  </div>
                </div>
              </div>
            </UPageCard>

            <!-- Progress Line Chart Card -->
            <div class="flex gap-3">
              <UPageCard
                v-if="progressData.length > 0"
                spotlight
                spotlight-color="success"
                class="h-fit"
                :ui="{ container: 'sm:p-2 gap-2!' }"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span
                      class="text-sm font-medium text-neutral-700 dark:text-neutral-200"
                    >Time Since Last Update</span>
                  </div>
                  <span
                    class="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono"
                  >{{ elapsedTime }}</span>
                </div>
                <div class="h-40">
                  <Bar
                    :data="progressChartData"
                    :options="progressChartOptions"
                  />
                </div>
              </UPageCard>

              <UPageCard
                spotlight
                spotlight-color="secondary"
                class="p-0 w-full"
                :ui="{ container: 'sm:p-2 gap-0! h-full' }"
                title="Special Tubes"
              >
                <div class="grid grid-cols-2 gap-1 p-0 h-full">
                  <div
                    v-for="item in propertyLegend"
                    :key="item.value"
                    class="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <div class="flex items-center gap-1">
                      <div
                        class="size-2 rounded border border-neutral-300 dark:border-neutral-600"
                        :style="{ backgroundColor: item.color }"
                      />
                      <span
                        class="text-[12px] font-medium text-neutral-700 dark:text-neutral-200"
                      >
                        {{ item.label }}
                      </span>
                    </div>
                    <span
                      class="text-[12px] font-bold text-neutral-900 dark:text-neutral-100 p-1 bg-neutral-100 dark:bg-neutral-800 rounded ml-2"
                    >
                      {{ item.count }}
                    </span>
                  </div>
                </div>
              </UPageCard>
            </div>

            <!-- Add Comment Section -->
            <div v-if="selectedIds.size > 0" class="space-y-2">
              <div v-if="!showCommentInput" class="flex justify-end">
                <UButton
                  label="Add Comment"
                  color="primary"
                  variant="outline"
                  icon="i-lucide-message-square-plus"
                  size="sm"
                  @click="showCommentInput = true"
                />
              </div>
              <UPageCard
                v-if="showCommentInput"
                spotlight
                spotlight-color="info"
                class="h-fit"
                :ui="{ container: 'sm:p-3 gap-3!' }"
              >
                <div
                  class="text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2"
                >
                  Add comment for tube: {{ [...selectedIds].join(", ") }}
                </div>
                <UTextarea
                  v-model="commentText"
                  placeholder="Enter your comment..."
                  :rows="3"
                  class="w-full"
                />
                <div class="flex justify-end gap-2 mt-2">
                  <UButton
                    label="Cancel"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    @click="
                      showCommentInput = false;
                      commentText = '';
                    "
                  />
                  <UButton
                    label="Add Comment"
                    color="primary"
                    size="sm"
                    :loading="addingComment"
                    :disabled="!commentText.trim()"
                    @click="submitComment"
                  />
                </div>
              </UPageCard>
            </div>

            <UPageCard
              :ui="{ container: 'sm:p-2' }"
              spotlight-color="secondary"
              class="h-fit p-0"
            >
              <UTabs :items="tabs" class="w-full">
                <template #content="{ item }">
                  <UTable
                    :data="
                      item.label === 'Progress'
                        ? viewDisplay === 'Back View'
                          ? backTableData
                          : tableData
                        : viewDisplay === 'Back View'
                          ? backRepeatTableData
                          : repeatTableData
                    "
                    class="flex-1 max-h-[312px]"
                    :rows="10"
                    sticky="header"
                  >
                    <template #Action-cell="{ row }">
                      <UFieldGroup>
                        <UButton
                          v-if="searchValue !== row.original?.tube"
                          size="xs"
                          color="primary"
                          variant="outline"
                          label="Locate"
                          @click="
                            searchValue = row.original?.tube;
                            searchTubes();
                          "
                        />
                        <UButton
                          v-if="searchValue === row.original?.tube"
                          size="xs"
                          color="error"
                          variant="outline"
                          label="Reset"
                          @click="
                            searchValue = '';
                            deselectAll();
                            resetView();
                          "
                        />
                      </UFieldGroup>
                    </template>
                  </UTable>
                </template>
              </UTabs>
            </UPageCard>
            <UPageCard
              v-if="selectedIds.size"
              spotlight
              spotlight-color="secondary"
              class="h-fit p-0"
              :title="`Tube History: ${[...selectedIds].join(', ')}`"
              :ui="{ container: 'sm:p-2 gap-y-2' }"
            >
              <div v-for="id in [...selectedIds]" :key="id">
                <div
                  v-if="
                    (viewDisplay === 'Back View'
                      ? backTableData
                      : tableData
                    ).find((t) => t.tube === id)
                  "
                  class="text-sm text-neutral-700 dark:text-neutral-200"
                >
                  Activity:
                  {{
                    (viewDisplay === "Back View"
                      ? backTableData
                      : tableData
                    ).find((t) => t.tube === id)!.Activity
                  }}
                  <br>
                  Time:
                  {{
                    (viewDisplay === "Back View"
                      ? backTableData
                      : tableData
                    ).find((t) => t.tube === id)!.time
                  }}
                  <br>
                </div>
                <div
                  v-else
                  class="text-sm text-neutral-700 dark:text-neutral-200"
                >
                  Tube not detected yet.
                </div>
                <div
                  v-if="
                    tubeComments.find((c) => c.tubeIdAsperLayout === id)
                      ?.comment
                  "
                  class="text-amber-600 dark:text-amber-400 mt-1"
                >
                  <span class="font-medium">Comment:</span>
                  {{
                    tubeComments.find((c) => c.tubeIdAsperLayout === id)
                      ?.comment
                  }}
                </div>
              </div>
            </UPageCard>
          </div>
        </template>
      </UPage>
    </template>
  </UDashboardPanel>

  <UModal
    v-model:open="stopModalOpen"
    title="Stop Survey"
    description="Are you sure you want to stop the survey?"
  >
    <template #footer>
      <div class="w-full flex justify-end items-center gap-4">
        <UButton
          label="Cancel"
          color="neutral"
          variant="outline"
          @click="stopModalOpen = false"
        />
        <UButton label="Confirm" color="primary" @click="stopSurvey" />
      </div>
    </template>
  </UModal>

  <UModal v-model:open="successModalOpen" :title="successMessage">
    <template #body>
      <p>The survey has been successfully stopped.</p>
    </template>
    <template #footer>
      <div class="w-full flex justify-end items-center gap-4">
        <UButton
          label="Download Report"
          color="neutral"
          variant="outline"
          @click="downloadReport"
        />
        <UButton label="Go back to home" color="primary" @click="goHome" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { Tube } from '@/types'
import { useReactorsStore } from '@/stores/reactors'
import { useSurveyStore } from '@/stores/survey'
import {
  tubeSheetTypeItems,
  typeOfPhases as allTypeOfPhasesItems,
  tubeSheetStatusLabels
} from '@/utils/tubesheetOptions'
import { UFieldGroup } from '#components'
import { Pie, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js'
import type { TooltipItem } from 'chart.js'

type TubeDataTable = {
  tube: string
  Activity: string
  time: string
  face: string
  comment?: string
}
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
)

const loading = ref(false)
const isRightOpen = ref(true)
const stopModalOpen = ref(false)
const successModalOpen = ref(false)
const successMessage = ref('')
const { setConfig } = useReactorGenerator()

const reactorId = useRoute().params?.reactorId as string
const sheetId = useRoute().params?.sheetId as string
const tableData = ref<TubeDataTable[]>([])
const repeatTableData = ref<TubeDataTable[]>([])
const backTableData = ref<TubeDataTable[]>([])
const backRepeatTableData = ref<TubeDataTable[]>([])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tubeSheetDetails = ref<any>(null)
const selectedPhase = ref<string>('')
const currentSurvey = ref('')
const currentSurveyTime = ref('')
const lastSurveyTime = ref('')

const showDetails = ref(false)
const items = ref(['Front View', 'Back View'])
const viewDisplay = ref('Front View')
const repeatCount = ref(0)
const viewMode = ref(false)
const activeSurveyId = ref<string | undefined>(undefined)

// Progress data from API and timer
const progressData = ref<{ time: string, tubes: number }[]>([])
const lastUpdatedAt = ref<string | null>(null)
const elapsedTime = ref('0:00')

// Comment functionality
const showCommentInput = ref(false)
const commentText = ref('')
const addingComment = ref(false)
const tubeComments = ref<
  {
    tubeIdAsperLayout: string
    comment: string
    timeStamp: string
    _id: string
  }[]
>([])

// Update elapsed time when API is called
function updateElapsedTime() {
  if (lastUpdatedAt.value) {
    const now = Date.now()
    const updated = new Date(lastUpdatedAt.value).getTime()
    const diffMs = now - updated
    const diffMins = Math.floor(diffMs / 60000)
    elapsedTime.value = `${diffMins} min`
  } else {
    elapsedTime.value = '0 min'
  }
}

const tabs = [
  {
    label: 'Progress',
    icon: 'i-lucide-activity'
  },
  {
    label: 'Repeat',
    icon: 'i-lucide-refresh-ccw'
  }
]

const pageUi = computed(() => ({
  root: 'gap-0!',
  right: isRightOpen.value ? 'lg:col-span-4 order-first lg:order-last' : '',
  center: isRightOpen.value ? 'lg:col-span-6' : 'lg:col-span-10'
}))

const bodyClass = computed(() => {
  const base = 'relative select-none !p-0 !mt-0 h-full w-full '
  const gridLight
    = 'bg-[linear-gradient(to_right,#e5e7eb_.5px,transparent_.5px),linear-gradient(to_bottom,#e5e7eb_.5px,transparent_.5px)] bg-[size:20px_20px]'
  const gridDark
    = 'dark:bg-[linear-gradient(to_right,#2d2d2d_.5px,transparent_.5px),linear-gradient(to_bottom,#2d2d2d_.5px,transparent_.5px)] dark:bg-[size:20px_20px]'
  const bgLight = 'bg-white'
  const bgDark = 'dark:bg-neutral-950'

  if (viewDisplay.value === 'Back View') {
    // For back view, use a reddish grid to differentiate
    const gridLightBack
      = 'bg-[linear-gradient(to_right,#ffcccc_.5px,transparent_.5px),linear-gradient(to_bottom,#ffcccc_.5px,transparent_.5px)] bg-[size:20px_20px]'
    const gridDarkBack
      = 'dark:bg-[linear-gradient(to_right,#4d0000_.5px,transparent_.5px),linear-gradient(to_bottom,#4d0000_.5px,transparent_.5px)] dark:bg-[size:20px_20px]'
    return `${base} ${gridLightBack} ${gridDarkBack} ${bgLight} ${bgDark}`
  } else {
    return `${base} ${gridLight} ${gridDark} ${bgLight} ${bgDark}`
  }
})
// Computed property to get only phases from tubesheet details
const typeOfPhasesItems = computed(() => {
  if (
    !tubeSheetDetails.value?.typeOfPhases
    || tubeSheetDetails.value.typeOfPhases.length === 0
  ) {
    return []
  }
  return tubeSheetDetails.value.typeOfPhases.map((phaseValue: string) => {
    const item = allTypeOfPhasesItems.find(p => p.value === phaseValue)
    return item || { label: phaseValue, value: phaseValue }
  })
})

const getEquipmentTypeLabel = (value: string) => {
  const item = tubeSheetTypeItems.find(t => t.value === value)
  return item ? item.label : value
}

const getPhaseLabels = (phases: string[]) => {
  if (!phases || phases.length === 0) return []
  return phases.map((phase) => {
    const item = allTypeOfPhasesItems.find(p => p.value === phase)
    return item ? item.label : phase
  })
}

const settingsInput = reactive({
  mirrorX: false
})

// const settingitems = computed<DropdownMenuItem[]>(() => [

//   {
//     label: 'Mirror  (Top ↔ Buttom)',
//     icon: 'i-lucide-arrow-up-down',
//     type: 'checkbox',
//     checked: settingsInput.mirrorX,
//     onUpdateChecked(v: boolean) { settingsInput.mirrorX = v },
//     onSelect(e: Event) { e.preventDefault() }
//   }
// ])

const { config, tubes: currentTubes } = useReactorGenerator()
const {
  scale,
  tx,
  ty,
  rotation,
  zoom,
  pan,
  reset,
  setZoom,
  setPan,
  setRotation
} = useViewportTransform()

const viewportStorageKey = reactorId
  ? `viewport:${reactorId}`
  : 'viewport:default'

function loadViewportState() {
  if (typeof localStorage === 'undefined') return
  const raw = localStorage.getItem(viewportStorageKey)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw) as {
      scale?: number
      tx?: number
      ty?: number
      rotation?: number
    }
    if (typeof parsed.scale === 'number') setZoom(parsed.scale)
    if (typeof parsed.tx === 'number' && typeof parsed.ty === 'number')
      setPan(parsed.tx, parsed.ty)
    if (typeof parsed.rotation === 'number') setRotation(parsed.rotation)
  } catch (err) {
    console.error('Failed to load viewport state', err)
  }
}

function persistViewportState() {
  if (typeof localStorage === 'undefined') return
  const payload = {
    scale: scale.value,
    tx: tx.value,
    ty: ty.value,
    rotation: rotation.value
  }
  localStorage.setItem(viewportStorageKey, JSON.stringify(payload))
}

// Initialize stores
const reactorsStore = useReactorsStore()

const transformStr = computed(
  () =>
    `translate(${tx.value} ${ty.value}) scale(${scale.value}) rotate(${rotation.value} 600 600)`
)
const svgRef = ref<SVGSVGElement | null>(null)
const svgWidth = 1200,
  svgHeight = 1200
const centerX = svgWidth / 2,
  centerY = svgHeight / 2,
  scalePx = 2
const searchValue = ref<string>('')

// Computed compass dimensions based on shape type
const compassSize = computed(() => {
  const shape = config.value.shape
  const outerDim = config.value.outerDimension || 100
  const width = config.value.width || outerDim
  const height = config.value.height || outerDim

  switch (shape) {
    case 'RECTANGLE': {
      // Use diagonal distance to ensure compass stays visible at all rotation angles
      const diagonal
        = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2) * scalePx
      return {
        horizontal: diagonal,
        vertical: diagonal
      }
    }
    case 'HEXAGONE':
      return {
        horizontal: outerDim * scalePx,
        vertical: outerDim * scalePx * 0.866 // hex height ratio
      }
    case 'DONUT':
    case 'CIRCLE':
    default:
      return {
        horizontal: outerDim * scalePx,
        vertical: outerDim * scalePx
      }
  }
})

// Cache DOM elements for fast access
const elById = new Map<string, SVGCircleElement>()
const selectedIds = ref<Set<string>>(new Set())
// Property options
const propertiesOptions = [
  { label: 'Catalyst Tc', value: 'CATALYST_TC', color: '#FF6B6B' },
  { label: 'Coolant', value: 'COOLANT', color: '#4ECDC4' },
  { label: 'Solid', value: 'SOLID', color: '#556270' },
  { label: 'Bend', value: 'BEND', color: '#C7F464' },
  { label: 'Salt Tc', value: 'SALT_TC', color: '#FFA500' },
  { label: 'Blocked', value: 'BLOCKED', color: '#1E90FF' }
]

/* ----------------------------
   UTIL: Find mirrored IDs
----------------------------- */
function getMirroredIds(id: string): string[] {
  if (!settingsInput.mirrorX) return []

  const match = id.match(/^R(\d+)C(\d+)$/)
  if (!match) return []
  const [, rStr, cStr] = match
  const row = Number(rStr)
  const col = Number(cStr)

  const rows = currentTubes.value
    .filter(t => !t.deleted)
    .map((t) => {
      const m = t?.id?.match(/^R(\d+)C/)
      return m ? Number(m[1]) : undefined
    })
    .filter((n): n is number => n !== undefined)

  const maxRow = rows.length ? Math.max(...rows) : row

  const mirrors = new Set<string>()

  // X mirror (top-bottom)
  if (settingsInput.mirrorX && row !== maxRow) {
    mirrors.add(`R${maxRow - (row - 1)}C${col}`) // e.g. R1 -> Rmax, R2 -> Rmax-1
  }

  // XY combined (diagonal mirror)

  return [...mirrors].filter(
    mid =>
      mid !== id && currentTubes.value.some(t => t.id === mid && !t.deleted)
  )
}

/* ----------------------------
   VISUAL UPDATE
----------------------------- */
function updateCircleVisual(
  t: Tube & { backColor?: string, _backendUpdatedBack?: boolean },
  newPropertyColor = ''
) {
  const c = elById.get(t.id)
  if (!c) return
  const isBackView = viewDisplay.value === 'Back View'
  const propertyColor = isBackView
    ? t.backColor
    || propertiesOptions.find(p => p.value === t.property)?.color
    || t.propertyColor
    : propertiesOptions.find(p => p.value === t.property)?.color
      || t.propertyColor
  const isSelected = selectedIds.value.has(t.id)
  const hasComment = !!t.comment

  c.setAttribute('cx', String(centerX + t.x * scalePx))
  c.setAttribute('cy', String(centerY + t.y * scalePx))
  c.setAttribute('r', String(t.r * scalePx))
  c.setAttribute('fill', newPropertyColor || propertyColor || '#fff')
  c.setAttribute(
    'stroke',
    hasComment ? '#facc15' : isSelected ? '#FF0000' : '#0f172a'
  )
  c.setAttribute('stroke-width', isSelected || hasComment ? '1.5' : '0.3')
  c.setAttribute('filter', isBackView ? 'invert(1)' : 'none')
}

/* ----------------------------
   SELECTION WITH MIRRORING
----------------------------- */
function addSelection(ids: string[]) {
  const set = new Set(selectedIds.value)
  ids.forEach(id => set.add(id))
  selectedIds.value = set
  ids.forEach(id =>
    updateCircleVisual(currentTubes.value.find(t => t.id === id)!)
  )
}

function removeSelection(ids: string[]) {
  ids.forEach(id => selectedIds.value.delete(id))
  ids.forEach(id =>
    updateCircleVisual(currentTubes.value.find(t => t.id === id)!)
  )
}

function selectWithMirrors(id: string, exclusive = false) {
  const mirrors = getMirroredIds(id)
  const all = [id, ...mirrors]

  if (exclusive) {
    const prev = [...selectedIds.value]
    selectedIds.value = new Set()
    prev.forEach(pid =>
      updateCircleVisual(currentTubes.value.find(t => t.id === pid)!)
    )
  }

  addSelection(all)
}

// function toggleSelect(id: string) {
//   if (selectedIds.value.has(id)) {
//     const mirrors = getMirroredIds(id)
//     removeSelection([id, ...mirrors])
//   } else {
//     selectWithMirrors(id)
//   }
// }

function selectOnly(id: string) {
  selectWithMirrors(id, true)
}

function deselect(id: string) {
  const mirrors = getMirroredIds(id)
  removeSelection([id, ...mirrors])
}

function deselectAll() {
  const prev = [...selectedIds.value]
  selectedIds.value.clear()
  prev.forEach(pid =>
    updateCircleVisual(currentTubes.value.find(t => t.id === pid)!)
  )
}

/* ----------------------------
   UI CLICK HANDLERS
----------------------------- */
function handleTubeClick(e: MouseEvent, id: string) {
  e.stopPropagation()
  if (selectedIds.value.has(id)) deselect(id)
  else selectOnly(id)
}

/* ----------------------------
   SEARCH SINGLE TUBE WITH ZOOM
----------------------------- */
function searchTubes() {
  if (!searchValue.value) return

  const tube = currentTubes.value.find(t => t.id === searchValue.value)
  if (!tube) return

  // Zoom to a reasonable level for viewing a single tube
  const zoomLevel = 3
  setZoom(zoomLevel)

  // Calculate position to center the tube
  // Tube position in SVG coordinates (when scale=1): centerX + tube.x * scalePx, centerY + tube.y * scalePx
  // After transform translate(tx, ty) scale(s), final position = tx + (centerX + tube.x * scalePx) * s
  // We want this to equal svgWidth/2, so: tx = svgWidth/2 - (centerX + tube.x * scalePx) * s
  const tx = svgWidth / 2 - (centerX + tube.x * scalePx) * zoomLevel
  const ty = svgHeight / 2 - (centerY + tube.y * scalePx) * zoomLevel

  setPan(tx, ty)

  // Select the tube
  selectOnly(searchValue.value)
}

/* ----------------------------
   COMMENT FUNCTIONALITY
----------------------------- */
async function submitComment() {
  if (!commentText.value.trim() || selectedIds.value.size === 0) return

  const surveyId = activeSurveyId.value
  if (!surveyId) {
    useToast().add({ title: 'No active survey', color: 'error' })
    return
  }

  addingComment.value = true
  try {
    // Add comment for each selected tube
    for (const tubeId of selectedIds.value) {
      await useAxios().$post(`/api/v2/survey/addComment/${surveyId}`, {
        tubeIdAsperLayout: tubeId,
        comment: commentText.value.trim()
      })
    }

    useToast().add({ title: 'Comment added successfully', color: 'success' })
    showCommentInput.value = false
    commentText.value = ''

    // Refresh data to show updated comments
    await fetchUpdatedTubeColors(surveyId)
  } catch (err) {
    console.error('Failed to add comment:', err)
    useToast().add({ title: 'Failed to add comment', color: 'error' })
  } finally {
    addingComment.value = false
  }
}

/* ----------------------------
   RENDERING
----------------------------- */
function renderAll() {
  const svg = svgRef.value
  if (!svg) return
  const vp = svg.querySelector('#viewport') as SVGGElement
  if (!vp) return

  const { boundary, tubes, labels } = ensureLayers(vp)
  boundary.innerHTML = ''
  Array.from(labels.children).forEach((child) => {
    if ((child as Element).id !== 'tooltip') child.remove()
  })

  drawBoundary(boundary, config.value, centerX, centerY, scalePx)

  const isBackView = viewDisplay.value === 'Back View'
  const activeTubes = currentTubes.value.filter(
    t => !t.deleted && (!isBackView || t._backendUpdatedBack)
  )
  const presentIds = new Set(activeTubes.map(t => t.id))

  // Remove stale circles
  for (const [id, el] of Array.from(elById.entries())) {
    if (!presentIds.has(id)) {
      el.remove()
      elById.delete(id)
    }
  }

  // Render or update existing circles
  for (const t of activeTubes) {
    let c = elById.get(t.id)
    if (!c) {
      c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      c.dataset.name = t.id
      c.addEventListener('click', e => handleTubeClick(e, t.id))
      // c.addEventListener('contextmenu', e => handleTubeContextMenu(e, t.id))
      elById.set(t.id, c)
      tubes.appendChild(c)
    }

    updateCircleVisual(t)
  }
}
let interval: ReturnType<typeof setInterval> | null = null
async function stratSurvey() {
  if (!selectedPhase.value) {
    useToast().add({ title: 'Please select a phase', color: 'error' })
    return
  }

  loading.value = true
  try {
    const data = await useSurveyStore().createSurvey({
      tubeSheetId: sheetId,
      surveyType: selectedPhase.value,
      reactorId: reactorId
    })
    // Call fetchUpdatedTubeColors immediately
    await fetchUpdatedTubeColors(data.id || (activeSurveyId.value as string))
    // Then set interval for 1 minute (60000ms)
    interval = setInterval(
      () => fetchUpdatedTubeColors(data.id || (activeSurveyId.value as string)),
      60000
    )
    if (data.Success) {
      useToast().add({ title: 'Survey Started', color: 'success' })
    }
  } catch {
    // useToast().add({ title: 'Survey Started', color: 'success' })
    loading.value = false
  }
}

function openStopModal() {
  stopModalOpen.value = true
}

async function stopSurvey() {
  try {
    await useSurveyStore().stopSurvey(activeSurveyId.value as string)
    loading.value = false
    if (interval) clearInterval(interval)
    stopModalOpen.value = false
    successMessage.value = 'Survey is ended'
    successModalOpen.value = true
  } catch {
    useToast().add({ title: 'Failed to stop survey', color: 'error' })
  }
}

function downloadReport() {
  // do nothing for now
}

function goHome() {
  navigateTo('/')
}

/* ----------------------------
   ZOOM HANDLERS
----------------------------- */
function zoomIn() {
  zoom(1.15)
}
function zoomOut() {
  zoom(1 / 1.15)
}
function panXY(dx: number, dy: number) {
  pan(dx, dy)
}
function handleWheel(event: WheelEvent) {
  // Slower zoom factor (1.03 instead of 1.1) for smoother control
  const factor = event.deltaY < 0 ? 1.03 : 1 / 1.03
  zoom(factor)
}
function resetView() {
  reset()
}

/* ----------------------------
   REACTOR SAVE & FETCH FUNCTIONALITY
----------------------------- */

// Load reactor data on mount
onMounted(async () => {
  loadViewportState()
  watch(
    () => [scale.value, tx.value, ty.value, rotation.value],
    persistViewportState,
    { deep: false }
  )

  // Fetch tubesheet details

  if (reactorId) {
    const reactor = await reactorsStore.getAReactor(reactorId)
    if (reactor) {
      if (reactor.config) {
        setConfig(reactor.config)

        // Load viewport positions from config if available
        if (reactor.config.positions) {
          const {
            scale: savedScale,
            tx: savedTx,
            ty: savedTy,
            rotation: savedRotation
          } = reactor.config.positions
          if (typeof savedScale === 'number') setZoom(savedScale)
          if (typeof savedTx === 'number' && typeof savedTy === 'number')
            setPan(savedTx, savedTy)
          if (typeof savedRotation === 'number') setRotation(savedRotation)
        }
      }

      if (reactor.tubes && reactor.tubes.length > 0) {
        currentTubes.value = [...reactor.tubes]
        renderAll()
      }
    }
  }

  if (sheetId) {
    try {
      const { data } = await useAxios().$get(
        `/api/v2/tubeSheet/getSpecificTubeSheet/${sheetId}`
      )
      tubeSheetDetails.value = data
    } catch (err) {
      console.error('Failed to fetch tubesheet details:', err)
    }
    const querySurveyId = useRoute().query.surveyId as string | undefined
    const resumedJourney = useRoute().query.resumedJourney
    if (querySurveyId) {
      activeSurveyId.value = querySurveyId
      if (resumedJourney) {
        loading.value = true
        await fetchUpdatedTubeColors(activeSurveyId.value)
        interval = setInterval(
          () => fetchUpdatedTubeColors(activeSurveyId.value as string),
          60000
        )
      } else {
        fetchUpdatedTubeColors(activeSurveyId.value)
        viewMode.value = true
      }
    }
  }
})

/* ----------------------------
   WATCH
----------------------------- */

watch(viewDisplay, () => {
  // Update all tube visuals when switching between front and back view
  currentTubes.value.forEach((tube) => {
    updateCircleVisual(tube)
  })
})

async function fetchUpdatedTubeColors(surveyId: string) {
  try {
    const idToUse = surveyId || activeSurveyId.value
    const {
      data,
      surveyType,
      createdAt,
      repeat,
      progress,
      updatedAt,
      comments
    } = idToUse
      ? await useSurveyStore().getSurveyUpdates(idToUse)
      : await useSurveyStore().getSurveyUpdates()
    repeatCount.value = repeat || 0

    // Update comments from API
    if (comments && Array.isArray(comments)) {
      tubeComments.value = comments
    }

    // Update progress data and timer
    if (progress && Array.isArray(progress)) {
      progressData.value = progress
    }
    if (updatedAt) {
      lastUpdatedAt.value = updatedAt
    }
    updateElapsedTime()

    currentSurvey.value
      = (allTypeOfPhasesItems.find(phase => phase.value === surveyType)
        ?.label as string) || ''
    currentSurveyTime.value = new Date(createdAt).toLocaleTimeString()
    lastSurveyTime.value = new Date(updatedAt).toLocaleTimeString()

    selectedPhase.value = surveyType || ''
    data.forEach(
      (element: { tubeId: string | number, color: string, face?: string }) => {
        const tube = currentTubes.value[element.tubeId as number]
        if (!tube) return
        if (element.face === 'back') {
          tube.backColor = element.color
          tube._backendUpdatedBack = true
        } else {
          tube.propertyColor = element.color
          tube._backendUpdated = true
        }
        updateCircleVisual(tube)
      }
    )

    const frontData = data?.filter((e: { face?: string }) => e.face !== 'back')
    const backData = data?.filter((e: { face?: string }) => e.face === 'back')

    tableData.value = frontData
      ?.filter((e: { isDuplicate: boolean }) => !e?.isDuplicate)
      .map(
        (item: {
          tubeIdAsperLayout: string
          activity: string
          timeStamp: string
          isDuplicate: boolean
          comment?: string
        }) => {
          return {
            tube: item.tubeIdAsperLayout,
            Activity: item.activity,
            time: new Date(item.timeStamp).toLocaleString(),
            Action: 'Locate',
            comment: item.comment
          }
        }
      )

    repeatTableData.value = frontData
      ?.filter((e: { isDuplicate: boolean }) => e?.isDuplicate)
      .map(
        (item: {
          tubeIdAsperLayout: string
          activity: string
          timeStamp: string
          isDuplicate: boolean
          comment?: string
        }) => {
          return {
            tube: item.tubeIdAsperLayout,
            Activity: item.activity,
            time: new Date(item.timeStamp).toLocaleString(),
            Action: 'Locate',
            comment: item.comment
          }
        }
      )

    backTableData.value = backData
      ?.filter((e: { isDuplicate: boolean }) => !e?.isDuplicate)
      .map(
        (item: {
          tubeIdAsperLayout: string
          activity: string
          timeStamp: string
          isDuplicate: boolean
          comment?: string
        }) => {
          return {
            tube: item.tubeIdAsperLayout,
            Activity: item.activity,
            time: new Date(item.timeStamp).toLocaleString(),
            Action: 'Locate',
            comment: item.comment
          }
        }
      )

    backRepeatTableData.value = backData
      ?.filter((e: { isDuplicate: boolean }) => e?.isDuplicate)
      .map(
        (item: {
          tubeIdAsperLayout: string
          activity: string
          timeStamp: string
          isDuplicate: boolean
          comment?: string
        }) => {
          return {
            tube: item.tubeIdAsperLayout,
            Activity: item.activity,
            time: new Date(item.timeStamp).toLocaleString(),
            Action: 'Locate',
            comment: item.comment
          }
        }
      )
  } catch (err) {
    console.error('Failed to fetch tube colors:', err)
  }
}

const backendUpdatedCount = computed(
  () =>
    currentTubes.value.filter(
      t =>
        t._backendUpdated
        && !propertiesOptions.some(p => p.value === t.property)
    ).length
)

const backBackendUpdatedCount = computed(
  () =>
    currentTubes.value.filter(
      t =>
        t._backendUpdatedBack
        && !propertiesOptions.some(p => p.value === t.property)
    ).length
)

// total tubes
const totalCount = computed(() => currentTubes.value.length)

// Property legend with counts
const propertyLegend = computed(() => {
  const counts: Record<string, number> = {}

  // Initialize counts for all properties
  propertiesOptions.forEach((prop) => {
    counts[prop.value] = 0
  })

  // Count tubes by property
  currentTubes.value.forEach((tube) => {
    if (tube.property && !tube.deleted) {
      counts[tube.property] = (counts[tube.property] || 0) + 1
    }
  })

  // Map to legend items with property details
  return propertiesOptions.map(prop => ({
    label: prop.label,
    value: prop.value,
    color: prop.color,
    count: counts[prop.value] || 0
  }))
})

const specialTubes = computed(() =>
  propertyLegend.value.reduce((sum, item) => sum + item.count, 0)
)
const effectiveTotal = computed(() => totalCount.value - specialTubes.value)
const completed = computed(() =>
  viewDisplay.value === 'Back View'
    ? backBackendUpdatedCount.value
    : backendUpdatedCount.value
)
const remaining = computed(() =>
  Math.max(0, effectiveTotal.value - completed.value)
)

const chartData = computed(() => ({
  labels: ['Completed', 'Remaining', 'Special Tubes'],
  datasets: [
    {
      data: [completed.value, remaining.value, specialTubes.value],
      backgroundColor: ['#4CAF50', '#FFC107', '#9C27B0'],
      borderWidth: 1
    }
  ]
}))

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'right' as const,
      align: 'start' as const,
      labels: { boxWidth: 10 }
    },
    tooltip: {
      callbacks: {
        label: function (context: TooltipItem<'pie'>) {
          const label = context.label || ''
          const value = context.parsed
          const total = context.dataset.data.reduce(
            (a: number, b: number) => a + b,
            0
          )
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
          return `${label}: ${value} (${percentage}%)`
        }
      }
    }
  }
}

// Progress Bar Chart Data
const progressChartData = computed(() => ({
  labels: progressData.value.map((p) => {
    const date = new Date(p.time)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }),
  datasets: [
    {
      label: 'Tubes Completed',
      data: progressData.value.map(p => p.tubes),
      backgroundColor: '#4CAF50',
      borderColor: '#388E3C',
      borderWidth: 1,
      borderRadius: 4
    }
  ]
}))

const progressChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: true,
      text: 'Hourly Efficiency',
      font: { size: 12 }
    }
  },
  scales: {
    x: {
      display: true,
      title: {
        display: false
      },
      ticks: {
        maxRotation: 45,
        font: { size: 9 }
      }
    },
    y: {
      display: true,
      beginAtZero: true,
      title: {
        display: true,
        text: 'Tubes',
        font: { size: 10 }
      },
      ticks: {
        font: { size: 9 }
      }
    }
  }
}

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>
