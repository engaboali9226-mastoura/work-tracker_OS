export class RuntimeFlowDiagram {

    build(): string {

        return `
flowchart TD

Kernel --> Registry
Kernel --> Loader
Kernel --> Validator
Kernel --> Components
Components --> Events
Events --> Dispatcher
Dispatcher --> Components
`.trim();

    }

}
