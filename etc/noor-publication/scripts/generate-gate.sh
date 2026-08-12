#!/bin/sh
set -eu
set -f
LC_ALL=C

# Noor Personal publication-control v3 gate generator.
# Creates a single-use active.gate for an authorized publication.
#
# Usage:
#   generate-gate.sh --operation CREATE|UPDATE --source-ref <REF> \
#       --source-object <COMMIT> --destination-ref <REF> \
#       --required-remote-object <OBJECT> [--authority-id <ID>] \
#       [--nonce <NONCE>] [--ttl <SECONDS>] [--expires-at <EPOCH>] [--dry-run]

usage() {
    echo "Usage: generate-gate.sh --operation CREATE|UPDATE --source-ref <REF> --source-object <COMMIT> --destination-ref <REF> --required-remote-object <OBJECT> [--authority-id <ID>] [--nonce <NONCE>] [--ttl <SECONDS>] [--expires-at <EPOCH>] [--dry-run]" >&2
    exit 2
}

deny() {
    echo "generate-gate: denied: $1" >&2
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
ZERO_OBJECT='0000000000000000000000000000000000000000'
GATE_DIR_NAME='noor-publication-gate'
STATE_LOCK_NAME='state.lock'
ACTIVE_GATE_NAME='active.gate'
CONSUMED_DIR_NAME='consumed'
REVOKED_DIR_NAME='revoked'
BACKUP_DIR_NAME='backups'
AUDIT_LOG_NAME='audit.log'
SENTINEL_URL='no_push://noor-personal-dev'

# Parse arguments
OPERATION=''
SOURCE_REF=''
SOURCE_OBJECT=''
DESTINATION_REF=''
REQUIRED_REMOTE_OBJECT=''
AUTHORITY_ID='NONE'
NONCE=''
TTL=3600
EXPIRES_AT=''
DRY_RUN=0

while [ "$#" -gt 0 ]; do
    case "$1" in
        --operation)
            shift
            [ "$#" -gt 0 ] || usage
            OPERATION=$1
            ;;
        --source-ref)
            shift
            [ "$#" -gt 0 ] || usage
            SOURCE_REF=$1
            ;;
        --source-object)
            shift
            [ "$#" -gt 0 ] || usage
            SOURCE_OBJECT=$1
            ;;
        --destination-ref)
            shift
            [ "$#" -gt 0 ] || usage
            DESTINATION_REF=$1
            ;;
        --required-remote-object)
            shift
            [ "$#" -gt 0 ] || usage
            REQUIRED_REMOTE_OBJECT=$1
            ;;
        --authority-id)
            shift
            [ "$#" -gt 0 ] || usage
            AUTHORITY_ID=$1
            ;;
        --nonce)
            shift
            [ "$#" -gt 0 ] || usage
            NONCE=$1
            ;;
        --ttl)
            shift
            [ "$#" -gt 0 ] || usage
            TTL=$1
            ;;
        --expires-at)
            shift
            [ "$#" -gt 0 ] || usage
            EXPIRES_AT=$1
            ;;
        --dry-run)
            DRY_RUN=1
            ;;
        *)
            usage
            ;;
    esac
    shift
done

# Validate required arguments
[ -n "$OPERATION" ] || usage
[ -n "$SOURCE_REF" ] || usage
[ -n "$SOURCE_OBJECT" ] || usage
[ -n "$DESTINATION_REF" ] || usage
[ -n "$REQUIRED_REMOTE_OBJECT" ] || usage

# Validate operation
[ "$OPERATION" = "CREATE_NON_PROTECTED_BRANCH_EXACT_OBJECT" ] || \
[ "$OPERATION" = "UPDATE_NON_PROTECTED_BRANCH_FAST_FORWARD" ] || \
[ "$OPERATION" = "CREATE_ANNOTATED_TAG_EXACT_OBJECT" ] || \
    deny "unsupported operation: $OPERATION"

# Validate source ref
git check-ref-format "$SOURCE_REF" || deny "invalid source ref"

# Validate source object format
printf '%s' "$SOURCE_OBJECT" | grep -Eq '^[0-9a-f]{40}$' || deny "invalid source object"

# Validate destination ref. Operation-specific namespace checks follow.
git check-ref-format "$DESTINATION_REF" || deny "invalid destination ref"

# Validate required remote object format
printf '%s' "$REQUIRED_REMOTE_OBJECT" | grep -Eq '^[0-9a-f]{40}$' || deny "invalid required remote object"

# Validate operation-specific invariants
if [ "$OPERATION" = "CREATE_NON_PROTECTED_BRANCH_EXACT_OBJECT" ]; then
    [ "$REQUIRED_REMOTE_OBJECT" = "$ZERO_OBJECT" ] ||
        deny "CREATE requires REQUIRED_REMOTE_OBJECT to be zero"
