import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import * as A from "../dist/index.js";

const MIN=-62167219200000;
const MAX=253402300799999;
const EVAL=1785196800000;
const scope={subject:"SYNTHETIC-SUBJECT",purpose:"CONTROLLED_SYNTHETIC_EXECUTION_RUN_AUTHORIZATION_FOUNDATION",capabilities:["PROJECT"],leastPrivilege:true,syntheticBundle:"BUNDLE",catalog:"CATALOG",executor:"RESTRICTED",callback:"PURE",workspace:"EPHEMERAL",environment:"DETERMINISTIC",resourceBudget:"BOUNDED",invocationPlan:"PLAN",scenarios:["S1"],repetitions:1,capture:"SUPPLIED",oracle:"TEST",quarantine:"REQUIRED",abort:"BOUND",cancellation:"BOUND",cleanup:"REQUIRED",replay:"REQUIRED"};
const lifecycle={issuedAt:"2026-07-27T00:00:00Z",activatesAt:"2026-07-27T01:00:00Z",expiresAt:"2026-07-29T00:00:00Z",suspended:false,revoked:false,renewalRequested:false};
const envelope={authoritySource:"REVIEW-042-R1",requestId:"REQUEST-043",revision:"1",immutable:true,requester:{id:"R",role:"REQUESTER"},executorOwner:{id:"E",role:"EXECUTOR_OWNER"},reviewer:{id:"V",role:"REVIEWER"},approver:{id:"A",role:"APPROVER"},scope,seals:{foundation:"FOUNDATION",policy:"POLICY-01",request:"REQUEST-01",subject:"SUBJECT-01",scope:"SCOPE-001"},lifecycle,delegationAllowed:false,transferable:false,conflictOfInterest:false,ambiguousPrecedence:false,operationalEffects:false,persistence:false};
let cases=0;
const test=(f)=>{cases++;f()};
const failureCode=(f)=>{let x;try{f()}catch(e){x=e}return x?.code};
const expectCode=(f,c)=>test(()=>assert.equal(failureCode(f),c));
const code=(patch,c)=>expectCode(()=>A.validateAuthorizationEnvelope({...envelope,...patch},EVAL),c);

