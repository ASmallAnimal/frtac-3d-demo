<template>
  <v-app-bar
    flat
    color="surface"
    class="border-b flex-column"
    elevation="1"
    style="height: auto; position: relative;"
  >
    <!-- 第一行：Logo + el-tabs -->
    <div class="d-flex align-center w-100 px-3" style="height: 36px;">
      <v-avatar color="primary" size="26" class="mr-2" rounded="md">
        <v-icon icon="mdi-cube-outline" color="white" size="16" />
      </v-avatar>

      <span class="text-primary font-weight-bold mr-4" style="font-size: 14px;">
        FRTAC 3D
      </span>

      <el-tabs
        v-model="activeTab"
        type="card"
        class="ribbon-tabs flex-1"
      >
        <el-tab-pane
          v-for="tab in tabs"
          :key="tab.key"
          :label="tab.label"
          :name="tab.key"
        />
      </el-tabs>
    </div>

    <!-- 第二行：Ribbon 面板 -->
    <v-sheet
      v-show="activeTab"
      color="surface"
      class="w-100 ribbon-panel px-3 d-flex align-center"
      elevation="0"
    >
      <!-- 文件 -->
      <div v-if="activeTab === 'file'" class="d-flex align-center gap-2 h-100">
        <v-btn
          size="small"
          prepend-icon="mdi-upload"
          color="primary"
          variant="tonal"
          class="text-none"
          style="font-size: 12px;"
          @click="onLoadJson"
        >
          {{ $t('menu.loadJson') }}
        </v-btn>
        <v-divider vertical class="mx-1 h-75" />
        <v-btn
          size="small"
          prepend-icon="mdi-content-save"
          color="primary"
          variant="flat"
          class="text-none"
          style="font-size: 12px;"
          @click="onSave"
        >
          {{ $t('menu.save') }}
        </v-btn>
      </div>

      <!-- 编辑 -->
      <div v-else-if="activeTab === 'edit'" class="d-flex align-center gap-2 h-100">
        <span class="text-caption text-disabled" style="font-size: 12px;">{{ $t('menu.edit') }}</span>
      </div>

      <!-- 视图 -->
      <div v-else-if="activeTab === 'view'" class="d-flex align-center gap-1 h-100">
        <v-btn
          v-for="v in viewButtons"
          :key="v.key"
          size="small"
          variant="tonal"
          color="primary"
          class="text-none px-2"
          style="font-size: 12px;"
          @click="emit(v.emit)"
        >
          {{ v.label }}
        </v-btn>
      </div>

      <!-- 工具 -->
      <div v-else-if="activeTab === 'tools'" class="d-flex align-center gap-2 h-100">
        <div class="d-flex flex-column">
          <span class="text-caption text-primary font-weight-medium mb-1" style="font-size: 11px;">{{ $t('menu.language') }}</span>
          <div class="d-flex gap-1">
            <v-btn
              v-for="lang in languages"
              :key="lang.code"
              size="x-small"
              :variant="currentLang === lang.code ? 'flat' : 'outlined'"
              :color="currentLang === lang.code ? 'primary' : 'secondary'"
              class="text-none"
              style="font-size: 11px;"
              @click="changeLang(lang.code)"
            >
              {{ lang.name }}
            </v-btn>
          </div>
        </div>
      </div>

      <!-- 帮助 -->
      <div v-else-if="activeTab === 'help'" class="d-flex align-center gap-2 h-100">
        <span class="text-caption text-disabled" style="font-size: 12px;">{{ $t('menu.help') }}</span>
      </div>
    </v-sheet>
  </v-app-bar>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale } from '../i18n/index.js'

const { locale, t } = useI18n()
const emit = defineEmits(['load-json', 'save', 'view-front', 'view-left', 'view-top', 'view-fit'])

const activeTab = ref('file')
const currentLang = computed(() => locale.value)

const tabs = [
  { key: 'file', label: t('menu.file') },
  { key: 'edit', label: t('menu.edit') },
  { key: 'view', label: t('menu.view') },
  { key: 'tools', label: t('menu.tools') },
  { key: 'help', label: t('menu.help') },
]

const viewButtons = [
  { key: 'front', label: t('scene3D.frontView'), emit: 'view-front' },
  { key: 'left', label: t('scene3D.leftView'), emit: 'view-left' },
  { key: 'top', label: t('scene3D.topView'), emit: 'view-top' },
  { key: 'fit', label: t('scene3D.fitWindow'), emit: 'view-fit' },
]

const languages = [
  { code: 'zh', name: t('lang.zh') },
  { code: 'en', name: t('lang.en') },
]

const onLoadJson = () => emit('load-json')
const onSave = () => emit('save')

const changeLang = (lang) => {
  setLocale(lang)
}
</script>

<style scoped>
.border-b {
  border-bottom: 1px solid rgba(59, 130, 246, 0.12);
}
.flex-column {
  flex-direction: column;
}
.ribbon-panel {
  height: 40px;
  border-top: 1px solid rgba(59, 130, 246, 0.08);
}
.h-100 {
  height: 100%;
}
</style>

<style>
/* ElementPlus Tabs 样式覆盖：紧凑 Ribbon 风格 */
.ribbon-tabs .el-tabs__header {
  margin: 0;
  border-bottom: none;
}
.ribbon-tabs .el-tabs__nav {
  border: none !important;
  border-radius: 0;
}
.ribbon-tabs .el-tabs__item {
  height: 26px;
  line-height: 26px;
  padding: 0 12px !important;
  font-size: 13px;
  color: #64748b;
  border: none !important;
  border-bottom: 2px solid transparent !important;
  transition: all 0.2s;
}
.ribbon-tabs .el-tabs__item.is-active {
  color: #3b82f6;
  border-bottom-color: #3b82f6 !important;
  background: rgba(59, 130, 246, 0.06);
}
.ribbon-tabs .el-tabs__item:hover {
  color: #3b82f6;
}
.ribbon-tabs .el-tabs__nav-wrap::after {
  display: none;
}
</style>
