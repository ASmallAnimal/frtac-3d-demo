<template>
  <v-sheet color="surface" class="d-flex flex-column fill-height" rounded="0">
    <v-toolbar density="compact" color="transparent" flat class="px-4">
      <v-toolbar-title class="text-body-1 font-weight-semibold">属性编辑</v-toolbar-title>
    </v-toolbar>
    <v-divider />
    <v-container v-if="selectedElement" fluid class="overflow-y-auto flex-1 py-2">
      <v-card variant="outlined" class="mb-3">
        <v-card-subtitle class="pt-3 pb-1 text-caption font-weight-bold text-uppercase text-secondary">
          基本信息
        </v-card-subtitle>
        <v-card-text class="pt-1">
          <v-text-field v-model="selectedElement.id" label="ID" variant="outlined" density="compact" hide-details disabled />
          <v-text-field v-model="selectedElement.name" label="名称" variant="outlined" density="compact" hide-details class="mt-2" />
          <v-text-field v-model="selectedElement.type" label="类型" variant="outlined" density="compact" hide-details disabled class="mt-2" />
        </v-card-text>
      </v-card>

      <v-card variant="outlined" class="mb-3">
        <v-card-subtitle class="pt-3 pb-1 text-caption font-weight-bold text-uppercase text-secondary">
          几何参数
        </v-card-subtitle>
        <v-card-text class="pt-1">
          <v-text-field v-model.number="selectedElement.length" label="长度 L (m)" type="number" step="0.01" variant="outlined" density="compact" hide-details />
          <v-text-field v-model.number="selectedElement.flowArea" label="流通面积 A (m²)" type="number" step="0.0001" variant="outlined" density="compact" hide-details class="mt-2" />
          <v-text-field v-model.number="selectedElement.wettedPerimeter" label="湿周 χ (m)" type="number" step="0.0001" variant="outlined" density="compact" hide-details class="mt-2" />
          <v-text-field v-model.number="selectedElement.nodeNum" label="节点数" type="number" min="1" variant="outlined" density="compact" hide-details class="mt-2" />
        </v-card-text>
      </v-card>

      <v-card variant="outlined" class="mb-3">
        <v-card-subtitle class="pt-3 pb-1 text-caption font-weight-bold text-uppercase text-secondary">
          方向角
        </v-card-subtitle>
        <v-card-text class="pt-1">
          <v-text-field v-model.number="selectedElement.zenithAngle" label="天顶角 θ (°)" type="number" step="1" variant="outlined" density="compact" hide-details />
          <v-text-field v-model.number="selectedElement.azimuthAngle" label="方位角 ϕ (°)" type="number" step="1" variant="outlined" density="compact" hide-details class="mt-2" />
        </v-card-text>
      </v-card>

      <v-card v-if="selectedElement.type === 'Pipe'" variant="outlined" class="mb-3">
        <v-card-subtitle class="pt-3 pb-1 text-caption font-weight-bold text-uppercase text-secondary">
          管道特性
        </v-card-subtitle>
        <v-card-text class="pt-1">
          <v-select v-model="selectedElement.fricMode" :items="['DEFAULT', 'CUSTOM']" label="摩擦模式" variant="outlined" density="compact" hide-details />
          <v-text-field :value="selectedElement.sampling?.join(', ')" label="采样点" placeholder="0, 1, 2..." variant="outlined" density="compact" hide-details class="mt-2" @input="updateSampling" />
        </v-card-text>
      </v-card>

      <v-card v-if="selectedElement.type === 'Pump'" variant="outlined" class="mb-3">
        <v-card-subtitle class="pt-3 pb-1 text-caption font-weight-bold text-uppercase text-secondary">
          泵特性
        </v-card-subtitle>
        <v-card-text class="pt-1">
          <v-text-field v-model.number="selectedElement.ratedHead" label="额定扬程 (m)" type="number" step="0.1" variant="outlined" density="compact" hide-details />
          <v-text-field v-model.number="selectedElement.ratedFlow" label="额定流量 (m³/s)" type="number" step="0.001" variant="outlined" density="compact" hide-details class="mt-2" />
        </v-card-text>
      </v-card>

      <v-card v-if="selectedElement.type === 'Valve'" variant="outlined" class="mb-3">
        <v-card-subtitle class="pt-3 pb-1 text-caption font-weight-bold text-uppercase text-secondary">
          阀门特性
        </v-card-subtitle>
        <v-card-text class="pt-1">
          <v-text-field v-model.number="selectedElement.valveArea" label="阀门开度面积 (m²)" type="number" step="0.0001" variant="outlined" density="compact" hide-details />
          <v-select v-model="selectedElement.isOpen" :items="[{title:'开启', value:true}, {title:'关闭', value:false}]" item-title="title" item-value="value" label="阀门状态" variant="outlined" density="compact" hide-details class="mt-2" />
        </v-card-text>
      </v-card>

      <div class="d-flex gap-2 mt-2">
        <v-btn color="primary" variant="flat" class="flex-1" @click="saveChanges">应用更改</v-btn>
        <v-btn variant="outlined" class="flex-1" @click="resetChanges">重置</v-btn>
      </div>
    </v-container>

    <v-container v-else fluid class="d-flex flex-column align-center justify-center fill-height text-disabled">
      <v-icon icon="mdi-clipboard-text-outline" size="64" class="mb-4 opacity-50" />
      <div class="text-body-2">选择组件以编辑属性</div>
    </v-container>
  </v-sheet>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  element: Object
})

const emit = defineEmits(['update'])

const selectedElement = ref(null)
const originalElement = ref(null)

watch(() => props.element, (newElement) => {
  if (newElement) {
    selectedElement.value = JSON.parse(JSON.stringify(newElement))
    originalElement.value = JSON.parse(JSON.stringify(newElement))
  } else {
    selectedElement.value = null
    originalElement.value = null
  }
}, { immediate: true })

const updateSampling = (e) => {
  const value = e.target.value
  if (selectedElement.value && selectedElement.value.type === 'Pipe') {
    selectedElement.value.sampling = value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v))
  }
}

const saveChanges = () => {
  if (selectedElement.value) {
    emit('update', selectedElement.value)
  }
}

const resetChanges = () => {
  if (originalElement.value) {
    selectedElement.value = JSON.parse(JSON.stringify(originalElement.value))
  }
}
</script>

<style scoped>
.flex-1 {
  flex: 1;
}
.gap-2 {
  gap: 8px;
}
</style>