elif [ "$OPERATION" = "UPDATE_NON_PROTECTED_BRANCH_FAST_FORWARD" ]; then
    [ "$REQUIRED_REMOTE_OBJECT" != "$ZERO_OBJECT" ] ||
        deny "UPDATE requires REQUIRED_REMOTE_OBJECT to be non-zero"
else
    [ "$REQUIRED_REMOTE_OBJECT" = "$ZERO_OBJECT" ] ||
        deny "tag CREATE requires REQUIRED_REMOTE_OBJECT to be zero"
fi

# Validate authority ID
printf '%s' "$AUTHORITY_ID" | grep -Eq '^[A-Z0-9][A-Z0-9._-]{0,126}$' ||
    deny "invalid authority ID"

# Generate nonce if not provided
if [ -z "$NONCE" ]; then
    NONCE=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
fi
printf '%s' "$NONCE" | grep -Eq '^[0-9a-f]{32}$' || deny "invalid nonce"

# Resolve git paths
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || deny "not a git repository"
COMMON_DIR=$(git rev-parse --git-common-dir 2>/dev/null) || deny "common dir unavailable"
case "$COMMON_DIR" in
    /*) ;;
    *) COMMON_DIR=$REPO_ROOT/$COMMON_DIR ;;
esac
COMMON_DIR=$(cd "$COMMON_DIR" 2>/dev/null && pwd -P) || deny "cannot canonicalize common dir"

GATE_DIR=$COMMON_DIR/$GATE_DIR_NAME
CONSUMED_DIR=$GATE_DIR/$CONSUMED_DIR_NAME
REVOKED_DIR=$GATE_DIR/$REVOKED_DIR_NAME
BACKUP_DIR=$GATE_DIR/$BACKUP_DIR_NAME
STATE_LOCK=$GATE_DIR/$STATE_LOCK_NAME
ACTIVE_GATE=$GATE_DIR/$ACTIVE_GATE_NAME
AUDIT_LOG=$GATE_DIR/$AUDIT_LOG_NAME

# Ensure runtime directories exist
mkdir -p "$GATE_DIR" "$CONSUMED_DIR" "$REVOKED_DIR" "$BACKUP_DIR"
chmod 0700 "$GATE_DIR" "$CONSUMED_DIR" "$REVOKED_DIR" "$BACKUP_DIR"

# Acquire common state lock
if ! mkdir "$STATE_LOCK" 2>/dev/null; then
    deny "state lock is held; a concurrent operation is in progress or a previous lock was not recovered"
fi
trap 'rmdir "$STATE_LOCK" 2>/dev/null || true' 0 1 2 3 15

# No-overwrite activation check
[ ! -e "$ACTIVE_GATE" ] && [ ! -L "$ACTIVE_GATE" ] ||
    deny "active gate already present"

# Compute timestamps
now=$(date -u '+%s')
now_10=$(printf '%s' "$now" | grep -Eq '^[0-9]{10}$' && printf '%s' "$now" || printf '0000000000')

if [ -n "$EXPIRES_AT" ]; then
    printf '%s' "$EXPIRES_AT" | grep -Eq '^[0-9]{10}$' || deny "invalid expires-at"
    expires=$EXPIRES_AT
    ttl_calc=$((expires - now_10))
    [ "$ttl_calc" -ge 1 ] || deny "expires-at is in the past"
    [ "$ttl_calc" -le 86400 ] || deny "TTL exceeds maximum"
else
    [ "$TTL" -ge 1 ] || deny "TTL too short"
    [ "$TTL" -le 86400 ] || deny "TTL exceeds maximum"
    expires=$((now_10 + TTL))
fi

# Validate operation-specific source, destination, and object invariants.
case "$OPERATION" in
    CREATE_NON_PROTECTED_BRANCH_EXACT_OBJECT|UPDATE_NON_PROTECTED_BRANCH_FAST_FORWARD)
        case "$SOURCE_REF" in refs/heads/*) ;; *) deny "branch operation source is not a branch ref" ;; esac
        _suffix=$(printf '%s' "$DESTINATION_REF" | sed 's|^refs/heads/pub/||')
        printf '%s' "$_suffix" | grep -Eq '^[0-9a-f]{12}$' || deny "destination not in pub namespace"
        git cat-file -e "$SOURCE_OBJECT^{commit}" 2>/dev/null || deny "source object is not a commit"
        resolved_src=$(git rev-parse "$SOURCE_REF^{commit}" 2>/dev/null) || deny "source ref unavailable"
        [ "$resolved_src" = "$SOURCE_OBJECT" ] || deny "source ref does not resolve to source object"
        if [ "$OPERATION" = "CREATE_NON_PROTECTED_BRANCH_EXACT_OBJECT" ]; then
            expected_suffix=$(printf '%s' "$SOURCE_OBJECT" | cut -c1-12)
            [ "$_suffix" = "$expected_suffix" ] || deny "destination suffix does not match source object"
        fi
        ;;
    CREATE_ANNOTATED_TAG_EXACT_OBJECT)
        case "$SOURCE_REF" in refs/tags/*) ;; *) deny "tag operation source is not a tag ref" ;; esac
        case "$DESTINATION_REF" in refs/tags/*) ;; *) deny "tag operation destination is not a tag ref" ;; esac
        [ "$SOURCE_REF" = "$DESTINATION_REF" ] || deny "tag source and destination differ"
        [ "$(git cat-file -t "$SOURCE_OBJECT" 2>/dev/null || true)" = "tag" ] ||
            deny "source object is not an annotated tag"
        resolved_src=$(git rev-parse --verify "$SOURCE_REF" 2>/dev/null) || deny "source ref unavailable"
        [ "$resolved_src" = "$SOURCE_OBJECT" ] || deny "source ref does not directly resolve to source object"
        tag_target=$(git cat-file -p "$SOURCE_OBJECT" | sed -n '1s/^object //p')
        printf '%s' "$tag_target" | grep -Eq '^[0-9a-f]{40}$' || deny "annotated tag target is invalid"
        [ "$(git cat-file -t "$tag_target" 2>/dev/null || true)" = "commit" ] ||
            deny "annotated tag must directly target a commit"
        peeled_target=$(git rev-parse "$SOURCE_OBJECT^{}" 2>/dev/null) || deny "annotated tag cannot be peeled"
        [ "$peeled_target" = "$tag_target" ] || deny "annotated tag peel does not match direct target"
        ;;
esac

# Build the gate file (lines 1-13 first)
TMP_GATE="$GATE_DIR/.gate.tmp.$$"

cat > "$TMP_GATE" <<EOF
SCHEMA_VERSION=2
REPOSITORY_URL=$CANONICAL_URL
SOURCE_REF=$SOURCE_REF
SOURCE_OBJECT=$SOURCE_OBJECT
DESTINATION_REF=$DESTINATION_REF
REQUIRED_REMOTE_OBJECT=$REQUIRED_REMOTE_OBJECT
UPDATE_COUNT=1
OPERATION=$OPERATION
CREATED_AT=$now_10
EXPIRES_AT=$expires
NONCE=$NONCE
AUTHORITY_ID=$AUTHORITY_ID
HOOK_POLICY_VERSION=3
EOF

# Compute GATE_FILE_SHA256 = sha256(lines 1-13)
gate_sha=$(compute_sha256 "$TMP_GATE")

# Append line 14
echo "GATE_FILE_SHA256=$gate_sha" >> "$TMP_GATE"

# Validate the generated gate: 14 lines, final LF, no invalid chars
lc=$(wc -l < "$TMP_GATE" | tr -d ' ')
[ "$lc" -eq 14 ] || deny "generated gate line count invalid"

fb=$(tail -c 1 "$TMP_GATE" | od -An -t x1 | tr -d ' \n')
[ "$fb" = "0a" ] || deny "generated gate final LF missing"

if LC_ALL=C grep -q '[^ -~]' "$TMP_GATE"; then
    deny "generated gate contains invalid control characters"
fi

# Activate the gate
if [ "$DRY_RUN" -eq 0 ]; then
    mv "$TMP_GATE" "$ACTIVE_GATE"
    chmod 0600 "$ACTIVE_GATE"

    # Verify activation
    [ -f "$ACTIVE_GATE" ] && [ ! -L "$ACTIVE_GATE" ] || deny "gate activation failed"
    [ "$(stat -f '%u' "$ACTIVE_GATE")" = "$(id -u)" ] || deny "gate owner invalid"
    [ "$(stat -f '%Lp' "$ACTIVE_GATE")" = 600 ] || deny "gate mode invalid"
    [ "$(stat -f '%l' "$ACTIVE_GATE")" = 1 ] || deny "gate link count invalid"

    # Verify the actual gate SHA matches (defense in depth)
    actual_sha=$(compute_sha256 "$ACTIVE_GATE")
    expected_sha=$(head -13 "$ACTIVE_GATE" | compute_sha256)
    # Gate file SHA includes line 14; the GATE_FILE_SHA256 field is lines 1-13
    # The full file hash is not constrained by design
    gate_line14=$(sed -n '14p' "$ACTIVE_GATE")
    line14_sha=$(printf '%s' "$gate_line14" | sed 's|^GATE_FILE_SHA256=||')
    [ "$expected_sha" = "$line14_sha" ] || deny "gate integrity check failed after activation"

    echo "generate-gate: active.gate created successfully (nonce=$NONCE)"
else
    rm -f "$TMP_GATE"
    echo "generate-gate: dry-run; gate not activated"
fi

exit 0
