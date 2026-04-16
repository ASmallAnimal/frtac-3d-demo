/**
 * @fileoverview 应用配置常量
 */

import type { Point3D } from '../types';

/**
 * 布局相关配置
 */
export const LAYOUT_CONFIG = {
  /** 默认回路间距 (米) */
  DEFAULT_CIRCUIT_SPACING: 12,

  /** 默认全局偏移 */
  DEFAULT_OFFSET: [0, 0, 0] as Point3D,

  /** 孤立节点哈希排布范围 */
  ISOLATED_NODE_RANGE: 8,

  /** 孤立节点哈希排布步长 */
  ISOLATED_NODE_STEP: 2,
} as const;

/**
 * 元件类型与颜色的映射
 */
export const ELEMENT_COLORS: Record<string, string> = {
  Pipe: '#44aaff',
  Pump: '#ffaa44',
  Bufffertank: '#ff8844',
  Pool: '#44ffdd',
  TimeDependentVolume: '#44ff88',
  TimeDependentJunction: '#aa44ff',
  Valve: '#ff4444',
  Default: '#aaaaaa',
  Selected: '#ffcc00',
} as const;

/**
 * 视图控制配置
 */
export const VIEW_CONFIG = {
  /** 默认相机位置 */
  DEFAULT_CAMERA_POSITION: [10, 10, 20] as Point3D,

  /** 适应窗口时的安全边距系数 */
  FIT_MARGIN_FACTOR: 1.1,

  /** 坐标轴 Gizmo 大小 */
  GIZMO_SIZE: 80,

  /** 网格大小 */
  GRID_SIZE: 20,

  /** 网格细分 */
  GRID_DIVISIONS: 20,
} as const;

/**
 * 几何体渲染配置
 */
export const GEOMETRY_CONFIG = {
  /** 圆柱/圆锥的径向分段数 */
  RADIAL_SEGMENTS: 32,

  /** 阀门锥体高度比例 */
  VALVE_CONE_HEIGHT_RATIO: 0.5,

  /** 选中状态下的箭头高度比例 */
  SELECTED_ARROW_HEIGHT_RATIO: 0.5,
} as const;

/**
 * 导出所有配置
 */
export default {
  LAYOUT_CONFIG,
  ELEMENT_COLORS,
  VIEW_CONFIG,
  GEOMETRY_CONFIG,
};