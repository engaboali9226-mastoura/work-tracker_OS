#!/bin/sh
set -eu
set -f
LC_ALL=C

# T30-T33 cover the policy-v3 annotated-tag authority path in isolated repos.

test_t30() {
    begin_test "T30"
    setup_test_env
    install_hook_in_test_repo
    make_annotated_tag "release-test"

    set +e
    (cd "$TEST_REPO" && etc/noor-publication/scripts/generate-gate.sh \
        --operation CREATE_ANNOTATED_TAG_EXACT_OBJECT \
        --source-ref "refs/tags/$TEST_TAG_NAME" \
        --source-object "$TEST_TAG_OBJECT" \
        --destination-ref "refs/tags/$TEST_TAG_NAME" \
        --required-remote-object "$ZERO_OBJECT" \
        --authority-id TEST_AUTHORITY --nonce 11111111111111111111111111111111 --ttl 3600 > /dev/null 2>&1)
    generate_rc=$?
    set -e
    assert_exit 0 "$generate_rc" "generate annotated-tag gate"

    run_simulated_push "refs/tags/$TEST_TAG_NAME" "refs/tags/$TEST_TAG_NAME" 0 0
    assert_file_absent "$GATE_DIR/active.gate"
    assert_file_exists "$GATE_DIR/consumed/11111111111111111111111111111111.gate"

    direct_line=$(git ls-remote --refs -- "$MOCK_REMOTE" "refs/tags/$TEST_TAG_NAME")
    set -- $direct_line
    assert_eq "$TEST_TAG_OBJECT" "$1" "remote direct annotated tag object"
    assert_eq "refs/tags/$TEST_TAG_NAME" "$2" "remote direct annotated tag ref"
    peeled_line=$(git ls-remote -- "$MOCK_REMOTE" "refs/tags/$TEST_TAG_NAME^{}")
    set -- $peeled_line
    assert_eq "$TEST_TAG_PEELED" "$1" "remote peeled annotated tag commit"
    assert_eq "refs/tags/$TEST_TAG_NAME^{}" "$2" "remote peeled tag ref"

    pass
    cleanup_test_env
}

test_t31() {
    begin_test "T31"
    setup_test_env
    install_hook_in_test_repo
    make_annotated_tag "valid-tag"
    git -C "$TEST_REPO" tag lightweight-tag "$TEST_COMMIT_IMPL"
    git -C "$TEST_REPO" tag -a tag-of-tag -m "tag chain" "refs/tags/$TEST_TAG_NAME"

    generator="$TEST_REPO/etc/noor-publication/scripts/generate-gate.sh"
    expect_generator_rejection() {
        set +e
        (cd "$TEST_REPO" && "$generator" "$@" --authority-id TEST_AUTHORITY --nonce 22222222222222222222222222222222 --ttl 3600 --dry-run > /dev/null 2>&1)
        actual=$?
        set -e
        assert_exit 1 "$actual" "tag generator rejection"
    }

    expect_generator_rejection --operation CREATE_ANNOTATED_TAG_EXACT_OBJECT --source-ref refs/tags/lightweight-tag --source-object "$TEST_COMMIT_IMPL" --destination-ref refs/tags/lightweight-tag --required-remote-object "$ZERO_OBJECT"
    expect_generator_rejection --operation CREATE_ANNOTATED_TAG_EXACT_OBJECT --source-ref refs/tags/valid-tag --source-object "$TEST_TAG_OBJECT" --destination-ref refs/tags/other-tag --required-remote-object "$ZERO_OBJECT"
    expect_generator_rejection --operation CREATE_ANNOTATED_TAG_EXACT_OBJECT --source-ref refs/tags/valid-tag --source-object "$TEST_TAG_OBJECT" --destination-ref refs/tags/valid-tag --required-remote-object "$TEST_COMMIT_IMPL"
    expect_generator_rejection --operation CREATE_ANNOTATED_TAG_EXACT_OBJECT --source-ref refs/tags/bad..tag --source-object "$TEST_TAG_OBJECT" --destination-ref refs/tags/bad..tag --required-remote-object "$ZERO_OBJECT"
    expect_generator_rejection --operation CREATE_ANNOTATED_TAG_EXACT_OBJECT --source-ref refs/heads/product/noor-personal-mvp --source-object "$TEST_COMMIT_IMPL" --destination-ref refs/heads/product/noor-personal-mvp --required-remote-object "$ZERO_OBJECT"
    chain_object=$(git -C "$TEST_REPO" rev-parse refs/tags/tag-of-tag)
    expect_generator_rejection --operation CREATE_ANNOTATED_TAG_EXACT_OBJECT --source-ref refs/tags/tag-of-tag --source-object "$chain_object" --destination-ref refs/tags/tag-of-tag --required-remote-object "$ZERO_OBJECT"

    pass
    cleanup_test_env
}

