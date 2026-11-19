import { z } from "zod";
import {
  planeProjectSchema,
  planeStateSchema,
  planeWorkItemSchema,
} from "../../shared/plane-rpc";

/** 看板用到的数据形状（契约见 paseo/shared/plane-rpc.ts）。 */
export type PlaneProject = z.infer<typeof planeProjectSchema>;
export type PlaneState = z.infer<typeof planeStateSchema>;
export type PlaneWorkItem = z.infer<typeof planeWorkItemSchema>;

/** 视图模式：列视图 / 列表视图（设计稿 §1.2）。 */
export type PlaneViewMode = "board" | "list";
