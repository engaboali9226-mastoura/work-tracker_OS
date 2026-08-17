#!/bin/sh
set -eu
set -f
LC_ALL=C

REPO_ROOT=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
GENERATOR="$REPO_ROOT/etc/noor-publication/scripts/generate-gate.sh"
HOOK_TEMPLATE="$REPO_ROOT/etc/noor-publication/pre-push.noor-policy-hook"

CANONICAL_URL='https://github.com/engaboali9226-mastoura/work-tracker_OS.git'
PROTECTED_REF='refs/heads/product/noor-personal-mvp'
SENTINEL_URL='no_push://noor-personal-dev'
ZERO_OBJECT='0000000000000000000000000000000000000000'
REAL_GIT=$(command -v git)

BASE="${TMPDIR:-/tmp}/noor-policy-v5-legacy-delete-behavior-$$"
mkdir -p "$BASE"
trap 'rm -rf "$BASE"' EXIT HUP INT TERM

fail() {
    echo "policy-v5-legacy-delete-behavior: FAIL: $1" >&2
    exit 1
}

sha256_file() {
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$1" | awk '{print $1}'
    else
        shasum -a 256 "$1" | awk '{print $1}'
    fi
}

setup_case_repo() {
    CASE_DIR=$1
    FAKE_REF=$2
    FAKE_OBJECT=$3

    mkdir -p "$CASE_DIR/home"
    "$REAL_GIT" init "$CASE_DIR/repo" >/dev/null 2>&1
    "$REAL_GIT" -C "$CASE_DIR/repo" config user.email "policy-v5-test@example.invalid"
    "$REAL_GIT" -C "$CASE_DIR/repo" config user.name "Policy v5 Test"

    printf '%s\n' seed > "$CASE_DIR/repo/seed.txt"
    "$REAL_GIT" -C "$CASE_DIR/repo" add seed.txt
    "$REAL_GIT" -C "$CASE_DIR/repo" commit -m seed >/dev/null 2>&1
    "$REAL_GIT" -C "$CASE_DIR/repo" branch -M product/noor-personal-mvp

    "$REAL_GIT" -C "$CASE_DIR/repo" remote add origin "$CANONICAL_URL"
    "$REAL_GIT" -C "$CASE_DIR/repo" config remote.origin.pushurl "$SENTINEL_URL"

    mkdir -p \
        "$CASE_DIR/repo/.git/noor-publication-gate/consumed" \
        "$CASE_DIR/repo/.git/noor-publication-gate/revoked" \
        "$CASE_DIR/repo/.git/noor-publication-gate/backups" \
        "$CASE_DIR/repo/.git/hooks" \
        "$CASE_DIR/shim"

    chmod 0700 \
        "$CASE_DIR/repo/.git/noor-publication-gate" \
        "$CASE_DIR/repo/.git/noor-publication-gate/consumed" \
        "$CASE_DIR/repo/.git/noor-publication-gate/revoked" \
        "$CASE_DIR/repo/.git/noor-publication-gate/backups"

    cp "$HOOK_TEMPLATE" "$CASE_DIR/repo/.git/hooks/pre-push"
    chmod 0755 "$CASE_DIR/repo/.git/hooks/pre-push"

    cat > "$CASE_DIR/shim/git" <<'SHIM'
#!/bin/sh
if [ "${1-}" = "ls-remote" ]; then
    _url=''
    _ref=''
    for _arg in "$@"; do
        case "$_arg" in
            "$NOOR_CANONICAL_URL") _url=$_arg ;;
            refs/*) _ref=$_arg ;;
        esac
    done
    if [ "$_url" = "$NOOR_CANONICAL_URL" ]; then
        if [ "$_ref" = "$NOOR_FAKE_REF" ]; then
            printf '%s\t%s\n' "$NOOR_FAKE_OBJECT" "$NOOR_FAKE_REF"
        fi
        exit 0
    fi
fi
exec "$NOOR_REAL_GIT" "$@"
SHIM
    chmod 0755 "$CASE_DIR/shim/git"
}

run_generator_case() {
    _name=$1
    _ref=$2
    _required=$3
    _fake_object=$4
    _expected=$5

    _dir="$BASE/generator-$_name"
    setup_case_repo "$_dir" "$_ref" "$_fake_object"

    set +e
    (
        cd "$_dir/repo"
        unset GIT_CONFIG_COUNT GIT_CONFIG_PARAMETERS
        HOME="$_dir/home" \
        PATH="$_dir/shim:$PATH" \
        NOOR_REAL_GIT="$REAL_GIT" \
        NOOR_CANONICAL_URL="$CANONICAL_URL" \
        NOOR_FAKE_REF="$_ref" \
        NOOR_FAKE_OBJECT="$_fake_object" \
        "$GENERATOR" \
            --operation DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT \
            --source-ref "(delete)" \
            --source-object "$ZERO_OBJECT" \
            --destination-ref "$_ref" \
            --required-remote-object "$_required" \
            --authority-id TEST_AUTHORITY \
            --dry-run >/dev/null 2>&1
    )
    _rc=$?
    set -e

    [ "$_rc" -eq "$_expected" ] ||
        fail "generator $_name expected rc=$_expected actual=$_rc"

    [ ! -e "$_dir/repo/.git/noor-publication-gate/active.gate" ] ||
        fail "generator $_name created active.gate during dry-run"
}

write_delete_gate() {
    _repo=$1
    _ref=$2
    _required=$3
    _nonce=$4

    _gate_dir="$_repo/.git/noor-publication-gate"
    _tmp="$_gate_dir/.gate.tmp.$$"
    _now=$(date -u '+%s')
    _expires=$((_now + 3600))

    {
        echo "SCHEMA_VERSION=3"
        echo "REPOSITORY_URL=$CANONICAL_URL"
        echo "SOURCE_REF=(delete)"
        echo "SOURCE_OBJECT=$ZERO_OBJECT"
        echo "DESTINATION_REF=$_ref"
        echo "REQUIRED_REMOTE_OBJECT=$_required"
        echo "UPDATE_COUNT=1"
        echo "OPERATION=DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT"
        echo "CREATED_AT=$_now"
        echo "EXPIRES_AT=$_expires"
        echo "NONCE=$_nonce"
        echo "AUTHORITY_ID=TEST_AUTHORITY"
        echo "HOOK_POLICY_VERSION=5"
    } > "$_tmp"

    _sha=$(sha256_file "$_tmp")
    echo "GATE_FILE_SHA256=$_sha" >> "$_tmp"
    mv "$_tmp" "$_gate_dir/active.gate"
    chmod 0600 "$_gate_dir/active.gate"
}

run_hook_case() {
    _name=$1
    _ref=$2
    _required=$3
    _remote_object=$4
    _expected=$5

    _dir="$BASE/hook-$_name"
    setup_case_repo "$_dir" "$_ref" "$_remote_object"

    _nonce=$(printf '%032x' "$((1000 + ${#_name}))")
    write_delete_gate "$_dir/repo" "$_ref" "$_required" "$_nonce"

    set +e
    printf '%s %s %s %s\n' \
        "(delete)" \
        "$ZERO_OBJECT" \
        "$_ref" \
        "$_remote_object" |
    (
        cd "$_dir/repo"
        unset GIT_CONFIG_COUNT GIT_CONFIG_PARAMETERS
        HOME="$_dir/home" \
        PATH="$_dir/shim:$PATH" \
        NOOR_REAL_GIT="$REAL_GIT" \
        NOOR_CANONICAL_URL="$CANONICAL_URL" \
        NOOR_FAKE_REF="$_ref" \
        NOOR_FAKE_OBJECT="$_remote_object" \
        .git/hooks/pre-push "$CANONICAL_URL" "$CANONICAL_URL" \
            >/dev/null 2>&1
    )
    _rc=$?
    set -e

    [ "$_rc" -eq "$_expected" ] ||
        fail "hook $_name expected rc=$_expected actual=$_rc"

    if [ "$_expected" -eq 0 ]; then
        [ ! -e "$_dir/repo/.git/noor-publication-gate/active.gate" ] ||
            fail "hook $_name did not consume accepted gate"
        [ -f "$_dir/repo/.git/noor-publication-gate/consumed/$_nonce.gate" ] ||
            fail "hook $_name accepted but consumed artifact missing"
    else
        [ -f "$_dir/repo/.git/noor-publication-gate/active.gate" ] ||
            fail "hook $_name consumed rejected authority"
    fi
}

PAIR1_REF='refs/heads/codex/noor-ci-workspace-integration'
PAIR1_OBJ='9427b2574488a3a3b3144d7da63332cdabb9d0aa'

PAIR2_REF='refs/heads/codex/platform-app-catalog-foundation'
PAIR2_OBJ='3097814d5f2195c35d3308ff96c90abd149c1bd9'

PAIR3_REF='refs/heads/codex/platform-application-composition-foundation'
PAIR3_OBJ='68fa2995c5be8193a269edc45117d1adc6f6dcba'

PAIR4_REF='refs/heads/agents/workspace-package-entrypoint-contract-repair'
PAIR4_OBJ='7ab046ac2fe8fa89c4c1031bfead41dfa7aa4b6d'

WRONG_OBJ='1111111111111111111111111111111111111111'

# Exact allowlisted pairs: generator and hook both accept.
run_generator_case allow1 "$PAIR1_REF" "$PAIR1_OBJ" "$PAIR1_OBJ" 0
run_generator_case allow2 "$PAIR2_REF" "$PAIR2_OBJ" "$PAIR2_OBJ" 0
run_generator_case allow3 "$PAIR3_REF" "$PAIR3_OBJ" "$PAIR3_OBJ" 0
run_generator_case allow4 "$PAIR4_REF" "$PAIR4_OBJ" "$PAIR4_OBJ" 0

run_hook_case allow1 "$PAIR1_REF" "$PAIR1_OBJ" "$PAIR1_OBJ" 0
run_hook_case allow2 "$PAIR2_REF" "$PAIR2_OBJ" "$PAIR2_OBJ" 0
run_hook_case allow3 "$PAIR3_REF" "$PAIR3_OBJ" "$PAIR3_OBJ" 0
run_hook_case allow4 "$PAIR4_REF" "$PAIR4_OBJ" "$PAIR4_OBJ" 0

# Exact ref with wrong object: reject even when fake remote matches wrong object.
run_generator_case wrong_object "$PAIR1_REF" "$WRONG_OBJ" "$WRONG_OBJ" 1
run_hook_case wrong_object "$PAIR1_REF" "$WRONG_OBJ" "$WRONG_OBJ" 1

# No wildcard authorization for codex/*.
run_generator_case unknown_codex \
    refs/heads/codex/not-allowlisted "$WRONG_OBJ" "$WRONG_OBJ" 1
run_hook_case unknown_codex \
    refs/heads/codex/not-allowlisted "$WRONG_OBJ" "$WRONG_OBJ" 1

# No wildcard authorization for agents/*.
run_generator_case unknown_agents \
    refs/heads/agents/not-allowlisted "$WRONG_OBJ" "$WRONG_OBJ" 1
run_hook_case unknown_agents \
    refs/heads/agents/not-allowlisted "$WRONG_OBJ" "$WRONG_OBJ" 1

# No arbitrary refs/heads/* authorization.
run_generator_case arbitrary_branch \
    refs/heads/random-legacy "$WRONG_OBJ" "$WRONG_OBJ" 1
run_hook_case arbitrary_branch \
    refs/heads/random-legacy "$WRONG_OBJ" "$WRONG_OBJ" 1

# Protected canonical remains undeletable.
run_generator_case protected \
    "$PROTECTED_REF" "$WRONG_OBJ" "$WRONG_OBJ" 1
run_hook_case protected \
    "$PROTECTED_REF" "$WRONG_OBJ" "$WRONG_OBJ" 1

# Tags remain outside branch-delete authority.
run_generator_case tag \
    refs/tags/not-authorized "$WRONG_OBJ" "$WRONG_OBJ" 1
run_hook_case tag \
    refs/tags/not-authorized "$WRONG_OBJ" "$WRONG_OBJ" 1

echo "POLICY_V5_EXACT_ALLOWLIST_GENERATOR_BEHAVIOR=PASS"
echo "POLICY_V5_EXACT_ALLOWLIST_HOOK_BEHAVIOR=PASS"
echo "POLICY_V5_WRONG_OBJECT_REJECTED=YES"
echo "POLICY_V5_UNKNOWN_CODEX_REJECTED=YES"
echo "POLICY_V5_UNKNOWN_AGENTS_REJECTED=YES"
echo "POLICY_V5_ARBITRARY_BRANCH_REJECTED=YES"
echo "POLICY_V5_PROTECTED_CANONICAL_REJECTED=YES"
echo "POLICY_V5_TAG_DELETE_REJECTED=YES"
echo "policy-v5-legacy-delete-behavior: PASS"
