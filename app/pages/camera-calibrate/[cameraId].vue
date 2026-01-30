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
                      <span class="text-neutral-500">Y +1°</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <UKbd>↓</UKbd>
                      <span class="text-neutral-500">Y -1°</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <UKbd>←</UKbd>
                      <span class="text-neutral-500">X -1°</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <UKbd>→</UKbd>
                      <span class="text-neutral-500">X +1°</span>
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
              <!-- Glitter sparkle overlay -->
              <div class="glitter-layer" />

              <div class="absolute inset-0 flex flex-col items-center justify-center z-10">
                <div class="bg-black/70 backdrop-blur-sm rounded-xl px-8 py-6 flex flex-col items-center border border-white/10 shadow-2xl">
                  <div class="relative">
                    <UIcon name="i-lucide-tv" class="size-16 mb-3 text-neutral-300 animate-pulse" />
                    <div class="absolute -top-1 -right-1 size-3 bg-red-500 rounded-full animate-ping" />
                  </div>
                  <p class="text-2xl font-bold text-white tracking-wider">
                    NO SIGNAL
                  </p>
                  <p class="text-sm mt-2 text-neutral-400 text-center max-w-xs">
                    {{ streamError || (camera.rtspUrl ? 'Connecting to stream...' : 'RTSP URL not configured') }}
                  </p>
                  <p v-if="camera.rtspUrl" class="text-[10px] mt-3 text-neutral-500 text-center max-w-xs break-all font-mono bg-black/30 px-3 py-1 rounded">
                    {{ camera.rtspUrl }}
                  </p>
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
                ref="btnUp"
                icon="i-lucide-chevron-up"
                color="neutral"
                variant="outline"
                size="xl"
                :class="{ 'scale-90 brightness-75': pressedKey === 'up' }"
                class="transition-all duration-75"
                :disabled="angleY >= 180"
                @click="adjustAngle('y', 1)"
              />
              <div class="flex gap-2">
                <UButton
                  ref="btnLeft"
                  icon="i-lucide-chevron-left"
                  color="neutral"
                  variant="outline"
                  size="xl"
                  :class="{ 'scale-90 brightness-75': pressedKey === 'left' }"
                  class="transition-all duration-75"
                  :disabled="angleX <= 0"
                  @click="adjustAngle('x', -1)"
                />
                <UButton
                  ref="btnCenter"
                  label="Reset"
                  color="primary"
                  variant="soft"
                  size="xl"
                  :class="{ 'scale-90 brightness-75': pressedKey === 'center' }"
                  class="text-xs transition-all duration-75"
                  @click="resetToCenter"
                />
                <UButton
                  ref="btnRight"
                  icon="i-lucide-chevron-right"
                  color="neutral"
                  variant="outline"
                  size="xl"
                  :class="{ 'scale-90 brightness-75': pressedKey === 'right' }"
                  class="transition-all duration-75"
                  :disabled="angleX >= 180"
                  @click="adjustAngle('x', 1)"
                />
              </div>
              <UButton
                ref="btnDown"
                icon="i-lucide-chevron-down"
                color="neutral"
                variant="outline"
                size="xl"
                :class="{ 'scale-90 brightness-75': pressedKey === 'down' }"
                class="transition-all duration-75"
                :disabled="angleY <= 0"
                @click="adjustAngle('y', -1)"
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
const toast = useToast()

const cameraId = computed(() => route.params.cameraId as string)

const camera = ref<Camera | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)
const streamActive = ref(false)
const videoElement = ref<HTMLVideoElement | null>(null)
const staticCanvas = ref<HTMLCanvasElement | null>(null)
const hlsInstance = ref<Hls | null>(null)
const streamError = ref<string | null>(null)

// Angle state
const angleX = ref(90)
const angleY = ref(90)

// Pressed key state for button animation
const pressedKey = ref<'up' | 'down' | 'left' | 'right' | 'center' | null>(null)

