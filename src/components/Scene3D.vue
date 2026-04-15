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
      <button class="control-btn text-btn" @click="setView('front')" title="正视图">正视图</button>
      <button class="control-btn text-btn" @click="setView('left')" title="左视图">左视图</button>
      <button class="control-btn text-btn" @click="setView('top')" title="俯视图">俯视图</button>
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
 * 核心逻辑：计算场景真实包围盒
 */
function computeSceneBoundingBox() {
  const box = new THREE.Box3()
  
  elements.value.forEach((el) => {
    if (!el.position) return
    const start = new THREE.Vector3(...el.position)
    
    let theta = el.zenithAngle ?? 90
    let phi = el.azimuthAngle ?? 0
    if (el.type === 'Pool') {
      theta = (theta !== 0 && theta !== 180) ? 180 : theta
      phi = 0
    }

    const [dx, dy, dz] = getDirectionVector(theta, phi)
    const end = new THREE.Vector3(
      start.x + dx * (el.length || 0),
      start.y + dy * (el.length || 0),
      start.z + dz * (el.length || 0)
    )

    box.expandByPoint(start)
    box.expandByPoint(end)
  })

  // 如果场景为空，提供一个默认大小
  if (box.isEmpty()) {
    box.setFromCenterAndSize(new THREE.Vector3(0, 0, 0), new THREE.Vector3(10, 10, 10))
  }
  return box
}

/**
 * 适应窗口：通过 BoundingSphere 简化距离计算，避免过度复杂的点积运算
 */
function fitToWindow() {
  const camera = cameraRef.value
  const controls = controlsRef.value
  if (!camera || !controls) return

  const box = computeSceneBoundingBox()
  const center = new THREE.Vector3()
  box.getCenter(center)
  
  // 获取包围球的半径，保证所有物体都能装下
  const sphere = new THREE.Sphere()
  box.getBoundingSphere(sphere)
  const radius = sphere.radius || 10

  // 根据相机的 fov 计算需要的距离 (乘以 1.2 留出边缘空白)
  const fovRad = camera.fov * THREE.MathUtils.DEG2RAD
  const distance = (radius / Math.sin(fovRad / 2)) * 1.2

  // 保持相机当前观察方向，向后拉远
  const direction = new THREE.Vector3()
  camera.getWorldDirection(direction)
  
  camera.position.copy(center).sub(direction.multiplyScalar(distance))
  controls.target.copy(center)
  
  camera.updateProjectionMatrix()
  controls.update()
}

/**
 * 统一处理三视图切换
 */
function setView(viewType) {
  const camera = cameraRef.value
  const controls = controlsRef.value
  if (!camera || !controls) return

  const box = computeSceneBoundingBox()
  const center = new THREE.Vector3()
  box.getCenter(center)
  
  const sphere = new THREE.Sphere()
  box.getBoundingSphere(sphere)
  const distance = (sphere.radius / Math.sin((camera.fov * Math.PI) / 360)) * 1.5

  // 重置相机的 Up 向量，防止控制系统错乱
  camera.up.set(0, 1, 0)

  if (viewType === 'front') {
    camera.position.set(center.x, center.y, center.z + distance)
  } else if (viewType === 'left') {
    camera.position.set(center.x + distance, center.y, center.z)
  } else if (viewType === 'top') {
    // 俯视图不要动 up 向量，直接放到 Y 轴高处向下看即可
    camera.position.set(center.x, center.y + distance, center.z + 0.001) // 微小偏移防止奇异点
  }

  controls.target.copy(center)
  camera.lookAt(center)
  camera.updateProjectionMatrix()
  controls.update()
}

// 动态更新坐标轴（恢复了跟随相机旋转的逻辑）
let rafId
const updateGizmo = () => {
  const cam = cameraRef.value
  if (!cam) return
  
  // 提取相机旋转四元数的逆向
  const q = cam.quaternion.clone().invert()
  
  // 【核心魔法】：定义物理（工程）坐标系在 Three.js 里的真实对应关系
  
  // 物理 X 轴 (向右) -> 对应 Three.js 的 +X
  const physicalX = new THREE.Vector3(0, 0, 1)
  
  // 物理 Y 轴 (桌面纵深) -> 对应 Three.js 的 -Z (向屏幕里面)
  const physicalY = new THREE.Vector3(1, 0, 0)
  
  // 物理 Z 轴 (垂直高度) -> 对应 Three.js 的 +Y (向上)
  const physicalZ = new THREE.Vector3(0, 1, 0)

  // 将物理向量投影到 2D 屏幕上
  const vX = physicalX.applyQuaternion(q)
  const vY = physicalY.applyQuaternion(q)
  const vZ = physicalZ.applyQuaternion(q)
  
  // 绑定到 Vue 响应式变量，SVG 会自动更新
  projX.value = { x: vX.x, y: vX.y }
  projY.value = { x: vY.x, y: vY.y }
  projZ.value = { x: vZ.x, y: vZ.y }
}

onMounted(async () => {
  if (cameraRef.value) {
    cameraRef.value.position.set(10, 10, 20)
  }

  // 启动渲染循环以更新 Gizmo
  const loop = () => {
    updateGizmo()
    rafId = requestAnimationFrame(loop)
  }
  loop()

  await nextTick()
  setTimeout(() => fitToWindow(), 100)
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
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
