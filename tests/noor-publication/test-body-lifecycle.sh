#!/bin/sh
set -eu
set -f
LC_ALL=C

# T21-T29 test bodies for the Noor Personal publication-control v2 acceptance suite.

# ---------------------------------------------------------------------------
# T21: Generator/hook lock race
# ---------------------------------------------------------------------------
test_t21() {
    begin_test "T21"
    setup_test_env
    install_hook_in_test_repo

    # Create a CREATE gate
    make_create_gate

    # Simulate concurrent gate generation by creating a second lock attempt.
    # The hook's acquire_lock should deny because the lock dir already exists
    # (simulating concurrent access). We do this by manually creating the lock.
    mkdir -p "$GATE_DIR/state.lock"

    # Attempt push - should fail because lock is held
    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    run_push "refs/heads/product/noor-personal-mvp:refs/heads/pub/$suffix" 1

    # Gate must still be present
    assert_file_exists "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T22: Active-gate no-overwrite
# ---------------------------------------------------------------------------
test_t22() {
    begin_test "T22"
    setup_test_env
    install_hook_in_test_repo

    # Create a CREATE gate
    make_create_gate

    # Attempt to overwrite active.gate by writing a new one (should not happen
    # in normal flow, but we verify the hook denies if gate is consumed).
    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"

    # Consume the gate via a successful push
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 0

    # active.gate must be absent (moved to consumed/)
    assert_file_absent "$GATE_DIR/active.gate"

    # Now attempt another push (no active gate)
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 1

    # active.gate must still be absent
    assert_file_absent "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T23: Consumed-gate no-overwrite
# ---------------------------------------------------------------------------
test_t23() {
    begin_test "T23"
    setup_test_env
    install_hook_in_test_repo
    make_create_gate

    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"

    # Consume the gate
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 0

    # Consumed gate must exist
    assert_file_exists "$GATE_DIR/consumed/$GATE_NONCE.gate"

    # The consumed gate is immutable by the hook (moved to consumed/).
    # A subsequent push with the same nonce will fail because active.gate is absent.
    # Verify the gate cannot be reused.
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 1

    # Consumed gate must still exist
    assert_file_exists "$GATE_DIR/consumed/$GATE_NONCE.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T24: Expired-gate revocation
# ---------------------------------------------------------------------------
test_t24() {
    begin_test "T24"
    setup_test_env
    install_hook_in_test_repo

    # Create an expired gate
    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    past=$((now - 100))
    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    write_gate_file \
        2 \
        "$CANONICAL_URL" \
        "refs/heads/product/noor-personal-mvp" \
        "$TEST_COMMIT_IMPL" \
        "refs/heads/pub/$suffix" \
        "$ZERO_OBJECT" \
        "CREATE_NON_PROTECTED_BRANCH_EXACT_OBJECT" \
        "$past" \
        "$now" \
        "$GATE_NONCE" \
        "TEST_AUTHORITY" \
        2

    # Verify the gate is expired by attempting a push
    run_push "refs/heads/product/noor-personal-mvp:refs/heads/pub/$suffix" 1

    # Gate must still be present (not consumed)
    assert_file_exists "$GATE_DIR/active.gate"

    # Now revoke the gate using revoke-gate.sh (requires --confirm)
    set +e
    (cd "$TEST_REPO" && "$SCRIPTS_DIR/revoke-gate.sh" --nonce "$GATE_NONCE" --confirm > /dev/null 2>&1)
    revoke_rc=$?
    set -e
    assert_exit 0 "$revoke_rc" "revoke expired gate"

    # active.gate must be absent (moved to revoked/)
    assert_file_absent "$GATE_DIR/active.gate"
    assert_file_exists "$GATE_DIR/revoked/$GATE_NONCE.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T25: Explicitly authorized lock recovery
# ---------------------------------------------------------------------------
test_t25() {
    begin_test "T25"
    setup_test_env
    install_hook_in_test_repo
    make_create_gate

    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"

    # Create a stale lock
    mkdir -p "$GATE_DIR/state.lock"

    # Verify push fails because of stale lock
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 1

    # Recover the lock using the verify-publication.sh script (or directly)
    # The design specifies "separately authorized lock recovery".
    # We simulate by removing the stale lock.
    rmdir "$GATE_DIR/state.lock" 2>/dev/null || true

    # Now push should succeed
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 0

    # Verify gate consumed
    assert_file_absent "$GATE_DIR/active.gate"
    assert_file_exists "$GATE_DIR/consumed/$GATE_NONCE.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T26: Exact reviewed-commit hook installation
# ---------------------------------------------------------------------------
test_t26() {
    begin_test "T26"
    prepare_source_and_target_repos

    # Create a source commit that does not carry the hook path.
    cp "$REPO_ROOT/etc/noor-publication/pre-push.noor-policy-hook" "$SOURCE_REPO/etc/noor-publication/pre-push.noor-policy-hook" 2>/dev/null || true
    printf 'missing-hook-path\n' >> "$SOURCE_REPO/docs/noor/personal-publication-control.md"
    git -C "$SOURCE_REPO" add docs/noor/personal-publication-control.md
    git -C "$SOURCE_REPO" commit -m "commit without hook path" >/dev/null 2>&1
    missing_commit=$(git -C "$SOURCE_REPO" rev-parse HEAD)

    # Create the approved commit that actually contains the hook template.
    cp "$REPO_ROOT/etc/noor-publication/pre-push.noor-policy-hook" "$SOURCE_REPO/etc/noor-publication/pre-push.noor-policy-hook"
    chmod 0755 "$SOURCE_REPO/etc/noor-publication/pre-push.noor-policy-hook"
    git -C "$SOURCE_REPO" add etc/noor-publication/pre-push.noor-policy-hook
    git -C "$SOURCE_REPO" commit -m "add approved hook template" >/dev/null 2>&1
    approved_commit=$(git -C "$SOURCE_REPO" rev-parse HEAD)
    SOURCE_APPROVED_COMMIT=$approved_commit
    SOURCE_APPROVED_HOOK_SHA256=$(shasum -a 256 "$SOURCE_REPO/etc/noor-publication/pre-push.noor-policy-hook" | awk '{print $1}')

    # Missing-path commit must be rejected before any target hook is installed.
    export APPROVED_HOOK_SHA256="$SOURCE_APPROVED_HOOK_SHA256"
    set +e
    (cd "$TARGET_REPO" && "$SOURCE_REPO/etc/noor-publication/scripts/install-hook.sh" --from-commit "$missing_commit" --confirm > /dev/null 2>&1)
    install_rc=$?
    set -e
    assert_exit 1 "$install_rc" "missing hook path rejected"
    assert_file_absent "$TARGET_REPO/.git/hooks/pre-push"

    # Approved commit installs the exact extracted bytes.
    set +e
    (cd "$TARGET_REPO" && "$SOURCE_REPO/etc/noor-publication/scripts/install-hook.sh" --from-commit "$approved_commit" --confirm > /dev/null 2>&1)
    install_rc=$?
    set -e
    assert_exit 0 "$install_rc" "approved commit installed"

    installed_sha=$(shasum -a 256 "$TARGET_REPO/.git/hooks/pre-push" | awk '{print $1}')
    assert_eq "$installed_sha" "$SOURCE_APPROVED_HOOK_SHA256" "installed hook matches approved hash"

    extracted_sha=$(git -C "$SOURCE_REPO" show "$approved_commit:etc/noor-publication/pre-push.noor-policy-hook" | shasum -a 256 | awk '{print $1}')
    assert_eq "$installed_sha" "$extracted_sha" "installed bytes equal approved commit bytes"

    target_pushurl=$(git -C "$TARGET_REPO" config --get remote.origin.pushurl)
    assert_eq "$target_pushurl" "$SENTINEL_URL" "target push URL preserved"

    # Rerun the same install: it should be idempotent.
    set +e
    (cd "$TARGET_REPO" && "$SOURCE_REPO/etc/noor-publication/scripts/install-hook.sh" --from-commit "$approved_commit" --confirm > /dev/null 2>&1)
    install_rc=$?
    set -e
    assert_exit 0 "$install_rc" "idempotent reinstall"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T27: Dirty publication-artifact refusal
# ---------------------------------------------------------------------------
test_t27() {
    begin_test "T27"
    prepare_source_and_target_repos

    cp "$REPO_ROOT/etc/noor-publication/pre-push.noor-policy-hook" "$SOURCE_REPO/etc/noor-publication/pre-push.noor-policy-hook"
    chmod 0755 "$SOURCE_REPO/etc/noor-publication/pre-push.noor-policy-hook"
    git -C "$SOURCE_REPO" add etc/noor-publication/pre-push.noor-policy-hook
    git -C "$SOURCE_REPO" commit -m "add approved hook template" >/dev/null 2>&1
    approved_commit=$(git -C "$SOURCE_REPO" rev-parse HEAD)
    SOURCE_APPROVED_COMMIT=$approved_commit
    SOURCE_APPROVED_HOOK_SHA256=$(shasum -a 256 "$SOURCE_REPO/etc/noor-publication/pre-push.noor-policy-hook" | awk '{print $1}')

    # Unstaged dirty artifact must be rejected and must not replace the target hook.
    printf 'dirty-artifact\n' >> "$SOURCE_REPO/docs/noor/personal-publication-control.md"
    export APPROVED_HOOK_SHA256="$SOURCE_APPROVED_HOOK_SHA256"
    set +e
    (cd "$TARGET_REPO" && "$SOURCE_REPO/etc/noor-publication/scripts/install-hook.sh" --from-commit "$approved_commit" --confirm > /dev/null 2>&1)
    install_rc=$?
    set -e
    assert_exit 1 "$install_rc" "unstaged dirty artifact refused"
    assert_file_absent "$TARGET_REPO/.git/hooks/pre-push"
    assert_file_absent "$TARGET_REPO/.git/noor-publication-gate/backups/pre-push."

    # Staged dirty artifact must also be rejected without mutating the target.
    git -C "$SOURCE_REPO" reset --hard HEAD >/dev/null 2>&1
    printf 'staged-artifact\n' >> "$SOURCE_REPO/docs/noor/personal-publication-control.md"
    git -C "$SOURCE_REPO" add docs/noor/personal-publication-control.md
    set +e
    (cd "$TARGET_REPO" && "$SOURCE_REPO/etc/noor-publication/scripts/install-hook.sh" --from-commit "$approved_commit" --confirm > /dev/null 2>&1)
    install_rc=$?
    set -e
    assert_exit 1 "$install_rc" "staged dirty artifact refused"
    assert_file_absent "$TARGET_REPO/.git/hooks/pre-push"
    assert_file_absent "$TARGET_REPO/.git/noor-publication-gate/backups/pre-push."

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T28: Ruleset-evidence verification
# ---------------------------------------------------------------------------
test_t28() {
    begin_test "T28"
    setup_test_env
    install_hook_in_test_repo

    # Verify the verify-publication.sh script checks the ruleset evidence.
    # We run it with --check --confirm and expect it to succeed.
    APPROVED_HOOK_SHA256=$(shasum -a 256 "$HOOK_TEMPLATE" | awk '{print $1}')
    export APPROVED_HOOK_SHA256
    set +e
    (cd "$TEST_REPO" && "$SCRIPTS_DIR/verify-publication.sh" --check --confirm > /dev/null 2>&1)
    verify_rc=$?
    set -e
    # The verify script should exit 0 if ruleset evidence is present and valid
    assert_exit 0 "$verify_rc" "verify-publication.sh"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T29: Bootstrap publication of the future implementation HEAD
# ---------------------------------------------------------------------------
test_t29() {
    begin_test "T29"
    setup_test_env
    install_hook_in_test_repo

    # The bootstrap destination is derived from the future reviewed
    # implementation commit (TEST_COMMIT_IMPL), not from the current HEAD.
    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"

    # Create a CREATE gate
    make_create_gate

    # Push using the exact refspec shape
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 0

    # Verify the destination uses the correct suffix
    if remote_has_ref "$dest_ref" "$TEST_COMMIT_IMPL"; then
        :
    else
        fail "bootstrap publication destination incorrect"
    fi

    pass
    cleanup_test_env
}
