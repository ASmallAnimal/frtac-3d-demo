/**
 * @fileoverview 几何计算工具函数
 * 提供与 Three.js 无关的纯数学计算功能
 */

import type { Point3D, Vector3, EulerRotation } from '../../types';

/**
 * 根据天顶角 θ 和方位角 ϕ 计算单位方向向量
 *
 * 坐标系定义 (Three.js Y-Up 右手系):
 * - zenithAngle (θ): 与 +Y 轴的夹角 (0°=垂直向上，90°=水平面，180°=垂直向下)
 * - azimuthAngle (ϕ): 绕 Y 轴的旋转角 (0°指向+Z, 90°指向+X)
 *
 * @param zenithAngle - 天顶角 (度)
 * @param azimuthAngle - 方位角 (度)
 * @returns 单位方向向量 [x, y, z]
 */
export function getDirectionVector(
  zenithAngle: number = 90,
  azimuthAngle: number = 0
): Point3D {
  const phi = zenithAngle * (Math.PI / 180);
  const theta = azimuthAngle * (Math.PI / 180);

  // 球坐标转笛卡尔坐标
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);

  return [
    sinPhi * sinTheta,  // x
    cosPhi,             // y
    sinPhi * cosTheta   // z
  ];
}

/**
 * 计算从起点沿指定方向延伸指定长度后的终点坐标
 *
 * @param start - 起点坐标
 * @param zenithAngle - 天顶角 (度)
 * @param azimuthAngle - 方位角 (度)
 * @param length - 延伸长度
 * @returns 终点坐标 [x, y, z]
 */
export function calculateEndPoint(
  start: Point3D,
  zenithAngle: number,
  azimuthAngle: number,
  length: number
): Point3D {
  const [dx, dy, dz] = getDirectionVector(zenithAngle, azimuthAngle);

  return [
    start[0] + dx * length,
    start[1] + dy * length,
    start[2] + dz * length
  ];
}

/**
 * 将角度转换为弧度
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * 将弧度转换为角度
 */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * 计算两点之间的距离
 */
export function distance(p1: Point3D, p2: Point3D): number {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 计算向量的模长
 */
export function vectorLength(vec: Point3D): number {
  return Math.sqrt(vec[0] ** 2 + vec[1] ** 2 + vec[2] ** 2);
}

/**
 * 归一化向量
 */
export function normalizeVector(vec: Point3D): Point3D {
  const len = vectorLength(vec);
  if (len === 0) return [0, 0, 0];
  return [vec[0] / len, vec[1] / len, vec[2] / len];
}

/**
 * 向量点积
 */
export function dotProduct(v1: Point3D, v2: Point3D): number {
  return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
}

/**
 * 向量叉积
 */
export function crossProduct(v1: Point3D, v2: Point3D): Point3D {
  return [
    v1[1] * v2[2] - v1[2] * v2[1],
    v1[2] * v2[0] - v1[0] * v2[2],
    v1[0] * v2[1] - v1[1] * v2[0]
  ];
}

/**
 * 向量加法
 */
export function addVectors(v1: Point3D, v2: Point3D): Point3D {
  return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
}

/**
 * 向量减法
 */
export function subtractVectors(v1: Point3D, v2: Point3D): Point3D {
  return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
}

/**
 * 向量数乘
 */
export function scaleVector(vec: Point3D, scalar: number): Point3D {
  return [vec[0] * scalar, vec[1] * scalar, vec[2] * scalar];
}

/**
 * 将欧拉角 (角度制) 转换为弧度制
 */
export function eulerToRadians(
  x: number,
  y: number,
  z: number
): EulerRotation {
  return {
    x: degToRad(x),
    y: degToRad(y),
    z: degToRad(z)
  };
}

/**
 * 根据天顶角和方位角计算欧拉角 (用于 Three.js 旋转)
 *
 * @param zenithAngle - 天顶角 (度)
 * @param azimuthAngle - 方位角 (度)
 * @returns 欧拉角 {x, y, z} (弧度)
 */
export function sphericalToEuler(
  zenithAngle: number,
  azimuthAngle: number
): EulerRotation {
  return {
    x: degToRad(zenithAngle),
    y: degToRad(azimuthAngle),
    z: 0
  };
}