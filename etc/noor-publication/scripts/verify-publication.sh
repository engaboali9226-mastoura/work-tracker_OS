#!/bin/sh
set -eu
set -f
LC_ALL=C

# Noor Personal publication-control v3 publication verifier.
# Post-push verification: confirms the remote ref matches the expected object.
#
# Usage:
#   verify-publication.sh --operation <OPERATION> --destination-ref <REF> --expected-object <OBJECT>
#       [--expected-peeled-object <COMMIT>]
#       [--remote-url <URL>]

usage() {
    echo "Usage: verify-publication.sh --operation <OPERATION> --destination-ref <REF> --expected-object <OBJECT> [--expected-peeled-object <COMMIT>] [--remote-url <URL>]" >&2
    exit 2
}

deny() {
    echo "verify-publication: denied: $1" >&2
    exit 1
}

# Constants
CANONICAL_URL='https://github.com/engaboali9226-mastoura/work-tracker_OS.git'

DESTINATION_REF=''
EXPECTED_OBJECT=''
EXPECTED_PEELED_OBJECT=''
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
[ -n "$EXPECTED_OBJECT" ] || usage
[ -n "$OPERATION" ] || usage

# Validate inputs
git check-ref-format "$DESTINATION_REF" || deny "invalid destination ref"
printf '%s' "$EXPECTED_OBJECT" | grep -Eq '^[0-9a-f]{40}$' || deny "invalid expected object"

case "$OPERATION" in
    CREATE_NON_PROTECTED_BRANCH_EXACT_OBJECT|UPDATE_NON_PROTECTED_BRANCH_FAST_FORWARD)
        case "$DESTINATION_REF" in refs/tags/*) deny "tag destination requires tag operation" ;; esac
        ;;
    CREATE_ANNOTATED_TAG_EXACT_OBJECT)
        case "$DESTINATION_REF" in refs/tags/*) ;; *) deny "tag operation destination is not a tag ref" ;; esac
        printf '%s' "$EXPECTED_PEELED_OBJECT" | grep -Eq '^[0-9a-f]{40}$' || deny "invalid expected peeled object"
        ;;
    *)
        deny "unknown operation"
        ;;
esac

# Verify remote state
remote_line=$(git ls-remote --refs -- "$REMOTE_URL" "$DESTINATION_REF" 2>/dev/null || deny "remote verification failed")

[ -n "$remote_line" ] || deny "destination ref not found on remote"

set -- $remote_line
[ "$#" -eq 2 ] || deny "remote state malformed"
[ "$1" = "$EXPECTED_OBJECT" ] || deny "remote object does not match expected"
[ "$2" = "$DESTINATION_REF" ] || deny "remote ref does not match expected"

if [ "$OPERATION" = "CREATE_ANNOTATED_TAG_EXACT_OBJECT" ]; then
    peeled_line=$(git ls-remote -- "$REMOTE_URL" "$DESTINATION_REF^{}" 2>/dev/null || deny "remote peeled verification failed")
    [ -n "$peeled_line" ] || deny "remote peeled tag ref not found"
    set -- $peeled_line
    [ "$#" -eq 2 ] || deny "remote peeled state malformed"
    [ "$1" = "$EXPECTED_PEELED_OBJECT" ] || deny "remote peeled object does not match expected"
    [ "$2" = "$DESTINATION_REF^{}" ] || deny "remote peeled ref does not match expected"
fi

echo "verify-publication: publication verified ($DESTINATION_REF = $EXPECTED_OBJECT)"
exit 0
