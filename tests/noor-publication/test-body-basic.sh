#!/bin/sh
set -eu
set -f
LC_ALL=C

# T01-T10 test bodies for the Noor Personal publication-control v3 acceptance suite.
# These functions are sourced by run-tests.sh.

# ---------------------------------------------------------------------------
# T01: Successful creation of one authorized publication branch
# ---------------------------------------------------------------------------
test_t01() {
    begin_test "T01"
    setup_test_env
    install_hook_in_test_repo
    make_create_gate

    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"

    # Attempt the push
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 0

    # Verify gate state
    assert_file_absent "$GATE_DIR/active.gate"
    assert_file_exists "$GATE_DIR/consumed/$GATE_NONCE.gate"

    # Verify remote state
    if remote_has_ref "$dest_ref" "$TEST_COMMIT_IMPL"; then
        :
    else
        fail "remote ref not created correctly"
    fi

    # Verify hook state unchanged
    installed_sha=$(shasum -a 256 "$TEST_REPO/.git/hooks/pre-push" | awk '{print $1}')
    template_sha=$(shasum -a 256 "$HOOK_TEMPLATE" | awk '{print $1}')
    assert_eq "$installed_sha" "$template_sha" "hook state"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T02: Successful authorized fast-forward update
# ---------------------------------------------------------------------------
test_t02() {
    begin_test "T02"
    setup_test_env
    install_hook_in_test_repo

    # First create the publication branch
    make_create_gate
    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 0

    # Now advance to child and create UPDATE gate
    # UPDATE must use the same stable destination ref as the CREATE
    advance_product_to_child
    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    expires=$((now + 3600))
    write_gate_file \
        2 \
        "$CANONICAL_URL" \
        "refs/heads/product/noor-personal-mvp" \
        "$TEST_CHILD_COMMIT" \
        "$dest_ref" \
        "$TEST_COMMIT_IMPL" \
        "UPDATE_NON_PROTECTED_BRANCH_FAST_FORWARD" \
        "$now" \
        "$expires" \
        "$GATE_NONCE" \
        "TEST_AUTHORITY" \
        3

    # Attempt the update push
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 0

    # Verify gate state
    assert_file_absent "$GATE_DIR/active.gate"
    assert_file_exists "$GATE_DIR/consumed/$GATE_NONCE.gate"

    # Verify remote state (fast-forwarded to child)
    if remote_has_ref "$dest_ref" "$TEST_CHILD_COMMIT"; then
        :
    else
        fail "remote ref not fast-forwarded correctly"
    fi

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T03: Rejection of protected product branch
# ---------------------------------------------------------------------------
test_t03() {
    begin_test "T03"
    setup_test_env
    install_hook_in_test_repo
    make_create_gate

    # Attempt to push directly to the protected branch
    run_push "refs/heads/product/noor-personal-mvp:refs/heads/product/noor-personal-mvp" 1

    # Gate must still be present (not consumed)
    assert_file_exists "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T04: Rejection of wrong source object
# ---------------------------------------------------------------------------
test_t04() {
    begin_test "T04"
    setup_test_env
    install_hook_in_test_repo
    make_create_gate

    # Create a different commit
    printf 'different\n' > "$TEST_REPO/diff.txt"
    git -C "$TEST_REPO" add diff.txt
    git -C "$TEST_REPO" commit -m "different" >/dev/null 2>&1

    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"

    # Push with wrong source object (different commit)
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 1

    # Gate must still be present
    assert_file_exists "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T05: Rejection of wrong remote object
# ---------------------------------------------------------------------------
test_t05() {
    begin_test "T05"
    setup_test_env
    install_hook_in_test_repo

    # Create the publication branch first
    make_create_gate
    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 0

    # Create a different remote state (simulate remote divergence)
    # Create a different commit and push it to the remote directly (bypassing hook)
    printf 'diverged\n' > "$TEST_REPO/diverged.txt"
    git -C "$TEST_REPO" add diverged.txt
    git -C "$TEST_REPO" commit -m "diverged" >/dev/null 2>&1
    diverged_commit=$(git -C "$TEST_REPO" rev-parse HEAD)

    # Push diverged commit directly to mock remote (bypass hook)
    mv "$TEST_REPO/.git/hooks/pre-push" "$TEST_REPO/.git/hooks/pre-push.$$.bak"
    git -C "$TEST_REPO" push "$MOCK_REMOTE" "$diverged_commit:$dest_ref" >/dev/null 2>&1
    if [ -f "$TEST_REPO/.git/hooks/pre-push.$$.bak" ]; then
        mv "$TEST_REPO/.git/hooks/pre-push.$$.bak" "$TEST_REPO/.git/hooks/pre-push"
        chmod 0755 "$TEST_REPO/.git/hooks/pre-push"
    fi

    # Now create UPDATE gate expecting the original impl commit as required remote
    advance_product_to_child
    make_update_gate

    # Attempt update push - should fail because remote is at diverged, not impl
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 1

    # Gate must still be present
    assert_file_exists "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T06: Rejection when destination unexpectedly exists (CREATE)
# ---------------------------------------------------------------------------
test_t06() {
    begin_test "T06"
    setup_test_env
    install_hook_in_test_repo

    # Pre-create the destination on the remote
    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"
    # Temporarily bypass hook for direct remote setup
    HOOK_BAK="$TEST_REPO/.git/hooks/pre-push.setup"
    if [ -f "$TEST_REPO/.git/hooks/pre-push" ]; then
        mv "$TEST_REPO/.git/hooks/pre-push" "$HOOK_BAK"
    fi
    git -C "$TEST_REPO" push "$MOCK_REMOTE" "$TEST_COMMIT_IMPL:$dest_ref" >/dev/null 2>&1
    if [ -f "$HOOK_BAK" ]; then
        mv "$HOOK_BAK" "$TEST_REPO/.git/hooks/pre-push"
        chmod 0755 "$TEST_REPO/.git/hooks/pre-push"
    fi

    # Now create a CREATE gate
    make_create_gate

    # Attempt push - should fail because destination already exists
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 1

    # Gate must still be present
    assert_file_exists "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T07: Rejection of force update
# ---------------------------------------------------------------------------
test_t07() {
    begin_test "T07"
    setup_test_env
    install_hook_in_test_repo

    # Create the publication branch first
    make_create_gate
    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 0

    # Create a diverged commit (not a descendant of impl)
    git -C "$TEST_REPO" checkout seed >/dev/null 2>&1 || git -C "$TEST_REPO" checkout --orphan diverged-base >/dev/null 2>&1
    printf 'diverged\n' > "$TEST_REPO/diverged.txt"
    git -C "$TEST_REPO" add diverged.txt
    git -C "$TEST_REPO" commit -m "diverged" >/dev/null 2>&1
    diverged_commit=$(git -C "$TEST_REPO" rev-parse HEAD)

    # Go back to product branch
    git -C "$TEST_REPO" checkout product/noor-personal-mvp >/dev/null 2>&1

    # Create UPDATE gate with source = diverged (not a fast-forward from impl)
    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    expires=$((now + 3600))
    write_gate_file \
        2 \
        "$CANONICAL_URL" \
        "refs/heads/product/noor-personal-mvp" \
        "$diverged_commit" \
        "$dest_ref" \
        "$TEST_COMMIT_IMPL" \
        "UPDATE_NON_PROTECTED_BRANCH_FAST_FORWARD" \
        "$now" \
        "$expires" \
        "$GATE_NONCE" \
        "TEST_AUTHORITY" \
        3

    # Reset product branch to diverged
    git -C "$TEST_REPO" reset --hard "$diverged_commit" >/dev/null 2>&1

    # Attempt force push - should fail (not a fast-forward)
    run_simulated_push "refs/heads/product/noor-personal-mvp" "$dest_ref" 1 1

    # Gate must still be present
    assert_file_exists "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T08: Rejection of deletion
# ---------------------------------------------------------------------------
test_t08() {
    begin_test "T08"
    setup_test_env
    install_hook_in_test_repo

    # Create the publication branch first
    make_create_gate
    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 0

    # Create a new gate for the deletion attempt
    make_create_gate

    # Attempt deletion (local object is zero)
    run_simulated_push "refs/heads/product/noor-personal-mvp" "$dest_ref" 0 1

    # Gate must still be present
    assert_file_exists "$GATE_DIR/active.gate"

    # Remote ref must still exist
    if remote_has_ref "$dest_ref" "$TEST_COMMIT_IMPL"; then
        :
    else
        fail "remote ref was deleted"
    fi

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T09: Rejection of tag push
# ---------------------------------------------------------------------------
test_t09() {
    begin_test "T09"
    setup_test_env
    install_hook_in_test_repo
    make_create_gate

    # Create a tag
    git -C "$TEST_REPO" tag v1.0.0 "$TEST_COMMIT_IMPL"

    # Attempt tag push (destination is a tag ref)
    run_simulated_push "refs/tags/v1.0.0" "refs/tags/v1.0.0" 0 1

    # Gate must still be present
    assert_file_exists "$GATE_DIR/active.gate"

    # No tag on remote
    set +e
    tag_count=$(git ls-remote --tags "$MOCK_REMOTE" 2>/dev/null | wc -l | tr -d ' ')
    set -e
    assert_eq "0" "$tag_count" "no tags on remote"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T10: Rejection of multiple refs
# ---------------------------------------------------------------------------
test_t10() {
    begin_test "T10"
    setup_test_env
    install_hook_in_test_repo
    make_create_gate

    # Create a second branch
    git -C "$TEST_REPO" branch feature-branch "$TEST_COMMIT_IMPL"

    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"

    # Simulate a push with two ref updates on stdin
    local_object=$(git -C "$TEST_REPO" rev-parse "refs/heads/product/noor-personal-mvp^{commit}")
    feature_object=$(git -C "$TEST_REPO" rev-parse "refs/heads/feature-branch^{commit}")

    echo "refs/heads/product/noor-personal-mvp $local_object $dest_ref 0000000000000000000000000000000000000000" > "$WORKSPACE/.stdin"
    echo "refs/heads/feature-branch $feature_object refs/heads/feature-branch 0000000000000000000000000000000000000000" >> "$WORKSPACE/.stdin"

    set +e
    (cd "$TEST_REPO" && .git/hooks/pre-push "$CANONICAL_URL" "$CANONICAL_URL" < "$WORKSPACE/.stdin" > /dev/null 2>&1)
    actual=$?
    set -e
    assert_exit 1 "$actual" "multiple ref push"

    # Gate must still be present
    assert_file_exists "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}
