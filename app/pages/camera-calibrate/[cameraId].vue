<template>
  <UDashboardPanel id="camera-calibrate">
    <template #header>
      <UDashboardNavbar title="Camera Calibration">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            color="neutral"
            @click="navigateTo('/')"
          />
        </template>
        <template #trailing>
          <UBadge v-if="camera" :color="camera.status ? 'success' : 'error'" variant="subtle">
            {{ camera.status ? 'Online' : 'Offline' }}
          </UBadge>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="loading" class="flex items-center justify-center h-full">
        <div class="flex flex-col items-center gap-4">
          <UIcon name="i-lucide-loader-2" class="size-12 animate-spin text-primary" />
          <p class="text-neutral-500">
            Loading camera details...
          </p>
        </div>
      </div>

      <div v-else-if="error" class="flex items-center justify-center h-full">
        <UCard class="max-w-md">
          <div class="flex flex-col items-center gap-4 text-center">
            <UIcon name="i-lucide-alert-circle" class="size-12 text-error" />
            <h3 class="text-lg font-semibold">
              Failed to Load Camera
            </h3>
            <p class="text-neutral-500">
              {{ error }}
            </p>
            <UButton label="Go Back" @click="navigateTo('/')" />
          </div>
        </UCard>
      </div>

      <div v-else-if="camera" class="h-full flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        <!-- Left Section: Video Stream -->
        <div class="flex-1 flex flex-col min-h-0 gap-2">
          <!-- Top Bar: Camera Info + Position Display -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="font-semibold">{{ camera.name }}</span>
              <UBadge color="primary" variant="subtle" size="xs">
                {{ camera.ipAddress }}
              </UBadge>
            </div>

            <div class="bg-primary/10 border border-primary/30 rounded-lg px-4 py-1.5 flex items-center gap-3">
              <div class="flex items-center gap-1.5">
                <UIcon name="i-lucide-move-horizontal" class="size-4 text-primary" />
                <span class="text-lg font-bold text-primary">X: {{ angleX }}°</span>
              </div>
              <USeparator orientation="vertical" class="h-5" />
              <div class="flex items-center gap-1.5">
                <UIcon name="i-lucide-move-vertical" class="size-4 text-primary" />
                <span class="text-lg font-bold text-primary">Y: {{ angleY }}°</span>
              </div>
              <span v-if="saving" class="ml-1 flex items-center gap-1 text-xs text-neutral-500">
                <UIcon name="i-lucide-loader-2" class="size-3 animate-spin" />
              </span>
            </div>

            <!-- Help Popover for Keyboard Shortcuts -->
            <UPopover>
              <UButton
                icon="i-lucide-keyboard"
                variant="ghost"
                color="neutral"
                size="xs"
              />
              <template #content>
                <div class="p-4 space-y-3 w-64">
                  <h4 class="font-semibold text-sm">
                    Keyboard Shortcuts
                  </h4>
                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <div class="flex items-center gap-2">
                      <UKbd>↑</UKbd>
                      <span class="text-neutral-500">Y +5°</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <UKbd>↓</UKbd>
                      <span class="text-neutral-500">Y -5°</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <UKbd>←</UKbd>
                      <span class="text-neutral-500">X -5°</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <UKbd>→</UKbd>
                      <span class="text-neutral-500">X +5°</span>
                    </div>
                    <div class="flex items-center gap-2 col-span-2">
                      <UKbd>Space</UKbd>
                      <span class="text-neutral-500">Reset to Center</span>
                    </div>
                  </div>
                </div>
              </template>
            </UPopover>
          </div>

          <!-- Video Stream - Full Height -->
          <div class="flex-1 bg-neutral-900 rounded-lg overflow-hidden relative">
            <!-- Video Element for HLS Stream -->
            <video
              ref="videoElement"
              class="w-full h-full object-contain"
              autoplay
              muted
              playsinline
            />

            <!-- TV Static Effect when no stream -->
            <div
              v-if="!streamActive"
              class="absolute inset-0 tv-static"
            >
              <div class="absolute inset-0 flex flex-col items-center justify-center z-10">
                <div class="bg-black/60 backdrop-blur-sm rounded-xl px-6 py-4 flex flex-col items-center">
                  <UIcon name="i-lucide-tv" class="size-12 mb-2 text-neutral-300" />
                  <p class="text-lg font-bold text-white">
                    No Signal
                  </p>
                  <p class="text-xs mt-1 text-neutral-400 text-center max-w-xs">
                    {{ streamError || (camera.rtspUrl ? 'Connecting to stream...' : 'RTSP URL not configured') }}
                  </p>
                  <p v-if="camera.rtspUrl" class="text-[10px] mt-2 text-neutral-500 text-center max-w-xs break-all">
                    {{ camera.rtspUrl }}
                  </p>
                  <UButton
                    v-if="camera.rtspUrl"
                    class="mt-3"
                    size="sm"
                    label="Retry Connection"
                    icon="i-lucide-refresh-cw"
                    @click="initializeStream"
                  />
                </div>
              </div>
            </div>

            <!-- Stream info overlay -->
            <div v-if="streamActive" class="absolute bottom-2 left-2 flex gap-2">
              <UBadge
                color="error"
                variant="solid"
                size="xs"
                class="animate-pulse"
              >
                <UIcon name="i-lucide-circle" class="size-2 mr-1" />
                LIVE
              </UBadge>
            </div>

            <!-- Footer overlay -->
            <div class="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-3">
              <div class="flex items-center justify-between text-xs text-neutral-300">
                <span>Controller: {{ camera.controllerIp || 'N/A' }}</span>
                <span>MAC: {{ camera.macId }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Section: Controls and Info -->
        <div class="lg:w-72 flex flex-col gap-3">
          <!-- Quick Controls -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-gamepad-2" class="size-4" />
                <span class="font-semibold text-sm">Controls</span>
              </div>
            </template>

            <div class="flex flex-col items-center gap-2">
              <UButton
                icon="i-lucide-chevron-up"
                color="neutral"
                variant="outline"
                size="xl"

                :disabled="angleY >= 180"
                @click="adjustAngle('y', 5)"
              />
              <div class="flex gap-2">
                <UButton
                  icon="i-lucide-chevron-left"
                  color="neutral"
                  variant="outline"
                  size="xl"

                  :disabled="angleX <= 0"
                  @click="adjustAngle('x', -5)"
                />
                <UButton
                  label="Reset"
                  color="primary"
                  variant="soft"
                  size="xl"
                  class="text-xs"
                  @click="resetToCenter"
                />
                <UButton
                  icon="i-lucide-chevron-right"
                  color="neutral"
                  variant="outline"
                  size="xl"

                  :disabled="angleX >= 180"
                  @click="adjustAngle('x', 5)"
                />
              </div>
              <UButton
                icon="i-lucide-chevron-down"
                color="neutral"
                variant="outline"
                size="xl"

                :disabled="angleY <= 0"
                @click="adjustAngle('y', -5)"
              />
            </div>

            <template #footer>
              <UButton
                label="Save Position"
                icon="i-lucide-save"
                size="sm"
                block
                :loading="saving"
                @click="saveAngle"
              />
            </template>
          </UCard>

          <!-- Camera Info Card -->
          <UCard class="flex-1">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-info" class="size-4" />
                <span class="font-semibold text-sm">Camera Info</span>
              </div>
            </template>

            <dl class="space-y-2 text-xs">
              <div class="flex justify-between">
                <dt class="text-neutral-500">
                  Name
                </dt>
                <dd class="font-medium">
                  {{ camera.name }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-neutral-500">
                  IP Address
                </dt>
                <dd class="font-medium">
                  {{ camera.ipAddress }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-neutral-500">
                  Controller IP
                </dt>
                <dd class="font-medium">
                  {{ camera.controllerIp || 'N/A' }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-neutral-500">
                  Status
                </dt>
                <dd>
                  <UBadge :color="camera.status ? 'success' : 'error'" size="xs">
                    {{ camera.status ? 'Online' : 'Offline' }}
                  </UBadge>
                </dd>
              </div>
            </dl>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { useCamera, type Camera } from '@/stores/camera'
import { useDebounceFn } from '@vueuse/core'
import Hls from 'hls.js'

const route = useRoute()
const cameraStore = useCamera()

const cameraId = computed(() => route.params.cameraId as string)

const camera = ref<Camera | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)
const streamActive = ref(false)
const videoElement = ref<HTMLVideoElement | null>(null)
const hlsInstance = ref<Hls | null>(null)
const streamError = ref<string | null>(null)

// Angle state
const angleX = ref(90)
const angleY = ref(90)

// Fetch camera details on mount
onMounted(async () => {
  await fetchCameraDetails()
  initializeStream()
  setupKeyboardControls()
})

onUnmounted(() => {
  removeKeyboardControls()
  destroyHls()
  cameraStore.clearCamera()
})

function destroyHls() {
  if (hlsInstance.value) {
    hlsInstance.value.destroy()
    hlsInstance.value = null
  }
}

async function fetchCameraDetails() {
  loading.value = true
  error.value = null

  try {
    const data = await cameraStore.getCameraDetails(cameraId.value)
    if (data) {
      camera.value = data
      // Initialize angles from camera data or default to 90
      angleX.value = data.x !== undefined ? Math.abs(data.x) : 90
      angleY.value = data.y !== undefined ? Math.abs(data.y) : 90
    } else {
      error.value = 'Camera not found'
    }
  } catch (e) {
    error.value = 'Failed to load camera details'
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function initializeStream() {
  if (!videoElement.value) {
    streamActive.value = false
    streamError.value = 'Video element not ready'
    return
  }

  if (!camera.value?.rtspUrl) {
    streamActive.value = false
    streamError.value = 'No RTSP URL configured'
    return
  }

  // Destroy existing HLS instance
  destroyHls()
  streamError.value = null

  try {
    const hlsUrl = `/api/v2/camera/stream/${cameraId.value}/index.m3u8`

    if (typeof window !== 'undefined') {
      if (videoElement.value.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.value.src = hlsUrl

        videoElement.value.addEventListener('loadedmetadata', () => {
          streamActive.value = true
          streamError.value = null
          videoElement.value?.play().catch(console.error)
        })

        videoElement.value.addEventListener('error', (e) => {
          console.error('Native HLS error:', e)
          streamActive.value = false
          streamError.value = 'Failed to load stream'
        })
      }
      // Use HLS.js for other browsers
      else if (Hls.isSupported()) {
        const hls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        })

        hlsInstance.value = hls
        hls.loadSource(hlsUrl)
        hls.attachMedia(videoElement.value)

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          streamActive.value = true
          streamError.value = null
          videoElement.value?.play().catch(console.error)
        })

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS.js error:', event, data)

          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                streamError.value = 'Network error - stream not available'
                // Try to recover
                hls.startLoad()
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                streamError.value = 'Media error - trying to recover'
                hls.recoverMediaError()
                break
              default:
                streamError.value = 'Fatal streaming error'
                streamActive.value = false
                destroyHls()
                break
            }
          }
        })
      } else {
        streamError.value = 'HLS not supported in this browser'
        streamActive.value = false
      }
    }
  } catch (e) {
    console.error('Failed to initialize stream:', e)
    streamActive.value = false
    streamError.value = 'Failed to initialize stream'
  }
}

