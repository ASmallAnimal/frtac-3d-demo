<template>
  <div class="scene-3d">
    <TresCanvas clear-color="#d9eaf7" @click="onCanvasClick">
      <TresPerspectiveCamera ref="cameraRef" />
      <MapControls ref="controlsRef" :screen-space-panning="true" />

      <TresAmbientLight color="#ffffff" :intensity="0.6" />
      <TresDirectionalLight :position="[10, 10, 10]" :intensity="0.8" />
      <TresDirectionalLight :position="[-10, -10, -10]" :intensity="0.4" />

      <TresGridHelper v-if="showGrid" :args="[20, 20, 0x888888, 0xcccccc]" />
      <TresAxesHelper v-if="showAxes" :args="[5]" />

      <template v-for="element in elements" :key="element.id">
        <HydraulicElement3D :element="element" />
      </template>
    </TresCanvas>

    <div class="axis-gizmo">
      <svg viewBox="0 0 100 100" width="80" height="80">
        <line :x1="50" :y1="50" :x2="50 + projX.x * 35" :y2="50 - projX.y * 35" stroke="#ff0000" stroke-width="3" stroke-linecap="round" />
        <line :x1="50" :y1="50" :x2="50 + projY.x * 35" :y2="50 - projY.y * 35" stroke="#00aa00" stroke-width="3" stroke-linecap="round" />
        <line :x1="50" :y1="50" :x2="50 + projZ.x * 35" :y2="50 - projZ.y * 35" stroke="#0066ff" stroke-width="3" stroke-linecap="round" />
        <text :x="50 + projX.x * 42" :y="50 - projX.y * 42" fill="#ff0000" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="middle">X</text>
        <text :x="50 + projY.x * 42" :y="50 - projY.y * 42" fill="#00aa00" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="middle">Y</text>
        <text :x="50 + projZ.x * 42" :y="50 - projZ.y * 42" fill="#0066ff" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="middle">Z</text>
      </svg>
    </div>

    <div class="scene-controls">
      <button class="control-btn text-btn" @click="setFrontView" title="正视图">正视图</button>
      <button class="control-btn text-btn" @click="setLeftView" title="左视图">左视图</button>
      <button class="control-btn text-btn" @click="setTopView" title="俯视图">俯视图</button>
      <button class="control-btn text-btn" @click="fitToWindow" title="适应窗口">适应窗口</button>
      <button class="control-btn" @click="showGrid = !showGrid" :class="{ active: showGrid }" title="显示/隐藏网格">⊞</button>
      <button class="control-btn" @click="showAxes = !showAxes" :class="{ active: showAxes }" title="显示/隐藏坐标轴">📐</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { MapControls } from '@tresjs/cientos'
import * as THREE from 'three'
import { useTopologyStore } from '../store/topologyStore.ts'
import HydraulicElement3D from './HydraulicElement3D.vue'
import { getDirectionVector } from '../utils/topologyLayout.ts'

const store = useTopologyStore()
const elements = computed(() => store.elementList)

const cameraRef = ref(null)
const controlsRef = ref(null)

// 坐标轴 Gizmo 状态
const projX = ref({ x: 1, y: 0 })
const projY = ref({ x: 0, y: 1 })
const projZ = ref({ x: 0, y: 0 })
const showGrid = ref(false)
const showAxes = ref(false)

/**
 * 计算当前场景中所有元素端点的真实物理包围盒
 * (这个函数刚才被不小心删掉了，现在补回来，并且去掉了多余的 Scale)
 */
function computeSceneBoundingBox() {
  const box = new THREE.Box3()

  elements.value.forEach((el) => {
    if (!el.position) return

    const start = new THREE.Vector3(el.position[0], el.position[1], el.position[2])

    let theta = el.zenithAngle ?? 90
    let phi = el.azimuthAngle ?? 0
    if (el.type === 'Pool') {
      theta = (theta !== 0 && theta !== 180) ? 180 : theta
      phi = 0
    }

    const [dx, dy, dz] = getDirectionVector(theta, phi)
    const length = el.length || 0
    const end = new THREE.Vector3(
      start.x + dx * length,
      start.y + dy * length,
      start.z + dz * length
    )

    box.expandByPoint(start)
    box.expandByPoint(end)
  })

  if (box.isEmpty()) {
    box.setFromCenterAndSize(new THREE.Vector3(0, 0, 0), new THREE.Vector3(10, 10, 10))
  }

  return box
}

/**
 * 核心逻辑：将相机聚焦到指定的包围盒，并设置观察方向
 */
