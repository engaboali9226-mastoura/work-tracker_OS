import assert from "node:assert/strict";
import test from "node:test";

import {
  applicationCatalog,
} from "@worktracker/core";

import type {
  ApplicationCatalog,
} from "@worktracker/core";

import {
  createRouteAccessEvidenceController,
} from "../src/route-access-evidence-controller.js";

import type {
  RouteAccessEvidenceClient,
} from "../src/route-access-evidence-client.js";

function deferred<T>() {
  let resolve:
    (value: T) => void =
      () => {};

  let reject:
    (reason?: unknown) => void =
      () => {};

  const promise =
    new Promise<T>(
      (
        innerResolve,
        innerReject,
      ) => {
        resolve =
          innerResolve;

        reject =
          innerReject;
      },
    );

  return {
    promise,
    resolve,
    reject,
  };
}

async function flush():
Promise<void> {
  await new Promise<void>(
    resolve =>
      setImmediate(
        resolve,
      ),
  );
}

function twoExperimentalCatalog():
ApplicationCatalog {
  const personal =
    applicationCatalog.findByKey(
      "noor-personal",
    );

  const work =
    applicationCatalog.findByKey(
      "noor-work",
    );

  assert.ok(
    personal,
  );

  assert.ok(
    work,
  );

  const second =
    Object.freeze({
      ...personal,
      appKey:
        "noor-secondary" as
          typeof personal.appKey,
      route:
        "/secondary",
      name:
        "Noor Secondary",
    });

  const entries =
    Object.freeze([
      personal,
      second,
      work,
    ]);

  return Object.freeze({
    list:
      () =>
        entries,

    findByKey:
      (
        appKey:
          string,
      ) =>
        entries.find(
          entry =>
            entry.appKey ===
            appKey,
        ),
  });
}

test(
  "root unknown and planned routes remain idle and never call privileged client",
  () => {
    let calls =
      0;

    const client:
      RouteAccessEvidenceClient =
      async () => {
        calls +=
          1;

        return {};
      };

    const controller =
      createRouteAccessEvidenceController(
        applicationCatalog,
        client,
      );

    controller.selectPathname(
      "/",
    );

    controller.selectPathname(
      "/missing",
    );

    assert.equal(
      controller
        .snapshot()
        .lifecycleState,
      "idle",
    );

    controller.selectPathname(
      "/work",
    );

    assert.deepEqual(
      controller.snapshot(),
      {
        pathname:
          "/work",
        lifecycleState:
          "idle",
      },
    );

    assert.equal(
      calls,
      0,
    );
  },
);

test(
  "experimental canonical route transitions bootstrapping to running with raw unknown evidence",
  async () => {
    const pending =
      deferred<unknown>();

    let calls =
      0;

    const client:
      RouteAccessEvidenceClient =
      request => {
        calls +=
          1;

        assert.deepEqual(
          request,
          {
            appKey:
              "noor-personal",
            pathname:
              "/personal",
          },
        );

        return pending.promise;
      };

    const controller =
      createRouteAccessEvidenceController(
        applicationCatalog,
        client,
      );

    controller.selectPathname(
      "/personal",
    );

    assert.deepEqual(
      controller.snapshot(),
      {
        pathname:
          "/personal",
        lifecycleState:
          "bootstrapping",
      },
    );

    controller.selectPathname(
      "/personal",
    );

    assert.equal(
      calls,
      1,
    );

    const rawEvidence =
      Object.freeze({
        arbitrary:
          "network-json",
      });

    pending.resolve(
      rawEvidence,
    );

    await flush();

    assert.equal(
      controller
        .snapshot()
        .lifecycleState,
      "running",
    );

    assert.equal(
      controller
        .snapshot()
        .accessEvidence,
      rawEvidence,
    );
  },
);

test(
  "transport failure becomes running with no evidence so shell can fail closed",
  async () => {
    const client:
      RouteAccessEvidenceClient =
      async () => {
        throw new Error(
          "synthetic network failure",
        );
      };

    const controller =
      createRouteAccessEvidenceController(
        applicationCatalog,
        client,
      );

    controller.selectPathname(
      "/personal",
    );

    await flush();

    const snapshot =
      controller.snapshot();

    assert.equal(
      snapshot.lifecycleState,
      "running",
    );

    assert.equal(
      Object.hasOwn(
        snapshot,
        "accessEvidence",
      ),
      false,
    );
  },
);

test(
  "stale success from a prior experimental route cannot overwrite a newer route",
  async () => {
    const first =
      deferred<unknown>();

    const second =
      deferred<unknown>();

    let call =
      0;

    const client:
      RouteAccessEvidenceClient =
      () => {
        call +=
          1;

        return (
          call === 1
            ? first.promise
            : second.promise
        );
      };

    const controller =
      createRouteAccessEvidenceController(
        twoExperimentalCatalog(),
        client,
      );

    controller.selectPathname(
      "/personal",
    );

    controller.selectPathname(
      "/secondary",
    );

    first.resolve({
      kind:
        "authenticated-authorized",
      appKey:
        "noor-personal",
      pathname:
        "/personal",
    });

    await flush();

    assert.deepEqual(
      controller.snapshot(),
      {
        pathname:
          "/secondary",
        lifecycleState:
          "bootstrapping",
      },
    );

    const current =
      Object.freeze({
        kind:
          "authentication-required",
        appKey:
          "noor-secondary",
        pathname:
          "/secondary",
      });

    second.resolve(
      current,
    );

    await flush();

    assert.equal(
      controller
        .snapshot()
        .accessEvidence,
      current,
    );
  },
);

test(
  "stale failure and route change to non-requesting route cannot mutate current selection",
  async () => {
    const pending =
      deferred<unknown>();

    const client:
      RouteAccessEvidenceClient =
      () =>
        pending.promise;

    const controller =
      createRouteAccessEvidenceController(
        applicationCatalog,
        client,
      );

    controller.selectPathname(
      "/personal",
    );

    controller.selectPathname(
      "/work",
    );

    pending.reject(
      new Error(
        "late stale failure",
      ),
    );

    await flush();

    assert.deepEqual(
      controller.snapshot(),
      {
        pathname:
          "/work",
        lifecycleState:
          "idle",
      },
    );
  },
);
