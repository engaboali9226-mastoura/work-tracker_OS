import type {
  ClockPort,
} from "../ports.js";

import type {
  IsoInstant,
} from "../domain/model.js";

export class SystemClock
implements ClockPort {
  public now():
  IsoInstant {
    return new Date().toISOString();
  }
}
