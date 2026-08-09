#!/bin/sh
set -eu
set -f
LC_ALL=C

# Common test helpers for the Noor Personal publication-control acceptance suite.
# These tests run ONLY against task-created temporary repositories and mock
# remotes under /tmp. They never modify the canonical repository.

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
CANONICAL_URL='https://github.com/engaboali9226-mastoura/work-tracker_OS.git'
ZERO_OBJECT='0000000000000000000000000000000000000000'
SENTINEL_URL='no_push://noor-personal-dev'

# Root of this repository (used for locating tracked artifacts)
REPO_ROOT=$(cd "$(dirname "$0")/../.." && pwd -P)
SCRIPTS_DIR="$REPO_ROOT/etc/noor-publication/scripts"
HOOK_TEMPLATE="$REPO_ROOT/etc/noor-publication/pre-push.noor-policy-hook"

# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------
TEST_ID=''
TEST_FAILED=0
PASS_COUNT=0
FAIL_COUNT=0
TOTAL_TEST_COUNT=0

begin_test() {
    TEST_ID=$1
    TEST_FAILED=0
    TOTAL_TEST_COUNT=$((TOTAL_TEST_COUNT + 1))
    echo ""
    echo "=== Running $TEST_ID ==="
}

pass() {
    if [ "$TEST_FAILED" -eq 0 ]; then
        PASS_COUNT=$((PASS_COUNT + 1))
        echo "PASS: $TEST_ID"
    else
        FAIL_COUNT=$((FAIL_COUNT + 1))
        echo "FAIL: $TEST_ID: test reported failures"
    fi
}

fail() {
    TEST_FAILED=1
    echo "FAIL: $TEST_ID: $1"
}

assert_eq() {
    [ "$1" = "$2" ] || { fail "assert eq: got [$1] expected [$2]"; }
}

assert_neq() {
    [ "$1" != "$2" ] || { fail "assert neq: [$1] should not equal [$2]"; }
}

assert_exit() {
    expected=$1
    actual=$2
    context=$3
    [ "$expected" = "$actual" ] || { fail "$context: expected exit $expected got $actual"; }
}

assert_file_exists() {
    [ -e "$1" ] || [ -L "$1" ] || { fail "expected file does not exist: $1"; }
}

assert_file_absent() {
    if [ -e "$1" ] || [ -L "$1" ]; then
        fail "expected file to be absent: $1"
    fi
}

# ---------------------------------------------------------------------------
# Test environment setup
# ---------------------------------------------------------------------------
TEST_BASE="${TMPDIR:-/tmp}/noor-pub-tests-$$"
WORKSPACE=''
MOCK_REMOTE=''
TEST_REPO=''
TEST_COMMIT_IMPL=''
TEST_CHILD_COMMIT=''
GATE_DIR=''
SOURCE_REPO=''
TARGET_REPO=''
SOURCE_APPROVED_COMMIT=''
SOURCE_APPROVED_HOOK_SHA256=''

copy_publication_control_artifacts() {
    repo_dir=$1
    include_hook=${2:-0}

    mkdir -p "$repo_dir/etc/noor-publication/scripts" "$repo_dir/docs/noor" "$repo_dir/tests"

    cp "$REPO_ROOT/etc/noor-publication/scripts/install-hook.sh" "$repo_dir/etc/noor-publication/scripts/install-hook.sh"
    cp "$REPO_ROOT/etc/noor-publication/POLICY.md" "$repo_dir/etc/noor-publication/POLICY.md" 2>/dev/null || true

    if [ "$include_hook" -eq 1 ]; then
        cp "$REPO_ROOT/etc/noor-publication/pre-push.noor-policy-hook" "$repo_dir/etc/noor-publication/pre-push.noor-policy-hook"
    fi

    if [ -f "$REPO_ROOT/docs/noor/personal-publication-control.md" ]; then
        cp "$REPO_ROOT/docs/noor/personal-publication-control.md" "$repo_dir/docs/noor/personal-publication-control.md"
    fi

    if [ -d "$REPO_ROOT/tests/noor-publication" ]; then
        cp -R "$REPO_ROOT/tests/noor-publication" "$repo_dir/tests/"
    fi

    chmod 0755 "$repo_dir/etc/noor-publication/scripts/install-hook.sh"
    if [ "$include_hook" -eq 1 ]; then
        chmod 0755 "$repo_dir/etc/noor-publication/pre-push.noor-policy-hook"
    fi
}

