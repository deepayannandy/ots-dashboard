<template>
  <UDashboardPanel id="create-tubesheet" :ui="{ body: '!p-0' }">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #title>
          <div class="flex flex-col">
            <span class="font-semibold text-xl text-primary-500">
              {{ tubeSheetDetails?.equipmentId }}
              {{ currentSurvey ? `- ${currentSurvey}` : "" }}
            </span>
          </div>
        </template>
        <template #right>
          <div class="flex items-center gap-2">
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
          </div>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <div class="flex items-center gap-2">
            <UButton
              color="neutral"
              variant="subtle"
              label="Info"
              @click="showDetails = !showDetails"
            />
            <div @keydown.stop.prevent>
              <URadioGroup
                v-model="viewDisplay"
                indicator="hidden"
                variant="card"
                size="xs"
                orientation="horizontal"
                default-value=""
                :items="items"
              />
            </div>
            <ZoomControls
              hide-rotation
              @zoom-in="zoomIn"
              @zoom-out="zoomOut"
              @pan="panXY"
              @reset="resetView"
              @fit-to-screen="fitToScreenHandler"
            />
            <UButton
              color="neutral"
              variant="subtle"
              :label="dualView ? 'Both Views: On' : 'Both Views'"
              size="sm"
              @click="toggleDualView"
            />
          </div>
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Phases:</span>
            <USelectMenu
              v-model="selectedPhase"
              placeholder="Select Phase"
              :items="typeOfPhasesItems"
              value-key="value"
              class="min-w-44"
              :disabled="loading"
            />
            <UButton
              v-if="!viewMode"
              :label="loading ? 'Complete Phase' : 'Start Survey'"
              color="primary"
              class="ml-2"
              :disabled="!selectedPhase"
              :icon="loading ? 'i-lucide-circle-check' : 'i-lucide-play'"
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
          </div>
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

          <div
            ref="containerRef"
            class="h-full p-10 w-full flex justify-center items-center"
          >
            <!-- SVG Canvas -->
            <div v-if="!dualView" class="w-full h-full">
              <svg
                ref="svgRef"
                :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid meet"
                :style="{
                  width: '100%',
                  height: '100%',
                  ...(viewDisplay === 'Back View'
                    ? {
                        transform: 'scale(-1,1)',
                        transformOrigin: 'center',
                        transformBox: 'fill-box',
                      }
                    : {}),
                }"
                @wheel.prevent="handleWheel"
              >
                <g id="viewport" :transform="transformStr"></g>
              </svg>
            </div>
            <div v-else class="w-full h-full flex gap-2">
              <svg
                ref="svgFrontRef"
                :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid meet"
                style="width: 50%; height: 100%"
                @wheel.prevent="handleWheel"
              >
                <g id="viewport" :transform="transformStr"></g>
              </svg>
              <svg
                ref="svgBackRef"
                :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid meet"
                style="
                  width: 50%;
                  height: 100%;
                  transform: scale(-1, 1);
                  transform-origin: center;
                "
                @wheel.prevent="handleWheel"
              >
                <g id="viewport" :transform="transformStr"></g>
              </svg>
            </div>
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
              <p>
                <span class="font-medium">Cameras:</span>
                {{ tubeSheetDetails.numberOfCameras || 0 }}
              </p>
              <div
                v-if="getPhaseLabels(tubeSheetDetails.typeOfPhases).length > 0"
              >
                <p class="font-medium mb-1">Phases:</p>
                <ul class="list-disc list-inside space-y-0.5 ml-2">
                  <li
                    v-for="(phase, idx) in getPhaseLabels(
                      tubeSheetDetails.typeOfPhases,
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
                      tubeSheetDetails.status === 'UNDER_SURVEY',
                  }"
                >
                  {{ tubeSheetStatusLabels[tubeSheetDetails.status as keyof typeof tubeSheetStatusLabels] || "N/A" }}
                </span>
              </p>
            </div>
          </UPageCard>

          <div class="w-20 h-20 top-0 absolute right-0 m-4">
            <svg viewBox="0 0 64 64" class="w-full h-full">
              <!-- Rotating compass needle group -->
              <g
                :style="{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: 'center',
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
              <span class="text-lg font-bold text-red-600 dark:text-red-500"
                >{{ rotation }}°</span
              >
            </div>
          </div>
        </UPageBody>
        <template v-if="isRightOpen && !dualView" #right>
          <div
            ref="rightPanelRef"
            class="w-full max-h-[calc(100dvh-var(--ui-header-height)-49px)] overflow-y-auto p-4 space-y-4 relative"
            :class="{
              'opacity-30 pointer-events-none bg-gray-200 dark:bg-gray-700':
                !loading && !viewMode,
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
              :ui="{
                root: 'overflow-hidden shadow-md',
                container: 'sm:p-0 gap-2!',
                header: 'w-full p-3 bg-primary',
              }"
            >
              <template #header>
                <div
                  class="bg-primary w-full flex items-center justify-between"
                >
                  Survey Progress
                  <div
                    class="text-sm w-[120px] text-left text-neutral-700 dark:text-neutral-200"
                  >
                    Next Update: {{ timeLeft }}s
                  </div>
                </div>
              </template>
              <div class="grid grid-cols-2 p-2">
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
                      <br />
                      {{ repeatCount }}
                    </div>
                  </div>
                  <div
                    class="flex justify-center text-center text-sm text-neutral-700 dark:text-neutral-200"
                  >
                    <div>
                      Start Time
                      <br />
                      {{ surveyStartTime }}
                    </div>
                  </div>
                  <div
                    class="flex justify-center text-center text-sm text-neutral-700 dark:text-neutral-200"
                  >
                    <div>
                      {{ surveyEndTimeStamp ? "Survey End" : "Last Updated" }}
                      <br />
                      {{ surveyEndTimeStamp ? surveyEndTime : lastUpdateTime }}
                    </div>
                  </div>
                </div>
              </div>
            </UPageCard>

            <!-- Progress Line Chart Card -->

            <UPageCard
              v-if="progressData.length > 0"
              spotlight
              spotlight-color="success"
              class="h-fit col-span-2"
              :ui="{
                root: 'overflow-hidden shadow-md',
                container: 'sm:p-0 gap-2!',
                header: 'w-full p-3 bg-primary mb-0',
              }"
            >
              <template #header>
                <div
                  class="bg-primary w-full flex items-center justify-between"
                >
                  <span>Total Survey Time</span>
                  <span
                    class="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono"
                    >{{ totalSurveyTime }}</span
                  >
                </div>
              </template>
              <div class="h-40">
                <Bar
                  :data="progressChartData"
                  :options="progressChartOptions"
                />
              </div>
            </UPageCard>
            <UPageCard
              v-if="selectedIds.size"
              spotlight
              spotlight-color="secondary"
              class="h-fit p-0"
              :title="`Tube History: ${[...selectedIds].join(', ')}`"
              :ui="{ container: 'sm:p-2 gap-y-2' }"
            >
              <template v-if="selectedPhase === 'CATALYST_OUTAGE_TRACKING'">
                <div
                  class="grid grid-cols-1 gap-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-b-lg"
                >
                  <div
                    class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-neutral-800 dark:text-neutral-200"
                  >
                    <div
                      class="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 shadow-sm"
                    >
                      <div
                        class="text-xs uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400"
                      >
                        Start Time
                      </div>
                      <div class="mt-2 font-semibold text-sm">
                        {{ catalystOutageStartTime }}
                      </div>
                    </div>
                    <div
                      class="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 shadow-sm"
                    >
                      <div
                        class="text-xs uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400"
                      >
                        Drop Time
                      </div>
                      <div class="mt-2 font-semibold text-sm">
                        {{ catalystOutageDropTime }}
                      </div>
                    </div>
                    <div
                      class="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 shadow-sm"
                    >
                      <div
                        class="text-xs uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400"
                      >
                        Max Pressure
                      </div>
                      <div class="mt-2 font-semibold text-sm">
                        {{ catalystOutageMaxPressure }}
                      </div>
                    </div>
                  </div>

                  <div
                    class="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 shadow-sm"
                  >
                    <div
                      class="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200"
                    >
                      Pressure Trend
                    </div>
                    <div class="h-48">
                      <Line
                        :data="catalystOutageChartData"
                        :options="catalystOutageChartOptions"
                      />
                    </div>
                  </div>
                </div>
              </template>

              <template v-else>
                <div v-for="id in [...selectedIds]" :key="id">
                  <div v-if="getTubeHistoryRows(id).length" class="space-y-2">
                    <div
                      v-for="(row, index) in getTubeHistoryRows(id)"
                      :key="`${id}-${row.face}-${row.time}-${index}`"
                      class="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 shadow-sm text-sm text-neutral-700 dark:text-neutral-200"
                    >
                      <div class="font-semibold">
                        Activity: {{ row.Activity }}
                      </div>
                      <div class="mt-1 flex items-center justify-between gap-3">
                        <span>Time: {{ row.time }}</span>
                        <UButton
                          v-if="row.evidenceImage"
                          size="xs"
                          color="primary"
                          variant="subtle"
                          icon="i-lucide-image"
                          @click="openImageModal(row)"
                        >
                          Show Evidence
                        </UButton>
                      </div>
                    </div>
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
              </template>
            </UPageCard>
            <!-- Color Cap Tracking Grid - Only visible for COLOR_CAP_TRACKING phase -->
            <UPageCard
              v-if="
                selectedPhase === 'COLOR_CAP_TRACKING' &&
                colorCapLegend.length > 0
              "
              spotlight
              spotlight-color="info"
              class="p-0 w-full"
              :ui="{
                root: 'overflow-hidden shadow-md',
                container: 'sm:p-0 gap-0! h-full',
                header: 'w-full p-3 bg-primary mb-0',
              }"
            >
              <template #header>
                <div class="bg-primary w-full">Color Cap Tracking</div>
              </template>
              <div class="grid grid-cols-5 p-0 h-full">
                <div
                  v-for="item in colorCapLegend"
                  :key="item.key"
                  class="flex flex-col items-center justify-between p-1 border border-gray-300 transition-colors"
                >
                  <div class="flex items-center gap-1">
                    <div
                      class="size-3 rounded border border-neutral-300 dark:border-neutral-600"
                      :style="{ backgroundColor: item.color }"
                    />
                    <span
                      class="text-[10px] font-medium text-neutral-700 dark:text-neutral-200 text-center"
                    >
                      {{ item.abbreviation }}
                    </span>
                  </div>
                  <span
                    class="text-[12px] font-bold text-neutral-900 dark:text-neutral-100 dark:bg-neutral-800 mt-2"
                  >
                    {{ item.count }}
                  </span>
                </div>
              </div>
            </UPageCard>
            <UPageCard
              spotlight
              spotlight-color="secondary"
              class="p-0 w-full"
              :ui="{
                root: 'overflow-hidden shadow-md',
                container: 'sm:p-0 gap-0! h-full',
                header: 'w-full p-3 bg-primary mb-0',
              }"
            >
              <template #header>
                <div class="bg-primary w-full">Special Tubes</div>
              </template>
              <div class="grid grid-cols-6 p-0 h-full">
                <div
                  v-for="item in propertyLegend"
                  :key="item.value"
                  class="flex flex-col items-center justify-between p-1 border border-gray-300 transition-colors"
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
                    class="text-[12px] font-bold text-neutral-900 dark:text-neutral-100 dark:bg-neutral-800 mt-3"
                  >
                    {{ item.count }}
                  </span>
                </div>
              </div>
            </UPageCard>

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
                :ui="{
                  root: 'overflow-hidden shadow-md',
                  container: 'sm:p-0 gap-0! h-full',
                  header: 'w-full p-3 bg-primary mb-0',
                }"
              >
                <template #header>
                  <div class="bg-primary w-full">
                    <div
                      class="text-sm font-medium text-neutral-700 dark:text-neutral-200"
                    >
                      Add comment for tube: {{ [...selectedIds].join(", ") }}
                    </div>
                  </div>
                </template>
                <div class="p-4">
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
                    v-if="item.label === 'Error logs'"
                    :data="displayedErrorLogs"
                    :columns="errorLogColumns"
                    class="flex-1 max-h-[312px]"
                    :rows="10"
                    sticky="header"
                  >
                    <template #activity-cell="{ row }">
                      <span
                        class="block max-w-[200px] whitespace-normal break-words text-xs"
                      >
                        {{ row.original?.activity }}
                      </span>
                    </template>
                    <template #action-cell="{ row }">
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
                  <UTable
                    v-else
                    :data="
                      item.label === 'Progress'
                        ? viewDisplay === 'Back View'
                          ? backTableData
                          : tableData
                        : viewDisplay === 'Back View'
                          ? backRepeatTableData
                          : repeatTableData
                    "
                    :columns="progressRepeatColumns"
                    class="flex-1 max-h-[312px]"
                    :rows="10"
                    sticky="header"
                  >
                    <template #Activity-cell="{ row }">
                      <span
                        class="block max-w-[120px] whitespace-normal break-words text-xs"
                      >
                        {{ row.original?.Activity }}
                      </span>
                    </template>
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
          </div>
        </template>
      </UPage>
    </template>
  </UDashboardPanel>

  <UModal
    v-model:open="stopModalOpen"
    title="Complete Phase"
    description="Are you sure you want to complete the phase?"
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

  <UModal
    v-model:open="successModalOpen"
    :title="successMessage"
  >
    <template #body>
      <div class="space-y-4">
        <p>The phase has been completed successfully.</p>
        <template v-if="typeOfPhasesItems.length">
          <div class="space-y-2">
            <span
              class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Start next phase
            </span>
            <USelectMenu
              v-model="nextPhaseSelected"
              placeholder="Select phase"
              :items="typeOfPhasesItems"
              value-key="value"
              class="w-full"
            />
          </div>
        </template>
        <p v-else class="text-sm text-neutral-500 dark:text-neutral-400">
          All phases for this tube sheet have been completed.
        </p>
      </div>
    </template>
    <template #footer>
      <div
        class="w-full flex flex-wrap justify-end items-center gap-3 sm:gap-4"
      >
        <UButton
          label="Download Report"
          color="neutral"
          variant="outline"
          @click="downloadReport"
        />
        <UButton
          v-if="typeOfPhasesItems.length"
          label="Start next phase"
          color="neutral"
          variant="outline"
          :disabled="!nextPhaseSelected"
          @click="startNextPhaseFromModal"
        />
        <UButton label="Go back to home" color="primary" @click="goHome" />
      </div>
    </template>
  </UModal>

  <UModal v-model:open="imageModalOpen" title="Evidence Image" size="3xl">
    <template #body>
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Tube: <span class="font-medium">{{ currentTubeId }}</span>
          </p>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Log Time: <span class="font-medium">{{ currentLogTime }}</span>
          </p>
        </div>
        <div class="flex justify-center">
          <img
            :src="currentImageUrl"
            alt="Evidence Image"
            class="max-w-full max-h-96 object-contain"
          />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="w-full flex justify-end gap-2">
        <UButton
          label="Download Image"
          color="primary"
          variant="outline"
          @click="downloadImage"
        />
        <UButton
          label="Close"
          color="neutral"
          variant="outline"
          @click="imageModalOpen = false"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from "vue";
