#!/bin/sh
set -eu
set -f
LC_ALL=C

# Noor Personal publication-control v4 publication verifier.
# Post-push verification: confirms the remote ref matches the expected object,
# and for DELETE verifies the protected canonical ref is preserved exactly.
#
# Usage:
#   verify-publication.sh --operation <OPERATION> --destination-ref <REF>
#       [--expected-object <OBJECT>] [--expected-peeled-object <COMMIT>]
#       [--protected-ref <REF>] [--protected-canonical-object <OBJECT>]
#       [--remote-url <URL>]

usage() {
    echo "Usage: verify-publication.sh --operation <OPERATION> --destination-ref <REF> [--expected-object <OBJECT>] [--expected-peeled-object <COMMIT>] [--protected-ref <REF>] [--protected-canonical-object <OBJECT>] [--remote-url <URL>]" >&2
    exit 2
}

deny() {
    echo "verify-publication: denied: $1" >&2
    exit 1
}

# Fail-closed check for Git URL rewrite rules (insteadOf / pushInsteadOf).
# If any configured rewrite rule could match the canonical URL, deny immediately.
# Checks local, global, and system Git config.
check_canonical_url_rewrite() {
    if [ -n "${GIT_CONFIG_COUNT-}" ]; then
        _env_index=1
        while [ "$_env_index" -le "${GIT_CONFIG_COUNT}" ]; do
            _diag_index=$_env_index
            eval "__env_key=\${GIT_CONFIG_KEY_$_env_index-}"
            eval "__env_value=\${GIT_CONFIG_VALUE_$_env_index-}"
            _env_index=$((_env_index + 1))
            [ -n "${__env_key:-}" ] || continue
            __env_key_norm=$(printf '%s' "$__env_key" | tr '[:upper:]' '[:lower:]')
            case "$__env_key_norm" in
                url.*.insteadof|url.*.pushinsteadof)
                    case "$CANONICAL_URL" in
                        "$__env_value"*)
                            echo "PUBLICATION_CONTROL_URL_REWRITE_DETECTED" >&2
                            deny "Git URL rewrite [GIT_CONFIG_KEY_${_diag_index}] targets canonical URL: $__env_key=$__env_value"
                            ;;
                    esac
                    ;;
            esac
        done
    fi

    if [ -n "${GIT_CONFIG_PARAMETERS-}" ]; then
        for _param in ${GIT_CONFIG_PARAMETERS}; do
            case "$_param" in
                *=*)
                    _param_key=${_param%%=*}
                    _param_value=${_param#*=}
                    _param_key_norm=$(printf '%s' "$_param_key" | tr '[:upper:]' '[:lower:]')
                    case "$_param_key_norm" in
                        url.*.insteadof|url.*.pushinsteadof)
                            case "$CANONICAL_URL" in
                                "$_param_value"*)
                                    echo "PUBLICATION_CONTROL_URL_REWRITE_DETECTED" >&2
                                    deny "Git URL rewrite [GIT_CONFIG_PARAMETERS] targets canonical URL: $_param_key=$_param_value"
                                    ;;
                            esac
                            ;;
                    esac
                    ;;
            esac
        done
    fi

    for _scope_args in "" "--global" "--system"; do
        set +e
        _config_output=$(git config $_scope_args --get-regexp 'url\.' 2>/dev/null)
        _rc=$?
        set -e
        [ "$_rc" -ne 0 ] && continue
        [ -z "$_config_output" ] && continue
        while IFS= read -r _line; do
            [ -n "$_line" ] || continue
            _key=$(echo "$_line" | awk '{print $1}')
            _value=$(echo "$_line" | awk '{print $2}')
            _key_norm=$(printf '%s' "$_key" | tr '[:upper:]' '[:lower:]')
            case "$_key_norm" in
                url.*.insteadof|url.*.pushinsteadof)
                    case "$CANONICAL_URL" in
                        "$_value"*)
                            echo "PUBLICATION_CONTROL_URL_REWRITE_DETECTED" >&2
                            deny "Git URL rewrite [$_scope_args] targets canonical URL: $_key=$_value"
                            ;;
                    esac
                    ;;
            esac
        done <<EOF
$_config_output
EOF
    done
}

# Constants
CANONICAL_URL='https://github.com/engaboali9226-mastoura/work-tracker_OS.git'

DESTINATION_REF=''
EXPECTED_OBJECT=''
EXPECTED_PEELED_OBJECT=''
PROTECTED_REF='refs/heads/product/noor-personal-mvp'
PROTECTED_CANONICAL_OBJECT=''
OPERATION=''
REMOTE_URL="$CANONICAL_URL"
CHECK_MODE=0
CONFIRM=0

while [ "$#" -gt 0 ]; do
    case "$1" in
        --destination-ref)
            shift
            [ "$#" -gt 0 ] || usage
            DESTINATION_REF=$1
            ;;
        --operation)
            shift
            [ "$#" -gt 0 ] || usage
            OPERATION=$1
            ;;
        --expected-object)
            shift
            [ "$#" -gt 0 ] || usage
            EXPECTED_OBJECT=$1
            ;;
        --expected-peeled-object)
            shift
            [ "$#" -gt 0 ] || usage
            EXPECTED_PEELED_OBJECT=$1
            ;;
        --protected-ref)
            shift
            [ "$#" -gt 0 ] || usage
            PROTECTED_REF=$1
            ;;
        --protected-canonical-object)
            shift
            [ "$#" -gt 0 ] || usage
            PROTECTED_CANONICAL_OBJECT=$1
            ;;
        --remote-url)
            shift
            [ "$#" -gt 0 ] || usage
            REMOTE_URL=$1
            ;;
        --check)
            CHECK_MODE=1
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

