import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PRIORITY_CHIP, SESSION_CHIP, SIZE, type PlaneColors } from "./tokens";

/** 优先级 chip（设计稿 §3.1）：深底 + 彩字 + 描边；无优先级时不渲染。 */
export function PriorityChip({
  priority,
  colors,
}: {
  priority: string | null;
  colors: PlaneColors;
}) {
  if (!priority) return null;
  const skin = PRIORITY_CHIP[priority];
  if (!skin) return null;
  return (
    <View style={[styles.chip, { backgroundColor: skin.bg, borderColor: colors.border }]}>
      <Text style={[styles.chipText, { color: skin.fg }]}>{skin.label}</Text>
    </View>
  );
}

/** 中性标签 chip（设计稿 §3.1）：最多 2 个，超出显示 +N。 */
export function LabelChips({
  labels,
  colors,
}: {
  labels: string[];
  colors: PlaneColors;
}) {
  if (labels.length === 0) return null;
  const visible = labels.slice(0, 2);
  const rest = labels.length - visible.length;
  return (
    <View style={styles.chipRow}>
      {visible.map((label) => (
        <View
          key={label}
          style={[styles.chip, { backgroundColor: "transparent", borderColor: colors.border }]}
        >
          <Text style={[styles.chipText, { color: colors.foregroundMuted }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ))}
      {rest > 0 ? (
        <View
          style={[styles.chip, { backgroundColor: "transparent", borderColor: colors.border }]}
        >
          <Text style={[styles.chipText, { color: colors.foregroundMuted }]}>{`+${rest}`}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** 指派头像（设计稿 §3.1）：直径 16 圆，取指派人名末两字。 */
export function AssigneeAvatar({
  name,
  colors,
}: {
  name: string | null;
  colors: PlaneColors;
}) {
  // 无人时显示「未指派」文字，不显示空头像（设计稿 §3.1）
  if (!name) {
    return <Text style={[styles.unassigned, { color: colors.foregroundMuted }]}>未指派</Text>;
  }
  const initial = name.slice(-2);
  return (
    <View
      style={[
        styles.avatar,
        { backgroundColor: colors.accent, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.avatarText, { color: colors.accentForeground }]}>{initial}</Text>
    </View>
  );
}

/** 会话 chip（设计稿 §3.1 / §3.3）：紫色系，点击直接唤起关联会话。 */
export function SessionChip({
  agentId,
  colors,
  onPress,
}: {
  agentId: string;
  colors: PlaneColors;
  onPress: (agentId: string) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(agentId)}
      style={[styles.chip, { backgroundColor: SESSION_CHIP.bg, borderColor: colors.border }]}
    >
      <Text style={[styles.chipText, { color: SESSION_CHIP.fg }]}>⌘ 会话</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 5,
    height: SIZE.chipLineHeight,
    justifyContent: "center",
  },
  chipText: {
    fontSize: SIZE.chipFontSize,
    lineHeight: SIZE.chipLineHeight,
  },
  avatar: {
    width: SIZE.avatarSize,
    height: SIZE.avatarSize,
    borderRadius: SIZE.avatarSize / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: SIZE.avatarFontSize,
    lineHeight: SIZE.avatarSize,
  },
  unassigned: {
    fontSize: SIZE.metaFontSize,
  },
});