prepare_source_and_target_repos() {
    WORKSPACE="$TEST_BASE/ws-$(printf '%s' "$TEST_ID" | tr -c 'A-Za-z0-9' '-')"
    mkdir -p "$WORKSPACE"

    SOURCE_REPO="$WORKSPACE/source-repo"
    TARGET_REPO="$WORKSPACE/target-repo"

    git init "$SOURCE_REPO" >/dev/null 2>&1
    git -C "$SOURCE_REPO" config user.email "test@example.com"
    git -C "$SOURCE_REPO" config user.name "Test"
    git -C "$SOURCE_REPO" checkout -b product/noor-personal-mvp >/dev/null 2>&1

    copy_publication_control_artifacts "$SOURCE_REPO" 0

    git -C "$SOURCE_REPO" add etc/noor-publication scripts/noor-publication docs/noor/personal-publication-control.md tests/noor-publication >/dev/null 2>&1 || true
    git -C "$SOURCE_REPO" add etc/noor-publication/scripts/install-hook.sh etc/noor-publication/POLICY.md docs/noor/personal-publication-control.md tests/noor-publication >/dev/null 2>&1 || true
    git -C "$SOURCE_REPO" commit -m "initial publication-control assets" >/dev/null 2>&1

    git init "$TARGET_REPO" >/dev/null 2>&1
    git -C "$TARGET_REPO" config user.email "test@example.com"
    git -C "$TARGET_REPO" config user.name "Test"
    printf 'seed\n' > "$TARGET_REPO/seed.txt"
    git -C "$TARGET_REPO" add seed.txt
    git -C "$TARGET_REPO" commit -m "seed" >/dev/null 2>&1
    git -C "$TARGET_REPO" checkout -b product/noor-personal-mvp >/dev/null 2>&1
    git -C "$TARGET_REPO" remote add origin "$SENTINEL_URL"
    git -C "$TARGET_REPO" config remote.origin.pushurl "$SENTINEL_URL"
    git -C "$TARGET_REPO" config push.default nothing

    TEST_REPO=$TARGET_REPO
    GATE_DIR="$TARGET_REPO/.git/noor-publication-gate"
    mkdir -p "$GATE_DIR/backups"
    chmod 0700 "$GATE_DIR" "$GATE_DIR/backups"
}

setup_test_env() {
    # Unique workspace per test
    WORKSPACE="$TEST_BASE/ws-$(printf '%s' "$TEST_ID" | tr -c 'A-Za-z0-9' '-')"
    mkdir -p "$WORKSPACE"

    # Initialize mock remote (bare repo)
    MOCK_REMOTE="$WORKSPACE/mock-remote.git"
    git init --bare "$MOCK_REMOTE" >/dev/null 2>&1
    git -C "$MOCK_REMOTE" config core.sharedRepository false

    # Initialize test repository from a seed commit
    TEST_REPO="$WORKSPACE/test-repo"
    git init "$TEST_REPO" >/dev/null 2>&1
    git -C "$TEST_REPO" config user.email "test@example.com"
    git -C "$TEST_REPO" config user.name "Test"

    # Create a seed commit
    printf 'seed\n' > "$TEST_REPO/seed.txt"
    git -C "$TEST_REPO" add seed.txt
    git -C "$TEST_REPO" commit -m "seed" >/dev/null 2>&1

    # Create the product branch and commits
    git -C "$TEST_REPO" checkout -b product/noor-personal-mvp >/dev/null 2>&1

    # Create the implementation commit (COMMIT_IMPL)
    printf 'impl\n' > "$TEST_REPO/impl.txt"
    git -C "$TEST_REPO" add impl.txt
    git -C "$TEST_REPO" commit -m "implementation" >/dev/null 2>&1
    TEST_COMMIT_IMPL=$(git -C "$TEST_REPO" rev-parse HEAD)

    # Create a child commit (CHILD_COMMIT) for UPDATE tests
    printf 'child\n' >> "$TEST_REPO/impl.txt"
    git -C "$TEST_REPO" add impl.txt
    git -C "$TEST_REPO" commit -m "child update" >/dev/null 2>&1
    TEST_CHILD_COMMIT=$(git -C "$TEST_REPO" rev-parse HEAD)

    # Set source to the implementation commit
    git -C "$TEST_REPO" reset --hard "$TEST_COMMIT_IMPL" >/dev/null 2>&1

    # Set up remote
    git -C "$TEST_REPO" remote add origin "$MOCK_REMOTE"
    git -C "$TEST_REPO" config remote.origin.pushurl "$SENTINEL_URL"
    git -C "$TEST_REPO" config push.default nothing

    # Set up URL rewriting: canonical URL -> local mock remote.
    # This lets the hook's internal `git ls-remote "$CANONICAL_URL"` reach the
    # mock remote. The hook is invoked directly by run_simulated_push with the
    # canonical URL as its second argument, so $2 still matches.
    git -C "$TEST_REPO" config --add "url.$MOCK_REMOTE.insteadOf" "$CANONICAL_URL"

    # Create the publication gate runtime directory
    GATE_DIR="$TEST_REPO/.git/noor-publication-gate"
    mkdir -p "$GATE_DIR/consumed" "$GATE_DIR/backups" "$GATE_DIR/revoked"
    chmod 0700 "$GATE_DIR" "$GATE_DIR/consumed" "$GATE_DIR/backups" "$GATE_DIR/revoked"
}

