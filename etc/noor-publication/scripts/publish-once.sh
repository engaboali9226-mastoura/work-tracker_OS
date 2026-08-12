#!/bin/sh
set -eu
set -f
LC_ALL=C

# Noor Personal publication-control v3 network-outcome executor.
# Runs exactly one explicit source-to-destination git push against the
# canonical URL. Records PUSH_ATTEMPT, PUSH_SUCCEEDED, PUSH_FAILED, or
# PUSH_DENIED in the audit log. Never reactivates a consumed gate.
#
# Usage:
#   publish-once.sh [--remote-url <URL>]

usage() {
    echo "Usage: publish-once.sh [--remote-url <URL>]" >&2
    exit 2
}

deny() {
    echo "publish-once: denied: $1" >&2
    exit 1
}

# SHA-256 utility with capability detection (macOS / GNU).
compute_sha256() {
    if [ "$#" -gt 0 ] && [ -n "$1" ]; then
        if command -v sha256sum >/dev/null 2>&1; then
            sha256sum "$1" | awk '{print $1}'
        elif command -v shasum >/dev/null 2>&1; then
            shasum -a 256 "$1" | awk '{print $1}'
        else
            return 127
        fi
    else
        if command -v sha256sum >/dev/null 2>&1; then
            sha256sum | awk '{print $1}'
        elif command -v shasum >/dev/null 2>&1; then
            shasum -a 256 | awk '{print $1}'
        else
            return 127
        fi
    fi
}

# Constants
CANONICAL_URL='https://github.com/engaboali9226-mastoura/work-tracker_OS.git'
GATE_DIR_NAME='noor-publication-gate'
STATE_LOCK_NAME='state.lock'
ACTIVE_GATE_NAME='active.gate'
AUDIT_LOG_NAME='audit.log'
SENTINEL_URL='no_push://noor-personal-dev'
VERIFY_SCRIPT_DIR='etc/noor-publication/scripts'

REMOTE_URL="$CANONICAL_URL"

while [ "$#" -gt 0 ]; do
    case "$1" in
        --remote-url)
            shift
            [ "$#" -gt 0 ] || usage
            REMOTE_URL=$1
            ;;
        *)
            usage
            ;;
    esac
    shift
done

