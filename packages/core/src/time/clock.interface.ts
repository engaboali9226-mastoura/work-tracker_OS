import { Timestamp } from "@worktracker/shared";

export interface Clock {
  now(): Timestamp;
}
