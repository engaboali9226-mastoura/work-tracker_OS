import { Lifecycle } from "../lifecycle/index.js";

export interface Component extends Lifecycle {
  readonly name: string;

  readonly version: string;
}
