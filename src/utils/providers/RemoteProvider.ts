import type { BaseLine } from "@/modules/base";
import { BaseAdapter, DataAdapter } from "../dataAdapter";
import type { Provider } from "./define";



class RemoteAdapter extends DataAdapter<BaseLine> {
    constructor(resource: string) {
        super();
        console.log("RemoteAdapter", resource);
    }
}

export class RemoteProvider implements Provider {

  async setup(input: File[] | File | string): Promise<void> {
    console.log("input", input)
  }

  getResources(): string[] {
    return [];
  }

  async getLines(uri: string): Promise<BaseLine[]> {
    console.log("getLines", uri)
    return []  as BaseLine[];
  }

  async getAdapter(resource: string): Promise<BaseAdapter<BaseLine>> {

    const adapter = new RemoteAdapter(resource);
    return adapter;
  }
}