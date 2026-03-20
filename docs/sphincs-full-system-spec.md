# SPHINCS Full System Specification

Date: 2026-03-20
Status: Draft platform blueprint
Audience: product, engineering, design, operations, future collaborators

## 1. Executive Summary

SPHINCS is a unified business operating system for small and growing businesses.
It combines ERP and CRM into one connected SaaS platform so companies can manage customers, operations, users, permissions, and business records inside a single structured system.

The product goal is simple:

- give small businesses the structure of larger companies
- remove unnecessary software complexity
- keep operations, customer workflows, and accountability connected end to end

SPHINCS is not intended to be a pile of separate modules.
It is meant to function as one operating environment for the business.

## 2. Product Vision

SPHINCS helps small businesses operate like structured companies without unnecessary complexity.

The platform should feel:

- connected
- understandable
- scalable
- role-aware
- traceable
- operationally useful from day one

The long-term promise is that a business can move from lead capture to operational execution without jumping between disconnected tools.

## 3. Product Positioning

SPHINCS sits between lightweight small-business tools and full enterprise software.

It is positioned for:

- founders
- owner-operators
- small teams
- growing multi-user businesses

It should deliver:

- more structure than simple spreadsheet-driven workflows
- less complexity than heavy enterprise suites
- clearer business ownership than generic productivity tools

## 4. Core Product Principles

### 4.1 Unified System

ERP and CRM must behave like connected parts of one platform, not two unrelated apps.

### 4.2 Multi-Tenant By Design

Every record belongs to an organization.
Branch-aware records support internal business structure without breaking tenant isolation.

### 4.3 Role-Aware Access

Users should only see and do what their role allows.
Permissions are a core system concern, not an afterthought.

### 4.4 Operational Simplicity

The product should model real business structure while keeping UI and workflows approachable.

### 4.5 Traceability

Important actions must be attributable through audit trails, user context, timestamps, and recovery paths where appropriate.

## 5. Platform Scope

The platform is composed of three major layers:

- Platform Core
- ERP
- CRM

Each layer is part of one SaaS product and should share:

- authentication
- session management
- RBAC
- organization and branch context
- audit logging
- versioned API conventions
- shared UI and navigation language

## 6. Platform Core

The platform core is the business identity and access layer.

Core entities:

- Organization
- Branch
- User
- Role
- UserRole
- RefreshToken
- AuditLog

Responsibilities:

- tenant isolation
- account onboarding
- branch structure
- user and role management
- access enforcement
- session lifecycle
- audit traceability

## 7. Tenant Model

SPHINCS is a multi-tenant SaaS application.

### 7.1 Organization

An organization is the top-level business tenant.
Most business records belong to one organization.

Examples:

- company
- firm
- store group
- agency

### 7.2 Branch

A branch represents a sub-unit of the organization.
It supports physical or logical segmentation such as:

- head office
- warehouse
- retail branch
- region

Branch assignment should be optional where business structure does not require it.

### 7.3 User

A user belongs to one organization and may optionally be assigned to one branch.
Users authenticate into the platform and receive role-based access.

### 7.4 Role Assignment

Roles are many-to-many through `UserRole`.
This allows one user to hold multiple permissions without inventing separate account types for every combination.

## 8. Authentication And Session Model

The authentication system is shared across ERP and CRM.

Current and target behavior:

- one account signs into the platform
- one session should work across ERP and CRM
- access tokens and refresh tokens drive authenticated access
- invalid or reused refresh tokens must terminate the client session cleanly
- critical account and role changes should invalidate affected sessions

Security expectations:

- no prefilled privileged credentials on public login screens
- refresh token rotation
- reuse detection
- explicit re-login recovery
- role-aware route protection

## 9. RBAC Model

RBAC controls what users can view and change.

Current role direction includes examples such as:

- Admin
- ERP Manager
- CRM Manager
- Staff

Long-term RBAC should support:

- module access permissions
- action permissions
- admin-only system controls
- read-only vs write access
- future plan-based feature gating

Examples:

- a CRM-focused user may access contacts, leads, and opportunities but not ERP purchasing
- an ERP-focused user may access items, suppliers, and purchase orders but not CRM
- an admin can manage users, roles, and higher-risk business actions

## 10. ERP System

The ERP system handles operational workflows.

Current Beta scope:

- Items
- Suppliers
- Purchase Orders

Future ERP expansion:

- accounting and finance
- reporting and analytics
- procurement workflows
- inventory intelligence
- advanced logistics

### 10.1 Items

Items are the operational catalog of goods or services.

Key responsibilities:

- item identity
- pricing
- stock control
- service vs inventory behavior
- classification
- purchasing linkage

Target item capabilities:

- SKU-based identification
- inventory-aware behavior
- service-mode support
- category and brand grouping
- tax and discount settings
- future stock intelligence and analytics

### 10.2 Suppliers

Suppliers are the vendor-side business profiles used for procurement and purchasing.

Key responsibilities:

- supplier identity
- contact details
- address details
- financial terms
- internal vendor preference context

Target supplier capabilities:

- rich vendor profile
- multiple contact channels
- purchasing integration
- finance and payment-term support
- future procurement scoring and performance insights

### 10.3 Purchase Orders

Purchase Orders are transactional ERP records, not simple forms.

Key responsibilities:

- supplier linkage
- ordered line items
- operational totals
- workflow state
- receiving state
- payment state

Target workflow states:

- Draft
- Submitted
- Approved
- Received
- Cancelled

Target purchase-order capabilities:

- line-item modeling
- computed totals
- logistics fields
- approval metadata
- receiving quantities
- partial delivery support

## 11. CRM System

The CRM system handles relationship and sales processes.

Current Beta scope:

- Contacts
- Leads
- Opportunities

Future CRM expansion:

