/**
 * @fileoverview 全局类型定义
 * 为整个应用提供统一的类型系统
 */

// ============================================
// 1. 基础几何类型
// ============================================

/** 3D 空间中的点坐标 */
export type Point3D = [number, number, number];

/** 3D 空间中的向量 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/** 球坐标参数 */
export interface SphericalCoords {
  radius: number;
  zenithAngle: number;   // θ (天顶角)
  azimuthAngle: number;  // ϕ (方位角)
}

// ============================================
// 2. 方向与变换类型
// ============================================

/** 欧拉角旋转 (弧度制) */
export interface EulerRotation {
  x: number;
  y: number;
  z: number;
}

/** 变换矩阵数据 */
export interface TransformData {
  position: Point3D;
  rotation: EulerRotation;
  scale?: Point3D;
}

// ============================================
// 3. 布局配置类型
// ============================================

/** 布局计算选项 */
export interface LayoutOptions {
  /** 全局偏移量 */
  offset?: Point3D;
  /** 是否重新计算所有节点 */
  forceRecalc?: boolean;
  /** 回路间距 */
  circuitSpacing?: number;
}

/** 布局结果 */
export interface LayoutResult {
  success: boolean;
  elementCount: number;
  warnings?: string[];
  errors?: string[];
}

// ============================================
// 4. 通用工具类型
// ============================================

/** 部分更新类型 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** 只读深度映射 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/** 字典/映射类型 */
export type Dictionary<T> = Record<string, T>;

/** 可选字典 */
export type OptionalDictionary<T> = Record<string, T | undefined>;