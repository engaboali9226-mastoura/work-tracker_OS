import { Component } from "./component.interface.js";

export interface ComponentFactory<
  TComponent extends Component = Component,
> {
  create(): Promise<TComponent>;
}
