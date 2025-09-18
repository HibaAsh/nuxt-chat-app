<template>
  <NuxtLayout>
    <Transition name="fade" mode="out-in">
      <NuxtPage />
    </Transition>
  </NuxtLayout>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
  position: absolute; /* prevents reflow during swap */
  width: 100%;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