// Debounced function to set camera angle
const debouncedSetAngle = useDebounceFn(async () => {
  await saveAngle()
}, 500)

async function saveAngle() {
  if (!cameraId.value) return

  saving.value = true
  try {
    const success = await cameraStore.setCameraAngle(cameraId.value, angleX.value, angleY.value)
    if (success) {
      useToast().add({
        title: 'Camera angle updated',
        color: 'success',
        icon: 'i-lucide-check'
      })
    } else {
      useToast().add({
        title: 'Failed to update camera angle',
        color: 'error',
        icon: 'i-lucide-x'
      })
    }
  } finally {
    saving.value = false
  }
}

function adjustAngle(axis: 'x' | 'y', delta: number) {
  if (axis === 'x') {
    angleX.value = Math.max(0, Math.min(180, angleX.value + delta))
  } else {
    angleY.value = Math.max(0, Math.min(180, angleY.value + delta))
  }
  debouncedSetAngle()
}

function resetToCenter() {
  angleX.value = 90
  angleY.value = 90
  debouncedSetAngle()
}

// Keyboard controls
function handleKeydown(event: KeyboardEvent) {
  // Don't trigger if user is typing in an input
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return
  }

  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      adjustAngle('y', 5)
      break
    case 'ArrowDown':
      event.preventDefault()
      adjustAngle('y', -5)
      break
    case 'ArrowLeft':
      event.preventDefault()
      adjustAngle('x', -5)
      break
    case 'ArrowRight':
      event.preventDefault()
      adjustAngle('x', 5)
      break
    case ' ':
      event.preventDefault()
      resetToCenter()
      break
  }
}

