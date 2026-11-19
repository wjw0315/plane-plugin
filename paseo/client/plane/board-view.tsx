import React, { useRef, useState } from "react";
import { PanResponder, ScrollView, StyleSheet, Text, View } from "react-native";
import { WorkItemCard } from "./card";
import { DRAG_OVER, SIZE, type PlaneColors } from "./tokens";
import type { PlaneState, PlaneWorkItem } from "./types";

export interface BoardViewProps {
  states: PlaneState[];
  itemsByState: (stateId: string) => PlaneWorkItem[];
  colors: PlaneColors;
  /** 窄屏用更窄的列（设计稿 §2.1）。 */
  compact: boolean;
  /** 拖拽落到目标列：乐观更新 + 失败回滚由上层统一处理。 */
  onMove: (item: PlaneWorkItem, targetStateId: string) => void;
  /** 点按卡片唤起会话。 */
  onOpenCard: (item: PlaneWorkItem) => void;
  /** 会话 chip 点击（直接用标签里的 agentId）。 */
  onOpenSession: (agentId: string) => void;
}

/**
 * 列视图（设计稿 §1.2 / §3.2）：横向滚动的列 + 拖拽改状态。
 *
 * 拖拽判定沿用既有实现：手势一旦落在卡片上就接管，
 * 用 measureInWindow 量出每列在窗口中的矩形，拖到哪一列就改到哪个状态。
 */
export function BoardView(props: BoardViewProps) {
  const { states, itemsByState, colors, compact, onMove, onOpenCard, onOpenSession } = props;
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStateId, setDragOverStateId] = useState<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const columnRefs = useRef<Record<string, View | null>>({});
  const columnRects = useRef<Record<string, { x: number; y: number; w: number; h: number }>>({});

  /** 按窗口坐标命中列（设计稿 §3.2 的拖拽落点判定）。 */
  const hitTestColumn = (x: number, y: number): string | null => {
    for (const s of states) {
      const r = columnRects.current[s.id];
      if (r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return s.id;
    }
    return null;
  };

  const createCardPanResponder = (item: PlaneWorkItem) =>
    PanResponder.create({
      // 卡片一旦被摸到就接管手势，看板横向滚动留给滚轮/触控板/列间空隙
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: () => {
        draggingIdRef.current = item.id;
        setDraggingId(item.id);
        // 尚未移动时不点亮任何列（悬停高亮只在真正拖到某一列时出现，设计稿 §3.2）
        setDragOverStateId(null);
        columnRects.current = {};
        Promise.all(
          states.map(
            (s) =>
              new Promise<void>((resolve) => {
                const ref = columnRefs.current[s.id];
                if (!ref) {
                  resolve();
                  return;
                }
                ref.measureInWindow((x, y, w, h) => {
                  columnRects.current[s.id] = { x, y, w, h };
                  resolve();
                });
              }),
          ),
        ).catch(() => {});
      },
      onPanResponderMove: (_e, gs) => {
        if (!draggingIdRef.current) return;
        setDragOverStateId(hitTestColumn(gs.x0 + gs.dx, gs.y0 + gs.dy));
      },
      onPanResponderRelease: (_e, gs) => {
        const draggedId = draggingIdRef.current;
        setDraggingId(null);
        setDragOverStateId(null);
        draggingIdRef.current = null;
        if (!draggedId || draggedId !== item.id) return;
        // 位移极小视为点按：唤起会话；否则走拖拽改状态
        if (Math.abs(gs.dx) < 10 && Math.abs(gs.dy) < 10) {
          onOpenCard(item);
          return;
        }
        const target = hitTestColumn(gs.x0 + gs.dx, gs.y0 + gs.dy);
        if (!target || target === item.stateId) return;
        onMove(item, target);
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => {
        draggingIdRef.current = null;
        setDraggingId(null);
        setDragOverStateId(null);
      },
    });

  const columnWidth = compact ? SIZE.columnWidthCompact : SIZE.columnWidth;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.board}
      contentContainerStyle={styles.boardContent}
    >
      {states.map((state) => {
        const items = itemsByState(state.id);
        const isOver = dragOverStateId === state.id;
        return (
          <View
            key={state.id}
            ref={(el) => {
              columnRefs.current[state.id] = el;
            }}
            style={[
              styles.column,
              {
                width: columnWidth,
                backgroundColor: isOver ? DRAG_OVER.bg : colors.surface1,
                borderColor: isOver ? DRAG_OVER.border : colors.border,
              },
            ]}
          >
            {/* 列头：状态色点 + 状态名 + 数量（设计稿 §3.2） */}
            <View style={styles.columnHeader}>
              <View
                style={[styles.dot, { backgroundColor: state.color ?? colors.foregroundMuted }]}
              />
              <Text numberOfLines={1} style={[styles.columnName, { color: colors.foreground }]}>
                {state.name}
              </Text>
              <Text style={[styles.columnCount, { color: colors.foregroundMuted }]}>
                {items.length}
              </Text>
            </View>
            {items.map((item) => (
              <WorkItemCard
                key={item.id}
                item={item}
                colors={colors}
                onPress={onOpenCard}
                onPressSession={onOpenSession}
                panHandlers={createCardPanResponder(item).panHandlers}
                dragging={draggingId === item.id}
              />
            ))}
            {items.length === 0 ? (
              <View style={[styles.blank, { borderColor: colors.border }]}>
                <Text style={[styles.blankText, { color: colors.foregroundMuted }]}>拖到这里</Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  board: {
    flex: 1,
  },
  boardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SIZE.columnGap,
    padding: SIZE.bodyPadding,
    paddingBottom: SIZE.bodyPadding + 8,
  },
  column: {
    borderRadius: SIZE.columnRadius,
    borderWidth: 1,
    padding: SIZE.columnPadding,
    minHeight: 80,
  },
  columnHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 7,
  },
  dot: {
    width: SIZE.dotSize,
    height: SIZE.dotSize,
    borderRadius: SIZE.dotSize / 2,
  },
  columnName: {
    flex: 1,
    fontSize: SIZE.columnNameFontSize,
    fontWeight: "600",
  },
  columnCount: {
    fontSize: SIZE.metaFontSize,
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
});
