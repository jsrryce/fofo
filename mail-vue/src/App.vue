<template>
  <el-config-provider :locale="settingStore.lang === 'zh' ? zhCn : null">
    <router-view />
  </el-config-provider>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { watch } from "vue";
import { useSettingStore } from "@/store/setting.js";
const settingStore = useSettingStore()
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import('@/icons/index.js')

const { locale } = useI18n()

// ★ 修改点 1：初始化语言时使用 localStorage，而不是 store
locale.value = localStorage.getItem("lang") || "en"

// ★ 修改点 2：监听 store.lang，让 UI 自动切换语言（无需刷新）
watch(() => settingStore.lang, (val) => {
  locale.value = val
})
</script>