function setupKeyboardControls() {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown)
  }
}

function removeKeyboardControls() {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
}
</script>

<style scoped>
/* TV Static Effect - CSS-based noise */
.tv-static {
  background-color: #1a1a1a;
  position: relative;
  overflow: hidden;
}

.tv-static::before {
  content: '';
  position: absolute;
  inset: -50%;
  width: 200%;
  height: 200%;
  background-image:
    repeating-radial-gradient(circle at 17% 32%, #fff 0px, transparent 1px),
    repeating-radial-gradient(circle at 83% 67%, #fff 0px, transparent 1px),
    repeating-radial-gradient(circle at 52% 15%, #fff 0px, transparent 1px),
    repeating-radial-gradient(circle at 31% 78%, #fff 0px, transparent 1px),
    repeating-radial-gradient(circle at 68% 43%, #fff 0px, transparent 1px);
  background-size: 3px 3px, 5px 5px, 4px 4px, 6px 6px, 3px 3px;
  opacity: 0.3;
  animation: staticMove 0.15s steps(8) infinite;
  pointer-events: none;
}

.tv-static::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.15) 2px,
    rgba(0, 0, 0, 0.15) 4px
  );
  pointer-events: none;
}

@keyframes staticMove {
  0% { transform: translate(0, 0); }
  12.5% { transform: translate(-2%, -3%); }
  25% { transform: translate(-4%, 2%); }
  37.5% { transform: translate(3%, -1%); }
  50% { transform: translate(-1%, 4%); }
  62.5% { transform: translate(2%, -2%); }
  75% { transform: translate(-3%, 1%); }
  87.5% { transform: translate(1%, 3%); }
  100% { transform: translate(0, 0); }
}
</style>
