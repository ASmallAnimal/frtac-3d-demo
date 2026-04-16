// src/models/hydro/topology.ts

// ============================================
// 1. 组件类型枚举 (对应 JSON 中的 TYPE 字段)
// ============================================

/** 水力元件类型联合类型 */
export type ElementType =
  | 'Pump'
  | 'Pipe'
  | 'Bufffertank'
  | 'Valve'
  | 'TimeDependentVolume'
  | 'TimeDependentJunction'
  | 'Pool';

/** JSON 中 TYPE 数值到 ElementType 的映射 */
export const ELEMENT_TYPE_MAP: Record<number, ElementType> = {
  0: 'Pump',
  1: 'Pipe',
  2: 'Bufffertank',
  3: 'Valve',
  4: 'TimeDependentVolume',
  5: 'TimeDependentJunction',
  10: 'Pool',
};

/**
 * 将 JSON 中的数字 TYPE 转换为 ElementType 字符串
 * @param typeCode - JSON 中的 TYPE 数值
 * @returns 对应的元件类型字符串
 * @throws Error 当遇到未知的类型代码时
 */
export function typeCodeToElementType(typeCode: number): ElementType {
  const type = ELEMENT_TYPE_MAP[typeCode];
  if (!type) {
    throw new Error(`Unknown element type code: ${typeCode}`);
  }
  return type;
}

// ============================================
// 2. 基础元素接口 (对应 JSON 中 ELEMENT 的公共字段)
// ============================================

import type { Point3D } from '../../types';

/** 所有水力元件的基础接口 */
export interface BaseElement {
  /** 唯一标识符 (对应 JSON 中的 Key) */
  id: string;
  /** 显示名称 */
  name: string;
  /** 组件类型 */
  type: ElementType;
  /** 长度 L (m) */
  length: number;
  /** 流通面积 A (m²) */
  flowArea: number;
  /** 湿周 χ (m) */
  wettedPerimeter: number;
  /** 节点数量 NODE_NUM */
  nodeNum: number;
  /** 天顶角 θ (°) */
  zenithAngle: number;
  /** 方位角 ϕ (°) */
  azimuthAngle: number;
  /** 3D 位置坐标 (由布局算法计算得出) */
  position?: Point3D;
  /** 采样点配置 SAMPLING */
  sampling?: number[];
}

// ============================================
// 3. 继承基类，定义具体组件特有属性
// ============================================

/** TYPE = 1 - 管道元件 */
export interface PipeElement extends BaseElement {
  type: 'Pipe';
  /** 表面粗糙度 (可选) */
  roughness?: number;
  /** 水力直径 (可选) */
  hydraulicDiameter?: number;
  /** 摩擦模式 */
  fricMode: 'DEFAULT' | string;
}

/** TYPE = 0 - 水泵元件 */
export interface PumpElement extends BaseElement {
  type: 'Pump';
  /** 额定扬程 */
  ratedHead: number;
  /** 额定流量 */
  ratedFlow: number;
}

/** TYPE = 3 - 阀门元件 */
export interface ValveElement extends BaseElement {
  type: 'Valve';
  /** 阀门开度面积 */
  valveArea: number;
  /** 阀门状态 */
  isOpen: boolean;
}

/** TYPE = 4 - 时变体积源 */
export interface TimeDependentVolumeElement extends BaseElement {
  type: 'TimeDependentVolume';
  // 目前 JSON 中无特有字段，后续可扩展
}

/** TYPE = 5 - 时变连接点 */
export interface TimeDependentJunctionElement extends BaseElement {
  type: 'TimeDependentJunction';
  // 目前 JSON 中无特有字段，后续可扩展
}

/** TYPE = 10 - 水池 */
export interface PoolElement extends BaseElement {
  type: 'Pool';
}

/** TYPE = 2 - 缓冲罐 */
export interface BufffertankElement extends BaseElement {
  type: 'Bufffertank';
}

// ============================================
// 4. 联合类型：代表系统中的任意一种组件
// ============================================

/** 水力元件联合类型 */
export type HydraulicElement =
  | PipeElement
  | PumpElement
  | ValveElement
  | TimeDependentVolumeElement
  | TimeDependentJunctionElement
  | PoolElement
  | BufffertankElement;

// ============================================
// 5. 连接关系结构
// ============================================

/** 元件之间的连接关系 */
export interface Connection {
  /** 连接唯一标识 */
  id: string;
  /** 源组件 ID */
  fromId: string;
  /** 目标组件 ID */
  toId: string;
}

// ============================================
// 6. 回路结构 (对应 JSON 中 HYDRO 下的子对象)
// ============================================

/** 水力回路 */
export interface Circuit {
  /** 介质名称 */
  medium: string;
  /** 是否为临界流 */
  criticalFlow: boolean;
  /** 元件字典 */
  elements: Record<string, HydraulicElement>;
  /** 连接列表 */
  connections: Connection[];
}

// ============================================
// 7. 系统整体拓扑结构
// ============================================

/** 完整的水力拓扑数据 */
export interface TopologyData {
  /** 多回路字典，Key 为回路名称 */
  circuits: Record<string, Circuit>;
}