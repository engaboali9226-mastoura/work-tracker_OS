#!/bin/sh
set -eu
set -f
LC_ALL=C

# Noor Personal publication-control v2 gate revoker and lock recoverer.
# Moves active or expired gates to revoked/. Recovers stale state.lock
# (requires --confirm).
#
# Usage:
#   revoke-gate.sh --nonce <NONCE> --confirm
#   revoke-gate.sh --expired --confirm
#   revoke-gate.sh --recover-lock --confirm

usage() {
    echo "Usage: revoke-gate.sh --nonce <NONCE> --confirm" >&2
    echo "       revoke-gate.sh --expired --confirm" >&2
    echo "       revoke-gate.sh --recover-lock --confirm" >&2
    exit 2
}

deny() {
    echo "revoke-gate: denied: $1" >&2
    exit 1
}

# Constants
GATE_DIR_NAME='noor-publication-gate'
STATE_LOCK_NAME='state.lock'
ACTIVE_GATE_NAME='active.gate'
REVOKED_DIR_NAME='revoked'
AUDIT_LOG_NAME='audit.log'

MODE=''
NONCE=''
CONFIRM=0

while [ "$#" -gt 0 ]; do
    case "$1" in
        --nonce)
            shift
            [ "$#" -gt 0 ] || usage
            MODE='nonce'
            NONCE=$1
            ;;
        --expired)
            MODE='expired'
            ;;
        --recover-lock)
            MODE='recover-lock'
            ;;
        --confirm)
            CONFIRM=1
            ;;
        *)
            usage
            ;;
    esac
    shift
done

[ -n "$MODE" ] || usage
[ "$CONFIRM" -eq 1 ] || deny "explicit --confirm required"

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
REVOKED_DIR=$GATE_DIR/$REVOKED_DIR_NAME
AUDIT_LOG=$GATE_DIR/$AUDIT_LOG_NAME

# Ensure runtime directories exist
mkdir -p "$GATE_DIR" "$REVOKED_DIR"
chmod 0700 "$GATE_DIR" "$REVOKED_DIR"

case "$MODE" in
    recover-lock)
        # Lock recovery is a distinct, explicitly authorized operation.
        # Verify the lock directory exists
        [ -d "$STATE_LOCK" ] && [ ! -L "$STATE_LOCK" ] ||
            deny "state.lock does not exist; nothing to recover"

        # Best-effort check: no active process should hold the lock
        active_procs=$(pgrep -f 'pre-push|generate-gate|publish-once|revoke-gate' 2>/dev/null || true)
        if [ -n "$active_procs" ]; then
            deny "lock appears active (processes: $active_procs)"
        fi

        # Remove the lock with rmdir (fails if not empty)
        if ! rmdir "$STATE_LOCK" 2>/dev/null; then
            deny "lock directory is not empty; manual intervention required"
        fi

        echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') event=LOCK_RECOVERED" >> "$AUDIT_LOG" 2>/dev/null || true
        chmod 0600 "$AUDIT_LOG" 2>/dev/null || true
        echo "revoke-gate: state.lock recovered"
        exit 0
        ;;

    nonce)
        # Validate nonce format
        printf '%s' "$NONCE" | grep -Eq '^[0-9a-f]{32}$' || deny "invalid nonce"

        # Acquire the common lock
        if ! mkdir "$STATE_LOCK" 2>/dev/null; then
            deny "state lock is held; a concurrent operation is in progress or a previous lock was not recovered"
        fi
        trap 'rmdir "$STATE_LOCK" 2>/dev/null || true' 0 1 2 3 15

        # active.gate must exist and its NONCE must match
        [ -f "$ACTIVE_GATE" ] && [ ! -L "$ACTIVE_GATE" ] ||
            deny "active.gate is unavailable"

        gate_nonce=$(sed -n '11p' "$ACTIVE_GATE" | sed 's|^NONCE=||')
        [ "$gate_nonce" = "$NONCE" ] ||
            deny "active.gate nonce does not match requested nonce"

        # Move to revoked/ without overwrite
        revoked_path="$REVOKED_DIR/$NONCE.gate"
        [ ! -e "$revoked_path" ] && [ ! -L "$revoked_path" ] ||
            deny "revoked gate already exists"

        mv "$ACTIVE_GATE" "$revoked_path" || deny "revocation failed"
        chmod 0600 "$revoked_path"

        echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') event=GATE_REVOKED nonce=$NONCE authority=$(sed -n '12p' "$revoked_path" | sed 's|^AUTHORITY_ID=||') reason=operator" >> "$AUDIT_LOG" 2>/dev/null || true
        chmod 0600 "$AUDIT_LOG" 2>/dev/null || true
        echo "revoke-gate: gate revoked to $revoked_path"
        exit 0
        ;;

    expired)
        # Acquire the common lock
        if ! mkdir "$STATE_LOCK" 2>/dev/null; then
            deny "state lock is held; a concurrent operation is in progress or a previous lock was not recovered"
        fi
        trap 'rmdir "$STATE_LOCK" 2>/dev/null || true' 0 1 2 3 15

        # active.gate must exist
        [ -f "$ACTIVE_GATE" ] && [ ! -L "$ACTIVE_GATE" ] ||
            deny "active.gate is unavailable"

        # Read nonce and expiration
        gate_nonce=$(sed -n '11p' "$ACTIVE_GATE" | sed 's|^NONCE=||')
        expires_at=$(sed -n '10p' "$ACTIVE_GATE" | sed 's|^EXPIRES_AT=||')

        now=$(date -u '+%s')
        now_10=$(printf '%s' "$now" | grep -Eq '^[0-9]{10}$' && printf '%s' "$now" || printf '0000000000')

        # Only revoke if the gate is expired
        [ "$now_10" -ge "$expires_at" ] || deny "gate is not yet expired"

        # Move to revoked/ without overwrite
        revoked_path="$REVOKED_DIR/$gate_nonce.gate"
        [ ! -e "$revoked_path" ] && [ ! -L "$revoked_path" ] ||
            deny "revoked gate already exists"

        mv "$ACTIVE_GATE" "$revoked_path" || deny "revocation failed"
        chmod 0600 "$revoked_path"

        echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') event=GATE_REVOKED_EXPIRED nonce=$gate_nonce authority=$(sed -n '12p' "$revoked_path" | sed 's|^AUTHORITY_ID=||') reason=expired" >> "$AUDIT_LOG" 2>/dev/null || true
        chmod 0600 "$AUDIT_LOG" 2>/dev/null || true
        echo "revoke-gate: expired gate revoked to $revoked_path"
        exit 0
        ;;

    *)
        usage
        ;;
esac
