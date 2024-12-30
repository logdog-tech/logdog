import type { BaseLine } from "@/modules/base";
import { BaseAdapter } from "../dataAdapter";

export interface Provider {
  setup(input: File[] | File | string): Promise<void>;

  getResources(): string[];

  getLines(uri: string): Promise<BaseLine[]>;

  getAdapter(resource: string): Promise<BaseAdapter<BaseLine>>;
}
