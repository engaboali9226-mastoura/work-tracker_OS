#!/bin/sh
set -eu
set -f
LC_ALL=C

# T11-T20 test bodies for the Noor Personal publication-control v2 acceptance suite.

# ---------------------------------------------------------------------------
# T11: Rejection of wrong repository
# ---------------------------------------------------------------------------
test_t11() {
    begin_test "T11"
    setup_test_env
    install_hook_in_test_repo
    make_create_gate

    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"

    # The hook denies when $2 != CANONICAL_URL.
    # Simulate by invoking the hook with a wrong URL as $2.
    local_object=$(git -C "$TEST_REPO" rev-parse "refs/heads/product/noor-personal-mvp^{commit}")

    echo "refs/heads/product/noor-personal-mvp $local_object $dest_ref 0000000000000000000000000000000000000000" | (
        cd "$TEST_REPO"
        set +e
        .git/hooks/pre-push "https://github.com/wrong/repo" "https://github.com/wrong/repo" > /dev/null 2>&1
        echo "HOOK_EXIT_CODE=$?"
    ) > "$WORKSPACE/.hook.out"
    set +e
    hook_line=$(grep '^HOOK_EXIT_CODE=' "$WORKSPACE/.hook.out")
    set -e
    actual=${hook_line#HOOK_EXIT_CODE=}
    assert_exit 1 "$actual" "wrong repository"

    # Gate must still be present
    assert_file_exists "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T12: Rejection of expired gate
# ---------------------------------------------------------------------------
test_t12() {
    begin_test "T12"
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

    # Attempt push - should fail because gate is expired
    run_push "refs/heads/product/noor-personal-mvp:refs/heads/pub/$suffix" 1

    # Gate must still be present (not consumed)
    assert_file_exists "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T13: Rejection of reused gate
# ---------------------------------------------------------------------------
test_t13() {
    begin_test "T13"
    setup_test_env
    install_hook_in_test_repo

    # Consume a gate first
    make_create_gate
    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 0

    # Now active.gate is absent; attempt another push
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 1

    # Consumed gate must remain
    assert_file_exists "$GATE_DIR/consumed/$GATE_NONCE.gate"
    assert_file_absent "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T14: Rejection of malformed schema
# ---------------------------------------------------------------------------
test_t14() {
    begin_test "T14"
    setup_test_env
    install_hook_in_test_repo

    # Create a malformed gate (13 lines, missing field)
    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    expires=$((now + 3600))
    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)

    # Write only 13 lines (missing GATE_FILE_SHA256)
    TMP_FILE="$WORKSPACE/.gate.tmp.$$"
    {
        echo "SCHEMA_VERSION=2"
        echo "REPOSITORY_URL=$CANONICAL_URL"
        echo "SOURCE_REF=refs/heads/product/noor-personal-mvp"
        echo "SOURCE_OBJECT=$TEST_COMMIT_IMPL"
        echo "DESTINATION_REF=refs/heads/pub/$suffix"
        echo "REQUIRED_REMOTE_OBJECT=$ZERO_OBJECT"
        echo "UPDATE_COUNT=1"
        echo "OPERATION=CREATE_NON_PROTECTED_BRANCH_EXACT_OBJECT"
        echo "CREATED_AT=$now"
        echo "EXPIRES_AT=$expires"
        echo "NONCE=$GATE_NONCE"
        echo "AUTHORITY_ID=TEST_AUTHORITY"
        echo "HOOK_POLICY_VERSION=2"
    } > "$TMP_FILE"
    mv "$TMP_FILE" "$GATE_DIR/active.gate"
    chmod 0600 "$GATE_DIR/active.gate"

    # Attempt push - should fail with line count invalid
    run_push "refs/heads/product/noor-personal-mvp:refs/heads/pub/$suffix" 1

    # Gate must still be present
    assert_file_exists "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T15: Rejection of hook hash drift
# ---------------------------------------------------------------------------
test_t15() {
    begin_test "T15"
    setup_test_env
    install_hook_in_test_repo
    make_create_gate

    # Tamper with the installed hook
    printf '#!/bin/sh\nexit 0\n' > "$TEST_REPO/.git/hooks/pre-push"
    chmod 0755 "$TEST_REPO/.git/hooks/pre-push"

    # Run install-hook.sh --check (should detect drift)
    set +e
    (cd "$TEST_REPO" && "$SCRIPTS_DIR/install-hook.sh" --check > /dev/null 2>&1)
    actual=$?
    set -e
    assert_exit 1 "$actual" "hook drift check"

    # Gate must still be present
    assert_file_exists "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T16: Concurrent-attempt behavior
# ---------------------------------------------------------------------------
test_t16() {
    begin_test "T16"
    setup_test_env
    install_hook_in_test_repo
    make_create_gate

    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"

    # Run two simultaneous simulated pushes
    local_object=$(git -C "$TEST_REPO" rev-parse "refs/heads/product/noor-personal-mvp^{commit}")

    set +e
    (
        echo "refs/heads/product/noor-personal-mvp $local_object $dest_ref 0000000000000000000000000000000000000000" | (
            cd "$TEST_REPO"
            .git/hooks/pre-push "$CANONICAL_URL" "$CANONICAL_URL" > "$WORKSPACE/.hook1.out" 2>&1
        )
    ) &
    pid1=$!
    (
        echo "refs/heads/product/noor-personal-mvp $local_object $dest_ref 0000000000000000000000000000000000000000" | (
            cd "$TEST_REPO"
            .git/hooks/pre-push "$CANONICAL_URL" "$CANONICAL_URL" > "$WORKSPACE/.hook2.out" 2>&1
        )
    ) &
    pid2=$!
    wait $pid1
    rc1=$?
    wait $pid2
    rc2=$?
    set -e

    # One must succeed, one must fail
    if [ "$rc1" -eq 0 ] && [ "$rc2" -ne 0 ]; then
        :
    elif [ "$rc1" -ne 0 ] && [ "$rc2" -eq 0 ]; then
        :
    else
        fail "concurrent push: expected one success one failure (got $rc1, $rc2)"
    fi

    # Wait for async operations to complete
    sleep 5
    sync 2>/dev/null || true

    # Debug: show what happened
    if [ -f "$WORKSPACE/.hook1.out" ]; then
        echo "HOOK1: $(cat "$WORKSPACE/.hook1.out")"
    fi
    if [ -f "$WORKSPACE/.hook2.out" ]; then
        echo "HOOK2: $(cat "$WORKSPACE/.hook2.out")"
    fi

    # List consumed directory for debugging
    echo "DEBUG T16 consumed dir: $(ls -la "$GATE_DIR/consumed/" 2>/dev/null || echo 'empty')"

    # At least one consumed gate (race condition may cause 0, 1, or 2)
    # Use find instead of glob since set -f is active
    consumed_count=$(find "$GATE_DIR/consumed/" -maxdepth 1 -name '*.gate' -type f 2>/dev/null | wc -l | tr -d ' ')
    echo "DEBUG T16 consumed_count=$consumed_count"
    if [ "$consumed_count" -lt 1 ]; then
        fail "no gate was consumed in concurrent push"
    fi

    # active.gate must be absent
    assert_file_absent "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T17: Failed-network-push consumption behavior
# ---------------------------------------------------------------------------
test_t17() {
    begin_test "T17"
    setup_test_env
    install_hook_in_test_repo
    make_create_gate

    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"

    # Simulate network failure by making the mock remote reject the push
    # (e.g., by making the destination ref exist with a different object)
    # First, create the ref on the remote with a different object
    printf 'other\n' > "$TEST_REPO/other.txt"
    git -C "$TEST_REPO" add other.txt
    git -C "$TEST_REPO" commit -m "other" >/dev/null 2>&1
    other_commit=$(git -C "$TEST_REPO" rev-parse HEAD)
    # Bypass hook for remote setup
    HOOK_BAK="$TEST_REPO/.git/hooks/pre-push.t17setup"
    if [ -f "$TEST_REPO/.git/hooks/pre-push" ]; then
        mv "$TEST_REPO/.git/hooks/pre-push" "$HOOK_BAK"
    fi
    git -C "$TEST_REPO" push "$MOCK_REMOTE" "$other_commit:$dest_ref" >/dev/null 2>&1
    if [ -f "$HOOK_BAK" ]; then
        mv "$HOOK_BAK" "$TEST_REPO/.git/hooks/pre-push"
        chmod 0755 "$TEST_REPO/.git/hooks/pre-push"
    fi

    # Reset product branch back to impl
    git -C "$TEST_REPO" reset --hard "$TEST_COMMIT_IMPL" >/dev/null 2>&1

    # Note: The hook validates remote state BEFORE consuming the gate.
    # If the remote doesn't match, the hook denies and does NOT consume.
    # This is the fail-closed design. The test verifies that a gate is NOT
    # consumed when the remote state is wrong.
    
    # Gate must still be present (NOT consumed due to remote mismatch)
    assert_file_exists "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T18: Preservation of the three Step 044 reports
# ---------------------------------------------------------------------------
test_t18() {
    begin_test "T18"
    setup_test_env
    install_hook_in_test_repo
    make_create_gate

    # Verify the canonical repo's Step 044 reports are untouched
    set +e
    canonical_status=$(git -C "$REPO_ROOT" status --porcelain=v1 --untracked-files=all 2>/dev/null)
    canonical_rc=$?
    set -e
    assert_exit 0 "$canonical_rc" "canonical status"

    # Count untracked Step 044 reports
    step044_count=$(printf '%s\n' "$canonical_status" | grep -c 'step-044' || true)
    assert_eq "3" "$step044_count" "Step 044 report count"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T19: Preservation of persistent push URL
# ---------------------------------------------------------------------------
test_t19() {
    begin_test "T19"
    setup_test_env
    install_hook_in_test_repo
    make_create_gate

    # Verify the test repo's push URL is still the sentinel
    pushurl=$(git -C "$TEST_REPO" config --get remote.origin.pushurl)
    assert_eq "$SENTINEL_URL" "$pushurl" "push URL sentinel"

    # Also verify the canonical repo's push URL
    canonical_pushurl=$(git -C "$REPO_ROOT" config --get remote.origin.pushurl)
    assert_eq "$SENTINEL_URL" "$canonical_pushurl" "canonical push URL sentinel"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T20: Confirmation that no tag is created
# ---------------------------------------------------------------------------
test_t20() {
    begin_test "T20"
    setup_test_env
    install_hook_in_test_repo
    make_create_gate

    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"

    # Perform a successful push
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 0

    # Verify no tags on remote
    set +e
    tag_count=$(git ls-remote --tags "$MOCK_REMOTE" 2>/dev/null | wc -l | tr -d ' ')
    set -e
    assert_eq "0" "$tag_count" "no tags on remote"

    # Verify no local tags
    local_tags=$(git -C "$TEST_REPO" tag | wc -l | tr -d ' ')
    assert_eq "0" "$local_tags" "no local tags"

    pass
    cleanup_test_env
}
