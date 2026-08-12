#!/bin/sh
set -eu
set -f
LC_ALL=C

# Noor Personal Publication Control — Gate Schema v2 / Hook Policy v3 hook installer.
# Installs the canonical pre-push hook from an exact reviewed commit.
#
# Modes:
#   install-hook.sh --from-commit <COMMIT> [--dry-run]
#       Extract hook from <COMMIT>:etc/noor-publication/pre-push.noor-policy-hook
#       and install it as .git/hooks/pre-push (backing up any existing hook
#       without overwrite). Requires --confirm and APPROVED_HOOK_SHA256.
#   install-hook.sh --check
#       Verify the installed hook matches the canonical template.
#   install-hook.sh --restore [--dry-run]
#       Restore the backup hook from the most recent backup.
#
# The installer never writes to .git/config.

usage() {
    echo "Usage: install-hook.sh --from-commit <COMMIT> [--confirm] [--dry-run]" >&2
    echo "       install-hook.sh --check" >&2
    echo "       install-hook.sh --restore [--confirm] [--dry-run]" >&2
    exit 2
}

deny() {
    echo "install-hook: denied: $1" >&2
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
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
SOURCE_REPOSITORY=''
CANONICAL_HOOK_PATH='etc/noor-publication/pre-push.noor-policy-hook'
SENTINEL_URL='no_push://noor-personal-dev'
GATE_DIR_NAME='noor-publication-gate'
BACKUP_DIR_NAME='backups'

resolve_source_repository() {
    candidate=$SCRIPT_DIR
    while [ "$candidate" != '/' ]; do
        if [ -d "$candidate/.git" ]; then
            SOURCE_REPOSITORY=$(CDPATH= cd -- "$candidate" && pwd -P)
            return 0
        fi
        candidate=$(CDPATH= cd -- "$candidate/.." && pwd -P) || return 1
    done
    return 1
}

# Parse arguments
MODE=''
FROM_COMMIT=''
CONFIRM=0
DRY_RUN=0

while [ "$#" -gt 0 ]; do
    case "$1" in
        --from-commit)
            MODE='from-commit'
            shift
            [ "$#" -gt 0 ] || usage
            FROM_COMMIT=$1
            ;;
        --check)
            MODE='check'
            ;;
        --restore)
            MODE='restore'
            ;;
        --confirm)
            CONFIRM=1
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

[ -n "$MODE" ] || usage

resolve_source_repository || deny "cannot resolve source repository"

