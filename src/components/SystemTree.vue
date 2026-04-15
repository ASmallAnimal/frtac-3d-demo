<template>
  <v-sheet color="surface" class="d-flex flex-column fill-height" rounded="0">
    <v-toolbar density="compact" color="transparent" flat class="px-2">
      <v-toolbar-title class="text-body-1 font-weight-semibold">系统目录</v-toolbar-title>
      <v-chip size="x-small" color="secondary" variant="tonal">{{ totalElements }} 个组件</v-chip>
    </v-toolbar>
    <v-divider />
    <v-list density="compact" nav class="flex-1 overflow-y-auto py-1">
      <v-list-group
        v-for="(circuit, circuitName) in circuits"
        :key="circuitName"
        :value="circuitName"
      >
        <template #activator="{ props: listProps }">
          <v-list-item
            v-bind="listProps"
            :active="currentCircuitName === circuitName"
            color="primary"
            @click="selectCircuit(circuitName)"
          >
            <template #prepend>
              <v-icon icon="mdi-lightning-bolt" size="small" />
            </template>
            <v-list-item-title class="text-body-2 font-weight-medium">
              {{ circuitName }}
            </v-list-item-title>
            <template #append>
              <v-chip size="x-small" color="secondary" variant="tonal" class="ml-2">
                {{ circuit.medium }}
              </v-chip>
            </template>
          </v-list-item>
        </template>
        <v-list-item
          v-for="element in getElementsArray(circuit)"
          :key="element.id"
          :active="selectedElement?.id === element.id"
          color="primary"
          class="pl-6"
          @click="selectElement(element)"
        >
          <template #prepend>
            <v-icon :icon="getElementIcon(element.type)" size="small" />
          </template>
          <v-list-item-title class="text-caption">
            {{ element.name || element.id }}
          </v-list-item-title>
          <template #append>
            <v-chip size="x-small" color="default" variant="tonal">
              {{ element.type }}
            </v-chip>
          </template>
        </v-list-item>
      </v-list-group>
    </v-list>
  </v-sheet>
</template>

<script setup>
import { computed } from 'vue'
import { useTopologyStore } from '../store/topologyStore.ts'

const store = useTopologyStore()

const circuits = computed(() => store.circuits)
const currentCircuitName = computed(() => store.currentCircuitName)
const totalElements = computed(() => store.totalElementsAllCircuits)
const selectedElement = computed(() => store.selectedElement)

const selectCircuit = (circuitName) => {
  store.selectCircuit(circuitName)
}

const getElementsArray = (circuit) => {
  return Object.values(circuit.elements || {})
}

const selectElement = (element) => {
  store.setSelectedElement(element)
}

const getElementIcon = (type) => {
  const icons = {
    'Pipe': 'mdi-pipe',
    'Pump': 'mdi-pump',
    'Valve': 'mdi-valve',
    'TimeDependentVolume': 'mdi-cube-outline',
    'TimeDependentJunction': 'mdi-source-branch',
    'Bufffertank': 'mdi-cylinder',
    'Pool': 'mdi-water'
  }
  return icons[type] || 'mdi-shape-outline'
}
</script>

<style scoped>
.flex-1 {
  flex: 1;
}
</style>
