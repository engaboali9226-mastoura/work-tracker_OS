# Kernel Validation Specification

## Validation Rules Extracted

- Component must have unique id
- Component must have unique name
- Component must expose at least one input port
- Component must expose at least one output port
- Component must expose version
- Component must implement runtime lifecycle

----------------------------------------

## Runtime Component Contract
/**
 * Runtime Component Contract
 *
 * Every executable component inside Work Tracker OS
 * must implement this contract.
 */

export interface RuntimeComponent {

    /**
     * Unique component identifier.
     */
    readonly id: string;

    /**
     * Human readable name.
     */
    readonly name: string;

    /**
     * Component version.
     */
    readonly version: string;

    /**
     * Start component.
     */
    start(): Promise<void>;

    /**
     * Stop component.
     */
    stop(): Promise<void>;

}

----------------------------------------

## Input Port
export interface InputPort<TInput> {

    execute(input: TInput): Promise<void>;

}

----------------------------------------

## Output Port
export interface OutputPort<TOutput> {

    publish(output: TOutput): Promise<void>;

}

----------------------------------------

## Current Gap
[ ] Validation Contract
[ ] Validation Result
[ ] Validation Error
[ ] Component Validator
[ ] Kernel Integration
