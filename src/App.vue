<template>
  <v-app class="bg-background">
    <!-- 顶部菜单栏 -->
    <MenuBar @load-json="loadSystemJson" @save="saveProject" />

    <v-main class="pa-0">
      <v-container fluid class="fill-height pa-0">
        <v-row no-gutters class="fill-height">
          <!-- 左侧：系统树状目录 -->
          <v-col cols="auto" class="panel-left">
            <SystemTree />
          </v-col>

          <v-divider vertical />

          <!-- 中部：3D 场景 -->
          <v-col class="panel-center">
            <Scene3D />
          </v-col>

          <v-divider vertical />

          <!-- 右侧：属性编辑 -->
          <v-col cols="auto" class="panel-right">
            <PropertyPanel :element="selectedElement" @update="onUpdateElement" />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { computed } from 'vue'
import MenuBar from './components/MenuBar.vue'
import SystemTree from './components/SystemTree.vue'
import Scene3D from './components/Scene3D.vue'
import PropertyPanel from './components/PropertyPanel.vue'
import { useTopologyStore } from './store/topologyStore.ts'
import systemJson from './examples/system.json'
import { typeCodeToElementType } from './models/hydro/topology.ts'

const store = useTopologyStore()
const selectedElement = computed(() => store.selectedElement)

/**
 * 解析 JSON 中的 HYDRO 数据为 TopologyData
 */
function parseHydroData(hydroData) {
  const circuits = {}

  for (const [circuitName, circuitRaw] of Object.entries(hydroData)) {
    const elements = {}

    for (const [elementId, elementRaw] of Object.entries(circuitRaw.ELEMENT || {})) {
      const base = {
        id: elementId,
        name: elementId,
        type: typeCodeToElementType(elementRaw.TYPE),
        length: elementRaw.L,
        flowArea: elementRaw.A,
        wettedPerimeter: elementRaw['\u03c7'], // χ
        nodeNum: elementRaw.NODE_NUM,
        zenithAngle: elementRaw['\u03b8'], // θ
        azimuthAngle: elementRaw['\u03d5'], // ϕ
      }

      // 根据类型补充特有字段
      switch (base.type) {
        case 'Pipe':
          elements[elementId] = {
            ...base,
            fricMode: elementRaw.FRIC_MODE,
            sampling: elementRaw.SAMPLING,
          }
          break
        default:
          elements[elementId] = base
      }
    }

    // 将 JSON 的邻接表转换为 Connection 数组
    const connections = [];
    const linkTableRaw = circuitRaw.LINKTABLE || {};
    for (const [fromId, toIds] of Object.entries(linkTableRaw)) {
      if (Array.isArray(toIds)) {
        for (const toId of toIds) {
          connections.push({
            id: `${fromId}->${toId}`,
            fromId,
            toId,
          });
        }
      }
    }

    circuits[circuitName] = {
      medium: circuitRaw.MEDIUM,
      criticalFlow: circuitRaw.CRITICAL_FLOW,
      elements,
      connections,
    }
  }

  return { circuits }
}

// 初始化：自动加载示例 JSON
const topologyData = parseHydroData(systemJson.HYDRO)
store.initTopology(topologyData)

function loadSystemJson() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,application/json'
  input.onchange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result)
        if (json.HYDRO) {
          store.initTopology(parseHydroData(json.HYDRO))
        } else {
          alert('JSON 文件中未找到 HYDRO 字段')
        }
      } catch (err) {
        alert('JSON 解析失败：' + err.message)
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

function saveProject() {
  console.log('保存项目', store.circuits)
  alert('项目已保存到控制台')
}

function onUpdateElement(updatedElement) {
  store.updateElementInCircuit(
    store.currentCircuitName,
    updatedElement.id,
    updatedElement
  )
  store.setSelectedElement(updatedElement)
}
</script>

<style scoped>
.panel-left {
  width: 260px;
  min-width: 220px;
  max-width: 360px;
}

.panel-right {
  width: 320px;
  min-width: 280px;
  max-width: 420px;
}

.panel-center {
  min-width: 0;
  position: relative;
}

@media (max-width: 900px) {
  .panel-left {
    width: 200px;
  }
  .panel-right {
    width: 240px;
  }
}
</style>