import type { Tube } from "@/types";
import { useReactorsStore } from "@/stores/reactors";
import { useSurveyStore } from "@/stores/survey";
import {
  tubeSheetTypeItems,
  typeOfPhases as allTypeOfPhasesItems,
  tubeSheetStatusLabels,
} from "@/utils/tubesheetOptions";
import { UFieldGroup } from "#components";
import { Pie, Bar, Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
} from "chart.js";
import type { TooltipItem } from "chart.js";
import { SURVEY_POLLING_INTERVAL } from "@/types/constants";
import type { TableColumn } from "@nuxt/ui";
import { appendLucideIconToSvgGroup } from "@/utils/lucideSvgInline";

type TubeDataTable = {
  tube: string;
  Activity: string;
  time: string;
  timeStamp: string;
  face: string;
  evidenceImage?: string;
  comment?: string;
};
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
);

const loading = ref(false);
const isRightOpen = ref(true);
const stopModalOpen = ref(false);
const successModalOpen = ref(false);
const successMessage = ref("");
const imageModalOpen = ref(false);
const currentImageUrl = ref("");
const currentLogTime = ref("");
const currentTubeId = ref("");
/** Phase values already completed for this visit (toolbar + success modal exclude these). */
const completedPhasesList = ref<string[]>([]);
const nextPhaseSelected = ref<string>("");
const route = useRoute();
const { setConfig } = useReactorGenerator();

// Countdown timer for next API call
const timeLeft = ref(SURVEY_POLLING_INTERVAL / 1000);
let countdownInterval: ReturnType<typeof setInterval> | null = null;

const reactorId = useRoute().params?.reactorId as string;
const sheetId = useRoute().params?.sheetId as string;
const tableData = ref<TubeDataTable[]>([]);
const repeatTableData = ref<TubeDataTable[]>([]);
const backTableData = ref<TubeDataTable[]>([]);
const backRepeatTableData = ref<TubeDataTable[]>([]);

