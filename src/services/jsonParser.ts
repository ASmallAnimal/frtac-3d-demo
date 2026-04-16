/**
 * @fileoverview JSON 数据解析服务
 * 负责将原始 JSON 数据转换为内部拓扑模型
 */

import type { TopologyData, Circuit, HydraulicElement, Connection } from '../models/hydro/topology';
import { typeCodeToElementType, ELEMENT_TYPE_MAP } from '../models/hydro/topology';

/**
 * 原始 JSON 中的元件数据结构
 */
interface RawElementData {
  TYPE: number;
  L?: number;
  A?: number;
  χ?: number;
  NODE_NUM?: number;
  θ?: number;
  ϕ?: number;
  FRIC_MODE?: string;
  SAMPLING?: number[];
  [key: string]: any;
}

/**
 * 原始 JSON 中的回路数据结构
 */
interface RawCircuitData {
  MEDIUM: string;
  CRITICAL_FLOW: boolean;
  ELEMENT: Record<string, RawElementData>;
  LINKTABLE?: Record<string, string[]>;
}

/**
 * 原始 JSON 根结构
 */
interface RawJsonData {
  HYDRO?: Record<string, RawCircuitData>;
  [key: string]: any;
}

/**
 * JSON 解析服务类
 */
export class JsonParserService {
  /**
   * 解析完整的 JSON 数据为 TopologyData
   */
  public parseTopologyData(rawData: RawJsonData): TopologyData {
    const circuits: Record<string, Circuit> = {};

    if (!rawData.HYDRO) {
      console.warn('JSON 中未找到 HYDRO 节点');
      return { circuits };
    }

    for (const [circuitName, circuitData] of Object.entries(rawData.HYDRO)) {
      circuits[circuitName] = this.parseCircuit(circuitData);
    }

    return { circuits };
  }

  /**
   * 解析单个回路
   */
  private parseCircuit(rawCircuit: RawCircuitData): Circuit {
    const elements: Record<string, HydraulicElement> = {};
    const connections: Connection[] = [];

    // 解析元件
    for (const [elementId, elementData] of Object.entries(rawCircuit.ELEMENT)) {
      const element = this.parseElement(elementId, elementData);
      elements[elementId] = element;
    }

    // 解析连接关系 (LINKTABLE)
    if (rawCircuit.LINKTABLE) {
      for (const [fromId, toIds] of Object.entries(rawCircuit.LINKTABLE)) {
        for (const toId of toIds) {
          connections.push({
            id: `${fromId}->${toId}`,
            fromId,
            toId,
          });
        }
      }
    }

    return {
      medium: rawCircuit.MEDIUM,
      criticalFlow: rawCircuit.CRITICAL_FLOW,
      elements,
      connections,
    };
  }

  /**
   * 解析单个元件
   */
  private parseElement(elementId: string, rawData: RawElementData): HydraulicElement {
    const elementType = typeCodeToElementType(rawData.TYPE);

    // 基础属性映射
    const baseProps = {
      id: elementId,
      name: elementId,
      type: elementType,
      length: rawData.L ?? 0,
      flowArea: rawData.A ?? 0.1,
      wettedPerimeter: rawData.χ ?? 0,
      nodeNum: rawData.NODE_NUM ?? 1,
      zenithAngle: rawData.θ ?? 90,
      azimuthAngle: rawData.ϕ ?? 0,
      sampling: rawData.SAMPLING,
    };

    // 根据类型添加特有属性
    switch (elementType) {
      case 'Pipe':
        return {
          ...baseProps,
          type: 'Pipe',
          fricMode: (rawData.FRIC_MODE as any) ?? 'DEFAULT',
        } as any;

      case 'Pump':
        return {
          ...baseProps,
          type: 'Pump',
          ratedHead: rawData.ratedHead ?? 0,
          ratedFlow: rawData.ratedFlow ?? 0,
        } as any;

      case 'Valve':
        return {
          ...baseProps,
          type: 'Valve',
          valveArea: rawData.valveArea ?? 0,
          isOpen: rawData.isOpen ?? true,
        } as any;

      case 'TimeDependentVolume':
        return {
          ...baseProps,
          type: 'TimeDependentVolume',
        } as any;

      case 'TimeDependentJunction':
        return {
          ...baseProps,
          type: 'TimeDependentJunction',
        } as any;

      case 'Pool':
        return {
          ...baseProps,
          type: 'Pool',
        } as any;

      case 'Bufffertank':
        return {
          ...baseProps,
          type: 'Bufffertank',
        } as any;

      default:
        // 未知类型降级为 Pipe
        console.warn(`未知元件类型 ${rawData.TYPE}, 降级为 Pipe`);
        return {
          ...baseProps,
          type: 'Pipe',
          fricMode: 'DEFAULT',
        } as any;
    }
  }

  /**
   * 从 URL 加载并解析 JSON 文件
   */
  public async loadFromUrl(url: string): Promise<TopologyData> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return this.parseTopologyData(data);
    } catch (error) {
      console.error('加载 JSON 文件失败:', error);
      throw error;
    }
  }

  /**
   * 从字符串解析 JSON
   */
  public parseFromString(jsonString: string): TopologyData {
    try {
      const data = JSON.parse(jsonString);
      return this.parseTopologyData(data);
    } catch (error) {
      console.error('解析 JSON 字符串失败:', error);
      throw new Error(`JSON 解析错误：${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 从 File 对象读取并解析 JSON
   */
  public async parseFromFile(file: File): Promise<TopologyData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const data = this.parseFromString(content);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };

      reader.readAsText(file);
    });
  }
}

// 导出单例实例
export const jsonParser = new JsonParserService();