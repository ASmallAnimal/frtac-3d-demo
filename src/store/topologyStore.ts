// src/stores/topologyStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Circuit, HydraulicElement, TopologyData } from '../models/hydro/topology.ts';
import { computeCircuitPositions } from '../utils/topologyLayout.ts';

export const useTopologyStore = defineStore('topology', () => {
  // ==========================================
  // 1. State (状态)
  // ==========================================

  // 存储所有回路
  const circuits = ref<Record<string, Circuit>>({});

  // 当前选中的回路名称
  const currentCircuitName = ref<string>('');

  // 当前选中的组件
  const selectedElement = ref<HydraulicElement | null>(null);

  // 工程是否已加载
  const isLoaded = ref(false);

  // ==========================================
  // 2. Getters (计算属性)
  // ==========================================

  // 获取当前回路
  const currentCircuit = computed(() => {
    return currentCircuitName.value
      ? circuits.value[currentCircuitName.value]
      : undefined;
  });

  // 获取当前回路的所有组件（数组形式，便于 UI 渲染）
  const elementList = computed(() => {
    const circuit = currentCircuit.value;
    return circuit ? Object.values(circuit.elements) : [];
  });

  // 获取所有回路名称列表
  const circuitNames = computed(() => Object.keys(circuits.value));

  // 获取当前回路的管道组件
  const pipes = computed(() => elementList.value.filter(e => e.type === 'Pipe'));

  // 获取当前回路的水泵组件
  const pumps = computed(() => elementList.value.filter(e => e.type === 'Pump'));

  // 获取当前回路的时变体积组件
  const timeDependentVolumes = computed(() =>
    elementList.value.filter(e => e.type === 'TimeDependentVolume')
  );

  // 获取当前回路的时变连接组件
  const timeDependentJunctions = computed(() =>
    elementList.value.filter(e => e.type === 'TimeDependentJunction')
  );

  // 统计当前回路组件总数
  const totalElements = computed(() => elementList.value.length);

  // 统计所有回路组件总数
  const totalElementsAllCircuits = computed(() => {
    return Object.values(circuits.value).reduce(
      (sum, circuit) => sum + Object.keys(circuit.elements).length,
      0
    );
  });

  // ==========================================
  // 3. Actions (方法)
  // ==========================================

  /**
   * 初始化拓扑数据 (解析 JSON 文件后调用)
   */
  function initTopology(data: TopologyData) {
    circuits.value = data.circuits || {};

    // 自动选择第一个回路作为当前回路
    const names = Object.keys(circuits.value);
    if (names.length > 0) {
      currentCircuitName.value = names[0];
    }

    // 为每个回路重新计算布局坐标
    recalcAllPositions();

    isLoaded.value = true;
  }

  /**
   * 为所有回路重新计算 3D 坐标
   */
  function recalcAllPositions() {
    let globalOffset = 0;
    Object.values(circuits.value).forEach((circuit) => {
      computeCircuitPositions(circuit, [globalOffset, 0, 0]);
      globalOffset += 12; // 回路之间水平间距
    });
  }

  /**
   * 切换当前回路
   * @param circuitName 回路名称
   */
  function selectCircuit(circuitName: string) {
    if (circuits.value[circuitName]) {
      currentCircuitName.value = circuitName;
    }
  }

  /**
   * 判断更新的字段是否影响布局坐标
   */
  function shouldRecalc(partialData: Partial<HydraulicElement>): boolean {
    return (
      'length' in partialData ||
      'zenithAngle' in partialData ||
      'azimuthAngle' in partialData
    );
  }

  /**
   * 获取回路当前的全局偏移量（简化：根据 circuits 的遍历顺序）
   */
  function getCircuitOffset(circuit: Circuit): [number, number, number] {
    const names = Object.keys(circuits.value);
    const idx = names.findIndex((name) => circuits.value[name] === circuit);
    return [idx * 12, 0, 0];
  }

  /**
   * 添加新回路
   */
  function addCircuit(name: string, circuit: Circuit) {
    if (!circuits.value[name]) {
      circuits.value[name] = circuit;
    }
  }

  /**
   * 更新某个组件的特定属性
   * @param elementId 组件ID
   * @param partialData 要更新的部分数据
   */
  function updateElement(elementId: string, partialData: Partial<HydraulicElement>) {
    const circuit = currentCircuit.value;
    if (circuit && circuit.elements[elementId]) {
      circuit.elements[elementId] = {
        ...circuit.elements[elementId],
        ...partialData,
      } as HydraulicElement;

      // 若修改了影响布局的属性，重新计算坐标
      if (shouldRecalc(partialData)) {
        computeCircuitPositions(circuit, getCircuitOffset(circuit));
      }
    }
  }

  /**
   * 在指定回路中更新组件
   */
  function updateElementInCircuit(
    circuitName: string,
    elementId: string,
    partialData: Partial<HydraulicElement>
  ) {
    const circuit = circuits.value[circuitName];
    if (circuit && circuit.elements[elementId]) {
      circuit.elements[elementId] = {
        ...circuit.elements[elementId],
        ...partialData,
      } as HydraulicElement;

      if (shouldRecalc(partialData)) {
        computeCircuitPositions(circuit, getCircuitOffset(circuit));
      }
    }
  }

  /**
   * 在当前回路中添加组件
   */
  function addElement(element: HydraulicElement) {
    const circuit = currentCircuit.value;
    if (circuit && !circuit.elements[element.id]) {
      circuit.elements[element.id] = element;
    }
  }

  /**
   * 在指定回路中添加组件
   */
  function addElementToCircuit(circuitName: string, element: HydraulicElement) {
    const circuit = circuits.value[circuitName];
    if (circuit && !circuit.elements[element.id]) {
      circuit.elements[element.id] = element;
    }
  }

  /**
   * 在当前回路中添加连接
   * @param fromId 源组件ID
   * @param toId 目标组件ID
   */
  function addConnection(fromId: string, toId: string) {
    const circuit = currentCircuit.value;
    if (circuit && circuit.elements[fromId] && circuit.elements[toId]) {
      if (!circuit.connections.some(c => c.fromId === fromId && c.toId === toId)) {
        circuit.connections.push({
          id: `${fromId}->${toId}`,
          fromId,
          toId,
        });
      }
    }
  }

  /**
   * 在当前回路中移除连接
   * @param connectionId 连接ID
   */
  function removeConnection(connectionId: string) {
    const circuit = currentCircuit.value;
    if (circuit) {
      const idx = circuit.connections.findIndex(c => c.id === connectionId);
      if (idx !== -1) {
        circuit.connections.splice(idx, 1);
      }
    }
  }

  /**
   * 获取当前回路的连接列表
   */
  function getCurrentConnections() {
    const circuit = currentCircuit.value;
    return circuit ? circuit.connections : [];
  }

  /**
   * 获取指定回路的连接列表
   */
  function getConnections(circuitName: string) {
    const circuit = circuits.value[circuitName];
    return circuit ? circuit.connections : [];
  }

  /**
   * 将连接列表转换为邻接表（兼容旧逻辑）
   */
  function getLinkTable(circuitName: string): Record<string, string[]> {
    const circuit = circuits.value[circuitName];
    if (!circuit) return {};
    const table: Record<string, string[]> = {};
    circuit.connections.forEach((c) => {
      if (!table[c.fromId]) table[c.fromId] = [];
      table[c.fromId].push(c.toId);
    });
    return table;
  }

  /**
   * 设置选中的组件
   * @param element 选中的组件，null 表示取消选中
   */
  function setSelectedElement(element: HydraulicElement | null) {
    selectedElement.value = element;
  }

  /**
   * 清空选中状态
   */
  function clearSelection() {
    selectedElement.value = null;
  }

  /**
   * 清空当前回路
   */
  function clearCurrentCircuit() {
    const circuit = currentCircuit.value;
    if (circuit) {
      circuit.elements = {};
      circuit.connections = [];
    }
  }

  /**
   * 清空所有回路
   */
  function clearTopology() {
    circuits.value = {};
    currentCircuitName.value = '';
    isLoaded.value = false;
  }

  // 对外暴露这些状态和方法
  return {
    // State
    circuits,
    currentCircuitName,
    selectedElement,
    isLoaded,
    // Getters
    currentCircuit,
    elementList,
    circuitNames,
    pipes,
    pumps,
    timeDependentVolumes,
    timeDependentJunctions,
    totalElements,
    totalElementsAllCircuits,
    // Actions
    initTopology,
    selectCircuit,
    addCircuit,
    updateElement,
    updateElementInCircuit,
    addElement,
    addElementToCircuit,
    addConnection,
    removeConnection,
    getCurrentConnections,
    getConnections,
    getLinkTable,
    setSelectedElement,
    clearSelection,
    clearCurrentCircuit,
    clearTopology,
  };
});
