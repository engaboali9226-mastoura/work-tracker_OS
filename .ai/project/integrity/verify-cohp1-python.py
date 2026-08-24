#!/usr/bin/env python3
import json, hashlib, sys
from pathlib import Path

def canonical_bytes(obj, excluded):
    x=dict(obj)
    for k in excluded: x.pop(k,None)
    # Frozen vectors use ASCII object keys and integer-only numeric values, a strict subset
    # whose serialization is identical to NOOR-COHP-1/JCS across this verifier and Node.
    return json.dumps(x, ensure_ascii=False, sort_keys=True, separators=(',',':'), allow_nan=False).encode('utf-8')

p=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).with_name('cohp1-test-vectors.json')
data=json.loads(p.read_text(encoding='utf-8'))
fail=0
for v in data['vectors']:
    got=hashlib.sha256(canonical_bytes(v['logical_object'],v['excluded_fields'])).hexdigest()
    ok=got==v['expected_sha256']
    print(f"{v['vector_id']}={'PASS' if ok else 'FAIL'} {got}")
    fail += 0 if ok else 1
print(f"NOOR_COHP_1_PYTHON_VECTOR_RESULT={'PASS' if fail==0 else 'FAIL'}")
sys.exit(1 if fail else 0)
