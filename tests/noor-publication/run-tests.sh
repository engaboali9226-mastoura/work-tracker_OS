#!/bin/sh
set -eu
set -f
LC_ALL=C

# Noor Personal publication-control v2 acceptance-test runner.
# Runs the complete T01-T29 matrix against task-created temporary
# repositories and mock remotes under /tmp.
#
# Usage:
#   run-tests.sh

# Source common helpers
. "$(dirname "$0")/common.sh"

# Source test bodies
. "$(dirname "$0")/test-body-basic.sh"
. "$(dirname "$0")/test-body-rejections.sh"
. "$(dirname "$0")/test-body-lifecycle.sh"

# Run all tests
test_t01
test_t02
test_t03
test_t04
test_t05
test_t06
test_t07
test_t08
test_t09
test_t10
test_t11
test_t12
test_t13
test_t14
test_t15
test_t16
test_t17
test_t18
test_t19
test_t20
test_t21
test_t22
test_t23
test_t24
test_t25
test_t26
test_t27
test_t28
test_t29

# Final summary
echo ""
echo "=============================================="
echo "Test suite final summary"
echo "=============================================="
echo "Total tests: $TOTAL_TEST_COUNT"
echo "Passed: $PASS_COUNT"
echo "Failed: $FAIL_COUNT"

if [ "$FAIL_COUNT" -eq 0 ] && [ "$TOTAL_TEST_COUNT" -eq 29 ]; then
    echo "Passed: 29"
    echo "Failed: 0"
    echo "ALL TESTS PASSED"
    teardown_all
    exit 0
else
    echo "TESTS FAILED"
    teardown_all
    exit 1
fi