// Historical 47-case baseline, adapted only to the required evaluationTimeMs arity.
test(()=>{assert.deepEqual([A.AUTHORIZATION_DOMAINS.length,A.AUTHORIZATION_PHASES.length,A.AUTHORIZATION_GATES.length,A.AUTHORIZATION_OUTCOMES.length],[18,22,18,11])});
test(()=>A.validateAuthorizationEnvelope(envelope,EVAL));
test(()=>assert.equal(A.canonicalizeAuthorization({b:1,a:2}),A.canonicalizeAuthorization({a:2,b:1})));
test(()=>assert.equal(A.transientAuthorizationSeal("x"),A.transientAuthorizationSeal("x")));
const p=A.projectAuthorizationReadiness(envelope,EVAL);
test(()=>assert.equal(p.gateStates.length,18));
test(()=>assert.ok(p.gateStates.every(g=>g.state==="PROJECTION_ONLY")));
test(()=>assert.ok(Object.values(p.operationalCounters).every(v=>v===0)));
const d=A.createTestOwnedDecision(envelope,EVAL);
test(()=>assert.equal(A.evaluateSuppliedDecision(envelope,d,EVAL),"AUTHORIZATION_APPROVED_PROJECTED"));
test(()=>assert.equal(A.projectReplayAgreement(p,A.projectAuthorizationReadiness(envelope,EVAL)),"REPLAY_AGREEMENT"));
test(()=>assert.equal(A.projectReplayAgreement(p,{...p,canonical:"bad"}),"REPLAY_MISMATCH"));
code({scope:{...scope,capabilities:[]}},"SCOPE_INVALID");
code({requester:envelope.reviewer},"IDENTITY_CONFLICT");
code({lifecycle:{...lifecycle,expiresAt:"2026-07-28T00:00:00Z"}},"AUTHORIZATION_EXPIRED");
code({lifecycle:{...lifecycle,revoked:true}},"AUTHORIZATION_REVOKED");
code({lifecycle:{...lifecycle,suspended:true}},"AUTHORIZATION_SUSPENDED");
code({delegationAllowed:true},"DELEGATION_FORBIDDEN");
code({seals:{...envelope.seals,scope:"bad"}},"SEAL_BINDING_INVALID");
code({lifecycle:{...lifecycle,activatesAt:"2026-07-29T00:00:00Z"}},"LIFECYCLE_INVALID");
code({conflictOfInterest:true},"CONFLICT_OF_INTEREST");
expectCode(()=>A.evaluateSuppliedDecision(envelope,{...d,controls:{...d.controls,AUTHORITY_SCOPE:false}},EVAL),"CONTROL_MISMATCH");
for(const [name,expected] of [["createAuthorization","AUTHORIZATION_CREATION_FORBIDDEN"],["issueAuthorization","AUTHORIZATION_ISSUANCE_FORBIDDEN"],["activateAuthorization","AUTHORIZATION_ACTIVATION_FORBIDDEN"],["suspendAuthorization","AUTHORIZATION_SUSPENSION_FORBIDDEN"],["revokeAuthorization","AUTHORIZATION_REVOCATION_FORBIDDEN"],["renewAuthorization","AUTHORIZATION_RENEWAL_FORBIDDEN"],["delegateAuthorization","AUTHORIZATION_DELEGATION_FORBIDDEN"],["transferAuthorization","AUTHORIZATION_TRANSFER_FORBIDDEN"],["widenAuthorizationScope","SCOPE_WIDENING_FORBIDDEN"],["persistAuthorizationEnvelope","AUTHORIZATION_PERSISTENCE_FORBIDDEN"],["createControlledRunRequest","CONTROLLED_RUN_REQUEST_CREATION_FORBIDDEN"],["materializeExecutableBundle","EXECUTABLE_BUNDLE_MATERIALIZATION_FORBIDDEN"],["allocateWorkspace","WORKSPACE_ALLOCATION_FORBIDDEN"],["materializeInvocationPlan","INVOCATION_PLAN_MATERIALIZATION_FORBIDDEN"],["executeScenario","SCENARIO_EXECUTION_FORBIDDEN"],["constructOperationalCapture","OPERATIONAL_CAPTURE_CONSTRUCTION_FORBIDDEN"],["constructOperationalResult","OPERATIONAL_RESULT_CONSTRUCTION_FORBIDDEN"],["admitEvidence","EVIDENCE_ADMISSION_FORBIDDEN"],["mutateCandidateState","CANDIDATE_STATE_MUTATION_FORBIDDEN"],["executeCandidate","CANDIDATE_EXECUTION_FORBIDDEN"],["executeAdapter","ADAPTER_EXECUTION_FORBIDDEN"],["accessNetwork","NETWORK_ACCESS_FORBIDDEN"],["executeExternalProcess","EXTERNAL_PROCESS_FORBIDDEN"],["stageFoundation","STAGE_FORBIDDEN"],["commitFoundation","COMMIT_FORBIDDEN"],["tagFoundation","TAG_FORBIDDEN"],["pushFoundation","PUSH_FORBIDDEN"]]){expectCode(()=>A[name](),expected)}
assert.equal(cases,47);
const historicalBaselineCases=cases;