function getTubeHistoryRows(id: string) {
  const data = dualView.value
    ? [
        ...tableData.value,
        ...repeatTableData.value,
        ...backTableData.value,
        ...backRepeatTableData.value,
      ]
    : viewDisplay.value === "Back View"
      ? [...backTableData.value, ...backRepeatTableData.value]
      : [...tableData.value, ...repeatTableData.value];
  return data
    .filter((row) => row.tube === id)
    .sort(
      (a, b) =>
        new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime(),
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tubeSheetDetails = ref<any>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const phasesData = ref<any[]>([]);
const selectedPhase = ref<string>("");
const currentSurvey = ref("");

const showDetails = ref(false);
const items = ref(["Front View", "Back View"]);
const viewDisplay = ref("Front View");
const repeatCount = ref(0);
const viewMode = ref(false);
const activeSurveyId = ref<string | undefined>(undefined);

// Progress data from API and timer
const progressData = ref<{ time: string; tubes: number; isDay?: boolean }[]>(
  [],
);
const surveyCreatedAt = ref<string | null>(null);
const surveyEndTimeStamp = ref<string | null>(null);
const apiCallTime = ref<Date | null>(null);
const totalSurveyTime = ref("0 min");

// Computed for display times
const surveyStartTime = computed(() => {
  if (surveyCreatedAt.value) {
    return new Date(surveyCreatedAt.value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
  return "N/A";
});

const surveyEndTime = computed(() => {
  if (surveyEndTimeStamp.value) {
    return new Date(surveyEndTimeStamp.value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
  return "N/A";
});

const lastUpdateTime = computed(() => {
  if (apiCallTime.value) {
    return apiCallTime.value.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
  return "N/A";
});

// Comment functionality
const showCommentInput = ref(false);
const commentText = ref("");
const addingComment = ref(false);
const tubeComments = ref<
  {
    tubeIdAsperLayout: string;
    comment: string;
    timeStamp: string;
    _id: string;
  }[]
>([]);

// Track repeat counts per tube and last detected tube
const tubeRepeatCounts = ref<Map<string, number>>(new Map());
const lastDetectedTubeId = ref<string>("");
const lastDetectedFace = ref<string>("front");
// Cache for icon overlay elements
const iconElById = new Map<string, SVGGElement>();

// Update total survey time when API is called
function updateTotalSurveyTime() {
  if (!surveyCreatedAt.value) {
    totalSurveyTime.value = "0 min";
    return;
  }

  const startTime = new Date(surveyCreatedAt.value).getTime();
  let endTime: number;

  if (surveyEndTimeStamp.value) {
    // Survey has ended - use end timestamp
    endTime = new Date(surveyEndTimeStamp.value).getTime();
  } else {
    // Survey still running - use API call time
    endTime = apiCallTime.value ? apiCallTime.value.getTime() : Date.now();
  }

  const diffMs = endTime - startTime;
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours > 0) {
    totalSurveyTime.value = `${hours}h ${mins}m`;
  } else {
    totalSurveyTime.value = `${mins} min`;
  }
}

const tabs = [
  {
    label: "Progress",
    icon: "i-lucide-activity",
  },
  {
    label: "Repeat",
    icon: "i-lucide-refresh-ccw",
  },
  {
    label: "Error logs",
    icon: "i-lucide-alert-triangle",
  },
];

type SurveyErrorLogApi = {
  tubeId: number;
  tubeIdAsperLayout: string;
  activity: string;
  color: string;
  timeStamp: string;
  isDetected?: boolean;
  face?: string;
};

type ErrorLogTableRow = {
  tube: string;
  activity: string;
  time: string;
  face: string;
  color: string;
};

const errorLogsRows = ref<ErrorLogTableRow[]>([]);

const displayedErrorLogs = computed(() => {
  const rows = errorLogsRows.value;
  if (viewDisplay.value === "Back View") {
    return rows.filter((r) => r.face === "back");
  }
  return rows.filter((r) => r.face !== "back");
});

const errorLogColumns: TableColumn<ErrorLogTableRow>[] = [
  { accessorKey: "tube", header: "Tube" },
  { accessorKey: "activity", header: "Activity" },
  { accessorKey: "time", header: "Time" },
  { accessorKey: "face", header: "Face" },
  { accessorKey: "color", header: "Color" },
  { id: "action", header: "Action" },
];

const progressRepeatColumns: TableColumn<TubeDataTable>[] = [
  { accessorKey: "tube", header: "Tube" },
  { accessorKey: "Activity", header: "Activity" },
  { accessorKey: "time", header: "Time" },
  { accessorKey: "face", header: "Face" },
  { id: "Action", header: "Action" },
];

const pageUi = computed(() => ({
  root: "gap-0!",
  right:
    isRightOpen.value && !dualView.value
      ? "lg:col-span-4 order-first lg:order-last"
      : "",
  center:
    isRightOpen.value && !dualView.value ? "lg:col-span-6" : "lg:col-span-10",
}));

const bodyClass = computed(() => {
  const base = "relative select-none !p-0 !mt-0 h-full w-full ";
  const gridLight =
    "bg-[linear-gradient(to_right,#e5e7eb_.5px,transparent_.5px),linear-gradient(to_bottom,#e5e7eb_.5px,transparent_.5px)] bg-[size:20px_20px]";
  const gridDark =
    "dark:bg-[linear-gradient(to_right,#2d2d2d_.5px,transparent_.5px),linear-gradient(to_bottom,#2d2d2d_.5px,transparent_.5px)] dark:bg-[size:20px_20px]";
  const bgLight = "bg-white";
  const bgDark = "dark:bg-neutral-950";

  if (dualView.value) {
    return `${base} ${gridLight} ${gridDark} ${bgLight} ${bgDark}`;
  }
  if (viewDisplay.value === "Back View") {
    // For back view, use a reddish grid to differentiate
    const gridLightBack =
      "bg-[linear-gradient(to_right,#ffcccc_.5px,transparent_.5px),linear-gradient(to_bottom,#ffcccc_.5px,transparent_.5px)] bg-[size:20px_20px]";
    const gridDarkBack =
      "dark:bg-[linear-gradient(to_right,#4d0000_.5px,transparent_.5px),linear-gradient(to_bottom,#4d0000_.5px,transparent_.5px)] dark:bg-[size:20px_20px]";
    return `${base} ${gridLightBack} ${gridDarkBack} ${bgLight} ${bgDark}`;
  } else {
    return `${base} ${gridLight} ${gridDark} ${bgLight} ${bgDark}`;
  }
});
function addCompletedPhase(phaseValue: string) {
  if (!phaseValue) return;
  if (!completedPhasesList.value.includes(phaseValue)) {
    completedPhasesList.value = [...completedPhasesList.value, phaseValue];
  }
}

/** Optional: same shape as dashboard `phaseData` rows when API includes them on the tube sheet. */
function mergeCompletedPhasesFromTubeSheetPayload(
  data: Record<string, unknown> | null | undefined,
) {
  if (!data) return;
  const rows = data.phaseData;
  if (!Array.isArray(rows)) return;
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const name = r.phaseName as string | undefined;
    if (!name) continue;
    const status = String(r.phaseStatus ?? "").toUpperCase();
    const nested =
      r.phaseData && typeof r.phaseData === "object"
        ? (r.phaseData as Record<string, unknown>)
        : null;
    const phaseEnd = r.phaseEndTimeStamp ?? nested?.endTimeStamp;
    const completed =
      status === "COMPLETED" ||
      status === "DONE" ||
      (phaseEnd != null && String(phaseEnd) !== "");
    if (completed) addCompletedPhase(name);
  }
}

async function refreshTubeSheetDetails() {
  if (!sheetId) return;
  try {
    const response = await useAxios().$get(
      `/api/v2/tubeSheet/getSpecificTubeSheet/${sheetId}`,
    );
    tubeSheetDetails.value = response.data;
    phasesData.value = response.phasesData || [];
    mergeCompletedPhasesFromTubeSheetPayload(
      response.data as Record<string, unknown>,
    );
  } catch (err) {
    console.error("Failed to fetch tubesheet details:", err);
  }
}

// Phases from tubesheet details, excluding completed phases
const typeOfPhasesItems = computed(() => {
  if (
    !tubeSheetDetails.value?.typeOfPhases ||
    tubeSheetDetails.value.typeOfPhases.length === 0
  ) {
    return [];
  }
  return tubeSheetDetails.value.typeOfPhases
    .map((phaseValue: string) => {
      const item = allTypeOfPhasesItems.find((p) => p.value === phaseValue);
      return item || { label: phaseValue, value: phaseValue };
    })
    .filter(
      (item: { label: string; value: string }) =>
        !completedPhasesList.value.includes(item.value),
    );
});

watch(successModalOpen, (open) => {
  if (open) {
    const items = typeOfPhasesItems.value;
    nextPhaseSelected.value = items[0]?.value ?? "";
  }
});

const getEquipmentTypeLabel = (value: string) => {
  const item = tubeSheetTypeItems.find((t) => t.value === value);
  return item ? item.label : value;
};

const getPhaseLabels = (phases: string[]) => {
  if (!phases || phases.length === 0) return [];
  return phases.map((phase) => {
    const item = allTypeOfPhasesItems.find((p) => p.value === phase);
    return item ? item.label : phase;
  });
};

const settingsInput = reactive({
  mirrorX: false,
});

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

const { config, tubes: currentTubes } = useReactorGenerator();
const {
  scale,
  tx,
  ty,
  rotation,
  zoom,
  pan,
  resetWithoutRotation,
  fitToScreen,
  setZoom,
  setPan,
  setRotation,
} = useViewportTransform();

// Store initial viewport state from API for reset functionality
const initialViewportState = ref<{
  scale: number;
  tx: number;
  ty: number;
  rotation: number;
} | null>(null);

const viewportStorageKey = reactorId
  ? `viewport:${reactorId}`
  : "viewport:default";

function loadViewportState() {
  if (typeof localStorage === "undefined") return;
  const raw = localStorage.getItem(viewportStorageKey);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as {
      scale?: number;
      tx?: number;
      ty?: number;
      rotation?: number;
    };
    if (typeof parsed.scale === "number") setZoom(parsed.scale);
    if (typeof parsed.tx === "number" && typeof parsed.ty === "number")
      setPan(parsed.tx, parsed.ty);
    if (typeof parsed.rotation === "number") setRotation(parsed.rotation);
  } catch (err) {
    console.error("Failed to load viewport state", err);
  }
}

function persistViewportState() {
  if (typeof localStorage === "undefined") return;
  const payload = {
    scale: scale.value,
    tx: tx.value,
    ty: ty.value,
    rotation: rotation.value,
  };
  localStorage.setItem(viewportStorageKey, JSON.stringify(payload));
}

// Initialize stores
const reactorsStore = useReactorsStore();

const transformStr = computed(
  () =>
    `translate(${tx.value} ${ty.value}) scale(${scale.value}) rotate(${rotation.value} 600 600)`,
);
const svgRef = ref<SVGSVGElement | null>(null);
const svgFrontRef = ref<SVGSVGElement | null>(null);
const svgBackRef = ref<SVGSVGElement | null>(null);
const dualView = ref(false);
const svgWidth = 1200,
  svgHeight = 1200;
const centerX = svgWidth / 2,
  centerY = svgHeight / 2,
  scalePx = 2;
const searchValue = ref<string>("");

// Computed compass dimensions based on shape type
const compassSize = computed(() => {
  const shape = config.value.shape;
  const outerDim = config.value.outerDimension || 100;
  const width = config.value.width || outerDim;
  const height = config.value.height || outerDim;

  switch (shape) {
    case "RECTANGLE": {
      // Use diagonal distance to ensure compass stays visible at all rotation angles
      const diagonal =
        Math.sqrt((width / 2) ** 2 + (height / 2) ** 2) * scalePx;
      return {
        horizontal: diagonal,
        vertical: diagonal,
      };
    }
    case "HEXAGONE":
      return {
        horizontal: outerDim * scalePx,
        vertical: outerDim * scalePx * 0.866, // hex height ratio
      };
    case "DONUT":
    case "CIRCLE":
    default:
      return {
        horizontal: outerDim * scalePx,
        vertical: outerDim * scalePx,
      };
  }
});

// Cache DOM elements for fast access
const elById = new Map<string, SVGCircleElement>();
const elMaps = {
  front: new Map<string, SVGCircleElement>(),
  back: new Map<string, SVGCircleElement>(),
};
const iconMaps = {
  front: new Map<string, SVGGElement>(),
  back: new Map<string, SVGGElement>(),
};
const selectedIds = ref<Set<string>>(new Set());
// Property options
const propertiesOptions = [
  { label: "Catalyst Tc", value: "CATALYST_TC", color: "#FF6B6B" },
  { label: "Coolant", value: "COOLANT", color: "#4ECDC4" },
  { label: "Solid", value: "SOLID", color: "#556270" },
  { label: "Bend", value: "BEND", color: "#C7F464" },
  { label: "Salt Tc", value: "SALT_TC", color: "#FFA500" },
  { label: "Blocked", value: "BLOCKED", color: "#1E90FF" },
];

/* ----------------------------
   UTIL: Find mirrored IDs
----------------------------- */
function getMirroredIds(id: string): string[] {
  if (!settingsInput.mirrorX) return [];

  const match = id.match(/^R(\d+)C(\d+)$/);
  if (!match) return [];
  const [, rStr, cStr] = match;
  const row = Number(rStr);
  const col = Number(cStr);

  const rows = currentTubes.value
    .filter((t) => !t.deleted)
    .map((t) => {
      const m = t?.id?.match(/^R(\d+)C/);
      return m ? Number(m[1]) : undefined;
    })
    .filter((n): n is number => n !== undefined);

  const maxRow = rows.length ? Math.max(...rows) : row;

  const mirrors = new Set<string>();

  // X mirror (top-bottom)
  if (settingsInput.mirrorX && row !== maxRow) {
    mirrors.add(`R${maxRow - (row - 1)}C${col}`); // e.g. R1 -> Rmax, R2 -> Rmax-1
  }

  // XY combined (diagonal mirror)

  return [...mirrors].filter(
    (mid) =>
      mid !== id && currentTubes.value.some((t) => t.id === mid && !t.deleted),
  );
}

/* ----------------------------
   VISUAL UPDATE
----------------------------- */
function updateCircleVisual(
  t: Tube & { backColor?: string; _backendUpdatedBack?: boolean },
  newPropertyColor = "",
) {
  if (dualView.value) {
    updateCircleVisualForSvg(
      t,
      svgFrontRef.value,
      elMaps.front,
      iconMaps.front,
      false,
      newPropertyColor,
    );
    updateCircleVisualForSvg(
      t,
      svgBackRef.value,
      elMaps.back,
      iconMaps.back,
      true,
      newPropertyColor,
    );
    return;
  }
  const isBackView = viewDisplay.value === "Back View";
  updateCircleVisualForSvg(
    t,
    svgRef.value,
    elById,
    iconElById,
    isBackView,
    newPropertyColor,
  );
}

function updateCircleVisualForSvg(
  t: Tube & { backColor?: string; _backendUpdatedBack?: boolean },
  svg: SVGSVGElement | null,
  elMap: Map<string, SVGCircleElement>,
  iconMap: Map<string, SVGGElement>,
  isBackView: boolean,
  newPropertyColor = "",
) {
  if (!svg) return;
  const c = elMap.get(t.id);
  if (!c) return;
  const specialPropertyColor = propertiesOptions.find(
    (p) => p.value === t.property,
  )?.color;
  const surveyColor = isBackView ? t.backColor : t.propertyColor;
  let fillColor = newPropertyColor || surveyColor || "#fff";

  if (t.property && !surveyColor && !newPropertyColor && specialPropertyColor) {
    fillColor = specialPropertyColor;
  }

  const isSelected = selectedIds.value.has(t.id);
  const cx = centerX + t.x * scalePx;
  const cy = centerY + t.y * scalePx;
  const r = t.r * scalePx;

  c.setAttribute("cx", String(cx));
  c.setAttribute("cy", String(cy));
  c.setAttribute("r", String(r));
  c.setAttribute("fill", fillColor);
  c.setAttribute("stroke", isSelected ? "#FF0000" : "#0f172a");
  c.setAttribute("stroke-width", isSelected ? "1.5" : "0.3");
  c.setAttribute(
    "filter",
    isBackView && t.backColor ? "url(#invert-filter)" : "none",
  );

  updateTubeIconsForSvg(t, svg, iconMap, isBackView, cx, cy, r);
}

function ensureInvertFilter(svg: SVGSVGElement) {
  let defs = svg.querySelector("defs") as SVGDefsElement | null;
  if (!defs) {
    defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    svg.insertBefore(defs, svg.firstChild);
  }
  if (!defs.querySelector("#invert-filter")) {
    const filter = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "filter",
    );
    filter.setAttribute("id", "invert-filter");
    const feColorMatrix = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feColorMatrix",
    );
    feColorMatrix.setAttribute("type", "matrix");
    feColorMatrix.setAttribute(
      "values",
      "-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0",
    );
    filter.appendChild(feColorMatrix);
    defs.appendChild(filter);
  }
}

function updateTubeIcons(
  t: Tube & { backColor?: string; _backendUpdatedBack?: boolean },
  cx: number,
  cy: number,
  r: number,
) {
  if (dualView.value) {
    updateTubeIconsForSvg(
      t,
      svgFrontRef.value,
      iconMaps.front,
      false,
      cx,
      cy,
      r,
    );
    updateTubeIconsForSvg(t, svgBackRef.value, iconMaps.back, true, cx, cy, r);
    return;
  }
  updateTubeIconsForSvg(
    t,
    svgRef.value,
    iconElById,
    viewDisplay.value === "Back View",
    cx,
    cy,
    r,
  );
}

function updateTubeIconsForSvg(
  t: Tube & { backColor?: string; _backendUpdatedBack?: boolean },
  svg: SVGSVGElement | null,
  iconMap: Map<string, SVGGElement>,
  isBackView: boolean,
  cx: number,
  cy: number,
  r: number,
) {
  if (!svg) return;
  let iconGroup = iconMap.get(t.id);
  const hasComment = !!(
    t.comment ||
    tubeComments.value.find((c) => c.tubeIdAsperLayout === t.id)?.comment
  );
  const repeatCount = tubeRepeatCounts.value.get(t.id) || 0;
  const isLastDetected =
    lastDetectedTubeId.value === t.id &&
    ((isBackView && lastDetectedFace.value === "back") ||
      (!isBackView && lastDetectedFace.value !== "back"));
  const needsIcons = hasComment || repeatCount > 1 || isLastDetected;

  if (!needsIcons) {
    if (iconGroup) {
      iconGroup.remove();
      iconMap.delete(t.id);
    }
    return;
  }

  if (!iconGroup) {
    iconGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    iconGroup.setAttribute("class", "tube-icons");
    iconGroup.setAttribute("pointer-events", "none");
    iconMap.set(t.id, iconGroup);
    const vp = svg.querySelector("#viewport") as SVGGElement;
    let iconsLayer = vp?.querySelector("#icons-layer") as SVGGElement;
    if (!iconsLayer) {
      iconsLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
      iconsLayer.setAttribute("id", "icons-layer");
      vp?.appendChild(iconsLayer);
    }
    iconsLayer.appendChild(iconGroup);
  }

  if (isBackView) {
    iconGroup.setAttribute(
      "transform",
      `scale(-1, 1) translate(${-2 * cx}, 0)`,
    );
  } else {
    iconGroup.removeAttribute("transform");
  }

  iconGroup.innerHTML = "";

  // Helper: choose readable text color (black or white) based on hole fill color
  const getContrastColor = (colorNameOrHex: string) => {
    if (!colorNameOrHex) return "#000";

    // Map standard color names to hex
    const colorMap: Record<string, string> = {
      red: "#EF4444",
      orange: "#F97316",
      yellow: "#FACC15",
      green: "#22C55E",
      cyan: "#06B6D4",
      blue: "#3B82F6",
      indigo: "#4F46E5",
      purple: "#7C3AED",
      pink: "#EC4899",
      brown: "#92400E",
      black: "#111827",
      white: "#F9FAFB",
    };

    const hex = colorMap[colorNameOrHex.toLowerCase()] || colorNameOrHex;

    let h = hex.replace("#", "").trim();
    if (h.length === 3)
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    if (h.length !== 6) return "#000";
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const toLin = (c: number) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const L = 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
    return L > 0.5 ? "#000" : "#fff";
  };

  const iconSize = Math.max(r * 0.7, 3);
  /** Lucide overlay icons: solid fill + larger than tube-relative `iconSize`. */
  const arrowOverlaySize = Math.max(r * 2.1, 22);
  const penOverlaySize = Math.max(r * 1.35, 14);

  // INSIDE TUBE — Repeat count
  if (repeatCount > 1) {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", String(cx));
    text.setAttribute("y", String(cy));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "central");
    // Compute hole fill color similarly to updateCircleVisualForSvg to pick readable font
    const specialPropertyColor = propertiesOptions.find(
      (p) => p.value === t.property,
    )?.color;
    const surveyColor = isBackView ? t.backColor : t.propertyColor;
    const holeColor = surveyColor || specialPropertyColor || "#ffffff";
    text.setAttribute("fill", getContrastColor(holeColor));
    text.setAttribute("font-size", String(Math.max(r * 1.1, 4)));
    text.setAttribute("font-weight", "bold");
    text.setAttribute("font-family", "Arial, sans-serif");
    text.textContent = String(repeatCount);
    iconGroup.appendChild(text);
  }

  // TOP — Last detected (Lucide `arrow-big-down` via iconify, not hand-drawn paths)
  if (isLastDetected) {
    const arrowGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    );
    const bottomY = cy - r - 1;
    arrowGroup.setAttribute(
      "transform",
      `translate(${cx - arrowOverlaySize / 2}, ${bottomY - arrowOverlaySize}) scale(${arrowOverlaySize / 24})`,
    );

    appendLucideIconToSvgGroup(arrowGroup, "arrow-big-down", {
      stroke: "#ef4444",
      variant: "solid",
    });

    iconGroup.appendChild(arrowGroup);
  }

  // RIGHT — Comment indicator (Lucide icon from @iconify-json/lucide, see `appendLucideIconToSvgGroup`)
  if (hasComment) {
    const commentIcon = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    );
    commentIcon.setAttribute(
      "transform",
      `translate(${cx + r + 2}, ${cy - penOverlaySize * 0.55}) scale(${penOverlaySize / 24})`,
    );

    appendLucideIconToSvgGroup(commentIcon, "pen", {
      stroke: "#3b82f6",
      opacity: "0.95",
      variant: "solid",
    });

    iconGroup.appendChild(commentIcon);
  }
}