# Install the canonical hook into the test repository's hooks path.
install_hook_in_test_repo() {
    HOOK_DST="$TEST_REPO/.git/hooks/pre-push"
    cp "$HOOK_TEMPLATE" "$HOOK_DST"
    chmod 0755 "$HOOK_DST"
}

# ---------------------------------------------------------------------------
# Gate generation helper
# ---------------------------------------------------------------------------
write_gate_file() {
    TMP_FILE="$WORKSPACE/.gate.tmp.$$"
    {
        echo "SCHEMA_VERSION=$1"
        echo "REPOSITORY_URL=$2"
        echo "SOURCE_REF=$3"
        echo "SOURCE_OBJECT=$4"
        echo "DESTINATION_REF=$5"
        echo "REQUIRED_REMOTE_OBJECT=$6"
        echo "UPDATE_COUNT=1"
        echo "OPERATION=$7"
        echo "CREATED_AT=$8"
        echo "EXPIRES_AT=$9"
        echo "NONCE=${10}"
        echo "AUTHORITY_ID=${11}"
        echo "HOOK_POLICY_VERSION=${12}"
    } > "$TMP_FILE"

    # Compute SHA-256 of lines 1-13
    if command -v sha256sum >/dev/null 2>&1; then
        sha=$(sha256sum "$TMP_FILE" | awk '{print $1}')
    else
        sha=$(shasum -a 256 "$TMP_FILE" | awk '{print $1}')
    fi
    echo "GATE_FILE_SHA256=$sha" >> "$TMP_FILE"

    mkdir -p "$GATE_DIR"
    mv "$TMP_FILE" "$GATE_DIR/active.gate"
    chmod 0600 "$GATE_DIR/active.gate"
}

# Generate a valid CREATE gate. Sets GATE_NONCE.
make_create_gate() {
    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    expires=$((now + 3600))
    suffix=$(printf '%s' "$TEST_COMMIT_IMPL" | cut -c1-12)
    write_gate_file \
        2 \
        "$CANONICAL_URL" \
        "refs/heads/product/noor-personal-mvp" \
        "$TEST_COMMIT_IMPL" \
        "refs/heads/pub/$suffix" \
        "$ZERO_OBJECT" \
        "CREATE_NON_PROTECTED_BRANCH_EXACT_OBJECT" \
        "$now" \
        "$expires" \
        "$GATE_NONCE" \
        "TEST_AUTHORITY" \
        2
}

# Generate a valid UPDATE gate. Sets GATE_NONCE.
make_update_gate() {
    GATE_NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    now=$(date -u '+%s')
    expires=$((now + 3600))
    suffix=$(printf '%s' "$TEST_CHILD_COMMIT" | cut -c1-12)
    write_gate_file \
        2 \
        "$CANONICAL_URL" \
        "refs/heads/product/noor-personal-mvp" \
        "$TEST_CHILD_COMMIT" \
        "refs/heads/pub/$suffix" \
        "$TEST_COMMIT_IMPL" \
        "UPDATE_NON_PROTECTED_BRANCH_FAST_FORWARD" \
        "$now" \
        "$expires" \
        "$GATE_NONCE" \
        "TEST_AUTHORITY" \
        2
}

# ---------------------------------------------------------------------------
# Core test execution helper
# ---------------------------------------------------------------------------
# Simulates a git push: invokes the pre-push hook directly with the canonical
# URL arguments, and if the hook exits 0, performs the network push to the
# mock remote.
#
# Args:
#   $1 = local ref
#   $2 = destination ref
#   $3 = force flag (0 or 1; when 1, uses --force)
#   $4 = expected exit (0 or 1)
# Returns via global HOOK_EXIT, PUSH_EXIT
HOOK_EXIT=99
PUSH_EXIT=99

