<template>
  <TresGroup :position="elementPosition" :rotation="elementRotation" rotation-order="YXZ">
    <!-- Valve: 双锥体尖尖相对（中间收腰） -->
    <template v-if="element.type === 'Valve'">
      <TresMesh :position="[0, halfLen / 2, 0]" @click="onElementClick">
        <TresConeGeometry :args="[radius, halfLen, 32]" />
        <TresMeshStandardMaterial :color="elementColor" />
      </TresMesh>
      <TresMesh :position="[0, halfLen + halfLen / 2, 0]" :rotation="[Math.PI, 0, 0]" @click="onElementClick">
        <TresConeGeometry :args="[radius, halfLen, 32]" />
        <TresMeshStandardMaterial :color="elementColor" />
      </TresMesh>
    </template>

    <!-- 选中状态：圆柱 + 圆锥组合体（各占一半长度） -->
    <template v-else-if="isSelected">
      <!-- 圆柱部分：占据前一半长度 -->
      <TresMesh :position="[0, cylinderLen / 2, 0]" @click="onElementClick">
        <TresCylinderGeometry :args="[radius, radius, cylinderLen, 32]" />
        <TresMeshStandardMaterial :color="elementColor" />
      </TresMesh>
      <!-- 圆锥部分：占据后一半长度，尖端指向下游（+Y 方向） -->
      <TresMesh :position="[0, cylinderLen + coneLen / 2, 0]" @click="onElementClick">
        <TresConeGeometry :args="[radius, coneLen, 32]" />
        <TresMeshStandardMaterial :color="elementColor" />
      </TresMesh>
    </template>

    <!-- 默认及所有其他类型：圆柱体 -->
    <template v-else>
      <TresMesh :position="[0, halfLen, 0]" @click="onElementClick">
        <TresCylinderGeometry :args="[radius, radius, element.length * scale, 32]" />
        <TresMeshStandardMaterial :color="elementColor" />
      </TresMesh>
    </template>
  </TresGroup>
</template>

<script setup>
import { computed } from 'vue'
import { useTopologyStore } from '../store/topologyStore.ts'

const props = defineProps({
  element: {
    type: Object,
    required: true
  }
})

const store = useTopologyStore()

const scale = 2

// 判断是否选中
const isSelected = computed(() => {
  return store.selectedElement?.id === props.element.id
})

// 从 flowArea 计算半径（假设为圆形截面）
const radius = computed(() => {
  return Math.sqrt(props.element.flowArea / Math.PI)
})

// 阀门双锥体的一半长度
const halfLen = computed(() => {
  return (props.element.length * scale) / 2
})

// 圆柱+圆锥组合体的各部分长度
const cylinderLen = computed(() => {
  return (props.element.length * scale) / 2
})

const coneLen = computed(() => {
  return (props.element.length * scale) / 2
})

// 根据类型返回颜色，如果选中则高亮
const elementColor = computed(() => {
  if (isSelected.value) return '#ffcc00' // 选中时显示金色
  
  switch (props.element.type) {
    case 'Pipe': return '#44aaff'
    case 'Pump': return '#ffaa44'
    case 'Bufffertank': return '#ff8844'
    case 'Pool': return '#44ffdd'
    case 'TimeDependentVolume': return '#44ff88'
    case 'TimeDependentJunction': return '#aa44ff'
    case 'Valve': return '#ff4444'
    default: return '#aaaaaa'
  }
})

// 位置：优先使用 element.position，否则根据 id 做简单排布
const elementPosition = computed(() => {
  if (props.element.position) {
    return [
      props.element.position[0] * scale,
      props.element.position[1] * scale,
      props.element.position[2] * scale
    ]
  }
  let hash = 0
  for (let i = 0; i < props.element.id.length; i++) {
    hash = props.element.id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const x = (hash % 10) * 2 - 8
  const z = ((hash >> 4) % 10) * 2 - 8
  return [x, 0, z]
})

// 旋转：根据和方位角 ϕ 计算
// 使用 YXZ 顺序：先绕 Y 旋转 ϕ，再绕 X 旋转 θ
// 这样可以确保原本沿 Y 轴的圆柱体正确指向 (sinθ sinϕ, cosθ, sinθ cosϕ)
const elementRotation = computed(() => {
  let theta = (props.element.zenithAngle || 90)
  let phi = (props.element.azimuthAngle || 0)

  // Pool 永远是垂直的 (0 或 180 度)
  if (props.element.type === 'Pool') {
    // 如果不是 0，则强制为 180 (垂直向下)
    if (theta !== 0 && theta !== 180) {
      theta = 180
    }
    phi = 0 // 垂直时方位角无意义，设为 0
  }

  return [theta * (Math.PI / 180), phi * (Math.PI / 180), 0]
})

// 处理组件点击事件
const onElementClick = (event) => {
  event.stopPropagation()
  store.setSelectedElement(props.element)
}
</script>
