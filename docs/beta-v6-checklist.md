# Beta V6 Checklist

Date: 2026-03-20
Target Release: `Beta V6.0.0`
Status: Planned execution checklist

## Core Rule

Beta V6 is about production-candidate maturity.

This phase prepares SPHINCS for broader external use, ecosystem growth, and stronger operational confidence.

## 1) Integrations And External Connectivity

- [ ] Define the first supported integration surfaces.
- [ ] Add stable API and integration boundaries that do not bypass tenant, role, or audit rules.
- [ ] Document external integration principles and security expectations.
- [ ] Decide what third-party systems are strategic versus optional.

## 2) Billing And Commercial Readiness

- [ ] Define the first production-ready billing model.
- [ ] Connect plan rules to actual commercial enforcement.
- [ ] Add subscription lifecycle handling for upgrades, downgrades, and plan state changes.
- [ ] Add clear internal documentation for plan entitlement behavior.

## 3) Automation And Extensibility

- [ ] Define a safe automation foundation for business workflows.
- [ ] Define plugin or extension boundaries if they remain part of the roadmap.
- [ ] Ensure future extensibility still respects tenant, role, and audit systems.
- [ ] Document what custom logic belongs in product core versus extension points.

## 4) Reliability And Performance

- [ ] Add stronger production-style reliability checks.
- [ ] Add performance baselines for critical ERP, CRM, and auth flows.
- [ ] Add operational monitoring expectations for the live platform.
- [ ] Improve deployment confidence for higher-usage environments.

## 5) Compliance-Minded Controls

- [ ] Review audit, access, and destructive-action controls with a more production-minded lens.
- [ ] Improve record-lifecycle clarity where retention or restore behavior matters.
- [ ] Document security and operational control assumptions clearly.
- [ ] Identify any remaining platform areas that are still too beta-fragile for broader rollout.

## 6) Support And Operational Readiness

- [ ] Create clearer support and incident playbooks.
- [ ] Define release governance expectations beyond beta cadence.
- [ ] Improve internal visibility for account, auth, and data issues.
- [ ] Prepare a production-candidate launch checklist.

## 7) Hard Stop Definition

Beta V6 is complete only when all of these are true:

- [ ] The platform has stable integration and billing direction.
- [ ] Extensibility and automation foundations are defined responsibly.
- [ ] Reliability, monitoring, and operational readiness are meaningfully stronger.
- [ ] SPHINCS is ready to be judged against production-candidate standards.

## 8) Immediate Execution Order

- [ ] Lock integration and billing principles first.
- [ ] Add extensibility and automation foundations second.
- [ ] Harden reliability and compliance-minded controls third.
- [ ] Finalize production-candidate readiness checklist last.