function focusBox(direction) {
  const camera = cameraRef.value
  
  // 【防弹解包】：适配不同版本的 TresJS/Cientos 实例暴露方式
  let controls = null
  if (controlsRef.value) {
    controls = controlsRef.value.value || 
               controlsRef.value.instance || 
               controlsRef.value.controls || 
               controlsRef.value
  }

  // 【致命错误拦截】：如果还没拿到真正的 ThreeJS 实例，或者 target 没准备好，立刻终止
  if (!camera || !controls || !controls.target) {
    console.warn('⚠️ 视图仍在初始化中，跳过本次调整')
    return
  }

  try {
    const box = computeSceneBoundingBox()
    const center = new THREE.Vector3()
    box.getCenter(center)
    
    const sphere = new THREE.Sphere()
    box.getBoundingSphere(sphere)
    const radius = sphere.radius === 0 ? 10 : sphere.radius

    const fov = camera.fov * (Math.PI / 180)
    const aspect = camera.aspect || 1
    let distance = (radius / Math.sin(fov / 2)) * 1.2
    if (aspect < 1) distance = distance / aspect

    // 此时 controls.target 百分之百存在，安全执行 copy
    controls.target.copy(center)

    const cameraPos = direction.clone().normalize().multiplyScalar(distance).add(center)
    camera.position.copy(cameraPos)

    camera.lookAt(center)
    camera.updateProjectionMatrix()
    controls.update()
  } catch (error) {
    console.error('视图切换异常:', error)
  }
}

function fitToWindow() {
  if (!cameraRef.value) return
  const currentDir = new THREE.Vector3()
  cameraRef.value.getWorldDirection(currentDir).negate()
  focusBox(currentDir)
}

function setFrontView() {
  if (cameraRef.value) cameraRef.value.up.set(0, 1, 0)
  focusBox(new THREE.Vector3(0, 0, 1))
}

function setLeftView() {
  if (cameraRef.value) cameraRef.value.up.set(0, 1, 0)
  focusBox(new THREE.Vector3(-1, 0, 0))
}

function setTopView() {
  if (cameraRef.value) cameraRef.value.up.set(0, 1, 0)
  focusBox(new THREE.Vector3(0, 1, 0.0001))
}

// 动态更新坐标轴
let rafId
const updateGizmo = () => {
  const cam = cameraRef.value
  if (!cam) return
  
  const q = cam.quaternion.clone().invert()
  
  // 物理映射逻辑
  const physicalX = new THREE.Vector3(0, 0, 1)
  const physicalY = new THREE.Vector3(1, 0, 0)
  const physicalZ = new THREE.Vector3(0, 1, 0)

  const vX = physicalX.applyQuaternion(q)
  const vY = physicalY.applyQuaternion(q)
  const vZ = physicalZ.applyQuaternion(q)
  
  projX.value = { x: vX.x, y: vX.y }
  projY.value = { x: vY.x, y: vY.y }
  projZ.value = { x: vZ.x, y: vZ.y }
}

onMounted(() => {
  if (cameraRef.value) {
    cameraRef.value.position.set(10, 10, 20)
  }

  const loop = () => {
    updateGizmo()
    rafId = requestAnimationFrame(loop)
  }
  loop()

  // 【智能轮询】：代替不可靠的 setTimeout(..., 100)
  // 每 50 毫秒检查一次，直到 3D 控制器真正挂载完毕再执行首次适应窗口
  const checkReady = setInterval(() => {
    let controls = null
    if (controlsRef.value) {
      controls = controlsRef.value.value || 
                 controlsRef.value.instance || 
                 controlsRef.value.controls || 
                 controlsRef.value
    }

    // 只要发现了 target，就说明底层引擎活过来了
    if (cameraRef.value && controls && controls.target) {
      clearInterval(checkReady) // 停止检查
      fitToWindow() // 执行完美的居中复位
    }
  }, 50)
})

const onCanvasClick = (event) => {
  if (!event.intersections || event.intersections.length === 0) {
    store.clearSelection()
  }
}
</script>

<style scoped>
.scene-3d {
  width: 100%;
  height: 100%;
  position: relative;
  background: #d9eaf7;
}

.scene-controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
  z-index: 10;
}

.control-btn {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.8);
  color: #333;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.05);
  border-color: #7c3aed;
}

.control-btn.active {
  background: #7c3aed;
  color: white;
  border-color: #7c3aed;
}

.control-btn.text-btn {
  width: auto;
  padding: 0 10px;
  font-size: 12px;
  white-space: nowrap;
}

.axis-gizmo {
  position: absolute;
  bottom: 16px;
  left: 16px;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
}

.axis-gizmo svg {
  overflow: visible;
}
</style>
