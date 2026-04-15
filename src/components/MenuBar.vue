<template>
  <v-app-bar flat color="surface" density="compact" class="px-2">
    <div class="d-flex align-center gap-4">
      <span class="text-h6 font-weight-bold text-secondary">FRTAC 3D</span>
      <v-btn variant="text" size="small" @click="onFileClick">文件</v-btn>
      <v-btn variant="text" size="small" @click="onEditClick">编辑</v-btn>
      <v-btn variant="text" size="small" @click="onViewClick">视图</v-btn>
      <v-btn variant="text" size="small" @click="onToolsClick">工具</v-btn>
      <v-btn variant="text" size="small" @click="onHelpClick">帮助</v-btn>
    </div>
    <v-spacer />
    <v-btn variant="outlined" size="small" prepend-icon="mdi-upload" @click="onLoadJson">
      加载JSON
    </v-btn>
    <v-btn variant="flat" color="primary" size="small" class="ml-2" prepend-icon="mdi-content-save" @click="onSave">
      保存
    </v-btn>
  </v-app-bar>
</template>

<script setup>
const emit = defineEmits(['load-json', 'save', 'file', 'edit', 'view', 'tools', 'help'])

const onLoadJson = () => emit('load-json')
const onSave = () => emit('save')
const onFileClick = () => emit('file')
const onEditClick = () => emit('edit')
const onViewClick = () => emit('view')
const onToolsClick = () => emit('tools')
const onHelpClick = () => emit('help')
</script>

<style scoped>
.gap-4 {
  gap: 4px;
}
</style>
