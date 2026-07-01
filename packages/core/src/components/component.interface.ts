import { Lifecycle } from "../lifecycle";

export interface Component extends Lifecycle {
  readonly name: string;

  readonly version: string;
}