// Failure vocabulary: legacy 45 unchanged plus one new code.
const legacyFailureCodes=["AUTHORITY_OR_IDENTITY_INVALID","IDENTITY_CONFLICT","IDENTITY_ROLE_INVALID","SCOPE_INVALID","SEAL_BINDING_INVALID","BOUND_SCOPE_INVALID","LIFECYCLE_INVALID","AUTHORIZATION_EXPIRED","AUTHORIZATION_REVOKED","AUTHORIZATION_SUSPENDED","RENEWAL_REVALIDATION_REQUIRED","DELEGATION_FORBIDDEN","TRANSFER_FORBIDDEN","CONFLICT_OF_INTEREST","AMBIGUOUS_PRECEDENCE","FOUNDATION_BOUNDARY_VIOLATION","SUPPLIED_DECISION_INVALID","CONTROL_MISMATCH","AUTHORIZATION_CREATION_FORBIDDEN","AUTHORIZATION_ISSUANCE_FORBIDDEN","AUTHORIZATION_ACTIVATION_FORBIDDEN","AUTHORIZATION_SUSPENSION_FORBIDDEN","AUTHORIZATION_REVOCATION_FORBIDDEN","AUTHORIZATION_RENEWAL_FORBIDDEN","AUTHORIZATION_DELEGATION_FORBIDDEN","AUTHORIZATION_TRANSFER_FORBIDDEN","SCOPE_WIDENING_FORBIDDEN","AUTHORIZATION_PERSISTENCE_FORBIDDEN","CONTROLLED_RUN_REQUEST_CREATION_FORBIDDEN","EXECUTABLE_BUNDLE_MATERIALIZATION_FORBIDDEN","WORKSPACE_ALLOCATION_FORBIDDEN","INVOCATION_PLAN_MATERIALIZATION_FORBIDDEN","SCENARIO_EXECUTION_FORBIDDEN","OPERATIONAL_CAPTURE_CONSTRUCTION_FORBIDDEN","OPERATIONAL_RESULT_CONSTRUCTION_FORBIDDEN","EVIDENCE_ADMISSION_FORBIDDEN","CANDIDATE_STATE_MUTATION_FORBIDDEN","CANDIDATE_EXECUTION_FORBIDDEN","ADAPTER_EXECUTION_FORBIDDEN","NETWORK_ACCESS_FORBIDDEN","EXTERNAL_PROCESS_FORBIDDEN","STAGE_FORBIDDEN","COMMIT_FORBIDDEN","TAG_FORBIDDEN","PUSH_FORBIDDEN"];
test(()=>assert.equal(A.AUTHORIZATION_FAILURE_CODES.length,46));
test(()=>assert.equal(new Set(A.AUTHORIZATION_FAILURE_CODES).size,46));
test(()=>assert.equal(A.AUTHORIZATION_FAILURE_CODES.filter(x=>x==="EVALUATION_TIME_INVALID").length,1));
test(()=>assert.deepEqual(A.AUTHORIZATION_FAILURE_CODES.filter(x=>x!=="EVALUATION_TIME_INVALID"),legacyFailureCodes));

// All runtime categories are rejected at every public temporal entry.
const invalidEvaluationTimes=[undefined,null,"0",true,{},[],0n,Symbol("invalid-evaluation-time"),()=>{},NaN,Infinity,-Infinity,1.5,Number.MAX_SAFE_INTEGER+1,-0,MIN-1,MAX+1];
for(const bad of invalidEvaluationTimes){
 expectCode(()=>A.validateAuthorizationEnvelope(envelope,bad),"EVALUATION_TIME_INVALID");
 expectCode(()=>A.projectAuthorizationReadiness(envelope,bad),"EVALUATION_TIME_INVALID");
 expectCode(()=>A.createTestOwnedDecision(envelope,bad),"EVALUATION_TIME_INVALID");
 expectCode(()=>A.evaluateSuppliedDecision(envelope,d,bad),"EVALUATION_TIME_INVALID");
}

// Evaluation rejection precedes any Envelope access at all four entries.
const hostileEnvelope=()=>{let reads=0;const proxy=new Proxy({}, {get(){reads++;throw new Error("ENVELOPE_READ")},ownKeys(){reads++;throw new Error("ENVELOPE_READ")},getOwnPropertyDescriptor(){reads++;throw new Error("ENVELOPE_READ")}});return{proxy,reads:()=>reads}};
for(const invoke of [
 e=>A.validateAuthorizationEnvelope(e,undefined),
 e=>A.projectAuthorizationReadiness(e,undefined),
 e=>A.createTestOwnedDecision(e,undefined),
 e=>A.evaluateSuppliedDecision(e,d,undefined),
]){
 test(()=>{const h=hostileEnvelope();assert.equal(failureCode(()=>invoke(h.proxy)),"EVALUATION_TIME_INVALID");assert.equal(h.reads(),0)});
}