test_t32() {
    begin_test "T32"
    setup_test_env
    install_hook_in_test_repo
    make_annotated_tag "moved-tag"
    make_tag_gate

    # Recreate the local tag after authority issuance; its direct object changes.
    git -C "$TEST_REPO" tag -f -a "$TEST_TAG_NAME" -m "replacement annotated tag" "$TEST_CHILD_COMMIT" > /dev/null
    run_simulated_push "refs/tags/$TEST_TAG_NAME" "refs/tags/$TEST_TAG_NAME" 0 1
    assert_file_exists "$GATE_DIR/active.gate"

    # A branch-operation gate cannot authorize a tag ref.
    rm -f "$GATE_DIR/active.gate"
    make_create_gate
    run_simulated_push "refs/tags/$TEST_TAG_NAME" "refs/tags/$TEST_TAG_NAME" 0 1
    assert_file_exists "$GATE_DIR/active.gate"

    pass
    cleanup_test_env
}

test_t33() {
    begin_test "T33"
    setup_test_env
    install_hook_in_test_repo
    make_annotated_tag "verification-tag"
    hook_backup="$TEST_REPO/.git/hooks/pre-push.t33"
    mv "$TEST_REPO/.git/hooks/pre-push" "$hook_backup"
    git -C "$TEST_REPO" push "$MOCK_REMOTE" "refs/tags/$TEST_TAG_NAME:refs/tags/$TEST_TAG_NAME" > /dev/null 2>&1
    mv "$hook_backup" "$TEST_REPO/.git/hooks/pre-push"
    chmod 0755 "$TEST_REPO/.git/hooks/pre-push"
    git -C "$TEST_REPO" tag -a same-commit-different-object -m "different tag object" "$TEST_COMMIT_IMPL"
    different_object=$(git -C "$TEST_REPO" rev-parse refs/tags/same-commit-different-object)
    verifier="$TEST_REPO/etc/noor-publication/scripts/verify-publication.sh"

    set +e
    (cd "$TEST_REPO" && "$verifier" --operation CREATE_ANNOTATED_TAG_EXACT_OBJECT --destination-ref "refs/tags/$TEST_TAG_NAME" --expected-object "$different_object" --expected-peeled-object "$TEST_TAG_PEELED" --remote-url "$MOCK_REMOTE" > /dev/null 2>&1)
    mismatch_rc=$?
    set -e
    assert_exit 1 "$mismatch_rc" "direct tag-object mismatch rejected"

    git -C "$TEST_REPO" tag lightweight-remote "$TEST_COMMIT_IMPL"
    mv "$TEST_REPO/.git/hooks/pre-push" "$hook_backup"
    git -C "$TEST_REPO" push "$MOCK_REMOTE" refs/tags/lightweight-remote:refs/tags/lightweight-remote > /dev/null 2>&1
    mv "$hook_backup" "$TEST_REPO/.git/hooks/pre-push"
    chmod 0755 "$TEST_REPO/.git/hooks/pre-push"
    set +e
    (cd "$TEST_REPO" && "$verifier" --operation CREATE_ANNOTATED_TAG_EXACT_OBJECT --destination-ref refs/tags/lightweight-remote --expected-object "$TEST_COMMIT_IMPL" --expected-peeled-object "$TEST_COMMIT_IMPL" --remote-url "$MOCK_REMOTE" > /dev/null 2>&1)
    lightweight_rc=$?
    set -e
    assert_exit 1 "$lightweight_rc" "lightweight remote tag rejected"

    pass
    cleanup_test_env
}
