import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { PanResponderInstance } from "react-native";
import { AssigneeAvatar, LabelChips, PriorityChip, SessionChip } from "./chips";
import { extractSessionAgentId, readableLabels } from "./labels";
import { IDENTIFIER_PREFIX, SIZE, type PlaneColors } from "./tokens";
import type { PlaneWorkItem } from "./types";

export interface WorkItemCardProps {
  item: PlaneWorkItem;
  colors: PlaneColors;
  /** 点按卡片：走 resolve-session 唤起会话（列视图位移 <10px 视为点按）。 */
  onPress: (item: PlaneWorkItem) => void;
  /** 会话 chip 点击：直接用标签解析出的 agentId 唤起，不发 RPC。 */
  onPressSession: (agentId: string) => void;
  /** 列视图的拖拽手势；列表视图不传（改用 Pressable 点按）。 */
  panHandlers?: PanResponderInstance["panHandlers"];
  /** 正在被拖拽的卡片降低不透明度。 */
  dragging?: boolean;
}

/**
 * 看板卡片（设计稿 §3.1）。
 *
 * 结构：标题（最多 2 行）+ 元信息行（编号 / 优先级 chip / 头像 / 会话 chip）+ 标签 chip。
 * 列视图由 PanResponder 接管手势（拖拽改状态、点按唤起会话），
 * 列表视图退化为普通 Pressable 点按。
 */
export function WorkItemCard(props: WorkItemCardProps) {
  const { item, colors, onPress, onPressSession, panHandlers, dragging } = props;
  const assignee = item.assignees.length > 0 ? item.assignees[0].name : null;
  const sessionAgentId = extractSessionAgentId(item.labels);
  const labels = readableLabels(item.labels);

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.surface2,
      borderColor: colors.border,
      opacity: dragging ? 0.45 : 1,
    },
  ];

  const content = (
    <>
      <Text numberOfLines={2} style={[styles.title, { color: colors.foreground }]}>
        {item.name}
      </Text>
      <View style={styles.metaRow}>
        <Text style={[styles.identifier, { color: colors.foregroundMuted }]}>
          {item.identifier ? `${IDENTIFIER_PREFIX}${item.identifier}` : ""}
        </Text>
        <PriorityChip priority={item.priority} colors={colors} />
        <AssigneeAvatar name={assignee} colors={colors} />
        {sessionAgentId ? (
          <SessionChip agentId={sessionAgentId} colors={colors} onPress={onPressSession} />
        ) : null}
      </View>
      <LabelChips labels={labels} colors={colors} />
    </>
  );

  if (panHandlers) {
    return (
      <View {...panHandlers} style={cardStyle}>
        {content}
      </View>
    );
  }

  return (
    <Pressable onPress={() => onPress(item)} style={cardStyle}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: SIZE.cardRadius,
    borderWidth: 1,
    paddingVertical: SIZE.cardPaddingV,
    paddingHorizontal: SIZE.cardPaddingH,
    marginBottom: SIZE.cardGap,
  },
  title: {
    fontSize: SIZE.titleFontSize,
    lineHeight: SIZE.titleLineHeight,
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },
  identifier: {
    fontSize: SIZE.metaFontSize,
    fontVariant: ["tabular-nums"],
  },
});