if [ "$CHECK_MODE" -eq 1 ]; then
    [ "$CONFIRM" -eq 1 ] || deny "explicit --confirm required"
    echo "verify-publication: check mode accepted"
    exit 0
fi

[ -n "$DESTINATION_REF" ] || usage
[ -n "$OPERATION" ] || usage

# Validate inputs
git check-ref-format "$DESTINATION_REF" || deny "invalid destination ref"
if [ "$OPERATION" != "DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT" ]; then
    [ -n "$EXPECTED_OBJECT" ] || usage
    printf '%s' "$EXPECTED_OBJECT" | grep -Eq '^[0-9a-f]{40}$' || deny "invalid expected object"
fi

# Fail-closed: reject any Git URL rewrite rule that could redirect canonical URL
check_canonical_url_rewrite

case "$OPERATION" in
    CREATE_NON_PROTECTED_BRANCH_EXACT_OBJECT|UPDATE_NON_PROTECTED_BRANCH_FAST_FORWARD)
        case "$DESTINATION_REF" in refs/tags/*) deny "tag destination requires tag operation" ;; esac
        ;;
    CREATE_ANNOTATED_TAG_EXACT_OBJECT)
        case "$DESTINATION_REF" in refs/tags/*) ;; *) deny "tag operation destination is not a tag ref" ;; esac
        [ -n "$EXPECTED_OBJECT" ] || usage
        printf '%s' "$EXPECTED_PEELED_OBJECT" | grep -Eq '^[0-9a-f]{40}$' || deny "invalid expected peeled object"
        ;;
    DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT)
        case "$DESTINATION_REF" in refs/heads/*) ;; *) deny "delete operation destination is not a branch ref" ;; esac
        git check-ref-format "$PROTECTED_REF" || deny "invalid protected canonical ref"
        [ -n "$PROTECTED_CANONICAL_OBJECT" ] || deny "required protected canonical object missing"
        printf '%s' "$PROTECTED_CANONICAL_OBJECT" | grep -Eq '^[0-9a-f]{40}$' || deny "invalid protected canonical object"
        ;;
    *)
        deny "unknown operation"
        ;;
esac

# Verify remote state
set +e
remote_line=$(git ls-remote --refs -- "$REMOTE_URL" "$DESTINATION_REF" 2>/dev/null)
remote_rc=$?
set -e
[ "$remote_rc" -eq 0 ] || deny "remote verification failed"

case "$OPERATION" in
    CREATE_NON_PROTECTED_BRANCH_EXACT_OBJECT|UPDATE_NON_PROTECTED_BRANCH_FAST_FORWARD)
        [ -n "$remote_line" ] || deny "destination ref not found on remote"
        set -- $remote_line
        [ "$#" -eq 2 ] || deny "remote state malformed"
        [ "$1" = "$EXPECTED_OBJECT" ] || deny "remote object does not match expected"
        [ "$2" = "$DESTINATION_REF" ] || deny "remote ref does not match expected"
        ;;
    CREATE_ANNOTATED_TAG_EXACT_OBJECT)
        [ -n "$remote_line" ] || deny "destination ref not found on remote"
        set -- $remote_line
        [ "$#" -eq 2 ] || deny "remote state malformed"
        [ "$1" = "$EXPECTED_OBJECT" ] || deny "remote object does not match expected"
        [ "$2" = "$DESTINATION_REF" ] || deny "remote ref does not match expected"
        set +e
        peeled_line=$(git ls-remote -- "$REMOTE_URL" "$DESTINATION_REF^{}" 2>/dev/null)
        peeled_rc=$?
        set -e
        [ "$peeled_rc" -eq 0 ] || deny "remote peeled verification failed"
        [ -n "$peeled_line" ] || deny "remote peeled tag ref not found"
        set -- $peeled_line
        [ "$#" -eq 2 ] || deny "remote peeled state malformed"
        [ "$1" = "$EXPECTED_PEELED_OBJECT" ] || deny "remote peeled object does not match expected"
        [ "$2" = "$DESTINATION_REF^{}" ] || deny "remote peeled ref does not match expected"
        ;;
    DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT)
        [ -z "$remote_line" ] || deny "destination ref still exists on remote after deletion"
        set +e
        protected_line=$(git ls-remote --refs -- "$REMOTE_URL" "$PROTECTED_REF" 2>/dev/null)
        protected_rc=$?
        set -e
        [ "$protected_rc" -eq 0 ] || deny "remote protected canonical verification failed"
        [ -n "$protected_line" ] || deny "protected canonical ref not found on remote"
        set -- $protected_line
        [ "$#" -eq 2 ] || deny "protected remote state malformed"
        [ "$1" = "$PROTECTED_CANONICAL_OBJECT" ] || deny "protected canonical ref changed after delete authorization"
        [ "$2" = "$PROTECTED_REF" ] || deny "protected canonical ref does not match expected"
        ;;
esac

echo "verify-publication: publication verified ($DESTINATION_REF)"
exit 0
