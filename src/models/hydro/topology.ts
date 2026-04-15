// src/models/hydro/topology.ts

// 1. 定义组件类型枚举 (对应 JSON 中的 TYPE 字段)
export type ElementType =
    | 'Pump'
    | 'Pipe'
    | 'Bufffertank'
    | 'Valve'
    | 'TimeDependentVolume'
    | 'TimeDependentJunction'
    | 'Pool';

// JSON 中 TYPE 数值到 ElementType 的映射
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
 */
export function typeCodeToElementType(typeCode: number): ElementType {
    const type = ELEMENT_TYPE_MAP[typeCode];
    if (!type) {
        throw new Error(`Unknown element type code: ${typeCode}`);
    }
    return type;
}

// 2. 定义基础元素接口 (对应 JSON 中 ELEMENT 的公共字段)
export interface BaseElement {
    id: string;                 // 唯一标识符 (对应 JSON 中的 Key)
    name: string;               // 显示名称
    type: ElementType;          // 组件类型
    length: number;             // 长度 L (m)
    flowArea: number;           // 流通面积 A (m²)
    wettedPerimeter: number;    // 湿周 χ (m)
    nodeNum: number;            // 节点数量 NODE_NUM
    zenithAngle: number;        // 天顶角 θ (°)
    azimuthAngle: number;       // 方位角 ϕ (°)
    // 可以根据需要补充位置坐标，供 3D 渲染使用
    position?: [number, number, number];
    sampling?: number[];        // 采样点配置 SAMPLING
}

// 3. 继承基类，定义具体组件特有属性

/** TYPE = 1 */
export interface PipeElement extends BaseElement {
    type: 'Pipe';
    roughness?: number;         // 表面粗糙度 (可选，JSON 中未出现但保留)
    hydraulicDiameter?: number; // 水力直径 (可选)
    fricMode: "DEFAULT";          // 摩擦模式 FRIC_MODE，如 "DEFAULT"
}

/** TYPE = 2 */
export interface PumpElement extends BaseElement {
    type: 'Pump';
    ratedHead: number;          // 额定扬程
    ratedFlow: number;          // 额定流量
}

/** TYPE = 3 */
export interface ValveElement extends BaseElement {
    type: 'Valve';
    valveArea: number;          // 阀门开度面积
    isOpen: boolean;            // 阀门状态
}

/** TYPE = 4 */
export interface TimeDependentVolumeElement extends BaseElement {
    type: 'TimeDependentVolume';
    // 目前 JSON 中无特有字段，后续可扩展
}

/** TYPE = 5 */
export interface TimeDependentJunctionElement extends BaseElement {
    type: 'TimeDependentJunction';
    // 目前 JSON 中无特有字段，后续可扩展
}

/** TYPE = 10 */
export interface PoolElement extends BaseElement {
    type: 'Pool';
}

/** TYPE = 2 */
export interface BufffertankElement extends BaseElement {
    type: 'Bufffertank';
}

// 4. 联合类型：代表系统中的任意一种组件
export type HydraulicElement =
    | PipeElement
    | PumpElement
    | ValveElement
    | TimeDependentVolumeElement
    | TimeDependentJunctionElement
    | PoolElement
    | BufffertankElement;

// 5. 定义连接 (Connection) 结构
export interface Connection {
    id: string;           // 连接唯一标识，例如 `${fromId}->${toId}` 或 UUID
    fromId: string;       // 源组件ID
    toId: string;         // 目标组件ID
}

// 6. 定义回路 (Circuit) 结构，对应 JSON 中 HYDRO 下的子对象
export interface Circuit {
    medium: string;                         // 介质 MEDIUM，如 "PbBi"
    criticalFlow: boolean;                  // 临界流标志 CRITICAL_FLOW
    elements: Record<string, HydraulicElement>; // 组件字典 ELEMENT
    connections: Connection[];              // 连接列表（替代旧版 linkTable）
}

// 6. 定义系统的整体 JSON 结构 (对应 C# 中反序列化的 SystemTopology)
export interface TopologyData {
    circuits: Record<string, Circuit>;      // 多回路字典，Key 为回路名称
}