// Strict timestamp grammar and calendar rejection evidence.
const invalidTimestamps=[
 "2026-07-27T00:60:00Z",
 "2026-07-00T00:00:00Z",
 "2026-07-27T00:00:00-00:00",
 "+2026-07-27T00:00:00Z",
 "-0001-07-27T00:00:00Z",
 "02026-07-27T00:00:00Z",
 "10000-07-27T00:00:00Z",
 "\t2026-07-27T00:00:00Z",
 "2026-07-27T00:00:00Z\n",
 "07/28/2026 00:00:00",
 "July 28 2026 00:00:00",
 "2026-07-27T00:00:00z",
 "2026-07-27T00:00:00+00:00",
 "2026-7-27T00:00:00Z",
 " 2026-07-27T00:00:00Z",
 "2026-07-27T24:00:00Z",
 "2026-07-27T00:00:60Z",
 "2100-02-29T00:00:00Z",
 "2026-04-31T00:00:00Z",
 "2026-00-27T00:00:00Z",
 "2026-13-27T00:00:00Z",
 "2026-07-27T00:00:00.1Z",
 "2026-07-27T00:00:00.12Z",
 "2026-07-27T00:00:00.1234Z",
];
for(const timestamp of invalidTimestamps){expectCode(()=>A.validateAuthorizationEnvelope({...envelope,lifecycle:{...lifecycle,issuedAt:timestamp}},EVAL),"LIFECYCLE_INVALID")}
test(()=>A.validateAuthorizationEnvelope({...envelope,lifecycle:{issuedAt:"2000-02-29T00:00:00Z",activatesAt:"2024-02-29T00:00:00Z",expiresAt:"2026-07-29T00:00:00Z",suspended:false,revoked:false,renewalRequested:false}},EVAL));
test(()=>A.validateAuthorizationEnvelope({...envelope,lifecycle:{issuedAt:"2026-07-27T00:00:00.123Z",activatesAt:"2026-07-27T01:00:00.123Z",expiresAt:"2026-07-29T00:00:00.123Z",suspended:false,revoked:false,renewalRequested:false}},EVAL));

// Arithmetic conversion anchors through lifecycle boundary behavior.
test(()=>A.validateAuthorizationEnvelope({...envelope,lifecycle:{issuedAt:"0000-01-01T00:00:00.000Z",activatesAt:"0000-01-01T00:00:00.000Z",expiresAt:"0000-01-01T00:00:00.001Z",suspended:false,revoked:false,renewalRequested:false}},MIN));
test(()=>A.validateAuthorizationEnvelope({...envelope,lifecycle:{issuedAt:"1970-01-01T00:00:00Z",activatesAt:"1970-01-01T00:00:00Z",expiresAt:"1970-01-01T00:00:00.001Z",suspended:false,revoked:false,renewalRequested:false}},0));
test(()=>A.validateAuthorizationEnvelope({...envelope,lifecycle:{issuedAt:"1970-01-01T00:00:00.000Z",activatesAt:"1970-01-01T00:00:00.000Z",expiresAt:"1970-01-01T00:00:00.001Z",suspended:false,revoked:false,renewalRequested:false}},0));
test(()=>A.validateAuthorizationEnvelope({...envelope,lifecycle:{issuedAt:"9999-12-31T23:59:58.999Z",activatesAt:"9999-12-31T23:59:58.999Z",expiresAt:"9999-12-31T23:59:59.999Z",suspended:false,revoked:false,renewalRequested:false}},MAX-1));
expectCode(()=>A.validateAuthorizationEnvelope({...envelope,lifecycle:{issuedAt:"9999-12-31T23:59:58.999Z",activatesAt:"9999-12-31T23:59:58.999Z",expiresAt:"9999-12-31T23:59:59.999Z",suspended:false,revoked:false,renewalRequested:false}},MAX),"AUTHORIZATION_EXPIRED");

// Equal instants may retain distinct Envelope text identity.
const zEnvelope={...envelope,lifecycle:{...lifecycle,issuedAt:"2026-07-27T00:00:00Z"}};
const msEnvelope={...envelope,lifecycle:{...lifecycle,issuedAt:"2026-07-27T00:00:00.000Z"}};
test(()=>{A.validateAuthorizationEnvelope(zEnvelope,EVAL);A.validateAuthorizationEnvelope(msEnvelope,EVAL);assert.notEqual(A.canonicalizeAuthorization(zEnvelope),A.canonicalizeAuthorization(msEnvelope))});