// ensure svg refs for dual view when created in template
onMounted(() => {
  // If dualView is enabled later, svgFrontRef and svgBackRef will be bound by template
});

/* ----------------------------
   SELECTION WITH MIRRORING
----------------------------- */
function addSelection(ids: string[]) {
  const set = new Set(selectedIds.value);
  ids.forEach((id) => set.add(id));
  selectedIds.value = set;
  ids.forEach((id) =>
    updateCircleVisual(currentTubes.value.find((t) => t.id === id)!),
  );
}

function removeSelection(ids: string[]) {
  ids.forEach((id) => selectedIds.value.delete(id));
  ids.forEach((id) =>
    updateCircleVisual(currentTubes.value.find((t) => t.id === id)!),
  );
}

function selectWithMirrors(id: string, exclusive = false) {
  const mirrors = getMirroredIds(id);
  const all = [id, ...mirrors];

  if (exclusive) {
    const prev = [...selectedIds.value];
    selectedIds.value = new Set();
    prev.forEach((pid) =>
      updateCircleVisual(currentTubes.value.find((t) => t.id === pid)!),
    );
  }

  addSelection(all);
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
  selectWithMirrors(id, true);
}

function deselect(id: string) {
  const mirrors = getMirroredIds(id);
  removeSelection([id, ...mirrors]);
}

