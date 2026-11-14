import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { useRpc } from "@getpaseo/plugin/client";
import { settingsRpc } from "@getpaseo/plugin";
import { PLANE_SETTINGS, type PlaneConfig } from "../shared/plane-settings";

/**
 * Plane 任务看板屏幕（`addScreen` id `plane-board`）。
 *
 * 阶段一（票 01）只做配置状态展示：配置缺失时给出明确提示，
 * 配置就绪时显示连接摘要，看板渲染在票 03–04 实现。
 */
export function PlaneScreen(props: PluginScreenProps) {
  const { theme } = props;
  const c = theme.colors;
  const readSettings = useRpc(settingsRpc(PLANE_SETTINGS.id).read);
  const [config, setConfig] = useState<PlaneConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await readSettings({});
        if (cancelled) return;
        if (result.status === "ready") {
          setConfig(result.values as PlaneConfig);
        } else {
          setError(result.error ?? "配置读取失败");
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.surface0 }]}>
        <Text style={[styles.text, { color: c.foregroundMuted }]}>加载中…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: c.surface0 }]}>
        <Text style={[styles.title, { color: c.foreground }]}>Plane 任务看板</Text>
        <Text style={[styles.text, { color: c.statusDanger }]}>{error}</Text>
      </View>
    );
  }

  if (!config || !config.baseUrl || !config.apiKey) {
    return (
      <View style={[styles.container, { backgroundColor: c.surface0 }]}>
        <Text style={[styles.title, { color: c.foreground }]}>Plane 任务看板</Text>
        <Text style={[styles.text, { color: c.foregroundMuted }]}>
          尚未配置 Plane 连接。请在 设置 → 插件 → Plane 中填写 Base URL、API Key、Workspace 与 Project。
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.surface0 }]}>
      <Text style={[styles.title, { color: c.foreground }]}>Plane 任务看板</Text>
      <Text style={[styles.text, { color: c.foregroundMuted }]}>
        {config.baseUrl} · {config.workspace || "未选工作区"} / {config.project || "未选项目"}
      </Text>
      <Text style={[styles.text, { color: c.foregroundMuted }]}>
        看板渲染与拖拽改状态将在后续迭代中实现。
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
  },
});
