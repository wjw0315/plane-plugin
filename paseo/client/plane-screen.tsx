import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { useRpc } from "@getpaseo/plugin/client";
import { settingsRpc } from "@getpaseo/plugin";
import { PLANE_SETTINGS, type PlaneConfig } from "../shared/plane-settings";
import {
  planeListProjectsRpc,
  planeListStatesRpc,
  planeListWorkItemsRpc,
  planePatchStateRpc,
  planeResolveSessionRpc,
} from "../shared/plane-rpc";
import { BoardView } from "./plane/board-view";
import { ListView } from "./plane/list-view";
import { PlaneHeader } from "./plane/header";
import { PlaneToast, type PlaneToastState } from "./plane/toast";
import { SIZE } from "./plane/tokens";
import type { PlaneProject, PlaneState, PlaneWorkItem, PlaneViewMode } from "./plane/types";

export interface PlaneScreenProps extends PluginScreenProps {
  /** 由 contribute 注入：跳转宿主设置页；宿主不支持时为空。 */
  onOpenSettings?: () => void;
}

/**
 * Plane 任务看板屏幕（`addScreen` id `plane-board`）。
 *
 * 页面骨架见设计稿 §1：顶栏（状态点 / 标题 / 列-列表段控件 / 项目 / 刷新 / 设置）
 * + 主体（列视图或列表视图）+ 底部 toast。数据只拉一次，切换视图不重新请求。
 */