function deselectAll() {
  const prev = [...selectedIds.value];
  selectedIds.value.clear();
  prev.forEach((pid) =>
    updateCircleVisual(currentTubes.value.find((t) => t.id === pid)!),
  );
}

/* ----------------------------
   UI CLICK HANDLERS
----------------------------- */
function handleTubeClick(e: MouseEvent, id: string) {
  e.stopPropagation();
  if (selectedIds.value.has(id)) deselect(id);
  else selectOnly(id);
}

/* ----------------------------
   SEARCH SINGLE TUBE WITH ZOOM
----------------------------- */

import axios from "axios";
interface MyData {
  holeId: string;
}

async function postData(url: string, payload: MyData) {
  try {
    // Axios handles the JSON conversion for you
    const response = await axios.post(url, payload);
    console.log("Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending data:", error);
  }
}

function searchTubes() {
  if (!searchValue.value) return;

  const tube = currentTubes.value.find((t) => t.id === searchValue.value);
  if (!tube) return;

  // Zoom to a reasonable level for viewing a single tube
  const zoomLevel = 3;
  setZoom(zoomLevel);

  // Calculate position to center the tube
  // Tube position in SVG coordinates (when scale=1): centerX + tube.x * scalePx, centerY + tube.y * scalePx
  // After transform translate(tx, ty) scale(s), final position = tx + (centerX + tube.x * scalePx) * s
  // We want this to equal svgWidth/2, so: tx = svgWidth/2 - (centerX + tube.x * scalePx) * s
  const tx = svgWidth / 2 - (centerX + tube.x * scalePx) * zoomLevel;
  const ty = svgHeight / 2 - (centerY + tube.y * scalePx) * zoomLevel;

  setPan(tx, ty);

  // Select the tube
  selectOnly(searchValue.value);

  console.log("Tubes searched ", searchValue.value);
  const info = { holeId: searchValue.value };
  postData("https://apiots.dnyindia.in/api/v2/actions/searchActions", info);
}

/* ----------------------------
   COMMENT FUNCTIONALITY
----------------------------- */
async function submitComment() {
  if (!commentText.value.trim() || selectedIds.value.size === 0) return;

  const surveyId = activeSurveyId.value;
  if (!surveyId) {
    useToast().add({ title: "No active survey", color: "error" });
    return;
  }

  addingComment.value = true;
  try {
    // Add comment for each selected tube
    for (const tubeId of selectedIds.value) {
      await useAxios().$post(`/api/v2/survey/addComment/${surveyId}`, {
        tubeIdAsperLayout: tubeId,
        comment: commentText.value.trim(),
      });
    }

    useToast().add({ title: "Comment added successfully", color: "success" });
    showCommentInput.value = false;
    commentText.value = "";

    // Refresh data to show updated comments
    await fetchUpdatedTubeColors(surveyId);
  } catch (err) {
    console.error("Failed to add comment:", err);
    useToast().add({ title: "Failed to add comment", color: "error" });
  } finally {
    addingComment.value = false;
  }
}

/* ----------------------------
   RENDERING
----------------------------- */
function renderAll() {
  if (dualView.value) {
    // Render into front and back SVGs separately
    renderAllForSvg(svgFrontRef.value, elMaps.front, iconMaps.front, false);
    renderAllForSvg(svgBackRef.value, elMaps.back, iconMaps.back, true);
    return;
  }

  const svg = svgRef.value;
  if (!svg) return;
  renderAllForSvg(svg, elById, iconElById, viewDisplay.value === "Back View");
}

function renderAllForSvg(
  svg: SVGSVGElement | null,
  elMap: Map<string, SVGCircleElement>,
  iconMap: Map<string, SVGGElement>,
  isBackView: boolean,
) {
  if (!svg) return;
  console.log("renderAllForSvg", {
    isBackView,
    svgExists: !!svg,
    tubeCount: currentTubes.value.length,
  });
  const vp = svg.querySelector("#viewport") as SVGGElement;
  if (!vp) return;

  const { boundary, tubes, labels } = ensureLayers(vp);
  boundary.innerHTML = "";
  Array.from(labels.children).forEach((child) => {
    if ((child as Element).id !== "tooltip") child.remove();
  });

  if (isBackView) {
    ensureInvertFilter(svg);
  }

  // Ensure icons layer exists
  let iconsLayer = vp.querySelector("#icons-layer") as SVGGElement;
  if (!iconsLayer) {
    iconsLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    iconsLayer.setAttribute("id", "icons-layer");
    vp.appendChild(iconsLayer);
  }

  drawBoundary(boundary, config.value, centerX, centerY, scalePx, isBackView);

  const activeTubes = currentTubes.value.filter((t) => !t.deleted);
  const presentIds = new Set(activeTubes.map((t) => t.id));

  // Remove stale circles and icons for this svg
  for (const [id, el] of Array.from(elMap.entries())) {
    if (!presentIds.has(id)) {
      el.remove();
      elMap.delete(id);
    }
  }
  for (const [id, el] of Array.from(iconMap.entries())) {
    if (!presentIds.has(id)) {
      el.remove();
      iconMap.delete(id);
    }
  }

  // Render or update existing circles into this svg's tubes layer
  for (const t of activeTubes) {
    let c = elMap.get(t.id);
    if (!c) {
      c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.dataset.name = t.id;
      c.addEventListener("click", (e) => handleTubeClick(e, t.id));
      elMap.set(t.id, c);
      tubes.appendChild(c);
    }

    updateCircleVisualForSvg(t, svg, elMap, iconMap, isBackView);
  }

  // Render row labels with tube counts for this svg
  renderRowLabels(vp, activeTubes, isBackView);
}