run_simulated_push() {
    local_ref=$1
    dest_ref=$2
    force_flag=${3:-0}
    expected_exit=${4:-0}

    # Determine the local object (what the source ref resolves to)
    if [ "$local_ref" = "refs/heads/product/noor-personal-mvp" ]; then
        local_object=$(git -C "$TEST_REPO" rev-parse "$local_ref^{commit}" 2>/dev/null || echo "$ZERO_OBJECT")
    else
        local_object=$(git -C "$TEST_REPO" rev-parse "$local_ref^{commit}" 2>/dev/null || echo "$ZERO_OBJECT")
    fi

    # Determine what the remote has for dest_ref
    set +e
    remote_line=$(git ls-remote -- "$MOCK_REMOTE" "$dest_ref" 2>/dev/null)
    set -e
    if [ -z "$remote_line" ]; then
        remote_object="$ZERO_OBJECT"
    else
        set -- $remote_line
        remote_object=$1
    fi

    # Deletion: if local_ref is empty (for delete), local_object is zero
    local_ref_name=$(printf '%s' "$local_ref" | sed 's|^refs/||' 2>/dev/null || printf '%s' "$local_ref")

    # Invoke the hook directly with canonical URL arguments
    echo "$local_ref $local_object $dest_ref $remote_object" | (
        cd "$TEST_REPO"
        set +e
        .git/hooks/pre-push "$CANONICAL_URL" "$CANONICAL_URL" 2>&1
        echo "HOOK_EXIT_CODE=$?"
    ) > "$WORKSPACE/.hook.out"
    # Extract hook exit
    set +e
    hook_line=$(grep '^HOOK_EXIT_CODE=' "$WORKSPACE/.hook.out")
    set -e
    HOOK_EXIT=${hook_line#HOOK_EXIT_CODE=}

    # If hook passed, perform the actual push to mock remote
    if [ "$HOOK_EXIT" -eq 0 ]; then
        # Temporarily bypass the hook for the actual push verification.
        # The hook has already consumed the gate; running it again would fail.
        HOOK_BACKUP="$TEST_REPO/.git/hooks/pre-push.$$.bak"
        mv "$TEST_REPO/.git/hooks/pre-push" "$HOOK_BACKUP"

        # The source object for the push is determined by whether local_ref exists
        if [ "$local_object" = "$ZERO_OBJECT" ]; then
            # Deletion push
            set +e
            git -C "$TEST_REPO" push "$MOCK_REMOTE" --delete "$dest_ref" > /dev/null 2>&1
            PUSH_EXIT=$?
            set -e
        else
            # Use the ref name for the push (Git resolves it to the object)
            # This avoids refspec formatting issues
            if [ "$force_flag" -eq 1 ]; then
                set +e
                git -C "$TEST_REPO" push --force "$MOCK_REMOTE" "$local_ref:$dest_ref" > /dev/null 2>&1
                PUSH_EXIT=$?
                set -e
            else
                set +e
                git -C "$TEST_REPO" push "$MOCK_REMOTE" "$local_ref:$dest_ref" > /dev/null 2>&1
                PUSH_EXIT=$?
                set -e
            fi
        fi

        # Restore the hook
        if [ -f "$HOOK_BACKUP" ]; then
            mv "$HOOK_BACKUP" "$TEST_REPO/.git/hooks/pre-push"
            chmod 0755 "$TEST_REPO/.git/hooks/pre-push"
        fi
        total_exit=$PUSH_EXIT
    else
        PUSH_EXIT=1
        total_exit=$HOOK_EXIT
    fi

    # If the test expected success but overall exit is 1, report both
    if [ "$expected_exit" -eq 0 ] && [ "$total_exit" -ne 0 ]; then
        cat "$WORKSPACE/.hook.out"
    fi
    assert_exit "$expected_exit" "$total_exit" "simulated push"
}

# Backward-compatible wrapper for run_push used by older tests
run_push() {
    refspec=$1
    expected_exit=$2
    # Parse refspec local:dest
    local_ref=$(printf '%s' "$refspec" | cut -d: -f1)
    dest_ref=$(printf '%s' "$refspec" | cut -d: -f2)
    run_simulated_push "$local_ref" "$dest_ref" 0 "$expected_exit"
}

# ---------------------------------------------------------------------------
# State helpers
# ---------------------------------------------------------------------------
advance_product_to_impl() {
    git -C "$TEST_REPO" reset --hard "$TEST_COMMIT_IMPL" >/dev/null 2>&1
}

advance_product_to_child() {
    git -C "$TEST_REPO" reset --hard "$TEST_CHILD_COMMIT" >/dev/null 2>&1
}

remote_has_ref() {
    ref=$1
    expected_obj=$2
    set +e
    remote_line=$(git ls-remote -- "$MOCK_REMOTE" "$ref" 2>/dev/null)
    remote_rc=$?
    set -e
    if [ "$remote_rc" -ne 0 ]; then
        return 1
    fi
    if [ -z "$remote_line" ]; then
        return 1
    fi
    set -- $remote_line
    [ "$#" -eq 2 ] || return 1
    [ "$1" = "$expected_obj" ] || return 1
    return 0
}

remote_ref_count() {
    set +e
    count=$(git ls-remote -- "$MOCK_REMOTE" 2>/dev/null | wc -l | tr -d ' ')
    set -e
    printf '%s' "$count"
}

# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------
cleanup_test_env() {
    rm -rf "$WORKSPACE"
    rm -rf "$TEST_BASE" 2>/dev/null || true
}

teardown_all() {
    rm -rf "$TEST_BASE" 2>/dev/null || true
}