export function PlaneScreen(props: PlaneScreenProps) {
  const { theme, params, navigation, layout, onOpenSettings } = props;
  const colors = theme.colors;

  const readSettings = useRpc(settingsRpc(PLANE_SETTINGS.id).read);
  const fetchProjects = useRpc(planeListProjectsRpc);
  const fetchStates = useRpc(planeListStatesRpc);
  const fetchItems = useRpc(planeListWorkItemsRpc);
  const patchState = useRpc(planePatchStateRpc);
  const resolveSession = useRpc(planeResolveSessionRpc);

  const [config, setConfig] = useState<PlaneConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [projects, setProjects] = useState<PlaneProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(params.projectId ?? "");
  const [states, setStates] = useState<PlaneState[]>([]);
  const [workItems, setWorkItems] = useState<PlaneWorkItem[]>([]);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [view, setView] = useState<PlaneViewMode>("board");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<PlaneToastState | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // 读取插件配置（设置贡献点写在宿主设置里，这里只读）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await readSettings({});
        if (cancelled) return;
        if (result.status === "ready") {
          setConfig(result.values as PlaneConfig);
        } else {
          setConfigError(result.error ?? "配置读取失败");
        }
      } catch (e) {
        if (!cancelled) setConfigError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 拉项目列表
  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await fetchProjects({});
        if (cancelled) return;
        if (result.status === "ready") {
          setProjects(result.projects);
          if (!selectedProjectId && result.projects.length > 0) {
            setSelectedProjectId(result.projects[0].id);
          }
        } else {
          setBoardError(result.error);
        }
      } catch (e) {
        if (!cancelled) setBoardError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  // 拉当前项目的状态与工作项（刷新按钮通过 reloadToken 触发重拉）
  useEffect(() => {
    if (!config || !selectedProjectId) return;
    let cancelled = false;
    setLoadingBoard(true);
    setBoardError(null);
    setStates([]);
    setWorkItems([]);

    (async () => {
      try {
        const [statesResult, itemsResult] = await Promise.all([
          fetchStates({ projectId: selectedProjectId }),
          fetchItems({ projectId: selectedProjectId }),
        ]);
        if (cancelled) return;

        if (statesResult.status === "ready") {
          setStates(statesResult.states);
        } else {
          setBoardError(statesResult.error);
        }
        if (itemsResult.status === "ready") {
          setWorkItems(itemsResult.items);
        } else if (statesResult.status === "ready") {
          setBoardError(itemsResult.error);
        }
      } catch (e) {
        if (!cancelled) setBoardError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoadingBoard(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config, selectedProjectId, reloadToken]);

  // toast 自动消失：成功 5 秒（撤销窗口），失败 8 秒
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.kind === "success" ? 5000 : 8000);
    return () => clearTimeout(timer);
  }, [toast]);

  const itemsByState = useCallback(
    (stateId: string) => workItems.filter((w) => w.stateId === stateId),
    [workItems],
  );

  const stateName = useCallback(
    (stateId: string) => states.find((s) => s.id === stateId)?.name ?? stateId,
    [states],
  );

  /** 改状态：乐观更新 + 失败回滚原列 + toast（设计稿 §4 / §3.4）。 */
  const handleMove = useCallback(
    (item: PlaneWorkItem, targetStateId: string) => {
      if (!item || targetStateId === item.stateId) return;
      const fromStateId = item.stateId;
      setWorkItems((prev) =>
        prev.map((w) => (w.id === item.id ? { ...w, stateId: targetStateId } : w)),
      );
      setToast({
        kind: "success",
        message: `已移到「${stateName(targetStateId)}」`,
        undo: { itemId: item.id, fromStateId, toStateId: targetStateId },
      });
      patchState({ projectId: selectedProjectId, workItemId: item.id, stateId: targetStateId })
        .then((result) => {
          if (result.status === "error") {
            setWorkItems((prev) =>
              prev.map((w) => (w.id === item.id ? { ...w, stateId: fromStateId } : w)),
            );
            setToast({ kind: "error", message: `拖拽失败：${result.error}` });
          }
        })
        .catch((e: unknown) => {
          setWorkItems((prev) =>
            prev.map((w) => (w.id === item.id ? { ...w, stateId: fromStateId } : w)),
          );
          setToast({
            kind: "error",
            message: `拖拽失败：${e instanceof Error ? e.message : String(e)}`,
          });
        });
    },
    [patchState, selectedProjectId, stateName],
  );

  /** 撤销：5 秒内把卡片放回原列。 */
  const handleUndo = useCallback(() => {
    const undo = toast?.undo;
    if (!undo) return;
    setToast(null);
    setWorkItems((prev) =>
      prev.map((w) => (w.id === undo.itemId ? { ...w, stateId: undo.fromStateId } : w)),
    );
    patchState({
      projectId: selectedProjectId,
      workItemId: undo.itemId,
      stateId: undo.fromStateId,
    })
      .then((result) => {
        if (result.status === "error") {
          setWorkItems((prev) =>
            prev.map((w) => (w.id === undo.itemId ? { ...w, stateId: undo.toStateId } : w)),
          );
          setToast({ kind: "error", message: `撤销失败：${result.error}` });
        }
      })
      .catch((e: unknown) => {
        setWorkItems((prev) =>
          prev.map((w) => (w.id === undo.itemId ? { ...w, stateId: undo.toStateId } : w)),
        );
        setToast({
          kind: "error",
          message: `撤销失败：${e instanceof Error ? e.message : String(e)}`,
        });
      });
  }, [patchState, selectedProjectId, toast]);

  /** 点卡片：按标签反查会话并唤起（设计稿 §4，保留既有行为）。 */
  const handleOpenCard = useCallback(
    (item: PlaneWorkItem) => {
      resolveSession({ projectId: selectedProjectId, workItemId: item.id })
        .then((result) => {
          if (result.status === "error") {
            setToast({ kind: "error", message: `打开会话失败：${result.error}` });
            return;
          }
          if (!navigation?.openAgent) {
            setToast({ kind: "error", message: "当前环境不支持唤起会话" });
            return;
          }
          navigation.openAgent({ agentId: result.agentId });
        })
        .catch((e: unknown) => {
          setToast({
            kind: "error",
            message: `打开会话失败：${e instanceof Error ? e.message : String(e)}`,
          });
        });
    },
    [navigation, resolveSession, selectedProjectId],
  );

  /** 会话 chip：标签里已带 agentId，直接唤起，不再发 RPC（设计稿 §3.1）。 */
  const handleOpenSession = useCallback(
    (agentId: string) => {
      if (!navigation?.openAgent) {
        setToast({ kind: "error", message: "当前环境不支持唤起会话" });
        return;
      }
      navigation.openAgent({ agentId });
    },
    [navigation],
  );

  const handleToggleGroup = useCallback((stateId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [stateId]: !prev[stateId] }));
  }, []);

  const handleOpenSettings = useCallback(() => {
    if (!onOpenSettings) {
      setToast({ kind: "error", message: "请在宿主设置里打开 Plane 配置" });
      return;
    }
    onOpenSettings();
  }, [onOpenSettings]);

  // 状态点：绿=已连上且已拉到项目，灰=未配置或加载中（出错时也不变色，设计稿 §5）
  const connected = useMemo(
    () => !!config && !loadingBoard && projects.length > 0,
    [config, loadingBoard, projects.length],
  );

  // 未配置：整页提示 + 去设置（设计稿 §5）
  if (configError) {
    return (
      <View style={[styles.page, { backgroundColor: colors.surface0 }]}>
        <Text style={[styles.message, { color: colors.statusDanger }]}>{configError}</Text>
      </View>
    );
  }

  if (!config || !config.baseUrl || !config.apiKey || !config.workspace) {
    return (
      <View style={[styles.page, { backgroundColor: colors.surface0 }]}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Plane 任务看板</Text>
        <Text style={[styles.message, { color: colors.foregroundMuted }]}>
          请在设置中配置 Plane base URL、API Key 与 workspace
        </Text>
        <Pressable
          onPress={handleOpenSettings}
          style={[styles.actionButton, { borderColor: colors.border, backgroundColor: colors.surface2 }]}
        >
          <Text style={[styles.actionText, { color: colors.foreground }]}>去设置</Text>
        </Pressable>
      </View>
    );
  }

  // 主体：加载 / 出错 / 空项目 / 列视图 / 列表视图（设计稿 §5）
  const renderBody = () => {
    if (loadingBoard) {
      return (
        <Text style={[styles.message, { color: colors.foregroundMuted }]}>加载中…</Text>
      );
    }
    if (boardError) {
      return <Text style={[styles.message, { color: colors.statusDanger }]}>{boardError}</Text>;
    }
    if (states.length === 0) {
      return (
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyBox, { borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>这个项目还没有状态</Text>
            <Text style={[styles.emptyText, { color: colors.foregroundMuted }]}>
              去 Plane 里给项目配一套状态（Backlog / Todo / …），看板列会跟着变。
            </Text>
          </View>
        </View>
      );
    }
    if (view === "board") {
      return (
        <BoardView
          states={states}
          itemsByState={itemsByState}
          colors={colors}
          compact={layout.compact}
          onMove={handleMove}
          onOpenCard={handleOpenCard}
          onOpenSession={handleOpenSession}
        />
      );
    }
    return (
      <ListView
        states={states}
        itemsByState={itemsByState}
        colors={colors}
        collapsed={collapsedGroups}
        onToggleGroup={handleToggleGroup}
        onMove={handleMove}
        onOpenCard={handleOpenCard}
        onOpenSession={handleOpenSession}
      />
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface0 }]}>
      <PlaneHeader
        colors={colors}
        view={view}
        onChangeView={setView}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onRefresh={() => setReloadToken((token) => token + 1)}
        onOpenSettings={handleOpenSettings}
        connected={connected}
      />
      <View style={styles.body}>{renderBody()}</View>
      {toast ? <PlaneToast toast={toast} colors={colors} onUndo={handleUndo} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SIZE.bodyPadding * 2,
  },
  pageTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  message: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  actionButton: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  actionText: {
    fontSize: 11,
  },
  emptyWrap: {
    padding: SIZE.bodyPadding,
  },
  emptyBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: SIZE.columnRadius,
    padding: 14,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 12.5,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: "center",
  },
});