- sales automation
- campaigns
- lifecycle tracking
- AI-assisted insights

### 11.1 Contacts

Contacts are the people or business contacts known to the organization.

They act as the CRM identity layer for later sales workflows.

### 11.2 Leads

Leads represent potential business interest tied to contacts.

Lead responsibilities:

- qualification state
- contact linkage
- pipeline entry point

### 11.3 Opportunities

Opportunities represent active sales pipeline records linked to leads.

Opportunity responsibilities:

- sales status
- progression through commercial pipeline
- future deal value, stage, ownership, and forecasting

## 12. Cross-Module Business Workflow

The platform becomes powerful when CRM and ERP are connected.

Example target workflow:

1. A contact is created in CRM
2. A lead is created for that contact
3. The lead becomes an opportunity
4. The opportunity is won or operationally approved
5. ERP workflows are triggered as needed
6. Supplier, purchasing, inventory, and operational actions occur
7. Business actions are captured in audit logs

This is the central idea behind SPHINCS:

- customer-side workflow starts in CRM
- operational execution happens in ERP
- platform core keeps access and traceability consistent

## 13. Subscription Model

SPHINCS will support tiered SaaS plans.

### 13.1 Personal

For:

- individuals
- freelancers
- micro businesses

Expected profile:

- low user count
- low record volume
- limited operational scale

### 13.2 Studio

For:

- small teams
- growing businesses

Expected profile:

- collaboration workflows
- moderate scale
- higher usage limits

### 13.3 Company

For:

- structured growing businesses
- multi-user and multi-role organizations
- businesses using full ERP and CRM workflows

Expected profile:

- richer access controls
- broader module access
- higher limits
- deeper operational usage

### 13.4 Plan Gating Direction

Plan differences should eventually control:

- user limits
- branch limits
- record volume limits
- advanced features
- automation capabilities
- integrations
- analytics depth

## 14. Onboarding Flow

The target onboarding sequence:

1. User visits the landing page
2. User chooses sign up
3. User selects a plan
4. User enters personal account information
5. User enters organization information
6. System creates:
   - organization
   - initial branch
   - admin user
   - default role assignments
7. User lands in the platform dashboard

The onboarding flow should be structured, fast, and aligned with tenant creation.

## 15. Dashboard Direction

The long-term dashboard should act as the business command center.

It should surface:

- business summary
- activity overview
- operational alerts
- CRM pipeline health
- ERP workflow status
- recent audit activity
- shortcuts into core modules

The dashboard should differ by role and plan where useful.

## 16. Audit And Traceability

Audit logging is a core system requirement.

Important events should capture:

- actor
- organization
- action
- entity type
- entity id
- timestamp
- useful metadata

Audit should support:

- debugging
- compliance-minded traceability
- admin review
- accountability on destructive changes

## 17. Data Model Expectations

The end product requires a stronger relational backbone than a loose collection of UUID fields.

### 17.1 Core Relationships

- Organization has many Branches
- Organization has many Users
- User has many UserRoles
- Role has many UserRoles
- User has many RefreshTokens

### 17.2 CRM Relationships

- Contact can have many Leads
- Lead can have many Opportunities or one primary downstream pipeline path
- CRM records belong to an Organization
- CRM records may belong to a Branch

### 17.3 ERP Relationships

- Supplier can have many PurchaseOrders
- PurchaseOrder has many PurchaseOrderLineItems
- Item can appear in many PurchaseOrderLineItems
- ERP records belong to an Organization
- ERP records may belong to a Branch

### 17.4 Cross-System Relationships

- won opportunities may trigger ERP-side operational workflows
- audit logs reference users and organizational context
- future finance and reporting modules will depend on these connected records

## 18. Target Relational Backbone

To support the long-term system properly, the database should eventually enforce more business relationships directly.

High-priority relational targets:

- `purchase_orders.supplier_id -> suppliers.id`
- `purchase_order_line_items.item_id -> items.id`
- `leads.contact_id -> contacts.id`
- `opportunities.lead_id -> leads.id`
- organization foreign keys across business tables
- branch foreign keys across branch-aware business tables
- safe audit foreign keys where lifecycle rules allow them

This strengthens:

- data integrity
- reporting accuracy
- viewer clarity
- restore/delete safety
- long-term analytics

## 19. API And Platform Expansion

Long-term platform expansion should include:

- external integrations
- payment and billing systems
- public or partner APIs
- plugin marketplace
- advanced dashboards
- workflow automation

These should be built on top of the tenant, RBAC, audit, and relational foundation rather than bypassing it.

## 20. Product Roadmap Direction

### 20.1 Current Focus

- stabilize Beta V2
- harden access and sessions
- improve ERP and CRM usability
- strengthen data and testing discipline

### 20.2 Near-Term Expansion

- stronger relational modeling
- deeper ERP workflow coverage
- richer CRM pipeline features
- release and operational maturity

### 20.3 Longer-Term Expansion

- finance
- analytics
- automation
- campaigns
- insights
- integrations
- marketplace

## 21. Beta Scope Versus End-State Scope

### Current Beta Reality

The platform currently proves:

- shared authentication
- multi-user structure
- ERP fundamentals
- CRM fundamentals
- bug reporting
- versioning and release tracking
- growing operational maturity

### End-State Goal

The final product should behave like a coherent business operating system with:

- strong relational integrity
- reliable role-aware operations
- connected CRM-to-ERP workflows
- scalable tenant structure
- modular expansion without fragmentation

## 22. Final Statement

SPHINCS is designed to help small businesses run with structure, accountability, and clarity.

Its value does not come from having the most modules.
Its value comes from making the business feel connected:

- people
- roles
- customers
- operations
- decisions
- records
- accountability

The system should grow from a strong connected core, not from isolated features.