// Temporal boundaries and multi-defect precedence.
test(()=>A.validateAuthorizationEnvelope({...envelope,lifecycle:{...lifecycle,activatesAt:"2026-07-28T00:00:00Z"}},EVAL));
expectCode(()=>A.validateAuthorizationEnvelope({...envelope,lifecycle:{...lifecycle,expiresAt:"2026-07-28T00:00:00Z"}},EVAL),"AUTHORIZATION_EXPIRED");
expectCode(()=>A.validateAuthorizationEnvelope({...envelope,lifecycle:{...lifecycle,expiresAt:"2026-07-27T23:59:59.999Z"}},EVAL),"AUTHORIZATION_EXPIRED");
expectCode(()=>A.validateAuthorizationEnvelope({...envelope,lifecycle:{...lifecycle,activatesAt:"2026-07-28T00:00:00.001Z"}},EVAL),"LIFECYCLE_INVALID");
expectCode(()=>A.validateAuthorizationEnvelope({...envelope,lifecycle:{...lifecycle,issuedAt:"2026-07-27T02:00:00Z",activatesAt:"2026-07-27T01:00:00Z"}},EVAL),"LIFECYCLE_INVALID");
expectCode(()=>A.validateAuthorizationEnvelope({...envelope,authoritySource:"",lifecycle:{...lifecycle,issuedAt:"bad"}},EVAL),"AUTHORITY_OR_IDENTITY_INVALID");
expectCode(()=>A.validateAuthorizationEnvelope({...envelope,lifecycle:{...lifecycle,activatesAt:"2026-07-29T00:00:00Z",expiresAt:"2026-07-27T00:00:00Z"}},EVAL),"LIFECYCLE_INVALID");

// Projection/replay bind evaluationTimeMs.
const pSame=A.projectAuthorizationReadiness(envelope,EVAL);
const pLater=A.projectAuthorizationReadiness(envelope,EVAL+1);
test(()=>assert.equal(pSame.evaluationTimeMs,EVAL));
test(()=>assert.equal(pSame.canonical,A.projectAuthorizationReadiness(envelope,EVAL).canonical));
test(()=>assert.equal(pSame.transientSeal,A.projectAuthorizationReadiness(envelope,EVAL).transientSeal));
test(()=>assert.notEqual(pSame.canonical,pLater.canonical));
test(()=>assert.equal(A.projectReplayAgreement(pSame,pLater),"REPLAY_MISMATCH"));

// Supplied-decision time agreement and precedence over controls mismatch.
test(()=>assert.equal(d.evaluationTimeMs,EVAL));
expectCode(()=>A.evaluateSuppliedDecision(envelope,d,EVAL+1),"SUPPLIED_DECISION_INVALID");
expectCode(()=>A.evaluateSuppliedDecision(envelope,{...d,controls:{...d.controls,AUTHORITY_SCOPE:false}},EVAL+1),"SUPPLIED_DECISION_INVALID");

// No ambient/open-ended time dependency in production source.
const source=readFileSync(new URL("../src/index.ts",import.meta.url),"utf8");
for(const forbidden of [
 /Date\.parse\s*\(/,
 /Date\.now\s*\(/,
 /\bDate\s*\(\s*\)/,
 /\bnew\s+Date\s*\(\s*\)/,
 /performance\.now\s*\(/,
 /process\.hrtime\s*\(/,
 /process\.env/,
]){test(()=>assert.doesNotMatch(source,forbidden))}
test(()=>assert.equal(source.includes("2026-07-28T00:00:00Z"),false));

// Foundation effects remain zero.
test(()=>assert.ok(Object.values(A.projectAuthorizationReadiness(envelope,EVAL).operationalCounters).every(v=>v===0)));
test(()=>assert.ok(cases>historicalBaselineCases));

console.log("NOOR_STEP_043_AUTHORIZATION_FOUNDATION_TESTS_PASS baseline=47 cases="+cases);
