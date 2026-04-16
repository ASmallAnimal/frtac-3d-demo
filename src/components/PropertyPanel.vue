<template>
  <v-sheet color="surface" class="d-flex flex-column fill-height" rounded="0">
    <v-toolbar density="compact" color="transparent" flat class="px-4">
      <v-toolbar-title class="text-body-1 font-weight-semibold text-primary">{{ $t('propertyPanel.title') }}</v-toolbar-title>
    </v-toolbar>
    <v-divider class="border-opacity-25" />
    <v-container v-if="selectedElement" fluid class="overflow-y-auto flex-1 py-2" bg-color="surface">
      <v-card variant="outlined" class="mb-3 border-light-blue">
        <v-card-subtitle class="pt-3 pb-1 text-caption font-weight-bold text-uppercase text-primary">
          {{ $t('propertyPanel.basicInfo') }}
        </v-card-subtitle>
        <v-card-text class="pt-1">
          <v-text-field v-model="selectedElement.id" :label="$t('propertyPanel.id')" variant="outlined" density="compact" hide-details disabled bg-color="surface" />
          <v-text-field v-model="selectedElement.name" :label="$t('propertyPanel.name')" variant="outlined" density="compact" hide-details class="mt-2" bg-color="surface" />
          <v-text-field v-model="selectedElement.type" :label="$t('propertyPanel.type')" variant="outlined" density="compact" hide-details disabled class="mt-2" bg-color="surface" />
        </v-card-text>
      </v-card>

      <v-card variant="outlined" class="mb-3 border-light-blue">
        <v-card-subtitle class="pt-3 pb-1 text-caption font-weight-bold text-uppercase text-primary">
          {{ $t('propertyPanel.geometry') }}
        </v-card-subtitle>
        <v-card-text class="pt-1">
          <v-text-field v-model.number="selectedElement.length" :label="$t('propertyPanel.length')" type="number" step="0.01" variant="outlined" density="compact" hide-details bg-color="surface" />
          <v-text-field v-model.number="selectedElement.flowArea" :label="$t('propertyPanel.flowArea')" type="number" step="0.0001" variant="outlined" density="compact" hide-details class="mt-2" bg-color="surface" />
          <v-text-field v-model.number="selectedElement.wettedPerimeter" :label="$t('propertyPanel.wettedPerimeter')" type="number" step="0.0001" variant="outlined" density="compact" hide-details class="mt-2" bg-color="surface" />
          <v-text-field v-model.number="selectedElement.nodeNum" :label="$t('propertyPanel.nodeNum')" type="number" min="1" variant="outlined" density="compact" hide-details class="mt-2" bg-color="surface" />
        </v-card-text>
      </v-card>

      <v-card variant="outlined" class="mb-3 border-light-blue">
        <v-card-subtitle class="pt-3 pb-1 text-caption font-weight-bold text-uppercase text-primary">
          {{ $t('propertyPanel.orientation') }}
        </v-card-subtitle>
        <v-card-text class="pt-1">
          <v-text-field v-model.number="selectedElement.zenithAngle" :label="$t('propertyPanel.zenithAngle')" type="number" step="1" variant="outlined" density="compact" hide-details bg-color="surface" />
          <v-text-field v-model.number="selectedElement.azimuthAngle" :label="$t('propertyPanel.azimuthAngle')" type="number" step="1" variant="outlined" density="compact" hide-details class="mt-2" bg-color="surface" />
        </v-card-text>
      </v-card>

      <v-card v-if="selectedElement.type === 'Pipe'" variant="outlined" class="mb-3 border-light-blue">
        <v-card-subtitle class="pt-3 pb-1 text-caption font-weight-bold text-uppercase text-primary">
          {{ $t('propertyPanel.pipeProps') }}
        </v-card-subtitle>
        <v-card-text class="pt-1">
          <v-select v-model="selectedElement.fricMode" :items="['DEFAULT', 'CUSTOM']" :label="$t('propertyPanel.fricMode')" variant="outlined" density="compact" hide-details bg-color="surface" />
          <v-text-field :value="selectedElement.sampling?.join(', ')" :label="$t('propertyPanel.sampling')" placeholder="0, 1, 2..." variant="outlined" density="compact" hide-details class="mt-2" bg-color="surface" @input="updateSampling" />
        </v-card-text>
      </v-card>

      <v-card v-if="selectedElement.type === 'Pump'" variant="outlined" class="mb-3 border-light-blue">
        <v-card-subtitle class="pt-3 pb-1 text-caption font-weight-bold text-uppercase text-primary">
          {{ $t('propertyPanel.pumpProps') }}
        </v-card-subtitle>
        <v-card-text class="pt-1">
          <v-text-field v-model.number="selectedElement.ratedHead" :label="$t('propertyPanel.ratedHead')" type="number" step="0.1" variant="outlined" density="compact" hide-details bg-color="surface" />
          <v-text-field v-model.number="selectedElement.ratedFlow" :label="$t('propertyPanel.ratedFlow')" type="number" step="0.001" variant="outlined" density="compact" hide-details class="mt-2" bg-color="surface" />
        </v-card-text>
      </v-card>

      <v-card v-if="selectedElement.type === 'Valve'" variant="outlined" class="mb-3 border-light-blue">
        <v-card-subtitle class="pt-3 pb-1 text-caption font-weight-bold text-uppercase text-primary">
          {{ $t('propertyPanel.valveProps') }}
        </v-card-subtitle>
        <v-card-text class="pt-1">
          <v-text-field v-model.number="selectedElement.valveArea" :label="$t('propertyPanel.valveArea')" type="number" step="0.0001" variant="outlined" density="compact" hide-details bg-color="surface" />
          <v-select v-model="selectedElement.isOpen" :items="valveStateItems" item-title="title" item-value="value" :label="$t('propertyPanel.valveState')" variant="outlined" density="compact" hide-details class="mt-2" bg-color="surface" />
        </v-card-text>
      </v-card>

      <div class="d-flex gap-2 mt-2">
        <v-btn color="primary" variant="flat" class="flex-1" @click="saveChanges">{{ $t('propertyPanel.apply') }}</v-btn>
        <v-btn variant="outlined" color="primary" class="flex-1" @click="resetChanges">{{ $t('propertyPanel.reset') }}</v-btn>
      </div>
    </v-container>

    <v-container v-else fluid class="d-flex flex-column align-center justify-center fill-height text-disabled">
      <v-icon icon="mdi-clipboard-text-outline" size="64" class="mb-4 opacity-50" />
      <div class="text-body-2">{{ $t('propertyPanel.emptyHint') }}</div>
    </v-container>
  </v-sheet>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  element: Object
})

const emit = defineEmits(['update'])

const selectedElement = ref(null)
const originalElement = ref(null)

const valveStateItems = computed(() => [
  { title: t('propertyPanel.open'), value: true },
  { title: t('propertyPanel.closed'), value: false }
])

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
.border-light-blue {
  border-color: rgba(59, 130, 246, 0.25) !important;
}
</style>
