/**
 * @fileoverview 拓扑布局工具 (向后兼容的导出)
 *
 * @deprecated 请使用新的几何模块:
 * - `import { layoutEngine } from '@/utils/geometry/topologyLayout'`
 * - `import { getDirectionVector } from '@/utils/geometry/vector'`
 */

// 重新导出新的几何模块，保持向后兼容性
export {
  layoutEngine,
  TopologyLayoutEngine
} from './geometry/topologyLayout';

export {
  getDirectionVector,
  calculateEndPoint,
  degToRad,
  radToDeg,
  distance,
  vectorLength,
  normalizeVector,
  dotProduct,
  crossProduct,
  addVectors,
  subtractVectors,
  scaleVector,
  eulerToRadians,
  sphericalToEuler
} from './geometry/vector';