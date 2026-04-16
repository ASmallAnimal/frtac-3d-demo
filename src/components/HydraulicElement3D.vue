<template>
    <TresGroup :position="elementPosition" :rotation="elementRotation" rotation-order="YXZ">

        <template v-if="element.type === 'Valve'">
            <TresMesh :position="[0, length / 4, 0]" @click="onElementClick">
                <TresConeGeometry :args="[radius, length / 2, GEOMETRY_CONFIG.RADIAL_SEGMENTS]" />
                <TresMeshStandardMaterial :color="elementColor" />
            </TresMesh>
            <TresMesh :position="[0, (length * 3) / 4, 0]" :rotation="[Math.PI, 0, 0]" @click="onElementClick">
                <TresConeGeometry :args="[radius, length / 2, GEOMETRY_CONFIG.RADIAL_SEGMENTS]" />
                <TresMeshStandardMaterial :color="elementColor" />
            </TresMesh>
        </template>

        <template v-else-if="isSelected">
            <TresMesh :position="[0, length / 4, 0]" @click="onElementClick">
                <TresCylinderGeometry :args="[radius, radius, length / 2, GEOMETRY_CONFIG.RADIAL_SEGMENTS]" />
                <TresMeshStandardMaterial :color="elementColor" />
            </TresMesh>
            <TresMesh :position="[0, (length * 3) / 4, 0]" @click="onElementClick">
                <TresConeGeometry :args="[radius, length / 2, GEOMETRY_CONFIG.RADIAL_SEGMENTS]" />
                <TresMeshStandardMaterial :color="elementColor" />
            </TresMesh>
        </template>

        <template v-else>
            <TresMesh :position="[0, length / 2, 0]" @click="onElementClick">
                <TresCylinderGeometry :args="[radius, radius, length, GEOMETRY_CONFIG.RADIAL_SEGMENTS]" />
                <TresMeshStandardMaterial :color="elementColor" />
            </TresMesh>
        </template>

    </TresGroup>
</template>

<script setup>
import { computed } from 'vue'
import { useTopologyStore } from '../store/topologyStore.ts'
import { ELEMENT_COLORS, GEOMETRY_CONFIG } from '../config/constants.ts'

const props = defineProps({
    element: {
        type: Object,
        required: true
    }
})

const store = useTopologyStore()

// 判断是否选中
const isSelected = computed(() => {
    return store.selectedElement?.id === props.element.id
})

// 半径和长度
const radius = computed(() => {
    return Math.sqrt((props.element.flowArea || 0.1) / Math.PI)
})

const length = computed(() => props.element.length || 0.1)

// 直接使用算法算出来的起始点
const elementPosition = computed(() => {
    if (props.element.position) {
        return [
            props.element.position[0],
            props.element.position[1],
            props.element.position[2]
        ]
    }
    // 孤立节点的兜底排布
    let hash = 0
    for (let i = 0; i < props.element.id.length; i++) {
        hash = props.element.id.charCodeAt(i) + ((hash << 5) - hash)
    }
    return [(hash % 10) * 2 - 8, 0, ((hash >> 4) % 10) * 2 - 8]
})

// 欧拉角映射，配合 rotation-order="YXZ"
const elementRotation = computed(() => {
    let theta = props.element.zenithAngle ?? 90
    let phi = props.element.azimuthAngle ?? 0

    if (props.element.type === 'Pool') {
        if (theta !== 0 && theta !== 180) theta = 180
        phi = 0
    }

    return [theta * (Math.PI / 180), phi * (Math.PI / 180), 0]
})

// 根据类型返回颜色
const elementColor = computed(() => {
    if (isSelected.value) return ELEMENT_COLORS.Selected

    return ELEMENT_COLORS[props.element.type] || ELEMENT_COLORS.Default
})

const onElementClick = (event) => {
    event.stopPropagation()
    store.setSelectedElement(props.element)
}
</script>