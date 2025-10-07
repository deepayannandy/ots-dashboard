<template>
  <UApp>
    <UHeader>
      <template #title>
        <img class="h-10 w-auto" src="/ots.jpeg" />
      </template>
    </UHeader>

    <UMain>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>
    <!-- <UFooter>
      <p class="text-muted text-sm">
        Copyright © {{ new Date().getFullYear() }}
      </p>
    </UFooter> -->
  </UApp>
</template>
