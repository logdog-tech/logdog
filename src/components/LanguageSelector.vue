<template>
  <div class="language-selector">
    <select v-model="currentLocale" @change="changeLocale" class="select-locale">
      <option value="zh">中文</option>
      <option value="en">English</option>
      <option value="ja">日本語</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const currentLocale = ref(locale.value)

const changeLocale = () => {
  locale.value = currentLocale.value
  localStorage.setItem('locale', currentLocale.value)
}

onMounted(() => {
  const savedLocale = localStorage.getItem('locale')
  if (savedLocale) {
    currentLocale.value = savedLocale
    locale.value = savedLocale
  }
})
</script>

<style scoped>
.language-selector {
  padding: 8px;
}

.select-locale {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background-color: white;
  cursor: pointer;
}

.select-locale:hover {
  border-color: #666;
}
</style>
