import assert from "node:assert/strict";
import {ExecutionFoundationError,EXECUTION_DESIGN_DOMAINS,EXECUTION_PHASES,EXECUTION_GATES,EXECUTION_OUTCOMES,FAILURE_CODES,projectRegistrationExecution,projectIndependentDecision,verifyTransientSeal,executeOperationalRegistration,persistRegistrationManifest} from "../dist/index.js";
const request={requestId:"REQ-031-001",idempotencyKey:"IDEMPOTENCY-031-001",purpose:"Synthetic offline execution projection",issuedAt:"2026-07-27T07:00:00Z",expiresAt:"2026-07-27T09:00:00Z",candidateId:"CANDIDATE-031-001",revisionId:"REVISION-031-001",expectedPriorRevisionId:null,registrarId:"REGISTRAR-031",reviewerId:"REVIEWER-031",foundationSeal:"FOUNDATION-SEAL-031",dryRunOnly:true};
const authority={executionFoundationAuthorized:true,registrarAuthorized:true,reviewerAuthorized:true,scope:"OPERATIONAL_REGISTRATION_EXECUTION_DRY_RUN",authorizationExpiresAt:"2026-07-27T09:00:00Z"};
const candidate={candidateId:request.candidateId,revisionId:request.revisionId,priorRevisionId:null,controlDomain:"Execution Authorization and Scope",conceptFamily:"NATIVE",declarationsComplete:true,capabilitiesAdmissible:true,privilegesAdmissible:true,dependenciesAdmissible:true,supplyChainAdmissible:true,evidenceReferencesAdmissible:true,duplicatesResolved:true,supersessionValid:true,lifecycleValid:true,blockingFindings:[]};
const input={request,authority,candidate,expectedFoundationSeal:request.foundationSeal,now:"2026-07-27T08:00:00Z",repositoryMutationDetected:false};
assert.equal(EXECUTION_DESIGN_DOMAINS.length,18);assert.equal(EXECUTION_PHASES.length,17);assert.equal(EXECUTION_GATES.length,18);assert.equal(EXECUTION_OUTCOMES.length,6);assert.equal(FAILURE_CODES.length,37);
const ready=projectRegistrationExecution(input);assert.equal(ready.outcome,"REVIEW_READY_PROJECTED");assert.equal(ready.operationalEffect,false);verifyTransientSeal(ready);assert.deepEqual(projectRegistrationExecution(input),ready);
const approved=projectIndependentDecision(ready,"APPROVE");assert.equal(approved.outcome,"APPROVAL_PROJECTED");verifyTransientSeal(approved);
const quarantined=projectRegistrationExecution({...input,candidate:{...candidate,blockingFindings:["synthetic-blocker"]}});assert.equal(quarantined.outcome,"QUARANTINED");assert.ok(quarantined.failedGates.includes("BLOCKING_FINDINGS_PRESENT"));
function code(fn,expected){let caught=null;try{fn()}catch(error){caught=error}assert.ok(caught instanceof ExecutionFoundationError);assert.equal(caught.code,expected)}
code(()=>projectRegistrationExecution({...input,request:{...request,reviewerId:request.registrarId}}),"SELF_REVIEW_FORBIDDEN");
const stale=projectRegistrationExecution({...input,candidate:{...candidate,priorRevisionId:"REVISION-OLD"}});assert.equal(stale.outcome,"QUARANTINED");assert.ok(stale.failedGates.includes("CONCURRENCY_CONFLICT"));
const invalidDomain=projectRegistrationExecution({...input,candidate:{...candidate,controlDomain:"Invalid Domain"}});assert.equal(invalidDomain.outcome,"QUARANTINED");assert.ok(invalidDomain.failedGates.includes("DOMAIN_BINDING_INVALID"));
code(()=>projectRegistrationExecution({...input,manifestPersistenceRequested:true}),"MANIFEST_PERSISTENCE_FORBIDDEN");
code(()=>projectRegistrationExecution({...input,operationalEffectRequested:true}),"OPERATIONAL_REGISTRATION_FORBIDDEN");
code(()=>projectRegistrationExecution({...input,repositoryMutationDetected:true}),"REPOSITORY_MUTATION_DETECTED");
code(()=>executeOperationalRegistration(),"OPERATIONAL_REGISTRATION_FORBIDDEN");code(()=>persistRegistrationManifest(),"MANIFEST_PERSISTENCE_FORBIDDEN");
console.log("NOOR_STEP_031_OPERATIONAL_REGISTRATION_EXECUTION_FOUNDATION_TESTS_PASS");
