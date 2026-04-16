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

            <TresGroup ref="modelGroupRef">
                <template v-for="element in elements" :key="element.id">
                    <HydraulicElement3D :element="element" />
                </template>
            </TresGroup>
        </TresCanvas>

        <div class="axis-gizmo">
            <svg viewBox="0 0 100 100" width="80" height="80">
                <line :x1="50" :y1="50" :x2="50 + projX.x * 35" :y2="50 - projX.y * 35" stroke="#ff0000"
                    stroke-width="3" stroke-linecap="round" />
                <line :x1="50" :y1="50" :x2="50 + projY.x * 35" :y2="50 - projY.y * 35" stroke="#00aa00"
                    stroke-width="3" stroke-linecap="round" />
                <line :x1="50" :y1="50" :x2="50 + projZ.x * 35" :y2="50 - projZ.y * 35" stroke="#0066ff"
                    stroke-width="3" stroke-linecap="round" />
                <text :x="50 + projX.x * 42" :y="50 - projX.y * 42" fill="#ff0000" font-size="12" font-weight="bold"
                    text-anchor="middle" dominant-baseline="middle">X</text>
                <text :x="50 + projY.x * 42" :y="50 - projY.y * 42" fill="#00aa00" font-size="12" font-weight="bold"
                    text-anchor="middle" dominant-baseline="middle">Y</text>
                <text :x="50 + projZ.x * 42" :y="50 - projZ.y * 42" fill="#0066ff" font-size="12" font-weight="bold"
                    text-anchor="middle" dominant-baseline="middle">Z</text>
            </svg>
        </div>

        <div class="scene-controls">
            <button class="control-btn text-btn" @click="setFrontView" title="正视图">正视图</button>
            <button class="control-btn text-btn" @click="setLeftView" title="左视图">左视图</button>
            <button class="control-btn text-btn" @click="setTopView" title="俯视图">俯视图</button>
            <button class="control-btn text-btn" @click="fitToWindow" title="适应窗口">适应窗口</button>
            <button class="control-btn" @click="showGrid = !showGrid" :class="{ active: showGrid }"
                title="显示/隐藏网格">⊞</button>
            <button class="control-btn" @click="showAxes = !showAxes" :class="{ active: showAxes }"
                title="显示/隐藏坐标轴">📐</button>
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
import { getDirectionVector } from '../utils/geometry/topologyLayout.ts'

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


// 新增对 3D 组的引用
const modelGroupRef = ref(null)

/**
 * 终极包围盒算法：直接测量渲染出来的真实 3D 几何体
 */
function computeSceneBoundingBox() {
    const box = new THREE.Box3()

    // 1. 最精确的方法：直接读取真实的 3D 对象边界
    const group = modelGroupRef.value?.value || modelGroupRef.value
    if (group && group.children.length > 0) {
        group.updateMatrixWorld(true) // 强制刷新世界坐标
        box.setFromObject(group)      // 让 Three.js 自己去框选所有模型
    }

    // 2. 兜底方法：如果 3D 对象还没渲染完，再用数学算一下骨架
    if (box.isEmpty()) {
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
    }

    if (box.isEmpty()) {
        box.setFromCenterAndSize(new THREE.Vector3(0, 0, 0), new THREE.Vector3(10, 10, 10))
    }
    return box
}

/**
 * 核心逻辑：精准聚焦包围盒（保守策略：取宽/高适配的最大距离）
 */
function focusBox(direction) {
    const camera = cameraRef.value
    const controls = controlsRef.value?.value || controlsRef.value?.instance || controlsRef.value?.controls || controlsRef.value

    if (!camera || !controls || !controls.target) return

    try {
        // 1. 获取模型真实包围盒
        const box = computeSceneBoundingBox()
        const center = new THREE.Vector3()
        box.getCenter(center)

        // 2. 获取包围盒在当前视角下的“视觉尺寸”
        const size = new THREE.Vector3()
        box.getSize(size)

        // 获取画布真实的物理宽高比
        const canvas = document.querySelector('.scene-3d canvas')
        const aspect = canvas ? (canvas.clientWidth / canvas.clientHeight) : (camera.aspect || 1)
        const fovRad = camera.fov * (Math.PI / 180)

        // 3. 计算适配高度所需的距离
        // 公式：dist = (height / 2) / tan(fov / 2)
        // 我们需要判断在当前方向下，哪个轴是“高度”方向
        // 为了简化并保证“保守”，我们取 box 三个维度中在屏幕投影方向上的最大体现

        // 更加精确的保守算法：
        // 计算包围盒在相机坐标系下的投影
        const vDir = direction.clone().normalize()
        const vUp = new THREE.Vector3(0, 1, 0)
        const vRight = new THREE.Vector3().crossVectors(vUp, vDir).normalize()
        const vRealUp = new THREE.Vector3().crossVectors(vDir, vRight).normalize()

        // 计算 8 个顶点在 Right 和 Up 方向上的最大跨度
        const corners = [
            new THREE.Vector3(box.min.x, box.min.y, box.min.z),
            new THREE.Vector3(box.min.x, box.min.y, box.max.z),
            new THREE.Vector3(box.min.x, box.max.y, box.min.z),
            new THREE.Vector3(box.min.x, box.max.y, box.max.z),
            new THREE.Vector3(box.max.x, box.min.y, box.min.z),
            new THREE.Vector3(box.max.x, box.min.y, box.max.z),
            new THREE.Vector3(box.max.x, box.max.y, box.min.z),
            new THREE.Vector3(box.max.x, box.max.y, box.max.z),
        ]

        let minW = Infinity, maxW = -Infinity
        let minH = Infinity, maxH = -Infinity

        corners.forEach(corner => {
            const w = corner.dot(vRight)
            const h = corner.dot(vRealUp)
            minW = Math.min(minW, w); maxW = Math.max(maxW, w)
            minH = Math.min(minH, h); maxH = Math.max(maxH, h)
        })

        const modelW = maxW - minW
        const modelH = maxH - minH

        // 4. 根据保守策略计算距离
        // 适配高度的距离
        const distH = (modelH / 2) / Math.tan(fovRad / 2)
        // 适配宽度的距离 (宽度受 aspect 影响)
        const distW = (modelW / 2) / Math.tan(fovRad / 2) / aspect

        // 取两者中较大的一个，确保任何方向都不会超出画布
        // 加上 1.1 的系数（留出 10% 的安全边距），这比之前的 1.5 会大很多，更显眼
        const distance = Math.max(distH, distW) * 1.1

        // 5. 应用位置
        controls.target.copy(center)
        const cameraPos = direction.clone().normalize().multiplyScalar(distance).add(center)
        camera.position.copy(cameraPos)

        camera.lookAt(center)
        camera.updateProjectionMatrix()
        controls.update()
    } catch (error) {
        console.error('视图调整异常:', error)
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
