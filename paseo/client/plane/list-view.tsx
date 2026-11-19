import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { WorkItemCard } from "./card";
import { SIZE, type PlaneColors } from "./tokens";
import type { PlaneState, PlaneWorkItem } from "./types";

export interface ListViewProps {
  states: PlaneState[];
  itemsByState: (stateId: string) => PlaneWorkItem[];
  colors: PlaneColors;
  /** 折叠状态：stateId -> 是否折叠。 */
  collapsed: Record<string, boolean>;
  onToggleGroup: (stateId: string) => void;
  /** 用「移动到」pill 改状态。 */
  onMove: (item: PlaneWorkItem, targetStateId: string) => void;
  /** 点按卡片唤起会话。 */
  onOpenCard: (item: PlaneWorkItem) => void;
  /** 会话 chip 点击（直接用标签里的 agentId）。 */
  onOpenSession: (agentId: string) => void;
}

/**
 * 列表视图（设计稿 §1.2 / §3.3）：按状态分组、组头可折叠，
 * 每张卡片下面跟一行「移动到」状态 pill（RN 无原生 select，用一排 pill 代替）。
 */
export function ListView(props: ListViewProps) {
  const {
    states,
    itemsByState,
    colors,
    collapsed,
    onToggleGroup,
    onMove,
    onOpenCard,
    onOpenSession,
  } = props;

  return (
    <ScrollView
      style={styles.list}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    >
      {states.map((state) => {
        const items = itemsByState(state.id);
        const isCollapsed = collapsed[state.id] === true;
        return (
          <View
            key={state.id}
            style={[styles.group, { backgroundColor: colors.surface1, borderColor: colors.border }]}
          >
            {/* 组头：状态色点 + 状态名 + 数量（设计稿 §3.3） */}
            <Pressable
              onPress={() => onToggleGroup(state.id)}
              style={[styles.groupHeader, { backgroundColor: colors.surface2 }]}
            >
              <Text style={[styles.chevron, { color: colors.foregroundMuted }]}>
                {isCollapsed ? "▸" : "▾"}
              </Text>
              <View
                style={[styles.dot, { backgroundColor: state.color ?? colors.foregroundMuted }]}
              />
              <Text numberOfLines={1} style={[styles.groupName, { color: colors.foreground }]}>
                {state.name}
              </Text>
              <Text style={[styles.groupCount, { color: colors.foregroundMuted }]}>
                {items.length}
              </Text>
            </Pressable>
            {isCollapsed ? null : (
              <View style={styles.groupBody}>
                {items.length === 0 ? (
                  <View style={[styles.blank, { borderColor: colors.border }]}>
                    <Text style={[styles.blankText, { color: colors.foregroundMuted }]}>
                      这个状态还没有工作项
                    </Text>
                  </View>
                ) : (
                  items.map((item) => (
                    <View key={item.id}>
                      <WorkItemCard
                        item={item}
                        colors={colors}
                        onPress={onOpenCard}
                        onPressSession={onOpenSession}
                      />
                      {/* 「移动到」一排状态 pill（设计稿 §3.3） */}
                      <View style={styles.moveRow}>
                        <Text style={[styles.moveLabel, { color: colors.foregroundMuted }]}>
                          移动到
                        </Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.pillRow}
                        >
                          {states.map((target) => {
                            const active = target.id === item.stateId;
                            return (
                              <Pressable
                                key={target.id}
                                onPress={() => {
                                  if (active) return;
                                  onMove(item, target.id);
                                }}
                                style={[
                                  styles.statePill,
                                  {
                                    borderColor: colors.border,
                                    backgroundColor: active ? colors.accent : "transparent",
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.statePillText,
                                    {
                                      color: active
                                        ? colors.accentForeground
                                        : colors.foregroundMuted,
                                    },
                                  ]}
                                >
                                  {target.name}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </ScrollView>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    padding: SIZE.bodyPadding,
    paddingBottom: SIZE.bodyPadding + 40,
  },
  group: {
    borderWidth: 1,
    borderRadius: SIZE.columnRadius,
    marginBottom: 8,
    overflow: "hidden",
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 9,
  },
  chevron: {
    fontSize: 10,
    width: 10,
  },
  dot: {
    width: SIZE.dotSize,
    height: SIZE.dotSize,
    borderRadius: SIZE.dotSize / 2,
  },
  groupName: {
    flex: 1,
    fontSize: SIZE.columnNameFontSize,
    fontWeight: "600",
  },
  groupCount: {
    fontSize: SIZE.metaFontSize,
  },
  groupBody: {
    padding: 8,
  },
  blank: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: SIZE.cardRadius,
    paddingVertical: 8,
    alignItems: "center",
  },
  blankText: {
    fontSize: SIZE.metaFontSize,
  },
  moveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  moveLabel: {
    fontSize: 10,
  },
  pillRow: {
    alignItems: "center",
    gap: 6,
    paddingRight: 4,
  },
  statePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  statePillText: {
    fontSize: SIZE.segFontSize,
  },
});
