# Beta V5 Checklist

Date: 2026-03-20
Target Release: `Beta V5.0.0`
Status: Planned execution checklist

## Core Rule

Beta V5 is about commercial operations depth.

The platform should start helping the business understand and manage money, performance, and operational health, not just store records.

## 1) Finance Foundations

- [ ] Define the first supported finance/accounting scope for SPHINCS.
- [ ] Add finance data model foundations that align with ERP records.
- [ ] Decide what purchase-order and supplier financial events should feed later finance workflows.
- [ ] Document what finance capabilities are in scope versus deferred.

## 2) Analytics And Reporting Foundations

- [ ] Define a first reporting surface for small-business operators.
- [ ] Add role-aware KPI summaries for ERP activity.
- [ ] Add role-aware KPI summaries for CRM activity.
- [ ] Add reporting documentation that identifies trusted source entities and metrics.
- [ ] Ensure reporting reads align with the stronger relational backbone.

## 3) Procurement Enrichment

- [ ] Expand supplier and purchase-order workflows toward richer procurement behavior.
- [ ] Add vendor-performance oriented fields or reporting where justified.
- [ ] Add better receiving and procurement visibility across order lifecycle.
- [ ] Clarify how procurement data should feed later finance and analytics work.

## 4) CRM Lifecycle Maturity

- [ ] Expand opportunity lifecycle depth beyond the early beta flow.
- [ ] Add clearer status, ownership, and follow-up behavior in CRM.
- [ ] Define the first lifecycle view from contact to closed opportunity.
- [ ] Document future automation hooks without prematurely overbuilding them.

## 5) Dashboard Intelligence

- [ ] Expand the dashboard from shortcuts into meaningful business insight.
- [ ] Surface operational exceptions or business attention items.
- [ ] Add role-aware widgets without turning the dashboard into clutter.
- [ ] Ensure dashboard signals stay understandable for small businesses.

## 6) Operational Quality

- [ ] Add stronger regression coverage around reporting-critical workflows.
- [ ] Add data-quality tests for metrics that feed analytics surfaces.
- [ ] Add smoke checks for finance/reporting-impacting releases.
- [ ] Update docs so business metrics are not defined only in code.

## 7) Hard Stop Definition

Beta V5 is complete only when all of these are true:

- [ ] SPHINCS provides meaningful operational insight, not only transactional record entry.
- [ ] Finance/reporting foundations are documented and structurally aligned with ERP and CRM data.
- [ ] Procurement and CRM lifecycle depth are richer without losing simplicity.
- [ ] Dashboard value is real for business operators.

## 8) Immediate Execution Order

- [ ] Define finance/reporting scope first.
- [ ] Strengthen procurement and CRM lifecycle models.
- [ ] Add dashboard intelligence surfaces.
- [ ] Add reporting-quality coverage.
- [ ] Close Beta V5 only after metric definitions and docs are trustworthy.
