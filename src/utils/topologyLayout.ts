import * as THREE from 'three';
import type { Circuit } from '../models/hydro/topology.ts';

/**
 * 根据天顶角 θ 和方位角 ϕ 计算单位方向向量
 * 采用 Three.js 默认的 Y-Up 右手坐标系定义：
 * - zenith (Phi): 与 +Y 轴的夹角 (0°=垂直向上, 90°=水平面, 180°=垂直向下)
 * - azimuth (Theta): 绕 Y 轴的旋转角 (0°指向+Z, 90°指向+X)
 */
export function getDirectionVector(zenithAngle: number = 90, azimuthAngle: number = 0): [number, number, number] {
    // 利用 Three.js 原生 API 进行球坐标转换，保证绝对精准
    const phi = zenithAngle * THREE.MathUtils.DEG2RAD;
    const theta = azimuthAngle * THREE.MathUtils.DEG2RAD;

    // radius = 1, phi (极角), theta (方位角)
    const vec = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);

    return [vec.x, vec.y, vec.z];
}

/**
 * 为回路中的每个组件计算绝对坐标 position。
 */
export function computeCircuitPositions(
    circuit: Circuit,
    offset: [number, number, number] = [0, 0, 0]
): void {
    const { elements, connections } = circuit;
    const elementIds = Object.keys(elements);
    if (elementIds.length === 0) return;

    // 构建邻接表
    const linkTable: Record<string, string[]> = {};
    connections.forEach((c) => {
        if (!linkTable[c.fromId]) linkTable[c.fromId] = [];
        linkTable[c.fromId].push(c.toId);
    });

    const allTargets = new Set(connections.map(c => c.toId));
    let roots = elementIds.filter(id => !allTargets.has(id));
    if (roots.length === 0) roots = [elementIds[0]]; // 环状降级处理

    // 清理并初始化根节点
    elementIds.forEach(id => { elements[id].position = undefined as any; });
    roots.forEach(id => { elements[id].position = [...offset]; });

    const visited = new Set<string>();

    function traverse(nodeId: string) {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);

        const node = elements[nodeId];
        if (!node || !node.position) return;

        let { zenithAngle = 90, azimuthAngle = 0, length = 0 } = node;

        // Pool 的特殊垂向规则
        if (node.type === 'Pool') {
            zenithAngle = (zenithAngle !== 0 && zenithAngle !== 180) ? 180 : zenithAngle;
            azimuthAngle = 0;
        }

        const [dx, dy, dz] = getDirectionVector(zenithAngle, azimuthAngle);
        const endPos = [
            node.position[0] + dx * length,
            node.position[1] + dy * length,
            node.position[2] + dz * length
        ];

        const targets = linkTable[nodeId] || [];
        targets.forEach((targetId) => {
            const target = elements[targetId];
            if (target && !target.position) {
                target.position = [endPos[0], endPos[1], endPos[1]];
            }
            traverse(targetId);
        });
    }

    roots.forEach(traverse);

    // 兜底孤立节点
    elementIds.forEach(id => {
        if (!elements[id].position) {
            elements[id].position = [...offset];
        }
    });
}