# Resolve git paths
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || deny "not a git repository"
COMMON_DIR=$(git rev-parse --git-common-dir 2>/dev/null) || deny "common dir unavailable"
case "$COMMON_DIR" in
    /*) ;;
    *) COMMON_DIR=$REPO_ROOT/$COMMON_DIR ;;
esac
COMMON_DIR=$(cd "$COMMON_DIR" 2>/dev/null && pwd -P) || deny "cannot canonicalize common dir"

GATE_DIR=$COMMON_DIR/$GATE_DIR_NAME
STATE_LOCK=$GATE_DIR/$STATE_LOCK_NAME
ACTIVE_GATE=$GATE_DIR/$ACTIVE_GATE_NAME
AUDIT_LOG=$GATE_DIR/$AUDIT_LOG_NAME

# Verify persistent push URL sentinel is intact
configured_pushurl=$(git config --get remote.origin.pushurl 2>/dev/null || git config --get remote.origin.url 2>/dev/null)
[ "$configured_pushurl" = "$SENTINEL_URL" ] ||
    deny "persistent push URL sentinel has been altered"

# Acquire the common lock
if ! mkdir "$STATE_LOCK" 2>/dev/null; then
    deny "state lock is held; a concurrent operation is in progress or a previous lock was not recovered"
fi
trap 'rmdir "$STATE_LOCK" 2>/dev/null || true' 0 1 2 3 15

# Read active.gate parameters (must exist)
[ -f "$ACTIVE_GATE" ] && [ ! -L "$ACTIVE_GATE" ] || deny "active.gate is unavailable"

SOURCE_REF=''
DESTINATION_REF=''
OPERATION=''
SOURCE_OBJECT=''
NONCE=''

line_no=0
while IFS= read -r line || [ -n "$line" ]; do
    line_no=$((line_no + 1))
    case "$line_no" in
        3)  SOURCE_REF=${line#SOURCE_REF=} ;;
        4)  SOURCE_OBJECT=${line#SOURCE_OBJECT=} ;;
        5)  DESTINATION_REF=${line#DESTINATION_REF=} ;;
        8)  OPERATION=${line#OPERATION=} ;;
        11) NONCE=${line#NONCE=} ;;
    esac
done < "$ACTIVE_GATE"

[ -n "$SOURCE_REF" ] || deny "gate missing source ref"
[ -n "$DESTINATION_REF" ] || deny "gate missing destination ref"
[ -n "$OPERATION" ] || deny "gate missing operation"
[ -n "$SOURCE_OBJECT" ] || deny "gate missing source object"
[ -n "$NONCE" ] || deny "gate missing nonce"

# Release the lock (so the hook can acquire it during git push)
rmdir "$STATE_LOCK" 2>/dev/null || true
trap - 0 1 2 3 15

# Record push attempt
audit_line="$(date -u '+%Y-%m-%dT%H:%M:%SZ') event=PUSH_ATTEMPT nonce=$NONCE op=$OPERATION src=$SOURCE_REF dst=$DESTINATION_REF"
echo "$audit_line" >> "$AUDIT_LOG"
chmod 0600 "$AUDIT_LOG" 2>/dev/null || true

# Execute exactly one explicit source-to-destination push
set +e
git push "$REMOTE_URL" "$SOURCE_REF:$DESTINATION_REF" 2>"$GATE_DIR/.push.err.$$"
push_exit=$?
set -e
detail=$(head -n 1 "$GATE_DIR/.push.err.$$" 2>/dev/null || echo "")
rm -f "$GATE_DIR/.push.err.$$"

# Re-acquire the common lock
if ! mkdir "$STATE_LOCK" 2>/dev/null; then
    # Lock was left by the hook or another process. Fail-closed.
    echo "publish-once: lock held after push; cannot finalize audit record" >&2
    exit 1
fi
trap 'rmdir "$STATE_LOCK" 2>/dev/null || true' 0 1 2 3 15

# Determine outcome
if [ -e "$ACTIVE_GATE" ] || [ -L "$ACTIVE_GATE" ]; then
    # active.gate still exists -> hook denied the push (gate not consumed)
    outcome="PUSH_DENIED"
    echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') event=$outcome nonce=$NONCE exit_code=$push_exit detail=$detail" >> "$AUDIT_LOG"
    echo "publish-once: push denied by hook; gate not consumed" >&2
    echo "Gate state: not consumed. Generate a new gate to retry." >&2
    exit 1
fi

if [ "$push_exit" -eq 0 ]; then
    outcome="PUSH_SUCCEEDED"
    echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') event=$outcome nonce=$NONCE exit_code=0" >> "$AUDIT_LOG"
    echo "publish-once: push accepted by remote; mandatory verification is running..."
    # Release lock before running publication verifier
    rmdir "$STATE_LOCK" 2>/dev/null || true
    trap - 0 1 2 3 15
    # Run verify-publication.sh
    verify_script="$REPO_ROOT/$VERIFY_SCRIPT_DIR/verify-publication.sh"
    if [ ! -f "$verify_script" ] || [ -L "$verify_script" ] || [ ! -x "$verify_script" ]; then
        echo "publish-once: mandatory verifier is unavailable; publication outcome is unverified. Gate remains consumed; do not retry automatically." >&2
        exit 1
    fi

    set +e
    case "$OPERATION" in
        CREATE_ANNOTATED_TAG_EXACT_OBJECT)
            "$verify_script" --operation "$OPERATION" --destination-ref "$DESTINATION_REF" --expected-object "$SOURCE_OBJECT" --expected-peeled-object "$(git rev-parse "$SOURCE_OBJECT^{}" 2>/dev/null || echo '')" --remote-url "$REMOTE_URL"
            verify_exit=$?
            ;;
        CREATE_NON_PROTECTED_BRANCH_EXACT_OBJECT|UPDATE_NON_PROTECTED_BRANCH_FAST_FORWARD)
            "$verify_script" --operation "$OPERATION" --destination-ref "$DESTINATION_REF" --expected-object "$(git rev-parse "$SOURCE_REF^{commit}" 2>/dev/null || echo '')" --remote-url "$REMOTE_URL"
            verify_exit=$?
            ;;
        *)
            set -e
            deny "unknown operation"
            ;;
    esac
    set -e

    if [ "$verify_exit" -ne 0 ]; then
        echo "publish-once: mandatory verification failed; publication outcome is unverified. Gate remains consumed; do not retry automatically." >&2
        exit 1
    fi

    echo "publish-once: publication verified and completed successfully."
    exit 0
else
    outcome="PUSH_FAILED"
    echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') event=$outcome nonce=$NONCE exit_code=$push_exit detail=$detail" >> "$AUDIT_LOG"
    echo "publish-once: push failed (exit $push_exit)" >&2
    echo "Gate state: consumed. Generate a new gate to retry." >&2
    exit 1
fi