// Helper to trigger press animation
function triggerPress(key: 'up' | 'down' | 'left' | 'right' | 'center') {
  pressedKey.value = key
  setTimeout(() => {
    pressedKey.value = null
  }, 100)
}

// Define keyboard shortcuts using Nuxt
defineShortcuts({
  'arrowup': {
    handler: () => {
      if (angleY.value < 180) {
        triggerPress('up')
        adjustAngle('y', 1)
      }
    }
  },
  'arrowdown': {
    handler: () => {
      if (angleY.value > 0) {
        triggerPress('down')
        adjustAngle('y', -1)
      }
    }
  },
  'arrowleft': {
    handler: () => {
      if (angleX.value > 0) {
        triggerPress('left')
        adjustAngle('x', -1)
      }
    }
  },
  'arrowright': {
    handler: () => {
      if (angleX.value < 180) {
        triggerPress('right')
        adjustAngle('x', 1)
      }
    }
  },
  ' ': {
    handler: () => {
      triggerPress('center')
      resetToCenter()
    }
  }
})

// Fetch camera details on mount
onMounted(async () => {
  await fetchCameraDetails()
  initializeStream()
})

onUnmounted(() => {
  destroyHls()
  cameraStore.clearCamera()
})

function destroyHls() {
  if (hlsInstance.value) {
    hlsInstance.value.destroy()
    hlsInstance.value = null
  }
}

// TV Static noise animation
let staticAnimationId: number | null = null

function startStaticNoise() {
  const canvas = staticCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Set canvas size to match container
  const updateCanvasSize = () => {
    if (canvas.parentElement) {
      canvas.width = canvas.parentElement.offsetWidth
      canvas.height = canvas.parentElement.offsetHeight
    }
  }
  updateCanvasSize()

  const drawNoise = () => {
    const imageData = ctx.createImageData(canvas.width, canvas.height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255
      data[i] = value // red
      data[i + 1] = value // green
      data[i + 2] = value // blue
      data[i + 3] = 255 // alpha
    }

    ctx.putImageData(imageData, 0, 0)
    staticAnimationId = requestAnimationFrame(drawNoise)
  }

  drawNoise()
}

function stopStaticNoise() {
  if (staticAnimationId) {
    cancelAnimationFrame(staticAnimationId)
    staticAnimationId = null
  }
}

// Watch streamActive to start/stop static noise
watch(streamActive, (active) => {
  if (!active) {
    nextTick(() => startStaticNoise())
  } else {
    stopStaticNoise()
  }
}, { immediate: true })

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
  streamActive.value = false

  try {
    // Backend converts RTSP to HLS and serves it at this endpoint
    const hlsUrl = `/api/v2/camera/stream/${cameraId.value}/index.m3u8`

    if (typeof window !== 'undefined') {
      // Check if HLS is supported natively (Safari)
      if (videoElement.value.canPlayType('application/vnd.apple.mpegurl')) {
        // Remove old listeners first
        const newVideo = videoElement.value.cloneNode(false) as HTMLVideoElement
        videoElement.value.parentNode?.replaceChild(newVideo, videoElement.value)
        videoElement.value = newVideo

        videoElement.value.src = hlsUrl

        videoElement.value.addEventListener('loadedmetadata', () => {
          streamActive.value = true
          streamError.value = null
          videoElement.value?.play().catch(console.error)
        }, { once: true })

        videoElement.value.addEventListener('error', () => {
          streamActive.value = false
          streamError.value = 'Stream not available'
        }, { once: true })
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
}, 300)

async function saveAngle() {
  if (!cameraId.value) return

  saving.value = true
  try {
    const success = await cameraStore.setCameraAngle(cameraId.value, angleX.value, angleY.value)
    if (success) {
      toast.add({
        title: 'Camera angle updated',
        color: 'success',
        icon: 'i-lucide-check'
      })
    } else {
      toast.add({
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
</script>

<style scoped>
/* No additional styles needed - using canvas for TV static */
</style>
