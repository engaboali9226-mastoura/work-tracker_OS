#!/bin/sh
set -eu
set -f
LC_ALL=C

# T35-T53 test bodies for DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT operations
# in the Noor Personal publication-control Policy-v5 acceptance suite.
# These functions are sourced by run-tests.sh.

# ---------------------------------------------------------------------------
# T35: Successful deletion of authorized publication branch
# ---------------------------------------------------------------------------
test_t35() {
    begin_test "T35"
    setup_test_env
    install_hook_in_test_repo

    # First create the publication branch
    make_create_gate
    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 0

    # Now create a DELETE gate
    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    expires=$((now + 3600))
    write_gate_file \
        3 \
        "$CANONICAL_URL" \
        "(delete)" \
        "$ZERO_OBJECT" \
        "$dest_ref" \
        "$TEST_COMMIT_IMPL" \
        "DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT" \
        "$now" \
        "$expires" \
        "$GATE_NONCE" \
        "TEST_AUTHORITY" \
        "$ACTIVE_HOOK_POLICY_VERSION"

    # Attempt the deletion push using real delete tuple
    run_simulated_push "(delete)" "$dest_ref" 0 0

    # Verify gate state
    assert_file_absent "$GATE_DIR/active.gate"
    assert_file_exists "$GATE_DIR/consumed/$GATE_NONCE.gate"

    # Verify remote state (ref should be gone)
    if remote_has_ref "$dest_ref" "$TEST_COMMIT_IMPL"; then
        fail "remote ref still exists after deletion"
    fi

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T36: Rejection of protected canonical branch deletion
# ---------------------------------------------------------------------------
test_t36() {
    begin_test "T36"
    setup_test_env
    install_hook_in_test_repo

    # Create a DELETE gate targeting the protected branch
    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    expires=$((now + 3600))
    # Gate claims to allow deletion of product branch (which should be rejected)
    write_gate_file \
        3 \
        "$CANONICAL_URL" \
        "(delete)" \
        "$ZERO_OBJECT" \
        "refs/heads/product/noor-personal-mvp" \
        "$TEST_COMMIT_IMPL" \
        "DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT" \
        "$now" \
        "$expires" \
        "$GATE_NONCE" \
        "TEST_AUTHORITY" \
        "$ACTIVE_HOOK_POLICY_VERSION"

    # Attempt to push with (delete) local_ref
    run_simulated_push "(delete)" "refs/heads/product/noor-personal-mvp" 0 1

    # Gate must still be present (not consumed)
    assert_file_exists "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T37: Rejection of deletion when remote branch already absent
# ---------------------------------------------------------------------------
test_t37() {
    begin_test "T37"
    setup_test_env
    install_hook_in_test_repo

    # Create a DELETE gate for a branch that doesn't exist on remote
    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"

    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    expires=$((now + 3600))
    write_gate_file \
        3 \
        "$CANONICAL_URL" \
        "(delete)" \
        "$ZERO_OBJECT" \
        "$dest_ref" \
        "$TEST_COMMIT_IMPL" \
        "DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT" \
        "$now" \
        "$expires" \
        "$GATE_NONCE" \
        "TEST_AUTHORITY" \
        "$ACTIVE_HOOK_POLICY_VERSION"

    # Attempt deletion when remote ref doesn't exist
    run_simulated_push "(delete)" "$dest_ref" 0 1

    # Gate must still be present
    assert_file_exists "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T38: Rejection of deletion with remote object mismatch
# ---------------------------------------------------------------------------
test_t38() {
    begin_test "T38"
    setup_test_env
    install_hook_in_test_repo

    # Create the publication branch
    make_create_gate
    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 0

    # Now create a child commit and update the remote to point to it
    advance_product_to_child
    HOOK_BAK="$TEST_REPO/.git/hooks/pre-push.bak"
    mv "$TEST_REPO/.git/hooks/pre-push" "$HOOK_BAK"
    git -C "$TEST_REPO" push "$MOCK_REMOTE" "$TEST_CHILD_COMMIT:$dest_ref" >/dev/null 2>&1 || true
    mv "$HOOK_BAK" "$TEST_REPO/.git/hooks/pre-push"
    chmod 0755 "$TEST_REPO/.git/hooks/pre-push"

    # Create a DELETE gate expecting the original impl commit, but remote is at child
    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    expires=$((now + 3600))
    write_gate_file \
        3 \
        "$CANONICAL_URL" \
        "(delete)" \
        "$ZERO_OBJECT" \
        "$dest_ref" \
        "$TEST_COMMIT_IMPL" \
        "DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT" \
        "$now" \
        "$expires" \
        "$GATE_NONCE" \
        "TEST_AUTHORITY" \
        "$ACTIVE_HOOK_POLICY_VERSION"

    # Attempt deletion - should fail because remote object doesn't match
    run_simulated_push "(delete)" "$dest_ref" 0 1

    # Gate must still be present
    assert_file_exists "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T39: Rejection of tag deletion via branch-delete operation
# ---------------------------------------------------------------------------
test_t39() {
    begin_test "T39"
    setup_test_env
    install_hook_in_test_repo

    # Create a DELETE gate targeting a tag ref (which should be rejected)
    make_annotated_tag "test-tag"
    tag_ref="refs/tags/test-tag"

    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    expires=$((now + 3600))
    write_gate_file \
        3 \
        "$CANONICAL_URL" \
        "(delete)" \
        "$ZERO_OBJECT" \
        "$tag_ref" \
        "$TEST_TAG_OBJECT" \
        "DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT" \
        "$now" \
        "$expires" \
        "$GATE_NONCE" \
        "TEST_AUTHORITY" \
        "$ACTIVE_HOOK_POLICY_VERSION"

    # Attempt to delete a tag with branch-delete operation
    run_simulated_push "(delete)" "$tag_ref" 0 1

    # Gate must still be present
    assert_file_exists "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T40: Rejection of second use of consumed DELETE authority
# ---------------------------------------------------------------------------
test_t40() {
    begin_test "T40"
    setup_test_env
    install_hook_in_test_repo

    # Create and use a DELETE gate once
    make_create_gate
    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 0

    # Create DELETE gate
    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    expires=$((now + 3600))
    write_gate_file \
        3 \
        "$CANONICAL_URL" \
        "(delete)" \
        "$ZERO_OBJECT" \
        "$dest_ref" \
        "$TEST_COMMIT_IMPL" \
        "DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT" \
        "$now" \
        "$expires" \
        "$GATE_NONCE" \
        "TEST_AUTHORITY" \
        "$ACTIVE_HOOK_POLICY_VERSION"

    # First deletion succeeds
    run_simulated_push "(delete)" "$dest_ref" 0 0

    # Verify gate consumed
    assert_file_absent "$GATE_DIR/active.gate"
    assert_file_exists "$GATE_DIR/consumed/$GATE_NONCE.gate"

    # Recreate the ref on remote (bypassing hook)
    HOOK_BAK="$TEST_REPO/.git/hooks/pre-push.bak"
    mv "$TEST_REPO/.git/hooks/pre-push" "$HOOK_BAK"
    git -C "$TEST_REPO" push "$MOCK_REMOTE" "$TEST_COMMIT_IMPL:$dest_ref" >/dev/null 2>&1 || true
    mv "$HOOK_BAK" "$TEST_REPO/.git/hooks/pre-push"
    chmod 0755 "$TEST_REPO/.git/hooks/pre-push"

    # Re-activate the same gate (simulate reuse attempt)
    cp "$GATE_DIR/consumed/$GATE_NONCE.gate" "$GATE_DIR/active.gate"
    chmod 0600 "$GATE_DIR/active.gate"

    # Attempt second deletion with same gate - should fail (nonce already consumed)
    run_simulated_push "(delete)" "$dest_ref" 0 1

    # active.gate should still be present (hook rejected)
    assert_file_exists "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T41: Rejection of DELETE with multiple stdin updates
# ---------------------------------------------------------------------------
test_t41() {
    begin_test "T41"
    setup_test_env
    install_hook_in_test_repo

    # Create a valid DELETE gate with UPDATE_COUNT=1.
    # Bootstrap the protected canonical branch and the publication destination
    # ref on the isolated remote so the DELETE gate is otherwise fully
    # authorizable (state differs only by the multiple stdin update count).
    HOOK_BAK="$TEST_REPO/.git/hooks/pre-push.bak"
    mv "$TEST_REPO/.git/hooks/pre-push" "$HOOK_BAK"
    git -C "$TEST_REPO" push --no-verify "$MOCK_REMOTE" "refs/heads/product/noor-personal-mvp:refs/heads/product/noor-personal-mvp" >/dev/null 2>&1 || true
    mv "$HOOK_BAK" "$TEST_REPO/.git/hooks/pre-push"
    chmod 0755 "$TEST_REPO/.git/hooks/pre-push"

    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"
    HOOK_BAK2="$TEST_REPO/.git/hooks/pre-push.bak2"
    mv "$TEST_REPO/.git/hooks/pre-push" "$HOOK_BAK2"
    git -C "$TEST_REPO" push --no-verify "$MOCK_REMOTE" "$TEST_COMMIT_IMPL:$dest_ref" >/dev/null 2>&1 || true
    mv "$HOOK_BAK2" "$TEST_REPO/.git/hooks/pre-push"
    chmod 0755 "$TEST_REPO/.git/hooks/pre-push"

    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    expires=$((now + 3600))
    write_gate_file \
        3 \
        "$CANONICAL_URL" \
        "(delete)" \
        "$ZERO_OBJECT" \
        "$dest_ref" \
        "$TEST_COMMIT_IMPL" \
        "DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT" \
        "$now" \
        "$expires" \
        "$GATE_NONCE" \
        "TEST_AUTHORITY" \
        "$ACTIVE_HOOK_POLICY_VERSION"

    # Supply multiple valid pre-push stdin update lines, each a valid DELETE
    # tuple matching the gate. The hook must reject specifically because the
    # actual push update count is greater than the authorized UPDATE_COUNT=1.
    stdin_file="$WORKSPACE/.multi-update.stdin"
    printf '%s %s %s %s\n' "(delete)" "$ZERO_OBJECT" "$dest_ref" "$TEST_COMMIT_IMPL" > "$stdin_file"
    printf '%s %s %s %s\n' "(delete)" "$ZERO_OBJECT" "$dest_ref" "$TEST_COMMIT_IMPL" >> "$stdin_file"
    set +e
    (cd "$TEST_REPO" && .git/hooks/pre-push "$CANONICAL_URL" "$CANONICAL_URL" < "$stdin_file" > "$WORKSPACE/.t41.out" 2>&1)
    hook_rc=$?
    set -e
    assert_exit 1 "$hook_rc" "multi-update delete gate rejection"

    assert_file_exists "$GATE_DIR/active.gate"
    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T42: Rejection when CREATE gate is used for deletion attempt
# ---------------------------------------------------------------------------
test_t42() {
    begin_test "T42"
    setup_test_env
    install_hook_in_test_repo

    # Create publication branch
    make_create_gate
    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 0

    # Try to reuse CREATE gate for deletion (should fail)
    make_create_gate

    # Attempt real delete with CREATE gate - should be rejected due to operation mismatch
    run_simulated_push "(delete)" "$dest_ref" 0 1

    # Gate must still be present
    assert_file_exists "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T43: Successful publisher/verifier DELETE end-to-end
# ---------------------------------------------------------------------------
test_t43() {
    begin_test "T43"
    setup_test_env
    install_hook_in_test_repo

    # Bootstrap the protected canonical branch on the mock remote without touching the
    # candidate pre-push gate. This is only local test setup for a detached isolated repo.
    HOOK_BAK="$TEST_REPO/.git/hooks/pre-push.bak"
    mv "$TEST_REPO/.git/hooks/pre-push" "$HOOK_BAK"
    git -C "$TEST_REPO" push --no-verify "$MOCK_REMOTE" "refs/heads/product/noor-personal-mvp:refs/heads/product/noor-personal-mvp" >/dev/null 2>&1 || true
    mv "$HOOK_BAK" "$TEST_REPO/.git/hooks/pre-push"
    chmod 0755 "$TEST_REPO/.git/hooks/pre-push"

    # Create a publication branch and publish it to the mock remote.
    make_create_gate
    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 0

    # Create a delete gate authorizing exact remote deletion.
    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    expires=$((now + 3600))
    write_gate_file \
        3 \
        "$CANONICAL_URL" \
        "(delete)" \
        "$ZERO_OBJECT" \
        "$dest_ref" \
        "$TEST_COMMIT_IMPL" \
        "DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT" \
        "$now" \
        "$expires" \
        "$GATE_NONCE" \
        "TEST_AUTHORITY" \
        "$ACTIVE_HOOK_POLICY_VERSION"

    # Run the actual candidate publisher and verifier path through the existing
    # helper so authorization uses canonical hook identity and transport remains
    # isolated to the local mock remote.
    run_publish_once_with_candidate_hook "$WORKSPACE/publish.out" --remote-url "$CANONICAL_URL"
    assert_exit 0 "$PUBLISH_ONCE_EXIT" "publish-once delete verification"

    assert_file_absent "$GATE_DIR/active.gate"
    assert_file_exists "$GATE_DIR/consumed/$GATE_NONCE.gate"
    if remote_has_ref "$dest_ref" "$TEST_COMMIT_IMPL"; then
        fail "remote ref should be deleted but still exists"
    fi
    if ! remote_has_ref "refs/heads/product/noor-personal-mvp" "$TEST_COMMIT_IMPL"; then
        fail "protected canonical branch changed unexpectedly"
    fi

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T45: Verifier rejects remote-query failure for DELETE
# ---------------------------------------------------------------------------
test_t45() {
    begin_test "T45"
    setup_test_env
    install_hook_in_test_repo

    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"
    protected_object=$(git -C "$TEST_REPO" rev-parse "refs/heads/product/noor-personal-mvp")

    set +e
    (cd "$TEST_REPO" && etc/noor-publication/scripts/verify-publication.sh --operation DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT --destination-ref "$dest_ref" --remote-url "ssh://127.0.0.1/does-not-exist" --protected-ref refs/heads/product/noor-personal-mvp --protected-canonical-object "$protected_object" > "$WORKSPACE/verify-fail.out" 2>&1)
    verify_rc=$?
    set -e
    assert_exit 1 "$verify_rc" "delete verifier must fail on remote query failure"

    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T46: UPDATE gate cannot authorize DELETE
# ---------------------------------------------------------------------------
test_t46() {
    begin_test "T46"
    setup_test_env
    install_hook_in_test_repo

    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"
    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    expires=$((now + 3600))
    write_gate_file \
        3 "$CANONICAL_URL" "refs/heads/product/noor-personal-mvp" "$TEST_CHILD_COMMIT" "$dest_ref" "$TEST_COMMIT_IMPL" "UPDATE_NON_PROTECTED_BRANCH_FAST_FORWARD" "$now" "$expires" "$GATE_NONCE" "TEST_AUTHORITY" "$ACTIVE_HOOK_POLICY_VERSION"

    printf '%s %s %s %s\n' "(delete)" "$ZERO_OBJECT" "$dest_ref" "$TEST_COMMIT_IMPL" > "$WORKSPACE/update-delete.stdin"
    set +e
    (cd "$TEST_REPO" && .git/hooks/pre-push "$CANONICAL_URL" "$CANONICAL_URL" < "$WORKSPACE/update-delete.stdin" > "$WORKSPACE/update-delete.out" 2>&1)
    hook_rc=$?
    set -e
    assert_exit 1 "$hook_rc" "update gate must not authorize delete"
    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T47: TAG-CREATE gate cannot authorize DELETE
# ---------------------------------------------------------------------------
test_t47() {
    begin_test "T47"
    setup_test_env
    install_hook_in_test_repo
    make_annotated_tag "delete-tag-test"
    tag_ref="refs/tags/delete-tag-test"
    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    expires=$((now + 3600))
    write_gate_file \
        3 "$CANONICAL_URL" "$tag_ref" "$TEST_TAG_OBJECT" "$tag_ref" "$ZERO_OBJECT" "CREATE_ANNOTATED_TAG_EXACT_OBJECT" "$now" "$expires" "$GATE_NONCE" "TEST_AUTHORITY" "$ACTIVE_HOOK_POLICY_VERSION"

    printf '%s %s %s %s\n' "(delete)" "$ZERO_OBJECT" "$tag_ref" "$TEST_TAG_OBJECT" > "$WORKSPACE/tag-delete.stdin"
    set +e
    (cd "$TEST_REPO" && .git/hooks/pre-push "$CANONICAL_URL" "$CANONICAL_URL" < "$WORKSPACE/tag-delete.stdin" > "$WORKSPACE/tag-delete.out" 2>&1)
    hook_rc=$?
    set -e
    assert_exit 1 "$hook_rc" "tag-create gate must not authorize delete"
    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T48: DELETE gate cannot authorize CREATE
# ---------------------------------------------------------------------------
test_t48() {
    begin_test "T48"
    setup_test_env
    install_hook_in_test_repo

    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"
    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    expires=$((now + 3600))
    write_gate_file \
        3 "$CANONICAL_URL" "(delete)" "$ZERO_OBJECT" "$dest_ref" "$TEST_COMMIT_IMPL" "DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT" "$now" "$expires" "$GATE_NONCE" "TEST_AUTHORITY" "$ACTIVE_HOOK_POLICY_VERSION"

    printf '%s %s %s %s\n' "refs/heads/product/noor-personal-mvp" "$TEST_COMMIT_IMPL" "$dest_ref" "$ZERO_OBJECT" > "$WORKSPACE/delete-create.stdin"
    set +e
    (cd "$TEST_REPO" && .git/hooks/pre-push "$CANONICAL_URL" "$CANONICAL_URL" < "$WORKSPACE/delete-create.stdin" > "$WORKSPACE/delete-create.out" 2>&1)
    hook_rc=$?
    set -e
    assert_exit 1 "$hook_rc" "delete gate must not authorize create"
    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T49: DELETE gate cannot authorize UPDATE
# ---------------------------------------------------------------------------
test_t49() {
    begin_test "T49"
    setup_test_env
    install_hook_in_test_repo
    make_create_gate
    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 0
    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    expires=$((now + 3600))
    write_gate_file \
        3 "$CANONICAL_URL" "(delete)" "$ZERO_OBJECT" "$dest_ref" "$TEST_COMMIT_IMPL" "DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT" "$now" "$expires" "$GATE_NONCE" "TEST_AUTHORITY" "$ACTIVE_HOOK_POLICY_VERSION"

    printf '%s %s %s %s\n' "refs/heads/product/noor-personal-mvp" "$TEST_CHILD_COMMIT" "$dest_ref" "$TEST_COMMIT_IMPL" > "$WORKSPACE/delete-update.stdin"
    set +e
    (cd "$TEST_REPO" && .git/hooks/pre-push "$CANONICAL_URL" "$CANONICAL_URL" < "$WORKSPACE/delete-update.stdin" > "$WORKSPACE/delete-update.out" 2>&1)
    hook_rc=$?
    set -e
    assert_exit 1 "$hook_rc" "delete gate must not authorize update"
    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T50: DELETE gate cannot authorize tag create
# ---------------------------------------------------------------------------
test_t50() {
    begin_test "T50"
    setup_test_env
    install_hook_in_test_repo
    make_annotated_tag "delete-tag-create"
    tag_ref="refs/tags/delete-tag-create"
    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    expires=$((now + 3600))
    write_gate_file \
        3 "$CANONICAL_URL" "(delete)" "$ZERO_OBJECT" "$tag_ref" "$TEST_TAG_OBJECT" "DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT" "$now" "$expires" "$GATE_NONCE" "TEST_AUTHORITY" "$ACTIVE_HOOK_POLICY_VERSION"

    printf '%s %s %s %s\n' "refs/tags/delete-tag-create" "$TEST_TAG_OBJECT" "$tag_ref" "$ZERO_OBJECT" > "$WORKSPACE/delete-tag-create.stdin"
    set +e
    (cd "$TEST_REPO" && .git/hooks/pre-push "$CANONICAL_URL" "$CANONICAL_URL" < "$WORKSPACE/delete-tag-create.stdin" > "$WORKSPACE/delete-tag-create.out" 2>&1)
    hook_rc=$?
    set -e
    assert_exit 1 "$hook_rc" "delete gate must not authorize tag create"
    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T51: DELETE gate cannot authorize tag delete
# ---------------------------------------------------------------------------
test_t51() {
    begin_test "T51"
    setup_test_env
    install_hook_in_test_repo
    make_annotated_tag "delete-tag-delete"
    tag_ref="refs/tags/delete-tag-delete"
    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    expires=$((now + 3600))
    write_gate_file \
        3 "$CANONICAL_URL" "(delete)" "$ZERO_OBJECT" "$tag_ref" "$TEST_TAG_OBJECT" "DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT" "$now" "$expires" "$GATE_NONCE" "TEST_AUTHORITY" "$ACTIVE_HOOK_POLICY_VERSION"

    printf '%s %s %s %s\n' "(delete)" "$ZERO_OBJECT" "$tag_ref" "$TEST_TAG_OBJECT" > "$WORKSPACE/delete-tag-delete.stdin"
    set +e
    (cd "$TEST_REPO" && .git/hooks/pre-push "$CANONICAL_URL" "$CANONICAL_URL" < "$WORKSPACE/delete-tag-delete.stdin" > "$WORKSPACE/delete-tag-delete.out" 2>&1)
    hook_rc=$?
    set -e
    assert_exit 1 "$hook_rc" "delete gate must not authorize tag delete"
    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T52: DELETE source tuple with nonzero local object is rejected
# ---------------------------------------------------------------------------
test_t52() {
    begin_test "T52"
    setup_test_env
    install_hook_in_test_repo
    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"
    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    expires=$((now + 3600))
    write_gate_file \
        3 "$CANONICAL_URL" "(delete)" "$TEST_COMMIT_IMPL" "$dest_ref" "$TEST_COMMIT_IMPL" "DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT" "$now" "$expires" "$GATE_NONCE" "TEST_AUTHORITY" "$ACTIVE_HOOK_POLICY_VERSION"

    printf '%s %s %s %s\n' "(delete)" "$TEST_COMMIT_IMPL" "$dest_ref" "$TEST_COMMIT_IMPL" > "$WORKSPACE/delete-local-nonzero.stdin"
    set +e
    (cd "$TEST_REPO" && .git/hooks/pre-push "$CANONICAL_URL" "$CANONICAL_URL" < "$WORKSPACE/delete-local-nonzero.stdin" > "$WORKSPACE/delete-local-nonzero.out" 2>&1)
    hook_rc=$?
    set -e
    assert_exit 1 "$hook_rc" "delete source object must be zero"
    pass
    cleanup_test_env
}

# ---------------------------------------------------------------------------
# T53: Normal ref with zero object for delete tuple is rejected
# ---------------------------------------------------------------------------
test_t53() {
    begin_test "T53"
    setup_test_env
    install_hook_in_test_repo
    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"
    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    expires=$((now + 3600))
    write_gate_file \
        3 "$CANONICAL_URL" "refs/heads/product/noor-personal-mvp" "$ZERO_OBJECT" "$dest_ref" "$TEST_COMMIT_IMPL" "DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT" "$now" "$expires" "$GATE_NONCE" "TEST_AUTHORITY" "$ACTIVE_HOOK_POLICY_VERSION"

    printf '%s %s %s %s\n' "refs/heads/product/noor-personal-mvp" "$ZERO_OBJECT" "$dest_ref" "$ZERO_OBJECT" > "$WORKSPACE/normal-zero.stdin"
    set +e
    (cd "$TEST_REPO" && .git/hooks/pre-push "$CANONICAL_URL" "$CANONICAL_URL" < "$WORKSPACE/normal-zero.stdin" > "$WORKSPACE/normal-zero.out" 2>&1)
    hook_rc=$?
    set -e
    assert_exit 1 "$hook_rc" "normal ref with zero object is invalid for delete"
    pass
    cleanup_test_env
}


# ---------------------------------------------------------------------------
# T44: Rejection of zero REQUIRED_REMOTE_OBJECT for deletion
# ---------------------------------------------------------------------------
test_t44() {
    begin_test "T44"
    setup_test_env
    install_hook_in_test_repo

    # Create publication branch
    make_create_gate
    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    dest_ref="refs/heads/pub/$suffix"
    run_push "refs/heads/product/noor-personal-mvp:$dest_ref" 0

    # Create DELETE gate with zero REQUIRED_REMOTE_OBJECT (invalid)
    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    expires=$((now + 3600))
    write_gate_file \
        3 \
        "$CANONICAL_URL" \
        "(delete)" \
        "$ZERO_OBJECT" \
        "$dest_ref" \
        "$ZERO_OBJECT" \
        "DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT" \
        "$now" \
        "$expires" \
        "$GATE_NONCE" \
        "TEST_AUTHORITY" \
        "$ACTIVE_HOOK_POLICY_VERSION"

    # Attempt deletion - should fail due to zero REQUIRED_REMOTE_OBJECT
    run_simulated_push "(delete)" "$dest_ref" 0 1

    # Gate must still be present
    assert_file_exists "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}