function renderRowLabels(
  vp: SVGGElement,
  activeTubes: Tube[],
  isBackView: boolean,
) {
  // Remove existing row labels
  let labelsLayer = vp.querySelector("#row-labels") as SVGGElement;
  if (labelsLayer) {
    labelsLayer.innerHTML = "";
  } else {
    labelsLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    labelsLayer.setAttribute("id", "row-labels");
    vp.appendChild(labelsLayer);
  }

  // Group tubes by row
  const rowData = new Map<
    number,
    { count: number; maxX: number; avgY: number }
  >();

  for (const t of activeTubes) {
    // Extract row number from tube ID (e.g., "R1C2" -> 1)
    const match = t.id.match(/^R(\d+)C/);
    if (!match || !match[1]) continue;

    const rowNum = parseInt(match[1], 10);
    const tubeX = centerX + t.x * scalePx;
    const tubeY = centerY + t.y * scalePx;

    if (!rowData.has(rowNum)) {
      rowData.set(rowNum, { count: 0, maxX: tubeX, avgY: tubeY });
    }

    const row = rowData.get(rowNum)!;
    row.count++;
    row.maxX = Math.max(row.maxX, tubeX + t.r * scalePx);
    // Calculate running average Y position
    row.avgY = (row.avgY * (row.count - 1) + tubeY) / row.count;
  }

  // Sort rows by row number and add labels
  const sortedRows = Array.from(rowData.entries()).sort((a, b) => a[0] - b[0]);
  const labelOffset = 25; // Offset from the rightmost tube

  for (const [rowNum, data] of sortedRows) {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    // Position label to the right of the rightmost tube in the row
    // For back view, we need to position on the left side (which appears on right after flip)
    const xPos = isBackView
      ? centerX - (data.maxX - centerX) - labelOffset
      : data.maxX + labelOffset;
    text.setAttribute("x", String(xPos));
    text.setAttribute("y", String(data.avgY));
    text.setAttribute("font-size", "12");
    text.setAttribute("font-family", "Arial, sans-serif");
    text.setAttribute("font-weight", "bold");
    text.setAttribute("fill", "#374151");
    text.setAttribute("dominant-baseline", "middle");

    // For back view, flip the text horizontally so it's readable after the SVG scaleX(-1)
    // Also apply filter invert to counteract the SVG-level invert and keep text visible
    if (isBackView) {
      text.setAttribute("transform", `scale(-1, 1) translate(${-2 * xPos}, 0)`);
      text.setAttribute("text-anchor", "start");
      text.setAttribute("fill", "#22c55e"); // Green color for back view
      text.setAttribute("font-weight", "900"); // Extra bold
    } else {
      text.setAttribute("text-anchor", "start");
    }
    text.textContent = `R${rowNum}: ${data.count}`;

    labelsLayer.appendChild(text);
  }
}
let interval: ReturnType<typeof setInterval> | null = null;
async function stratSurvey() {
  if (!selectedPhase.value) {
    useToast().add({ title: "Please select a phase", color: "error" });
    return;
  }

  loading.value = true;
  try {
    const data = await useSurveyStore().createSurvey({
      tubeSheetId: sheetId,
      surveyType: selectedPhase.value,
      reactorId: reactorId,
    });
    if (!data?.id) {
      loading.value = false;
      return;
    }
    activeSurveyId.value = data.id;
    await navigateTo({
      path: route.path,
      query: { ...route.query, surveyId: data.id, resumedJourney: "true" },
    });
    // Call fetchUpdatedTubeColors immediately
    await fetchUpdatedTubeColors(data.id);
    // Then set interval for polling
    interval = setInterval(
      () => fetchUpdatedTubeColors(data.id),
      SURVEY_POLLING_INTERVAL,
    );
    // Start countdown timer
    timeLeft.value = 60;
    countdownInterval = setInterval(() => {
      timeLeft.value--;
      if (timeLeft.value <= 0) timeLeft.value = 60;
    }, 1000);
    if (data.Success) {
      useToast().add({ title: "Survey Started", color: "success" });
    }
  } catch {
    loading.value = false;
  }
}

async function startNextPhaseFromModal() {
  if (!nextPhaseSelected.value) {
    useToast().add({ title: "Please select a phase", color: "error" });
    return;
  }
  successModalOpen.value = false;
  selectedPhase.value = nextPhaseSelected.value;
  await stratSurvey();
}

function openStopModal() {
  stopModalOpen.value = true;
}

async function stopSurvey() {
  try {
    const phaseJustCompleted = selectedPhase.value;
    await useSurveyStore().stopSurvey(activeSurveyId.value as string);
    loading.value = false;
    if (interval) clearInterval(interval);
    interval = null;
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = null;
    stopModalOpen.value = false;
    if (phaseJustCompleted) addCompletedPhase(phaseJustCompleted);
    await refreshTubeSheetDetails();
    await nextTick();
    if (
      !typeOfPhasesItems.value.some(
        (i: { label: string; value: string }) =>
          i.value === selectedPhase.value,
      )
    ) {
      selectedPhase.value = typeOfPhasesItems.value[0]?.value ?? "";
    }
    successMessage.value = "Phase completed";
    successModalOpen.value = true;
  } catch {
    useToast().add({ title: "Failed to complete phase", color: "error" });
  }
}

const { openReportForPrint } = usePdfReport();

async function downloadReport() {
  if (!useRoute().query?.surveyId) {
    useToast().add({ title: "No survey ID available", color: "error" });
    return;
  }

  openReportForPrint({
    sheetId,
    reactorId,
    surveyId: useRoute().query?.surveyId as string,
  });
}

function goHome() {
  navigateTo("/");
}

/* ----------------------------
   ZOOM HANDLERS
----------------------------- */
function zoomIn() {
  zoom(1.15, centerX, centerY);
}
function zoomOut() {
  zoom(1 / 1.15, centerX, centerY);
}
function panXY(dx: number, dy: number) {
  // Invert X direction when in Back View (mirrored) mode
  const adjustedDx = viewDisplay.value === "Back View" ? -dx : dx;
  pan(adjustedDx, dy);
}
function handleWheel(event: WheelEvent) {
  // Slower zoom factor (1.03 instead of 1.1) for smoother control
  const factor = event.deltaY < 0 ? 1.03 : 1 / 1.03;
  const svg = (event.currentTarget as SVGSVGElement) || svgRef.value;
  if (svg) {
    const rect = svg.getBoundingClientRect();
    const pivotX = ((event.clientX - rect.left) / rect.width) * svgWidth;
    const pivotY = ((event.clientY - rect.top) / rect.height) * svgHeight;
    zoom(factor, pivotX, pivotY);
  } else {
    zoom(factor, centerX, centerY);
  }
}
function resetView() {
  if (initialViewportState.value) {
    setZoom(initialViewportState.value.scale);
    setPan(initialViewportState.value.tx, initialViewportState.value.ty);
    setRotation(initialViewportState.value.rotation);
  } else {
    resetWithoutRotation();
  }
}

// Keyboard handler for arrow keys
// Shift + Arrow = move reactor, Arrow only (up/down) = scroll right panel
function handleKeyDown(event: KeyboardEvent) {
  const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  if (!arrowKeys.includes(event.key)) return;

  event.preventDefault();
  const step = 40;

  // If the right panel is open and visible, arrow keys scroll it unless Shift is held.
  const rightOpen =
    !!rightPanelRef.value && isRightOpen.value && !dualView.value;
  if (event.shiftKey || !rightOpen) {
    // Shift + Arrow OR when right panel is not open => move reactor
    switch (event.key) {
      case "ArrowUp":
        panXY(0, -step);
        break;
      case "ArrowDown":
        panXY(0, step);
        break;
      case "ArrowLeft":
        panXY(-step, 0);
        break;
      case "ArrowRight":
        panXY(step, 0);
        break;
    }
  } else {
    // Arrow only (up/down) => scroll right panel
    if (event.key === "ArrowUp") {
      rightPanelRef.value!.scrollBy({ top: -step, behavior: "smooth" });
    } else if (event.key === "ArrowDown") {
      rightPanelRef.value!.scrollBy({ top: step, behavior: "smooth" });
    }
  }
}

// Reference to the container div for fit-to-screen calculation
const containerRef = ref<HTMLDivElement | null>(null);
// Reference to the right panel for scrolling
const rightPanelRef = ref<HTMLDivElement | null>(null);

function fitToScreenHandler() {
  // Calculate actual reactor dimensions from config
  const outerDim = config.value.outerDimension || 100;
  const width = config.value.width || outerDim;
  const height = config.value.height || outerDim;

  // The reactor content is rendered with scalePx = 2, so total dimensions are:
  // width * scalePx * 2, height * scalePx * 2
  const renderedWidth = width * scalePx * 2;
  const renderedHeight = height * scalePx * 2;

  // SVG viewBox is 1200x1200 - use full viewBox for fitting
  const viewBoxSize = 1200;

  // Calculate scale to fit reactor within the full viewBox
  const scaleX = viewBoxSize / renderedWidth;
  const scaleY = viewBoxSize / renderedHeight;
  const fitScale = Math.min(scaleX, scaleY);

  // Clamp scale between reasonable bounds (0.1 to 3.0)
  const finalScale = Math.max(0.1, Math.min(fitScale, 3.0));

  // Set scale
  setZoom(finalScale);

  // Center the reactor: translate to keep center at svgCenter after scaling
  const newTx = centerX * (1 - finalScale);
  const newTy = centerY * (1 - finalScale);
  setPan(newTx, newTy);
}

/* ----------------------------
   REACTOR SAVE & FETCH FUNCTIONALITY
----------------------------- */

