<!-- StatsView.vue -->
<template>
  <main class="page">
    <FisherStats :fisher="fisher" />
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;

  /* Heller Hintergrund + dunkler Text */
  background: #0b1220;     /* sehr helles Grau/Blau */
  color: #ffffff;          /* sehr dunkles Blau statt weiß */
}

/* Falls FisherStats eine weiße Karte hat: leichte Schatten/Kontrast */
:deep(.card) {
  background: #0b1220;
  color: #ffffff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}
</style>
