import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createDoctorReport } from "../src/commands/doctor.command.ts";

const forgeRoot = path.resolve(import.meta.dirname, "..");
const workspaceRoot = path.resolve(import.meta.dirname, "../../../");

function runForge(args: string[]) {
    return spawnSync(
        process.execPath,
        ["--import", "tsx", "src/main.ts", ...args],
        {
            cwd: forgeRoot,
            encoding: "utf8",
        },
    );
}

test("Forge doctor reports the real workspace as healthy", () => {
    const report = createDoctorReport(workspaceRoot);

    assert.equal(report.healthy, true);
    assert.equal(report.requiredPaths.every(check => check.ok), true);
    assert.equal(report.requiredTemplates.every(check => check.ok), true);
    assert.equal(report.componentCount >= 11, true);
    assert.equal(report.templateCount >= 10, true);
});

test("Forge doctor reports incomplete workspaces as unhealthy", () => {
    const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "forge-doctor-"));

    try {
        fs.writeFileSync(path.join(temporaryRoot, "package.json"), "{}", "utf8");

        const report = createDoctorReport(temporaryRoot);

        assert.equal(report.healthy, false);
        assert.equal(report.requiredPaths.some(check => !check.ok), true);
        assert.equal(report.requiredTemplates.some(check => !check.ok), true);
    } finally {
        fs.rmSync(temporaryRoot, { recursive: true, force: true });
    }
});

test("Forge doctor command prints a healthy workspace report", () => {
    const result = runForge(["doctor"]);
    const output = result.stdout + result.stderr;

    assert.equal(result.status, 0, output);
    assert.match(output, /Forge Doctor/);
    assert.match(output, /Required Paths/);
    assert.match(output, /Required Templates/);
    assert.match(output, /Components:\s+(?:\x1B\[[0-9;]*m)*\d+(?:\x1B\[[0-9;]*m)*/);
    assert.match(output, /Workspace Healthy/);
    assert.doesNotMatch(output, /Forge Error:/);
});


test("Forge doctor report includes executable architecture validation checks", () => {
    const report = createDoctorReport(
        path.resolve(process.cwd(), "../.."),
        {
            executableRunner: (_workspaceRoot, check) => ({
                ...check,
                ok: true,
                exitCode: 0,
                output: "mock validation passed",
            }),
        }
    );

    assert.equal(report.healthy, true);
    assert.equal(report.executableChecks.length, 1);
    assert.equal(report.executableChecks[0].label, "Architecture validation");
    assert.equal(report.executableChecks[0].command, "npm");
    assert.deepEqual(report.executableChecks[0].args, ["run", "validate:architecture"]);
    assert.equal(report.executableChecks[0].ok, true);
});

test("Forge doctor report becomes unhealthy when architecture validation fails", () => {
    const report = createDoctorReport(
        path.resolve(process.cwd(), "../.."),
        {
            executableRunner: (_workspaceRoot, check) => ({
                ...check,
                ok: false,
                exitCode: 1,
                output: "mock validation failed",
            }),
        }
    );

    assert.equal(report.healthy, false);
    assert.equal(report.executableChecks.length, 1);
    assert.equal(report.executableChecks[0].label, "Architecture validation");
    assert.equal(report.executableChecks[0].ok, false);
    assert.equal(report.executableChecks[0].exitCode, 1);
});

test("Forge doctor command output includes executable checks", () => {
    const result = runForge(["doctor"]);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Executable Checks/);
    assert.match(result.stdout, /Architecture validation/);
    assert.match(result.stdout, /npm run validate:architecture/);
});