// Load reactor data on mount
onMounted(async () => {
  // Add keyboard listener for arrow key controls
  window.addEventListener("keydown", handleKeyDown);

  loadViewportState();
  watch(
    () => [scale.value, tx.value, ty.value, rotation.value],
    persistViewportState,
    { deep: false },
  );

  // Fetch tubesheet details

  if (reactorId) {
    const reactor = await reactorsStore.getAReactor(reactorId);
    if (reactor) {
      if (reactor.config) {
        setConfig(reactor.config);

        // Load viewport positions from config if available
        if (reactor.config.positions) {
          const {
            scale: savedScale,
            tx: savedTx,
            ty: savedTy,
            rotation: savedRotation,
          } = reactor.config.positions;
          if (typeof savedScale === "number") setZoom(savedScale);
          if (typeof savedTx === "number" && typeof savedTy === "number")
            setPan(savedTx, savedTy);
          if (typeof savedRotation === "number") setRotation(savedRotation);

          // Store initial state for reset functionality
          initialViewportState.value = {
            scale: savedScale ?? 1,
            tx: savedTx ?? 0,
            ty: savedTy ?? 0,
            rotation: savedRotation ?? 0,
          };
        }
      }

      if (reactor.tubes && reactor.tubes.length > 0) {
        currentTubes.value = [...reactor.tubes];
        renderAll();
      }
    }
  }

  if (sheetId) {
    await refreshTubeSheetDetails();
    const querySurveyId = (useRoute().query.surveyId ||
      useSurveyStore().currentSurveyId) as string | undefined;
    const resumedJourney = useRoute().query.resumedJourney;
    // Only use the survey ID if it came from the current navigation (query param) or is explicitly a resume
    // Don't use the stored currentSurveyId to prevent cross-project survey loading
    const effectiveSurveyId = useRoute().query.surveyId as string | undefined;

    if (effectiveSurveyId) {
      activeSurveyId.value = effectiveSurveyId;
      if (resumedJourney) {
        loading.value = true;
        await fetchUpdatedTubeColors(activeSurveyId.value);
        interval = setInterval(
          () => fetchUpdatedTubeColors(activeSurveyId.value as string),
          SURVEY_POLLING_INTERVAL,
        );
        // Start countdown timer
        timeLeft.value = SURVEY_POLLING_INTERVAL / 1000;
        countdownInterval = setInterval(() => {
          timeLeft.value--;
          if (timeLeft.value <= 0)
            timeLeft.value = SURVEY_POLLING_INTERVAL / 1000;
        }, 1000);
      } else {
        fetchUpdatedTubeColors(activeSurveyId.value);
        viewMode.value = true;
      }
    } else {
      // Clear any lingering survey state when starting fresh
      activeSurveyId.value = "";
      useSurveyStore().currentSurveyId = "";
    }
  }
});

/* ----------------------------
   WATCH
----------------------------- */

// Watch for sheet ID changes and reset survey state to prevent loading old survey data
watch(
  () => sheetId,
  (newSheetId, oldSheetId) => {
    if (oldSheetId && newSheetId && oldSheetId !== newSheetId) {
      // Sheet has changed - clear the active survey and related state
      activeSurveyId.value = "";
      loading.value = false;
      viewMode.value = false;
      selectedPhase.value = "";
      currentSurvey.value = "";
      progressData.value = [];
      tubeRepeatCounts.value = new Map();
      lastDetectedTubeId.value = "";
      lastDetectedFace.value = "front";
      tubeComments.value = [];
      errorLogsRows.value = [];
      surveyCreatedAt.value = null;
      surveyEndTimeStamp.value = null;

      // Clear any polling interval
      if (interval) clearInterval(interval);
      interval = null;
      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = null;

      // Clear the Pinia store's currentSurveyId
      useSurveyStore().currentSurveyId = "";
    }
  },
);

watch(viewDisplay, () => {
  // Re-render everything when switching between front and back view
  // This will update tube visuals and row labels
  renderAll();
});

watch(dualView, () => {
  nextTick(() => renderAll());
});

function toggleDualView() {
  const was = dualView.value;
  dualView.value = !dualView.value;
  // When entering or exiting dual view, wait for DOM update then render.
  nextTick(() => renderAll());

  // If we just exited Both View (was true, now false), perform a full page refresh
  // to ensure single-view SVG state and caches fully reset.
  if (was && !dualView.value) {
    window.location.reload();
  }
}

async function fetchUpdatedTubeColors(surveyId: string) {
  try {
    const idToUse = surveyId || activeSurveyId.value;
    const surveyPayload =
      (idToUse
        ? await useSurveyStore().getSurveyUpdates(idToUse)
        : await useSurveyStore().getSurveyUpdates()) ?? {};
    const {
      data,
      surveyType,
      createdAt,
      repeat,
      progress,
      endTimeStamp,
      comments,
      errorLogs,
    } = surveyPayload as Record<string, any>;
    repeatCount.value = (repeat as number) || 0;

    if (Array.isArray(errorLogs)) {
      errorLogsRows.value = [...errorLogs]
        .sort((a, b) => {
          const ta = new Date(
            (a as SurveyErrorLogApi).timeStamp ?? 0,
          ).getTime();
          const tb = new Date(
            (b as SurveyErrorLogApi).timeStamp ?? 0,
          ).getTime();
          return tb - ta;
        })
        .map((entry) => {
          const item = entry as SurveyErrorLogApi;
          return {
            tube: item.tubeIdAsperLayout ?? String(item.tubeId),
            activity: item.activity ?? "",
            time: item.timeStamp
              ? new Date(item.timeStamp).toLocaleString()
              : "",
            face: (item.face || "front").toLowerCase(),
            color: item.color ?? "",
          };
        });
    } else {
      errorLogsRows.value = [];
    }

    // Record API call time
    apiCallTime.value = new Date();
    // Reset countdown timer
    timeLeft.value = SURVEY_POLLING_INTERVAL / 1000;

    // Update comments from API
    if (comments && Array.isArray(comments)) {
      tubeComments.value = comments;
    }

    // Update progress data and timer
    if (progress && Array.isArray(progress)) {
      progressData.value = progress;
    }

    // Store timing data
    surveyCreatedAt.value = createdAt || null;
    surveyEndTimeStamp.value = endTimeStamp || null;
    updateTotalSurveyTime();

    currentSurvey.value =
      (allTypeOfPhasesItems.find((phase) => phase.value === surveyType)
        ?.label as string) || "";

    selectedPhase.value = surveyType || "";

    // Track repeat counts per tube and last detected tube
    const repeatCounts = new Map<string, number>();
    let latestTubeId = "";
    let latestTimestamp = 0;
    let latestFace = "front";

    (data ?? []).forEach(
      (element: {
        tubeId: string | number;
        color: string;
        face?: string;
        tubeIdAsperLayout?: string;
        timeStamp?: string;
        isDuplicate?: boolean;
      }) => {
        const tube = currentTubes.value[element.tubeId as number];
        if (!tube) return;

        // Track last detected tube by timestamp and face
        if (element.timeStamp) {
          const ts = new Date(element.timeStamp).getTime();
          if (ts > latestTimestamp) {
            latestTimestamp = ts;
            latestTubeId = tube.id;
            latestFace = element.face || "front";
          }
        }

        // Count repeats per tube (by layout ID)
        const layoutId = element.tubeIdAsperLayout || tube.id;
        if (element.isDuplicate) {
          repeatCounts.set(layoutId, (repeatCounts.get(layoutId) || 1) + 1);
        }

        if (element.face === "back") {
          tube.backColor = element.color;
          tube._backendUpdatedBack = true;
        } else {
          tube.propertyColor = element.color;
          tube._backendUpdated = true;
        }
        updateCircleVisual(tube);
      },
    );

    // Update tracked state
    tubeRepeatCounts.value = repeatCounts;
    lastDetectedTubeId.value = latestTubeId;
    lastDetectedFace.value = latestFace;

    // Refresh all tube icons after data update
    const activeTubes = currentTubes.value.filter((t) => !t.deleted);
    for (const t of activeTubes) {
      const cx = centerX + t.x * scalePx;
      const cy = centerY + t.y * scalePx;
      const r = t.r * scalePx;
      updateTubeIcons(t, cx, cy, r);
    }

    const frontData = data?.filter((e: { face?: string }) => e.face !== "back");
    const backData = data?.filter((e: { face?: string }) => e.face === "back");

    tableData.value = frontData
      ?.filter((e: { isDuplicate: boolean }) => !e?.isDuplicate)
      .map(
        (item: {
          tubeIdAsperLayout: string;
          activity: string;
          timeStamp: string;
          isDuplicate: boolean;
          evidenceImage?: string;
        }) => {
          return {
            tube: item.tubeIdAsperLayout,
            Activity: item.activity,
            time: new Date(item.timeStamp).toLocaleString(),
            timeStamp: item.timeStamp,
            face: "front",
            evidenceImage: item.evidenceImage,
            Action: "Locate",
          };
        },
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime(),
      );

    repeatTableData.value = frontData
      ?.filter((e: { isDuplicate: boolean }) => e?.isDuplicate)
      .map(
        (item: {
          tubeIdAsperLayout: string;
          activity: string;
          timeStamp: string;
          isDuplicate: boolean;
          evidenceImage?: string;
        }) => {
          return {
            tube: item.tubeIdAsperLayout,
            Activity: item.activity,
            time: new Date(item.timeStamp).toLocaleString(),
            timeStamp: item.timeStamp,
            face: "front",
            evidenceImage: item.evidenceImage,
            Action: "Locate",
          };
        },
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime(),
      );

    backTableData.value = backData
      ?.filter((e: { isDuplicate: boolean }) => !e?.isDuplicate)
      .map(
        (item: {
          tubeIdAsperLayout: string;
          activity: string;
          timeStamp: string;
          isDuplicate: boolean;
          evidenceImage?: string;
        }) => {
          return {
            tube: item.tubeIdAsperLayout,
            Activity: item.activity,
            time: new Date(item.timeStamp).toLocaleString(),
            timeStamp: item.timeStamp,
            face: "back",
            evidenceImage: item.evidenceImage,
            Action: "Locate",
          };
        },
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime(),
      ); // Sort by time desc

    backRepeatTableData.value = backData
      ?.filter((e: { isDuplicate: boolean }) => e?.isDuplicate)
      .map(
        (item: {
          tubeIdAsperLayout: string;
          activity: string;
          timeStamp: string;
          isDuplicate: boolean;
          evidenceImage?: string;
        }) => {
          return {
            tube: item.tubeIdAsperLayout,
            Activity: item.activity,
            time: new Date(item.timeStamp).toLocaleString(),
            timeStamp: item.timeStamp,
            face: "back",
            evidenceImage: item.evidenceImage,
            Action: "Locate",
          };
        },
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime(),
      ); // Sort by time desc
  } catch (err) {
    console.error("Failed to fetch tube colors:", err);
  }
}

