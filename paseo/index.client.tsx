import type { PluginClientContext } from "@getpaseo/plugin/client";
import { contributePlane } from "./client/plane-contribute";

export default function contribute(client: PluginClientContext) {
  return contributePlane(client);
}
