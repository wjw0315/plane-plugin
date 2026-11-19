import type { PluginTheme } from "@getpaseo/plugin";

/** 宿主主题色板（设计稿 §2.2 的角色映射，全部取自 theme.colors）。 */
export type PlaneColors = PluginTheme["colors"];

/** 尺寸 token（设计稿 §2.1，数值取自 openchamber/panel/index.html）。 */
export const SIZE = {
  /** 顶栏高 */
  headerHeight: 40,
  /** 顶栏上下内边距 */
  headerPaddingV: 10,
  /** 顶栏左右内边距 */
  headerPaddingH: 12,
  /** 主体内边距 */
  bodyPadding: 12,
  /** 列宽（宽屏） */
  columnWidth: 200,
  /** 列宽（窄屏） */
  columnWidthCompact: 160,
  /** 列间距 */
  columnGap: 8,
  /** 列内边距 */
  columnPadding: 8,
  /** 列圆角 */
  columnRadius: 10,
  /** 卡片圆角 */
  cardRadius: 9,
  /** 卡片上下内边距 */
  cardPaddingV: 8,
  /** 卡片左右内边距 */
  cardPaddingH: 9,
  /** 卡片间距 */
  cardGap: 6,
  /** 标题字号 / 行高 */
  titleFontSize: 13,
  titleLineHeight: 18,
  /** 元信息字号 */
  metaFontSize: 10.5,
  /** chip 字号 / 行高 */
  chipFontSize: 9.5,
  chipLineHeight: 15,
  /** 头像直径 / 字号 */
  avatarSize: 16,
  avatarFontSize: 9,
  /** 段控件字号 */
  segFontSize: 10.5,
  /** 列头 / 组头状态名字号（设计稿 §3.2） */
  columnNameFontSize: 11,
  /** toast 内边距 / 圆角 */
  toastPaddingV: 7,
  toastPaddingH: 9,
  toastRadius: 9,
  /** 状态点直径 */
  dotSize: 6,
} as const;

/** 优先级 chip 固定色（设计稿 §2.2；描边统一用 theme.colors.border）。 */
export const PRIORITY_CHIP: Record<string, { label: string; fg: string; bg: string }> = {
  urgent: { label: "紧急", fg: "#f87171", bg: "#241618" },
  high: { label: "高", fg: "#fbbf24", bg: "#241f14" },
  medium: { label: "中", fg: "#60a5fa", bg: "#141e26" },
  low: { label: "低", fg: "#6b7482", bg: "#191d22" },
};

/** 拖拽悬停列的描边与底色（设计稿 §2.2 / §3.2）。 */
export const DRAG_OVER = { border: "#3f6ea8", bg: "#101823" };

/** 会话 chip 配色（设计稿 §3.1，紫色系）。 */
export const SESSION_CHIP = { fg: "#a78bfa", bg: "#1b1630" };

/** toast 配色（设计稿 §2.2 / §3.4）。 */
export const TOAST = {
  /** 成功 toast 底色（描边用 theme.colors.border） */
  successBg: "#1b2129",
  /** 失败 toast 底色 / 描边 / 文字 */
  errorBg: "#241618",
  errorBorder: "#4a2326",
  errorFg: "#f87171",
} as const;

/** 编号前缀（设计稿 §3.1：编号展示为 XLMSC-<identifier>）。 */
export const IDENTIFIER_PREFIX = "XLMSC-";