# Resolve git paths
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || deny "not a git repository"
COMMON_DIR=$(git rev-parse --git-common-dir 2>/dev/null) || deny "common dir unavailable"
case "$COMMON_DIR" in
    /*) ;;
    *) COMMON_DIR=$REPO_ROOT/$COMMON_DIR ;;
esac
COMMON_DIR=$(cd "$COMMON_DIR" 2>/dev/null && pwd -P) || deny "cannot canonicalize common dir"

GATE_DIR=$COMMON_DIR/$GATE_DIR_NAME
BACKUP_DIR=$GATE_DIR/$BACKUP_DIR_NAME
HOOK_PATH=$COMMON_DIR/hooks/pre-push

# Ensure runtime directories exist (bootstrap)
mkdir -p "$GATE_DIR" "$BACKUP_DIR"
chmod 0700 "$GATE_DIR" "$BACKUP_DIR"

# Verify persistent push URL sentinel is intact
current_pushurl=$(git config --get remote.origin.pushurl 2>/dev/null || git config --get remote.origin.url 2>/dev/null)
[ "$current_pushurl" = "$SENTINEL_URL" ] ||
    deny "persistent push URL must remain no_push://noor-personal-dev"

case "$MODE" in
    from-commit)
        [ "$CONFIRM" -eq 1 ] || deny "explicit --confirm required"
        [ -n "${APPROVED_HOOK_SHA256-}" ] ||
            deny "APPROVED_HOOK_SHA256 environment variable is required"

        printf '%s\n' "$FROM_COMMIT" | grep -Eq '^[0-9a-f]{40}$' ||
            deny "approved implementation commit must be a full 40-character lowercase hexadecimal object ID"

        git -C "$SOURCE_REPOSITORY" cat-file -e "$FROM_COMMIT^{commit}" 2>/dev/null ||
            deny "approved implementation commit is not a valid commit"

        object_type=$(git -C "$SOURCE_REPOSITORY" cat-file -t "$FROM_COMMIT" 2>/dev/null || true)
        [ "$object_type" = "commit" ] || deny "approved implementation commit is not a commit"

        if ! git -C "$SOURCE_REPOSITORY" diff --quiet -- etc/noor-publication docs/noor/personal-publication-control.md tests/noor-publication; then
            deny "tracked publication-control artifacts are dirty in source repository"
        fi

        if ! git -C "$SOURCE_REPOSITORY" diff --cached --quiet -- etc/noor-publication docs/noor/personal-publication-control.md tests/noor-publication; then
            deny "tracked publication-control artifacts are staged as dirty in source repository"
        fi

        TMP_HOOK=$(mktemp "$GATE_DIR/.hook.tmp.XXXXXX") || deny "unable to create temporary hook file"
        chmod 0600 "$TMP_HOOK"
        if ! git -C "$SOURCE_REPOSITORY" show "$FROM_COMMIT:$CANONICAL_HOOK_PATH" > "$TMP_HOOK" 2>/dev/null; then
            rm -f "$TMP_HOOK"
            deny "cannot extract canonical hook from approved commit"
        fi

        extracted_sha=$(compute_sha256 "$TMP_HOOK")
        [ "$extracted_sha" = "$APPROVED_HOOK_SHA256" ] || {
            rm -f "$TMP_HOOK"
            deny "extracted hook does not match approval record"
        }

        head -c 2 "$TMP_HOOK" | od -An -t c | grep -q '  #' || {
            rm -f "$TMP_HOOK"
            deny "extracted hook is missing shebang"
        }
        head -n 1 "$TMP_HOOK" | grep -q '^#!.*sh' || {
            rm -f "$TMP_HOOK"
            deny "extracted hook shebang is not sh"
        }

        expected_sha=$extracted_sha

        if [ -f "$HOOK_PATH" ] && [ ! -L "$HOOK_PATH" ]; then
            existing_sha=$(compute_sha256 "$HOOK_PATH" 2>/dev/null || echo "")
            if [ "$existing_sha" = "$expected_sha" ]; then
                rm -f "$TMP_HOOK"
                echo "install-hook: hook already matches canonical; nothing to do"
                exit 0
            fi
        fi

        if [ -f "$HOOK_PATH" ] && [ ! -L "$HOOK_PATH" ]; then
            existing_sha=$(compute_sha256 "$HOOK_PATH" 2>/dev/null || echo "")
            if [ -n "$existing_sha" ]; then
                backup="$BACKUP_DIR/pre-push.$existing_sha"
                if [ ! -e "$backup" ] && [ ! -L "$backup" ]; then
                    if [ "$DRY_RUN" -eq 0 ]; then
                        cp "$HOOK_PATH" "$backup"
                        chmod 0600 "$backup"
                    fi
                    echo "install-hook: backed up existing hook to $backup"
                fi
            fi
        fi

        if [ "$DRY_RUN" -eq 0 ]; then
            mv "$TMP_HOOK" "$HOOK_PATH"
            chmod 0755 "$HOOK_PATH"
        else
            rm -f "$TMP_HOOK"
        fi

        if [ "$DRY_RUN" -eq 0 ]; then
            installed_sha=$(compute_sha256 "$HOOK_PATH")
            [ "$installed_sha" = "$expected_sha" ] ||
                deny "installed hook does not match canonical"
        fi

        echo "install-hook: hook installed successfully from commit $FROM_COMMIT"
        exit 0
        ;;

    check)
        if ! git -C "$SOURCE_REPOSITORY" diff --quiet -- etc/noor-publication docs/noor/personal-publication-control.md tests/noor-publication; then
            deny "tracked publication-control artifacts are dirty in source repository"
        fi

        if ! git -C "$SOURCE_REPOSITORY" diff --cached --quiet -- etc/noor-publication docs/noor/personal-publication-control.md tests/noor-publication; then
            deny "tracked publication-control artifacts are staged as dirty in source repository"
        fi

        TMP_HOOK="$GATE_DIR/.hook.check.$$"
        git -C "$SOURCE_REPOSITORY" show "HEAD:$CANONICAL_HOOK_PATH" > "$TMP_HOOK" 2>/dev/null ||
            deny "cannot read canonical hook from HEAD"

        canonical_sha=$(compute_sha256 "$TMP_HOOK")
        rm -f "$TMP_HOOK"

        if [ -f "$HOOK_PATH" ] && [ ! -L "$HOOK_PATH" ]; then
            installed_sha=$(compute_sha256 "$HOOK_PATH")
        else
            deny "no pre-push hook installed"
        fi

        if [ "$installed_sha" = "$canonical_sha" ]; then
            echo "install-hook: hook hash matches canonical"
            exit 0
        else
            deny "hook hash drift detected; run install-hook.sh --restore"
        fi
        ;;

    restore)
        [ "$CONFIRM" -eq 1 ] || deny "explicit --confirm required"

        # Find the most recent backup
        latest=''
        for f in "$BACKUP_DIR"/pre-push.*; do
            [ -f "$f" ] && [ ! -L "$f" ] || continue
            latest=$f
        done
        [ -n "$latest" ] || deny "no backup hook available to restore"

        echo "install-hook: restoring from $latest"
        if [ "$DRY_RUN" -eq 0 ]; then
            chmod 0755 "$latest"
            cp "$latest" "$HOOK_PATH"
            chmod 0755 "$HOOK_PATH"
        fi
        echo "install-hook: restore complete"
        exit 0
        ;;

    *)
        usage
        ;;
esac