function openImageModal(row: TubeDataTable) {
  const {
    public: {
      axios: { baseURL },
    },
  } = useRuntimeConfig();
  // Concatenate base URL with the evidenceImage path
  currentImageUrl.value = baseURL + row.evidenceImage!;
  currentLogTime.value = row.time;
  currentTubeId.value = row.tube;
  imageModalOpen.value = true;
}

function downloadImage() {
  const link = document.createElement("a");
  link.href = currentImageUrl.value;
  link.download = `evidence_${currentTubeId.value}_${currentLogTime.value.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const backendUpdatedCount = computed(
  () =>
    currentTubes.value.filter(
      (t) =>
        t._backendUpdated &&
        !propertiesOptions.some((p) => p.value === t.property),
    ).length,
);

const backBackendUpdatedCount = computed(
  () =>
    currentTubes.value.filter(
      (t) =>
        t._backendUpdatedBack &&
        !propertiesOptions.some((p) => p.value === t.property),
    ).length,
);

// total tubes
const totalCount = computed(() => currentTubes.value.length);

// Property legend with counts
const propertyLegend = computed(() => {
  const counts: Record<string, number> = {};

  // Initialize counts for all properties
  propertiesOptions.forEach((prop) => {
    counts[prop.value] = 0;
  });

  // Count tubes by property
  currentTubes.value.forEach((tube) => {
    if (tube.property && !tube.deleted) {
      counts[tube.property] = (counts[tube.property] || 0) + 1;
    }
  });

  // Map to legend items with property details
  return propertiesOptions.map((prop) => ({
    label: prop.label,
    value: prop.value,
    color: prop.color,
    count: counts[prop.value] || 0,
  }));
});

const specialTubes = computed(() =>
  propertyLegend.value.reduce((sum, item) => sum + item.count, 0),
);

// Color Cap Tracking Legend - counts tubes by color for COLOR_CAP_TRACKING phase
const colorCapLegend = computed(() => {
  // Only compute for COLOR_CAP_TRACKING phase
  if (selectedPhase.value !== "COLOR_CAP_TRACKING") return [];

  // Find the COLOR_CAP_TRACKING phase config
  const colorCapPhase = phasesData.value.find(
    (p: { phaseName: string }) => p.phaseName === "COLOR_CAP_TRACKING",
  );
  if (!colorCapPhase?.configs) return [];

  const configs = colorCapPhase.configs;
  const isBackView = viewDisplay.value === "Back View";

  // Build color name to config mapping
  const colorConfigMap = new Map<
    string,
    { color: string; abbreviation: string; key: string }
  >();
  for (const [key, value] of Object.entries(configs)) {
    const config = value as { color: string; abbreviation: string };
    if (config.color && config.abbreviation) {
      // Normalize color name for matching (lowercase)
      colorConfigMap.set(config.color.toLowerCase(), {
        color: config.color,
        abbreviation: config.abbreviation,
        key,
      });
    }
  }

  // Count tubes by their propertyColor (which contains color names from survey)
  const counts = new Map<string, number>();
  const activeTubes = currentTubes.value.filter((t) => !t.deleted);

  for (const tube of activeTubes) {
    // Get the color based on view
    const tubeColor = isBackView ? tube.backColor : tube.propertyColor;
    if (!tubeColor) continue;

    // Try to match the color
    const normalizedColor = tubeColor.toLowerCase();
    if (colorConfigMap.has(normalizedColor)) {
      counts.set(normalizedColor, (counts.get(normalizedColor) || 0) + 1);
    }
  }

  // Build legend items from configs
  const legend: {
    key: string;
    color: string;
    abbreviation: string;
    count: number;
  }[] = [];
  for (const [colorName, config] of colorConfigMap) {
    legend.push({
      key: config.key,
      color: config.color,
      abbreviation: config.abbreviation,
      count: counts.get(colorName) || 0,
    });
  }

  return legend;
});

const effectiveTotal = computed(() => totalCount.value - specialTubes.value);
const completed = computed(() =>
  viewDisplay.value === "Back View"
    ? backBackendUpdatedCount.value
    : backendUpdatedCount.value,
);
const remaining = computed(() =>
  Math.max(0, effectiveTotal.value - completed.value),
);

const chartData = computed(() => ({
  labels: ["Completed", "Remaining", "Special Tubes"],
  datasets: [
    {
      data: [completed.value, remaining.value, specialTubes.value],
      backgroundColor: ["#4CAF50", "#FFC107", "#9C27B0"],
      borderWidth: 1,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: "right" as const,
      align: "start" as const,
      labels: { boxWidth: 10 },
    },
    tooltip: {
      callbacks: {
        label: function (context: TooltipItem<"pie">) {
          const label = context.label || "";
          const value = context.parsed;
          const total = context.dataset.data.reduce(
            (a: number, b: number) => a + b,
            0,
          );
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
          return `${label}: ${value} (${percentage}%)`;
        },
      },
    },
  },
};

// Progress Bar Chart Data
const progressChartData = computed(() => {
  return {
    labels: progressData.value.map((p) => {
      const date = new Date(p.time);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }),
    datasets: [
      {
        label: "Day",
        data: progressData.value.map((p) => (p.isDay ? p.tubes : null)),
        backgroundColor: "#4CAF50",
        borderColor: "#388E3C",
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: "Night",
        data: progressData.value.map((p) => (!p.isDay ? p.tubes : null)),
        backgroundColor: "#9E9E9E",
        borderColor: "#757575",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };
});

const progressChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: "bottom" as const,
      labels: {
        font: { size: 10 },
      },
    },
    title: {
      display: true,
      text: "Efficiency",
      font: { size: 12 },
    },
  },
  scales: {
    x: {
      display: true,
      title: {
        display: false,
      },
      ticks: {
        maxRotation: 45,
        font: { size: 9 },
      },
    },
    y: {
      display: true,
      beginAtZero: true,
      title: {
        display: true,
        text: "Tubes",
        font: { size: 10 },
      },
      ticks: {
        font: { size: 9 },
      },
    },
  },
};

const catalystOutageSeries = computed(() => {
  const now = Date.now();
  const base = new Date(now - 30 * 60 * 1000); // 30 minutes ago
  return [
    { time: new Date(base.getTime() + 0 * 60 * 1000).toISOString(), value: 0 },
    { time: new Date(base.getTime() + 5 * 60 * 1000).toISOString(), value: 8 },
    {
      time: new Date(base.getTime() + 10 * 60 * 1000).toISOString(),
      value: 16,
    },
    {
      time: new Date(base.getTime() + 15 * 60 * 1000).toISOString(),
      value: 24,
    },
    {
      time: new Date(base.getTime() + 20 * 60 * 1000).toISOString(),
      value: 31,
    },
    {
      time: new Date(base.getTime() + 25 * 60 * 1000).toISOString(),
      value: 39,
    },
    {
      time: new Date(base.getTime() + 28 * 60 * 1000).toISOString(),
      value: 12,
    },
    { time: new Date(base.getTime() + 30 * 60 * 1000).toISOString(), value: 0 },
  ];
});

const catalystOutageStartTime = computed(() => {
  const first = catalystOutageSeries.value[0];
  return first ? new Date(first.time).toLocaleString() : "N/A";
});

const catalystOutageDropTime = computed(() => {
  const last =
    catalystOutageSeries.value[catalystOutageSeries.value.length - 1];
  return last ? new Date(last.time).toLocaleString() : "N/A";
});

const catalystOutageMaxPressure = computed(() => {
  if (!catalystOutageSeries.value.length) return "N/A";
  const maxValue = Math.max(
    ...catalystOutageSeries.value.map((entry) => Number(entry.value) || 0),
  );
  return Number.isFinite(maxValue) ? `${maxValue}` : "N/A";
});

const catalystOutageChartData = computed(() => ({
  labels: catalystOutageSeries.value.map((point) => {
    const date = new Date(point.time);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }),
  datasets: [
    {
      label: "Pressure",
      data: catalystOutageSeries.value.map((point) => point.value),
      borderColor: "#EF4444",
      backgroundColor: "rgba(239, 68, 68, 0.2)",
      tension: 0.4,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 5,
    },
  ],
}));

const catalystOutageChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: function (context: TooltipItem<"line">) {
          return `Pressure: ${context.parsed.y}`;
        },
      },
    },
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: "Time",
      },
      ticks: {
        maxRotation: 45,
        font: { size: 9 },
      },
    },
    y: {
      display: true,
      beginAtZero: true,
      title: {
        display: true,
        text: "Pressure",
      },
      ticks: {
        font: { size: 9 },
      },
    },
  },
};

onUnmounted(() => {
  if (interval) clearInterval(interval);
  // Remove keyboard listener
  window.removeEventListener("keydown", handleKeyDown);
});
</script>
