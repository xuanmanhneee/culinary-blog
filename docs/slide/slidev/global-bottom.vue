<script setup>
import { computed } from 'vue'
import { useNav } from '@slidev/client'

const { currentPage, currentLayout, total } = useNav()
const hidden = computed(() => ['cover', 'end'].includes(currentLayout.value))
</script>

<template>
  <div v-if="!hidden" class="footer">
    <span>Culinary Blog · Báo cáo môn học · Nhóm 10</span>
    <span>{{ currentPage }} / {{ total }}</span>
  </div>
</template>

<style scoped>
.footer {
  position: absolute;
  left: 52px;
  right: 52px;
  bottom: 14px;
  z-index: 20;
  pointer-events: none;
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  letter-spacing: 0.04em;
  color: #8a7e73;
  border-top: 1px solid #dccfbf;
  padding-top: 6px;
}
</style>
