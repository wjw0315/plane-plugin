import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SIZE, type PlaneColors } from "./tokens";
import type { PlaneProject, PlaneViewMode } from "./types";

export interface PlaneHeaderProps {
  colors: PlaneColors;
  /** 当前视图（列 / 列表）。 */
  view: PlaneViewMode;
  onChangeView: (view: PlaneViewMode) => void;
  projects: PlaneProject[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  onRefresh: () => void;
  onOpenSettings: () => void;
  /** 已连上且已拉到项目：状态点变绿。 */
  connected: boolean;
}

/**
 * 顶栏（设计稿 §1 / §1.1）：状态点 / 标题 / 视图段控件 / 项目 / 刷新 / 设置。
 *
 * 没有 footer——连接态并进顶栏状态点（设计稿 §1）。
 */
export function PlaneHeader(props: PlaneHeaderProps) {
  const {
    colors,
    view,
    onChangeView,
    projects,
    selectedProjectId,
    onSelectProject,
    onRefresh,
    onOpenSettings,
    connected,
  } = props;
  const [menuOpen, setMenuOpen] = useState(false);

  const current = projects.find((p) => p.id === selectedProjectId);

  /** 项目切换：项目 ≤3 时直接循环切下一个，否则弹出项目浮层（设计稿 §1.1）。 */
  const handleProjectPress = () => {
    if (projects.length === 0) return;
    if (projects.length <= 3) {
      const index = projects.findIndex((p) => p.id === selectedProjectId);
      const next = projects[(index + 1) % projects.length];
      onSelectProject(next.id);
      return;
    }
    setMenuOpen((open) => !open);
  };

  return (
    <>
      <View
        style={[
          styles.header,
          {
            height: SIZE.headerHeight,
            paddingHorizontal: SIZE.headerPaddingH,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {/* 状态点：绿=已连上并拉到项目，灰=未配置或加载中 */}
        <View
          style={[
            styles.dot,
            { backgroundColor: connected ? colors.statusSuccess : colors.foregroundMuted },
          ]}
        />
        <Text style={[styles.title, { color: colors.foreground }]}>Plane 任务看板</Text>

        {/* 视图段控件：紧跟标题（设计稿 §1.1），切视图不重新拉数据 */}
        <View style={[styles.seg, { borderColor: colors.border, backgroundColor: colors.surface2 }]}>
          <Pressable
            onPress={() => onChangeView("board")}
            style={[
              styles.segButton,
              {
                borderRightColor: colors.border,
                borderRightWidth: 1,
                backgroundColor: view === "board" ? colors.accent : "transparent",
              },
            ]}
          >
            <Text
              style={[
                styles.segText,
                { color: view === "board" ? colors.accentForeground : colors.foregroundMuted },
              ]}
            >
              列
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onChangeView("list")}
            style={[
              styles.segButton,
              { backgroundColor: view === "list" ? colors.accent : "transparent" },
            ]}
          >
            <Text
              style={[
                styles.segText,
                { color: view === "list" ? colors.accentForeground : colors.foregroundMuted },
              ]}
            >
              列表
            </Text>
          </Pressable>
        </View>

        <View style={styles.grow} />

        {/* 项目切换 */}
        <Pressable
          onPress={handleProjectPress}
          style={[
            styles.projectButton,
            { borderColor: colors.border, backgroundColor: colors.surface2 },
          ]}
        >
          <Text numberOfLines={1} style={[styles.projectText, { color: colors.foregroundMuted }]}>
            {current ? `${current.name} ▾` : "项目 ▾"}
          </Text>
        </Pressable>

        {/* 刷新：重新拉 states + work items */}
        <Pressable onPress={onRefresh} style={styles.iconButton}>
          <Text style={[styles.iconText, { color: colors.foregroundMuted }]}>↻</Text>
        </Pressable>

        {/* 设置：跳转宿主设置页 */}
        <Pressable onPress={onOpenSettings} style={styles.iconButton}>
          <Text style={[styles.iconText, { color: colors.foregroundMuted }]}>⚙</Text>
        </Pressable>
      </View>

      {/* 项目浮层：超过 8 项时滚动（设计稿 §1.1） */}
      {menuOpen ? (
        <View style={[styles.menu, { borderColor: colors.border, backgroundColor: colors.surface1 }]}>
          <ScrollView
            style={projects.length > 8 ? styles.menuScroll : undefined}
            showsVerticalScrollIndicator={false}
          >
            {projects.map((p) => {
              const active = p.id === selectedProjectId;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    setMenuOpen(false);
                    onSelectProject(p.id);
                  }}
                  style={[
                    styles.menuItem,
                    { backgroundColor: active ? colors.accent : "transparent" },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.menuItemText,
                      { color: active ? colors.accentForeground : colors.foreground },
                    ]}
                  >
                    {p.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: SIZE.headerPaddingV,
    borderBottomWidth: 1,
  },
  dot: {
    width: SIZE.dotSize,
    height: SIZE.dotSize,
    borderRadius: SIZE.dotSize / 2,
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
  },
  grow: {
    flex: 1,
  },
  seg: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 7,
    overflow: "hidden",
  },
  segButton: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  segText: {
    fontSize: SIZE.segFontSize,
  },
  projectButton: {
    maxWidth: 140,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  projectText: {
    fontSize: 11,
  },
  iconButton: {
    paddingHorizontal: 3,
    paddingVertical: 2,
  },
  iconText: {
    fontSize: 13,
  },
  menu: {
    position: "absolute",
    top: SIZE.headerHeight,
    right: SIZE.headerPaddingH,
    minWidth: 160,
    maxWidth: 260,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    zIndex: 30,
    elevation: 8,
  },
  menuScroll: {
    maxHeight: 240,
  },
  menuItem: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  menuItemText: {
    fontSize: 11,
  },
});
