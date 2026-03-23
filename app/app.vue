<script setup lang="ts">
const colorMode = useColorMode();

const color = computed(() =>
  colorMode.value === "dark" ? "#1b1718" : "white",
);

useHead({
  meta: [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { key: "theme-color", name: "theme-color", content: color },
  ],
  link: [{ rel: "icon", href: "/favicon.ico" }],
  htmlAttrs: {
    lang: "en",
  },
});

const title = "OT-Software";
const description =
  "OT-Software Real Time Survey Progress Dashboard - Monitoring active reactor inspections and component life cycle phases.";

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: "https://ui.nuxt.com/assets/templates/nuxt/dashboard-light.png",
  twitterImage: "https://ui.nuxt.com/assets/templates/nuxt/dashboard-light.png",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <UApp
    :toaster="{
      duration: 3000,
    }"
  >
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
