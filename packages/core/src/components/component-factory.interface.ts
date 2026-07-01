import { Component } from "./component.interface";

export interface ComponentFactory<
  TComponent extends Component = Component,
> {
  create(): Promise<TComponent>;
}
