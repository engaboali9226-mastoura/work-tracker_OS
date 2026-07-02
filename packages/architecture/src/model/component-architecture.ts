import type { ComponentIdentity } from "./component-identity.js";
import type { Purpose } from "./purpose.js";
import type { Responsibility } from "./responsibility.js";
import type { CommandReference } from "./command-reference.js";
import type { QueryReference } from "./query-reference.js";
import type { EventReference } from "./event-reference.js";
import type { ContractReference } from "./contract-reference.js";
import type { PortReference } from "./port-reference.js";
import type { ServiceReference } from "./service-reference.js";
import type { DependencyReference } from "./dependency-reference.js";
import type { RuntimeArchitecture } from "./runtime-architecture.js";
import type { BusinessRule } from "./business-rule.js";
import type { Observability } from "./observability.js";
import type { Roadmap } from "./roadmap.js";

export interface ComponentArchitecture {

    readonly identity: ComponentIdentity;

    readonly purpose: Purpose;

    readonly responsibilities: readonly Responsibility[];

    readonly commands: readonly CommandReference[];

    readonly queries: readonly QueryReference[];

    readonly events: readonly EventReference[];

    readonly contracts: readonly ContractReference[];

    readonly ports: readonly PortReference[];

    readonly services: readonly ServiceReference[];

    readonly dependencies: readonly DependencyReference[];

    readonly runtime: RuntimeArchitecture;

    readonly businessRules: readonly BusinessRule[];

    readonly observability: Observability;

    readonly roadmap: Roadmap;

}

