import { Component } from "./component.interface";

export interface ComponentRegistry {
  register(
    component: Component,
  ): Promise<void>;

  unregister(
    name: string,
  ): Promise<void>;

  get(
    name: string,
  ): Component | undefined;

  getAll(): readonly Component[];
}
