#!/bin/sh
set -eu
set -f
LC_ALL=C

# Noor Personal publication-control v3 acceptance-test runner.
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
. "$(dirname "$0")/test-body-tags.sh"
. "$(dirname "$0")/test-body-delete.sh"

# Run all tests using centralized per-test execution.
# Each test is executed in a controlled subshell that safely captures the exit
# code without allowing set -e to terminate the runner.
run_test_case "T01" test_t01
run_test_case "T02" test_t02
run_test_case "T03" test_t03
run_test_case "T04" test_t04
run_test_case "T05" test_t05
run_test_case "T06" test_t06
run_test_case "T07" test_t07
run_test_case "T08" test_t08
run_test_case "T09" test_t09
run_test_case "T10" test_t10
run_test_case "T11" test_t11
run_test_case "T12" test_t12
run_test_case "T13" test_t13
run_test_case "T14" test_t14
run_test_case "T15" test_t15
run_test_case "T16" test_t16
run_test_case "T17" test_t17
run_test_case "T18" test_t18
run_test_case "T19" test_t19
run_test_case "T20" test_t20
run_test_case "T21" test_t21
run_test_case "T22" test_t22
run_test_case "T23" test_t23
run_test_case "T24" test_t24
run_test_case "T25" test_t25
run_test_case "T26" test_t26
run_test_case "T27" test_t27
run_test_case "T28" test_t28
run_test_case "T29" test_t29
run_test_case "T30" test_t30
run_test_case "T31" test_t31
run_test_case "T32" test_t32
run_test_case "T33" test_t33
run_test_case "T34" test_t34
run_test_case "T35" test_t35
run_test_case "T36" test_t36
run_test_case "T37" test_t37
run_test_case "T38" test_t38
run_test_case "T39" test_t39
run_test_case "T40" test_t40
run_test_case "T41" test_t41
run_test_case "T42" test_t42
run_test_case "T43" test_t43
run_test_case "T44" test_t44
run_test_case "T45" test_t45
run_test_case "T46" test_t46
run_test_case "T47" test_t47
run_test_case "T48" test_t48
run_test_case "T49" test_t49
run_test_case "T50" test_t50
run_test_case "T51" test_t51
run_test_case "T52" test_t52
run_test_case "T53" test_t53

# Final summary
echo ""
echo "=============================================="
echo "Test suite final summary"
echo "=============================================="
echo "Total tests: $TOTAL_TEST_COUNT"
echo "Passed: $PASS_COUNT"
echo "Failed: $FAIL_COUNT"

EXPECTED_TEST_COUNT=53
if [ "$TOTAL_TEST_COUNT" -eq "$EXPECTED_TEST_COUNT" ] && [ "$PASS_COUNT" -eq "$EXPECTED_TEST_COUNT" ] && [ "$FAIL_COUNT" -eq 0 ]; then
    echo "Passed: $PASS_COUNT"
    echo "Failed: $FAIL_COUNT"
    echo "ALL TESTS PASSED"
    teardown_all
    exit 0
else
    echo "TESTS FAILED"
    teardown_all
    exit 1
fi
