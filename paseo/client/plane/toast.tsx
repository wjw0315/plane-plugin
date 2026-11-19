import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SIZE, TOAST, type PlaneColors } from "./tokens";

/** toast 内容（设计稿 §3.4）：成功带「撤销」，失败展示服务端错误文案。 */
export interface PlaneToastState {
  kind: "success" | "error";
  message: string;
  /** 撤销信息：5 秒内可把卡片放回原列。 */
  undo?: { itemId: string; fromStateId: string; toStateId: string } | null;
}

export interface PlaneToastProps {
  toast: PlaneToastState;
  colors: PlaneColors;
  onUndo: () => void;
}

/** 底部 toast（设计稿 §1 / §3.4）：同时只显示一条，新的覆盖旧的。 */
export function PlaneToast({ toast, colors, onUndo }: PlaneToastProps) {
  const isError = toast.kind === "error";
  return (
    <View
      style={[
        styles.toast,
        {
          backgroundColor: isError ? TOAST.errorBg : TOAST.successBg,
          borderColor: isError ? TOAST.errorBorder : colors.border,
        },
      ]}
    >
      <Text
        numberOfLines={2}
        style={[styles.text, { color: isError ? TOAST.errorFg : colors.foregroundMuted }]}
      >
        {toast.message}
      </Text>
      {toast.undo ? (
        <Pressable onPress={onUndo} style={styles.undoButton}>
          <Text style={[styles.undoText, { color: colors.accent }]}>撤销</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: SIZE.headerPaddingH,
    right: SIZE.headerPaddingH,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: SIZE.toastRadius,
    paddingVertical: SIZE.toastPaddingV,
    paddingHorizontal: SIZE.toastPaddingH,
  },
  text: {
    flex: 1,
    fontSize: 11,
  },
  undoButton: {
    marginLeft: "auto",
    paddingHorizontal: 2,
  },
  undoText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
