/**
 * @fileoverview 拓扑布局计算引擎
 * 负责为回路中的组件计算 3D 空间位置
 */

import type { Circuit, HydraulicElement } from '../../models/hydro/topology';
import type { Point3D, LayoutOptions, LayoutResult } from '../../types';
import { calculateEndPoint } from './vector';

/**
 * 布局计算器类
 *
 * 提供可配置的拓扑布局算法，支持：
 * - 多回路并行布局
 * - 自定义偏移和间距
 * - 特殊元件处理 (如 Pool)
 * - 环状/孤立节点兜底策略
 */
export class TopologyLayoutEngine {
  /** 默认回路间距 */
  private static readonly DEFAULT_CIRCUIT_SPACING = 12;

  /**
   * 为单个回路计算所有组件的位置
   *
   * @param circuit - 回路对象
   * @param options - 布局选项
   * @returns 布局结果
   */
  public computeCircuitPositions(
    circuit: Circuit,
    options: LayoutOptions = {}
  ): LayoutResult {
    const {
      offset = [0, 0, 0],
      forceRecalc = false
    } = options;

    const { elements, connections } = circuit;
    const elementIds = Object.keys(elements);

    if (elementIds.length === 0) {
      return { success: true, elementCount: 0 };
    }

    // 构建邻接表
    const adjacencyList = this.buildAdjacencyList(connections);

    // 查找根节点 (没有入度的节点)
    const rootIds = this.findRootNodes(elementIds, connections);

    // 初始化位置
    this.initializePositions(elements, elementIds, rootIds, offset, forceRecalc);

    // DFS 遍历计算位置
    const visited = new Set<string>();
    const warnings: string[] = [];

    for (const rootId of rootIds) {
      this.traverseAndCalculate(
        rootId,
        elements,
        adjacencyList,
        visited,
        warnings
      );
    }

    // 兜底处理孤立节点
    this.handleIsolatedNodes(elements, elementIds, offset);

    return {
      success: true,
      elementCount: elementIds.length,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * 为多个回路批量计算位置
   *
   * @param circuits - 回路字典
   * @param spacing - 回路间距
   */
  public computeMultipleCircuits(
    circuits: Record<string, Circuit>,
    spacing: number = TopologyLayoutEngine.DEFAULT_CIRCUIT_SPACING
  ): void {
    let globalOffset = 0;

    for (const circuit of Object.values(circuits)) {
      this.computeCircuitPositions(circuit, {
        offset: [globalOffset, 0, 0]
      });
      globalOffset += spacing;
    }
  }

  /**
   * 构建邻接表
   */
  private buildAdjacencyList(
    connections: Array<{ fromId: string; toId: string }>
  ): Record<string, string[]> {
    const adjList: Record<string, string[]> = {};

    for (const conn of connections) {
      if (!adjList[conn.fromId]) {
        adjList[conn.fromId] = [];
      }
      adjList[conn.fromId].push(conn.toId);
    }

    return adjList;
  }

  /**
   * 查找根节点 (没有入度的节点)
   */
  private findRootNodes(
    elementIds: string[],
    connections: Array<{ fromId: string; toId: string }>
  ): string[] {
    const allTargets = new Set(connections.map(c => c.toId));
    const roots = elementIds.filter(id => !allTargets.has(id));

    // 如果是环状结构，降级处理：选择第一个节点作为根
    if (roots.length === 0 && elementIds.length > 0) {
      return [elementIds[0]];
    }

    return roots;
  }

  /**
   * 初始化所有节点的位置
   */
  private initializePositions(
    elements: Record<string, HydraulicElement>,
    elementIds: string[],
    rootIds: string[],
    offset: Point3D,
    forceRecalc: boolean
  ): void {
    for (const id of elementIds) {
      const element = elements[id];

      if (forceRecalc || !element.position) {
        element.position = undefined as any;
      }
    }

    // 设置根节点位置
    for (const rootId of rootIds) {
      if (elements[rootId]) {
        elements[rootId].position = [...offset];
      }
    }
  }

  /**
   * DFS 遍历并计算子节点位置
   */
  private traverseAndCalculate(
    nodeId: string,
    elements: Record<string, HydraulicElement>,
    adjacencyList: Record<string, string[]>,
    visited: Set<string>,
    warnings: string[]
  ): void {
    if (visited.has(nodeId)) {
      return;
    }
    visited.add(nodeId);

    const node = elements[nodeId];
    if (!node || !node.position) {
      return;
    }

    // 获取节点的方向参数
    const { zenithAngle = 90, azimuthAngle = 0, length = 0 } = node;

    // 特殊处理 Pool 元件
    const adjustedAngles = this.adjustAnglesForSpecialElements(node);

    // 计算终点坐标
    const endPoint = calculateEndPoint(
      node.position,
      adjustedAngles.zenithAngle,
      adjustedAngles.azimuthAngle,
      length
    );

    // 更新所有子节点的位置
    const children = adjacencyList[nodeId] || [];
    for (const childId of children) {
      const child = elements[childId];
      if (child && !child.position) {
        child.position = endPoint;
      }
      // 递归处理子节点
      this.traverseAndCalculate(childId, elements, adjacencyList, visited, warnings);
    }
  }

  /**
   * 特殊元件的角度调整规则
   */
  private adjustAnglesForSpecialElements(
    element: HydraulicElement
  ): { zenithAngle: number; azimuthAngle: number } {
    let { zenithAngle = 90, azimuthAngle = 0 } = element;

    if (element.type === 'Pool') {
      // Pool 必须垂直向下 (θ=180°) 或垂直向上 (θ=0°)
      if (zenithAngle !== 0 && zenithAngle !== 180) {
        zenithAngle = 180;
      }
      azimuthAngle = 0;
    }

    return { zenithAngle, azimuthAngle };
  }

  /**
   * 处理孤立节点 (没有位置的节点)
   */
  private handleIsolatedNodes(
    elements: Record<string, HydraulicElement>,
    elementIds: string[],
    offset: Point3D
  ): void {
    for (const id of elementIds) {
      if (!elements[id].position) {
        elements[id].position = [...offset];
      }
    }
  }
}

// 导出单例实例
export const layoutEngine = new TopologyLayoutEngine();