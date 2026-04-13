---
title: SPHINCS Database System Design (extracted)
source: SPHINCS_Database_System_Design.docx
note: Auto-generated; edit the Word source and re-run scripts/extract_docx_blueprint.py
---

This file is a **UTF-8 text extraction** of the canonical Word blueprint. **Tables may render as linear text**; refer to the `.docx` for layout.

SPHINCS

Enterprise Platform — Complete Database System Design

Stack: NestJS · Prisma · PostgreSQL   |   Architecture: Multi-Tenant · Multi-Branch · RBAC

Version 1.0  —  Production-Ready Schema Design


### SYSTEM OVERVIEW

SPHINCS is a modular, multi-tenant enterprise platform. This document defines the complete production database schema across all 11 business domains, core infrastructure, and shared reference data. The schema is designed for NestJS + Prisma + PostgreSQL and covers 107 tables organized across 13 sections.

Module Table Count

Module

Tables

Core Architecture

13

Shared / Global

11

Sales

9

Procurement & SRM

10

Inventory

6

Production & PLM

5

Accounting & Finance

10

Human Resources

11

Corporate Governance

5

CRM & Customer Service

6

Ecommerce

9

BI & Analytics

6

Enterprise Asset Management

6

TOTAL

107


## MULTI-TENANCY ARCHITECTURE

Isolation Strategy

SPHINCS uses Row-Level tenancy: every tenant shares the same database schema, but all business data rows are scoped by organization_id. This approach is PostgreSQL-native, Prisma-friendly, and horizontally scalable.

Enforcement Layers

1. Schema Level: All business tables carry a NOT NULL organization_id foreign key to organizations.

2. Application Level (NestJS): A global OrganizationGuard middleware extracts organization_id from the JWT and injects it into every Prisma query via a scoped service.

3. Prisma Middleware: A registerExtension or $use middleware appends WHERE organization_id = :orgId to every read/write operation automatically.

4. Row-Level Security (Optional): PostgreSQL RLS policies can be enabled per table for defense-in-depth, using SET app.current_org_id = :orgId at the session level.

5. Branch Scope: branch_id is nullable — null means "all branches". Rows with a specific branch_id are only accessible to members with that branch in their role scope.

Organization Types vs Account Plans

Account types (Personal, Studio, Enterprise) map to subscription_plans, not to separate schemas or databases. The organizations.type field drives UI presentation, while plan_id controls feature flags and resource limits stored in subscription_plans.features (JSONB).

Account Type

Use Case

Max Branches

Module Access

Personal

Solo freelancer or individual user

1

Core + CRM + BI

Studio

Small team / agency (Studio plan)

3

Core + Sales + HR + CRM + Ecom

Enterprise

Large org with full ERP needs

Unlimited

All modules


## CORE ARCHITECTURE TABLES

These tables form the foundation. They must be migrated first and have no dependency on business domain tables.

core.subscription_plans

Defines Personal, Studio, Enterprise tiers and their feature limits. Org-independent.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

Unique plan ID

name

VARCHAR(80)

NOT NULL

e.g. Personal, Studio, Enterprise

slug

VARCHAR(40)


### UNIQUE NOT NULL

machine-readable key: personal / studio / enterprise

max_users

INT

DEFAULT NULL

NULL = unlimited

max_branches

INT

DEFAULT 1

Branch limit per org

max_storage_gb

INT

DEFAULT 5

Storage limit GB

features

JSONB

NOT NULL DEFAULT '{}'

Feature flags: {inventory: true, bi: false, ...}

price_monthly

DECIMAL(10,2)

NOT NULL DEFAULT 0

Monthly price in base currency

price_yearly

DECIMAL(10,2)

NOT NULL DEFAULT 0

Yearly price in base currency

is_active

BOOLEAN

NOT NULL DEFAULT true

Visible to new signups

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

core.organizations

The root multi-tenancy entity. Every piece of business data is scoped to an org.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

Unique organization ID

name

VARCHAR(200)

NOT NULL

Organization display name

slug

VARCHAR(100)


### UNIQUE NOT NULL

URL-safe unique identifier

type

VARCHAR(20)

NOT NULL DEFAULT 'enterprise'

personal | studio | enterprise

plan_id (FK)

BIGINT

REFERENCES subscription_plans(id)

Active subscription plan

plan_started_at

TIMESTAMPTZ

When current plan began

plan_expires_at

TIMESTAMPTZ

Plan expiry (null = ongoing)

owner_id (FK)

BIGINT

REFERENCES users(id)

Founding/owner user

logo_url

TEXT

Organization logo URL

website

VARCHAR(200)

Corporate website

industry

VARCHAR(100)

Industry sector

size_range

VARCHAR(20)

1-10 | 11-50 | 51-200 | 201-1000 | 1000+

country_id (FK)

BIGINT

REFERENCES countries(id)

HQ country

timezone

VARCHAR(60)

NOT NULL DEFAULT 'UTC'

Default org timezone

locale

VARCHAR(10)

NOT NULL DEFAULT 'en'

Default locale (en, ar, fr …)

base_currency_id (FK)

BIGINT

REFERENCES currencies(id)

Default currency

fiscal_year_start

SMALLINT

NOT NULL DEFAULT 1

Month fiscal year starts (1=Jan)

is_active

BOOLEAN

NOT NULL DEFAULT true

Account status

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

deleted_at

TIMESTAMPTZ

DEFAULT NULL

Soft delete

core.branches

Physical or logical sub-units of an organization (offices, stores, warehouses). All business data can optionally be scoped to a branch.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

Unique branch ID

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

Parent organization

name

VARCHAR(150)

NOT NULL

Branch display name

code

VARCHAR(30)

NOT NULL

Short code e.g. BEY-01

type

VARCHAR(30)

headquarters | office | warehouse | store | factory

address_id (FK)

BIGINT

REFERENCES addresses(id)

Branch address

phone

VARCHAR(30)

Branch phone

email

VARCHAR(150)

Branch email

manager_id (FK)

BIGINT

REFERENCES users(id)

Branch manager user

is_active

BOOLEAN

NOT NULL DEFAULT true

Active status

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

deleted_at

TIMESTAMPTZ

DEFAULT NULL

Soft delete

UNIQUE

(organization_id, code)

Code unique per org

core.users

Global user accounts. A user can belong to multiple organizations. Authentication is handled externally (Passport/JWT); only profile and state is stored here.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

Unique user ID

email

VARCHAR(200)


### UNIQUE NOT NULL

Login email — globally unique

password_hash

TEXT

Bcrypt hash (null if SSO-only)

first_name

VARCHAR(80)

NOT NULL

First name

last_name

VARCHAR(80)

NOT NULL

Last name

avatar_url

TEXT

Profile avatar URL

phone

VARCHAR(30)

Phone number

status

VARCHAR(20)

NOT NULL DEFAULT 'active'

active | suspended | unverified

email_verified

BOOLEAN

NOT NULL DEFAULT false

Email verification status

mfa_enabled

BOOLEAN

NOT NULL DEFAULT false

MFA toggle

mfa_secret

TEXT

TOTP secret (encrypted)

last_login_at

TIMESTAMPTZ

Most recent login

last_login_ip

INET

IP of last login

timezone

VARCHAR(60)

DEFAULT 'UTC'

User-preferred timezone

locale

VARCHAR(10)

DEFAULT 'en'

Preferred locale

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

deleted_at

TIMESTAMPTZ

DEFAULT NULL

Soft delete

core.organization_members

Membership join table linking users to organizations. A user has one membership record per org with a role set and optional branch scope.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

Unique membership ID

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

Organization

user_id (FK)

BIGINT

REFERENCES users(id) NOT NULL

Member user

branch_id (FK)

BIGINT

REFERENCES branches(id)

Primary branch (null = all branches)

status

VARCHAR(20)

NOT NULL DEFAULT 'active'

active | invited | suspended

invited_by (FK)

BIGINT

REFERENCES users(id)

Who sent the invitation

invited_at

TIMESTAMPTZ

Invitation timestamp

joined_at

TIMESTAMPTZ

When invitation was accepted

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

UNIQUE

(organization_id, user_id)

One membership per user per org

core.roles

Roles are scoped per organization. System roles (super_admin, etc.) have organization_id = NULL. Custom roles are org-specific.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

Unique role ID

organization_id (FK)

BIGINT

REFERENCES organizations(id)

Owning org (null = system role)

name

VARCHAR(80)

NOT NULL

Role display name

slug

VARCHAR(60)

NOT NULL

Machine key: owner | admin | manager | member | viewer

description

TEXT

Role description

is_system

BOOLEAN

NOT NULL DEFAULT false

System-managed role (non-deletable)

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

UNIQUE

(organization_id, slug)

Slug unique per org

core.permissions

Granular permission definitions. Structured as module:resource:action (e.g. sales:orders:create). System-level, not org-specific.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

Unique permission ID

module

VARCHAR(50)

NOT NULL

Domain: sales, procurement, hr, accounting …

resource

VARCHAR(60)

NOT NULL

Resource: orders, invoices, employees …

action

VARCHAR(30)

NOT NULL

create | read | update | delete | export | approve

slug

VARCHAR(120)


### UNIQUE NOT NULL

Composite key: module:resource:action

description

TEXT

Human-readable description

UNIQUE

(module, resource, action)

Composite uniqueness

core.role_permissions

Many-to-many mapping of permissions to roles.

Column

Type

Constraints

Description

role_id (FK)

BIGINT

REFERENCES roles(id) NOT NULL

Role

permission_id (FK)

BIGINT

REFERENCES permissions(id) NOT NULL

Permission granted

granted_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

When permission was granted

granted_by (FK)

BIGINT

REFERENCES users(id)

Admin who granted it


### PRIMARY KEY

(role_id, permission_id)

Composite PK

core.member_roles

Maps roles to organization members. A member can hold multiple roles within an org.

Column

Type

Constraints

Description

member_id (FK)

BIGINT

REFERENCES organization_members(id) NOT NULL

Org member

role_id (FK)

BIGINT

REFERENCES roles(id) NOT NULL

Assigned role

branch_id (FK)

BIGINT

REFERENCES branches(id)

Scope to branch (null = all branches)

granted_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

Assignment timestamp

granted_by (FK)

BIGINT

REFERENCES users(id)

Admin who assigned role


### PRIMARY KEY

(member_id, role_id)

Composite PK

core.organization_settings

Key-value settings per organization. Covers module toggles, display preferences, integration keys.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

Unique setting ID

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

Owning org

key

VARCHAR(100)

NOT NULL

Setting key e.g. modules.sales.enabled

value

JSONB

NOT NULL DEFAULT 'null'

Setting value (any JSON type)

description

TEXT

What this setting controls

updated_by (FK)

BIGINT

REFERENCES users(id)

Who last changed it

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

UNIQUE

(organization_id, key)

One value per key per org

core.user_sessions

Active JWT/refresh token sessions for security monitoring.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

Session ID

user_id (FK)

BIGINT

REFERENCES users(id) NOT NULL

Session owner

organization_id (FK)

BIGINT

REFERENCES organizations(id)

Active org context

refresh_token_hash

TEXT

NOT NULL

Hashed refresh token

ip_address

INET

Client IP

user_agent

TEXT

Browser/app user agent

expires_at

TIMESTAMPTZ

NOT NULL

Token expiry

revoked_at

TIMESTAMPTZ

Manual revocation timestamp

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

core.audit_logs

Immutable audit trail. Written via database trigger or NestJS interceptor. Never updated or deleted.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

Log entry ID

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

Tenant scope

branch_id (FK)

BIGINT

REFERENCES branches(id)

Branch context if applicable

user_id (FK)

BIGINT

REFERENCES users(id)

Acting user (null = system)

action

VARCHAR(50)

NOT NULL


### CREATE | UPDATE | DELETE | LOGIN | EXPORT | APPROVE …

module

VARCHAR(50)

NOT NULL

Domain module name

resource

VARCHAR(80)

NOT NULL

Table/resource name

record_id

BIGINT

Affected record primary key

record_ref

VARCHAR(100)

Human-readable ref (order_number, etc.)

old_values

JSONB

Before-state snapshot

new_values

JSONB

After-state snapshot

ip_address

INET

Client IP

user_agent

TEXT

Client info

metadata

JSONB

Extra context (request_id, correlation_id …)

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

Immutable timestamp

core.notifications

In-app and push notification log per user.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

Notification ID

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

Tenant scope

user_id (FK)

BIGINT

REFERENCES users(id) NOT NULL

Target user

type

VARCHAR(60)

NOT NULL

Category: approval_needed, invoice_due, ticket_assigned …

title

VARCHAR(200)

NOT NULL

Short title

body

TEXT

Notification message

action_url

TEXT

Deep-link URL

is_read

BOOLEAN

NOT NULL DEFAULT false

Read flag

read_at

TIMESTAMPTZ

When read

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()


## SHARED / GLOBAL TABLES

Referenced by all domain modules. Eliminates duplication across the schema.

shared.countries

ISO country reference — system-wide, no org scope.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

name

VARCHAR(100)

NOT NULL

Country name

iso2

CHAR(2)


### UNIQUE NOT NULL

ISO 3166-1 alpha-2

iso3

CHAR(3)


### UNIQUE NOT NULL

ISO 3166-1 alpha-3

phone_prefix

VARCHAR(10)

e.g. +961

currency_id (FK)

BIGINT

REFERENCES currencies(id)

Default currency

shared.currencies

Currency master. Exchange rates updated periodically (scheduled job).

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

code

CHAR(3)


### UNIQUE NOT NULL

ISO 4217 code: USD, EUR, LBP …

name

VARCHAR(80)

NOT NULL

Full name

symbol

VARCHAR(5)

Display symbol: $, €, £

exchange_rate

DECIMAL(20,8)

NOT NULL DEFAULT 1

Rate vs base currency

is_base

BOOLEAN

NOT NULL DEFAULT false

System base currency flag

decimal_places

SMALLINT

NOT NULL DEFAULT 2

Display decimal precision

is_active

BOOLEAN

NOT NULL DEFAULT true

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

Rate last updated

shared.addresses

Reusable address entity. Referenced by organizations, branches, customers, suppliers, employees, etc.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id)

Owning org (null = system)

label

VARCHAR(60)

billing | shipping | home | office

line1

VARCHAR(200)

NOT NULL

Street address line 1

line2

VARCHAR(200)

Line 2 (apt, floor, etc.)

city

VARCHAR(100)

City

state

VARCHAR(100)

State / governorate

postal_code

VARCHAR(20)

ZIP / postal code

country_id (FK)

BIGINT

REFERENCES countries(id) NOT NULL

Country

latitude

DECIMAL(9,6)

GPS latitude

longitude

DECIMAL(9,6)

GPS longitude

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

shared.contacts

Reusable contact persons — referenced by customers, suppliers, leads, etc.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

Owning org

first_name

VARCHAR(80)

NOT NULL

last_name

VARCHAR(80)

email

VARCHAR(150)

phone

VARCHAR(30)

mobile

VARCHAR(30)

title

VARCHAR(80)

Job title

department

VARCHAR(80)

is_primary

BOOLEAN

NOT NULL DEFAULT false

Primary contact flag

notes

TEXT

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

shared.attachments

File/document attachments. Polymorphic via (entity_type, entity_id). Storage backed by S3/object store.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

Tenant scope

entity_type

VARCHAR(80)

NOT NULL

Table name: invoices, purchase_orders …

entity_id

BIGINT

NOT NULL

PK of related record

filename

VARCHAR(255)

NOT NULL

Original file name

file_key

TEXT

NOT NULL

Object storage key

mime_type

VARCHAR(80)

MIME type

size_bytes

BIGINT

File size

uploaded_by (FK)

BIGINT

REFERENCES users(id)

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

shared.tags

Polymorphic tagging system for any entity.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

name

VARCHAR(60)

NOT NULL

Tag label

color

VARCHAR(7)

Hex color #RRGGBB

module

VARCHAR(50)

Scope to module, or null = global

UNIQUE

(organization_id, name, module)

shared.entity_tags

Many-to-many tag assignments.

Column

Type

Constraints

Description

tag_id (FK)

BIGINT

REFERENCES tags(id) NOT NULL

entity_type

VARCHAR(80)

NOT NULL

Tagged table name

entity_id

BIGINT

NOT NULL

Tagged record ID

tagged_by (FK)

BIGINT

REFERENCES users(id)

tagged_at

TIMESTAMPTZ

NOT NULL DEFAULT now()


### PRIMARY KEY

(tag_id, entity_type, entity_id)

shared.units_of_measure

UoM definitions. Org-level (allows custom units) plus system-level defaults.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id)

null = system default

name

VARCHAR(60)

NOT NULL

e.g. Kilogram

symbol

VARCHAR(20)

NOT NULL

e.g. kg

category

VARCHAR(30)

weight | volume | count | length | area | time

base_factor

DECIMAL(20,8)

NOT NULL DEFAULT 1

Conversion factor to SI base

is_active

BOOLEAN

NOT NULL DEFAULT true

shared.taxes

Tax rules per org. Supports VAT, GST, withholding, etc.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

name

VARCHAR(100)

NOT NULL

e.g. VAT 11%

code

VARCHAR(20)

NOT NULL

Short code

type

VARCHAR(20)

NOT NULL

percentage | fixed | compound

rate

DECIMAL(8,4)

NOT NULL

Rate value (e.g. 11.0000)

applies_to

VARCHAR(20)

NOT NULL DEFAULT 'both'

sales | purchases | both

gl_account_id (FK)

BIGINT

REFERENCES gl_accounts(id)

Linked GL account

is_active

BOOLEAN

NOT NULL DEFAULT true

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

UNIQUE

(organization_id, code)

shared.payment_terms

Reusable payment terms (Net 30, COD, etc.).

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

name

VARCHAR(80)

NOT NULL

e.g. Net 30

due_days

INT

NOT NULL DEFAULT 0

Days until payment due

early_discount_days

INT

DEFAULT 0

Days for early discount

early_discount_pct

DECIMAL(5,2)

DEFAULT 0

% discount for early payment

is_active

BOOLEAN

NOT NULL DEFAULT true

shared.number_sequences

Controls auto-numbering for orders, invoices, POs, etc. per org per type.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

module

VARCHAR(50)

NOT NULL

sales | procurement | accounting …

document_type

VARCHAR(60)

NOT NULL

sales_order | invoice | purchase_order …

prefix

VARCHAR(20)

e.g. SO- | INV- | PO-

suffix

VARCHAR(20)

Optional suffix

next_number

INT

NOT NULL DEFAULT 1

Next available number

padding

SMALLINT

NOT NULL DEFAULT 5

Zero-padding width

reset_frequency

VARCHAR(10)

DEFAULT 'never'

never | yearly | monthly

UNIQUE

(organization_id, module, document_type)


## SALES MODULE

sales.customers

Customer master. Scoped per org. Linked to contacts and addresses via polymorphic refs.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

Owning branch

code

VARCHAR(30)

NOT NULL

Customer code (auto or manual)

name

VARCHAR(200)

NOT NULL

Customer / company name

type

VARCHAR(20)

NOT NULL DEFAULT 'company'

individual | company | government

email

VARCHAR(150)

phone

VARCHAR(30)

website

VARCHAR(200)

industry

VARCHAR(100)

segment

VARCHAR(50)

vip | wholesale | retail | distributor

credit_limit

DECIMAL(18,2)

NOT NULL DEFAULT 0

outstanding_balance

DECIMAL(18,2)

NOT NULL DEFAULT 0

Computed/cached AR balance

payment_terms_id (FK)

BIGINT

REFERENCES payment_terms(id)

currency_id (FK)

BIGINT

REFERENCES currencies(id)

tax_id

VARCHAR(50)

VAT / TIN registration number

pricelist_id (FK)

BIGINT

REFERENCES price_lists(id)

Default price list

billing_address_id (FK)

BIGINT

REFERENCES addresses(id)

shipping_address_id (FK)

BIGINT

REFERENCES addresses(id)

notes

TEXT

is_active

BOOLEAN

NOT NULL DEFAULT true

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

created_by (FK)

BIGINT

REFERENCES users(id)

deleted_at

TIMESTAMPTZ

UNIQUE

(organization_id, code)

sales.price_lists

Pricing tiers per org. Items reference products with overridden prices.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

name

VARCHAR(100)

NOT NULL

currency_id (FK)

BIGINT

REFERENCES currencies(id) NOT NULL

discount_pct

DECIMAL(5,2)

DEFAULT 0

Global discount applied on top

valid_from

DATE

valid_to

DATE

is_active

BOOLEAN

NOT NULL DEFAULT true

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

sales.price_list_items

Per-product overrides within a price list.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

pricelist_id (FK)

BIGINT

REFERENCES price_lists(id) NOT NULL

product_id (FK)

BIGINT

REFERENCES products(id) NOT NULL

min_qty

DECIMAL(18,4)

NOT NULL DEFAULT 1

Min qty to get this price

price

DECIMAL(18,4)

NOT NULL

Override unit price

discount_pct

DECIMAL(5,2)

DEFAULT 0

sales.quotations

Sales quotes. Converts to sales_orders on acceptance.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

number

VARCHAR(50)

NOT NULL

Auto-generated: QT-00001

customer_id (FK)

BIGINT

REFERENCES customers(id) NOT NULL

salesperson_id (FK)

BIGINT

REFERENCES users(id)

issue_date

DATE

NOT NULL

expiry_date

DATE

status

VARCHAR(20)

NOT NULL DEFAULT 'draft'

draft | sent | accepted | rejected | expired

currency_id (FK)

BIGINT

REFERENCES currencies(id) NOT NULL

exchange_rate

DECIMAL(18,6)

NOT NULL DEFAULT 1

subtotal

DECIMAL(18,2)

NOT NULL DEFAULT 0

discount_amount

DECIMAL(18,2)

NOT NULL DEFAULT 0

tax_amount

DECIMAL(18,2)

NOT NULL DEFAULT 0

total_amount

DECIMAL(18,2)

NOT NULL DEFAULT 0

notes

TEXT

terms

TEXT

Custom T&C

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

created_by (FK)

BIGINT

REFERENCES users(id)

deleted_at

TIMESTAMPTZ

UNIQUE

(organization_id, number)

sales.quotation_lines

Line items on a quotation.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

quotation_id (FK)

BIGINT

REFERENCES quotations(id) NOT NULL

product_id (FK)

BIGINT

REFERENCES products(id) NOT NULL

description

TEXT

Override description

quantity

DECIMAL(18,4)

NOT NULL

unit_id (FK)

BIGINT

REFERENCES units_of_measure(id)

unit_price

DECIMAL(18,4)

NOT NULL

discount_pct

DECIMAL(5,2)

DEFAULT 0

tax_id (FK)

BIGINT

REFERENCES taxes(id)

tax_amount

DECIMAL(18,2)

NOT NULL DEFAULT 0

line_total

DECIMAL(18,2)

NOT NULL

sort_order

INT

DEFAULT 0

sales.sales_orders

Confirmed orders. Drives inventory reservation, fulfillment and invoicing.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

number

VARCHAR(50)

NOT NULL

Auto-generated: SO-00001

quotation_id (FK)

BIGINT

REFERENCES quotations(id)

Source quotation

customer_id (FK)

BIGINT

REFERENCES customers(id) NOT NULL

salesperson_id (FK)

BIGINT

REFERENCES users(id)

order_date

DATE

NOT NULL

requested_delivery

DATE

confirmed_delivery

DATE

status

VARCHAR(30)

NOT NULL DEFAULT 'draft'

draft | confirmed | processing | shipped | completed | cancelled

payment_terms_id (FK)

BIGINT

REFERENCES payment_terms(id)

currency_id (FK)

BIGINT

REFERENCES currencies(id) NOT NULL

exchange_rate

DECIMAL(18,6)

NOT NULL DEFAULT 1

subtotal

DECIMAL(18,2)

NOT NULL DEFAULT 0

discount_amount

DECIMAL(18,2)

NOT NULL DEFAULT 0

tax_amount

DECIMAL(18,2)

NOT NULL DEFAULT 0

shipping_cost

DECIMAL(18,2)

NOT NULL DEFAULT 0

total_amount

DECIMAL(18,2)

NOT NULL DEFAULT 0

warehouse_id (FK)

BIGINT

REFERENCES warehouses(id)

Fulfillment warehouse

customer_po_ref

VARCHAR(100)

Customer's own PO number

billing_address_id (FK)

BIGINT

REFERENCES addresses(id)

shipping_address_id (FK)

BIGINT

REFERENCES addresses(id)

notes

TEXT

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

created_by (FK)

BIGINT

REFERENCES users(id)

deleted_at

TIMESTAMPTZ

UNIQUE

(organization_id, number)

sales.sales_order_lines

Line items on a sales order. Tracks delivered and invoiced quantities.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

sales_order_id (FK)

BIGINT

REFERENCES sales_orders(id) NOT NULL

product_id (FK)

BIGINT

REFERENCES products(id) NOT NULL

description

TEXT

qty_ordered

DECIMAL(18,4)

NOT NULL

qty_delivered

DECIMAL(18,4)

NOT NULL DEFAULT 0

qty_invoiced

DECIMAL(18,4)

NOT NULL DEFAULT 0

unit_id (FK)

BIGINT

REFERENCES units_of_measure(id)

unit_price

DECIMAL(18,4)

NOT NULL

discount_pct

DECIMAL(5,2)

DEFAULT 0

tax_id (FK)

BIGINT

REFERENCES taxes(id)

tax_amount

DECIMAL(18,2)

NOT NULL DEFAULT 0

line_total

DECIMAL(18,2)

NOT NULL

sort_order

INT

DEFAULT 0

sales.deliveries

Shipment/delivery records against sales orders.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

number

VARCHAR(50)

NOT NULL

sales_order_id (FK)

BIGINT

REFERENCES sales_orders(id) NOT NULL

warehouse_id (FK)

BIGINT

REFERENCES warehouses(id)

carrier

VARCHAR(100)

tracking_number

VARCHAR(100)

ship_date

DATE

expected_arrival

DATE

status

VARCHAR(20)

NOT NULL DEFAULT 'pending'

pending | shipped | in_transit | delivered | returned

notes

TEXT

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

created_by (FK)

BIGINT

REFERENCES users(id)

sales.delivery_lines

Items fulfilled in a delivery.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

delivery_id (FK)

BIGINT

REFERENCES deliveries(id) NOT NULL

order_line_id (FK)

BIGINT

REFERENCES sales_order_lines(id) NOT NULL

qty_delivered

DECIMAL(18,4)

NOT NULL

lot_number

VARCHAR(100)

serial_number

VARCHAR(100)


## PROCUREMENT & SRM

procurement.suppliers

Supplier master. Mirror structure to customers for consistency.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

code

VARCHAR(30)

NOT NULL

name

VARCHAR(200)

NOT NULL

type

VARCHAR(30)

manufacturer | distributor | service | freelancer

email

VARCHAR(150)

phone

VARCHAR(30)

payment_terms_id (FK)

BIGINT

REFERENCES payment_terms(id)

currency_id (FK)

BIGINT

REFERENCES currencies(id)

lead_time_days

INT

DEFAULT 0

Average lead time

rating

DECIMAL(3,1)

CHECK (rating BETWEEN 0 AND 5)

tax_id

VARCHAR(50)

Supplier VAT/TIN

billing_address_id (FK)

BIGINT

REFERENCES addresses(id)

is_approved

BOOLEAN

NOT NULL DEFAULT false

Supplier approval status

approved_by (FK)

BIGINT

REFERENCES users(id)

approved_at

TIMESTAMPTZ

is_active

BOOLEAN

NOT NULL DEFAULT true

notes

TEXT

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

created_by (FK)

BIGINT

REFERENCES users(id)

deleted_at

TIMESTAMPTZ

UNIQUE

(organization_id, code)

procurement.supplier_contracts

Formal supplier agreements with validity, value and renewal tracking.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

supplier_id (FK)

BIGINT

REFERENCES suppliers(id) NOT NULL

number

VARCHAR(50)

NOT NULL

start_date

DATE

NOT NULL

end_date

DATE

value

DECIMAL(18,2)

currency_id (FK)

BIGINT

REFERENCES currencies(id)

renewal_type

VARCHAR(20)

DEFAULT 'manual'

manual | auto

status

VARCHAR(20)

NOT NULL DEFAULT 'active'

active | expired | terminated

notes

TEXT

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

created_by (FK)

BIGINT

REFERENCES users(id)

procurement.purchase_requests

Internal purchase requisitions — optional step before RFQ/PO.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

number

VARCHAR(50)

NOT NULL

requested_by (FK)

BIGINT

REFERENCES users(id) NOT NULL

dept_id (FK)

BIGINT

REFERENCES departments(id)

needed_by

DATE

status

VARCHAR(20)

NOT NULL DEFAULT 'draft'

draft | submitted | approved | rejected | ordered

approved_by (FK)

BIGINT

REFERENCES users(id)

approved_at

TIMESTAMPTZ

notes

TEXT

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

procurement.rfqs

Requests for Quotation sent to one or more suppliers.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

number

VARCHAR(50)

NOT NULL

supplier_id (FK)

BIGINT

REFERENCES suppliers(id) NOT NULL

request_id (FK)

BIGINT

REFERENCES purchase_requests(id)

Source PR

issue_date

DATE

NOT NULL

deadline

DATE

status

VARCHAR(20)

NOT NULL DEFAULT 'draft'

draft | sent | received | closed

notes

TEXT

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

created_by (FK)

BIGINT

REFERENCES users(id)

procurement.rfq_lines

Items requested in an RFQ.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

rfq_id (FK)

BIGINT

REFERENCES rfqs(id) NOT NULL

product_id (FK)

BIGINT

REFERENCES products(id) NOT NULL

quantity

DECIMAL(18,4)

NOT NULL

unit_id (FK)

BIGINT

REFERENCES units_of_measure(id)

quoted_price

DECIMAL(18,4)

Supplier's quoted price

lead_time_days

INT

procurement.purchase_orders

Official POs issued to suppliers. Creates AP and inventory inbound.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

number

VARCHAR(50)

NOT NULL

rfq_id (FK)

BIGINT

REFERENCES rfqs(id)

supplier_id (FK)

BIGINT

REFERENCES suppliers(id) NOT NULL

buyer_id (FK)

BIGINT

REFERENCES users(id)

order_date

DATE

NOT NULL

expected_delivery

DATE

status

VARCHAR(30)

NOT NULL DEFAULT 'draft'

draft | sent | acknowledged | partial | received | cancelled

currency_id (FK)

BIGINT

REFERENCES currencies(id) NOT NULL

exchange_rate

DECIMAL(18,6)

NOT NULL DEFAULT 1

payment_terms_id (FK)

BIGINT

REFERENCES payment_terms(id)

subtotal

DECIMAL(18,2)

NOT NULL DEFAULT 0

tax_amount

DECIMAL(18,2)

NOT NULL DEFAULT 0

total_amount

DECIMAL(18,2)

NOT NULL DEFAULT 0

warehouse_id (FK)

BIGINT

REFERENCES warehouses(id)

notes

TEXT

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

created_by (FK)

BIGINT

REFERENCES users(id)

UNIQUE

(organization_id, number)

procurement.purchase_order_lines

PO line items. Tracks received and billed quantities.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

purchase_order_id (FK)

BIGINT

REFERENCES purchase_orders(id) NOT NULL

product_id (FK)

BIGINT

REFERENCES products(id) NOT NULL

qty_ordered

DECIMAL(18,4)

NOT NULL

qty_received

DECIMAL(18,4)

NOT NULL DEFAULT 0

qty_billed

DECIMAL(18,4)

NOT NULL DEFAULT 0

unit_id (FK)

BIGINT

REFERENCES units_of_measure(id)

unit_price

DECIMAL(18,4)

NOT NULL

tax_id (FK)

BIGINT

REFERENCES taxes(id)

tax_amount

DECIMAL(18,2)

NOT NULL DEFAULT 0

line_total

DECIMAL(18,2)

NOT NULL

procurement.goods_receipts

Records goods arriving at warehouse. Updates inventory.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

number

VARCHAR(50)

NOT NULL

purchase_order_id (FK)

BIGINT

REFERENCES purchase_orders(id) NOT NULL

warehouse_id (FK)

BIGINT

REFERENCES warehouses(id) NOT NULL

receipt_date

DATE

NOT NULL

received_by (FK)

BIGINT

REFERENCES users(id)

status

VARCHAR(20)

NOT NULL DEFAULT 'pending'

pending | partial | complete

notes

TEXT

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

procurement.goods_receipt_lines

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

goods_receipt_id (FK)

BIGINT

REFERENCES goods_receipts(id) NOT NULL

po_line_id (FK)

BIGINT

REFERENCES purchase_order_lines(id) NOT NULL

qty_received

DECIMAL(18,4)

NOT NULL

lot_number

VARCHAR(100)

expiry_date

DATE

condition

VARCHAR(20)

DEFAULT 'good'

good | damaged | rejected

procurement.supplier_evaluations

Periodic performance scorecards per supplier.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

supplier_id (FK)

BIGINT

REFERENCES suppliers(id) NOT NULL

period

VARCHAR(20)

NOT NULL

e.g. 2024-Q1

quality_score

DECIMAL(3,1)

0-5

delivery_score

DECIMAL(3,1)

price_score

DECIMAL(3,1)

service_score

DECIMAL(3,1)

overall_score

DECIMAL(3,1)

evaluated_by (FK)

BIGINT

REFERENCES users(id)

notes

TEXT

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()


## INVENTORY (Shared)

inventory.warehouses

Warehouse locations per org/branch.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

name

VARCHAR(100)

NOT NULL

code

VARCHAR(20)

NOT NULL

address_id (FK)

BIGINT

REFERENCES addresses(id)

manager_id (FK)

BIGINT

REFERENCES users(id)

is_active

BOOLEAN

NOT NULL DEFAULT true

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

UNIQUE

(organization_id, code)

inventory.product_categories

Hierarchical product categories per org.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

name

VARCHAR(100)

NOT NULL

parent_id (FK)

BIGINT

REFERENCES product_categories(id)

description

TEXT

inventory.products

Product/service master. Central entity referenced across all modules.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

sku

VARCHAR(100)

NOT NULL

name

VARCHAR(200)

NOT NULL

description

TEXT

category_id (FK)

BIGINT

REFERENCES product_categories(id)

type

VARCHAR(20)

NOT NULL DEFAULT 'storable'

storable | consumable | service

unit_id (FK)

BIGINT

REFERENCES units_of_measure(id)

cost_price

DECIMAL(18,4)

NOT NULL DEFAULT 0

sale_price

DECIMAL(18,4)

NOT NULL DEFAULT 0

tax_id (FK)

BIGINT

REFERENCES taxes(id)

barcode

VARCHAR(100)

weight_kg

DECIMAL(10,4)

is_manufactured

BOOLEAN

NOT NULL DEFAULT false

is_purchased

BOOLEAN

NOT NULL DEFAULT true

is_sold

BOOLEAN

NOT NULL DEFAULT true

lifecycle_stage

VARCHAR(30)

DEFAULT 'active'

concept | development | active | eol | discontinued

is_active

BOOLEAN

NOT NULL DEFAULT true

image_url

TEXT

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

created_by (FK)

BIGINT

REFERENCES users(id)

deleted_at

TIMESTAMPTZ

UNIQUE

(organization_id, sku)

inventory.product_variants

SKU variants (size, color, etc.) per product.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

product_id (FK)

BIGINT

REFERENCES products(id) NOT NULL

sku

VARCHAR(100)

NOT NULL

attributes

JSONB

{color: "red", size: "M"}

cost_price

DECIMAL(18,4)

Override if different

sale_price

DECIMAL(18,4)

barcode

VARCHAR(100)

is_active

BOOLEAN

NOT NULL DEFAULT true

inventory.inventory

Stock on hand per product/variant/warehouse. Updated by goods receipts, deliveries, and adjustments.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

product_id (FK)

BIGINT

REFERENCES products(id) NOT NULL

variant_id (FK)

BIGINT

REFERENCES product_variants(id)

warehouse_id (FK)

BIGINT

REFERENCES warehouses(id) NOT NULL

qty_on_hand

DECIMAL(18,4)

NOT NULL DEFAULT 0

qty_reserved

DECIMAL(18,4)

NOT NULL DEFAULT 0

Reserved by sales orders

qty_available

DECIMAL(18,4)

GENERATED ALWAYS AS (qty_on_hand - qty_reserved) STORED

qty_incoming

DECIMAL(18,4)

NOT NULL DEFAULT 0

In-transit from POs

reorder_point

DECIMAL(18,4)

DEFAULT 0

reorder_qty

DECIMAL(18,4)

DEFAULT 0

last_counted_at

TIMESTAMPTZ

Last physical count

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

UNIQUE

(product_id, variant_id, warehouse_id)

inventory.inventory_movements

Immutable ledger of every stock movement. Source of truth for all inventory changes.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

product_id (FK)

BIGINT

REFERENCES products(id) NOT NULL

variant_id (FK)

BIGINT

REFERENCES product_variants(id)

warehouse_id (FK)

BIGINT

REFERENCES warehouses(id) NOT NULL

movement_type

VARCHAR(30)

NOT NULL

receipt | delivery | adjustment | transfer | return | scrap

quantity

DECIMAL(18,4)

NOT NULL

Positive = in, negative = out

unit_cost

DECIMAL(18,4)

reference_type

VARCHAR(60)

goods_receipts | deliveries | …

reference_id

BIGINT

ID of source document

lot_number

VARCHAR(100)

moved_by (FK)

BIGINT

REFERENCES users(id)

moved_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

notes

TEXT


## PRODUCTION & PLM

production.bill_of_materials

BOM header. One BOM per product version.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

product_id (FK)

BIGINT

REFERENCES products(id) NOT NULL

version

VARCHAR(20)

NOT NULL DEFAULT '1.0'

output_qty

DECIMAL(18,4)

NOT NULL DEFAULT 1

Qty produced by this BOM

unit_id (FK)

BIGINT

REFERENCES units_of_measure(id)

is_active

BOOLEAN

NOT NULL DEFAULT true

effective_from

DATE

notes

TEXT

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

created_by (FK)

BIGINT

REFERENCES users(id)

production.bom_components

Components consumed by a BOM.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

bom_id (FK)

BIGINT

REFERENCES bill_of_materials(id) NOT NULL

component_id (FK)

BIGINT

REFERENCES products(id) NOT NULL

quantity

DECIMAL(18,4)

NOT NULL

unit_id (FK)

BIGINT

REFERENCES units_of_measure(id)

scrap_pct

DECIMAL(5,2)

DEFAULT 0

is_optional

BOOLEAN

DEFAULT false

notes

TEXT

production.work_centers

Manufacturing machines or stations.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

name

VARCHAR(100)

NOT NULL

code

VARCHAR(30)

NOT NULL

capacity_per_hour

DECIMAL(10,2)

cost_per_hour

DECIMAL(10,2)

is_active

BOOLEAN

NOT NULL DEFAULT true

production.work_orders

Manufacturing production orders.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

number

VARCHAR(50)

NOT NULL

product_id (FK)

BIGINT

REFERENCES products(id) NOT NULL

bom_id (FK)

BIGINT

REFERENCES bill_of_materials(id)

sales_order_id (FK)

BIGINT

REFERENCES sales_orders(id)

Triggered by SO

qty_planned

DECIMAL(18,4)

NOT NULL

qty_produced

DECIMAL(18,4)

NOT NULL DEFAULT 0

qty_scrapped

DECIMAL(18,4)

NOT NULL DEFAULT 0

planned_start

TIMESTAMPTZ

planned_end

TIMESTAMPTZ

actual_start

TIMESTAMPTZ

actual_end

TIMESTAMPTZ

status

VARCHAR(20)

NOT NULL DEFAULT 'draft'

draft | confirmed | in_progress | done | cancelled

notes

TEXT

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

created_by (FK)

BIGINT

REFERENCES users(id)

production.product_lifecycle_events

Immutable log of PLM stage transitions.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

product_id (FK)

BIGINT

REFERENCES products(id) NOT NULL

from_stage

VARCHAR(30)

to_stage

VARCHAR(30)

NOT NULL

changed_by (FK)

BIGINT

REFERENCES users(id)

reason

TEXT

changed_at

TIMESTAMPTZ

NOT NULL DEFAULT now()


## ACCOUNTING & FINANCE

accounting.fiscal_years

Fiscal year periods per org.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

name

VARCHAR(50)

NOT NULL

e.g. FY2024

start_date

DATE

NOT NULL

end_date

DATE

NOT NULL

status

VARCHAR(20)

NOT NULL DEFAULT 'open'

open | closed

accounting.accounting_periods

Monthly/quarterly periods. Locking a period prevents further postings.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

fiscal_year_id (FK)

BIGINT

REFERENCES fiscal_years(id) NOT NULL

name

VARCHAR(50)

NOT NULL

start_date

DATE

NOT NULL

end_date

DATE

NOT NULL

status

VARCHAR(20)

NOT NULL DEFAULT 'open'

open | closed | locked

accounting.gl_accounts

Chart of Accounts. Hierarchical tree structure.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

code

VARCHAR(30)

NOT NULL

Account number/code

name

VARCHAR(200)

NOT NULL

type

VARCHAR(30)

NOT NULL

asset | liability | equity | revenue | expense

subtype

VARCHAR(50)

current_asset | fixed_asset | payable | receivable …

parent_id (FK)

BIGINT

REFERENCES gl_accounts(id)

Parent in hierarchy

currency_id (FK)

BIGINT

REFERENCES currencies(id)

is_reconcilable

BOOLEAN

NOT NULL DEFAULT false

is_active

BOOLEAN

NOT NULL DEFAULT true

UNIQUE

(organization_id, code)

accounting.journal_entries

GL journal entry headers. Must balance (total_debit = total_credit).

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

number

VARCHAR(50)

NOT NULL

period_id (FK)

BIGINT

REFERENCES accounting_periods(id) NOT NULL

entry_date

DATE

NOT NULL

type

VARCHAR(30)

NOT NULL

manual | sales | purchase | payment | payroll | depreciation

reference

VARCHAR(100)

External doc reference

description

TEXT

total_debit

DECIMAL(18,2)

NOT NULL DEFAULT 0

total_credit

DECIMAL(18,2)

NOT NULL DEFAULT 0

status

VARCHAR(20)

NOT NULL DEFAULT 'draft'

draft | posted | cancelled

posted_by (FK)

BIGINT

REFERENCES users(id)

posted_at

TIMESTAMPTZ

currency_id (FK)

BIGINT

REFERENCES currencies(id)

exchange_rate

DECIMAL(18,6)

NOT NULL DEFAULT 1

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

created_by (FK)

BIGINT

REFERENCES users(id)

accounting.journal_entry_lines

Debit/credit lines. Each JE must have at least 2 lines that balance.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

journal_entry_id (FK)

BIGINT

REFERENCES journal_entries(id) NOT NULL

account_id (FK)

BIGINT

REFERENCES gl_accounts(id) NOT NULL

debit

DECIMAL(18,2)

NOT NULL DEFAULT 0

credit

DECIMAL(18,2)

NOT NULL DEFAULT 0

description

TEXT

partner_type

VARCHAR(20)

customer | supplier

partner_id

BIGINT

customer or supplier ID

accounting.invoices

Customer invoices (AR). Auto-posts a journal entry on posting.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

number

VARCHAR(50)

NOT NULL

type

VARCHAR(20)

NOT NULL DEFAULT 'invoice'

invoice | credit_note | debit_note

sales_order_id (FK)

BIGINT

REFERENCES sales_orders(id)

customer_id (FK)

BIGINT

REFERENCES customers(id) NOT NULL

invoice_date

DATE

NOT NULL

due_date

DATE

NOT NULL

period_id (FK)

BIGINT

REFERENCES accounting_periods(id)

currency_id (FK)

BIGINT

REFERENCES currencies(id) NOT NULL

exchange_rate

DECIMAL(18,6)

NOT NULL DEFAULT 1

subtotal

DECIMAL(18,2)

NOT NULL DEFAULT 0

tax_amount

DECIMAL(18,2)

NOT NULL DEFAULT 0

total_amount

DECIMAL(18,2)

NOT NULL DEFAULT 0

amount_paid

DECIMAL(18,2)

NOT NULL DEFAULT 0

balance_due

DECIMAL(18,2)

NOT NULL DEFAULT 0

status

VARCHAR(20)

NOT NULL DEFAULT 'draft'

draft | posted | partial | paid | cancelled

journal_entry_id (FK)

BIGINT

REFERENCES journal_entries(id)

notes

TEXT

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

created_by (FK)

BIGINT

REFERENCES users(id)

accounting.invoice_lines

Invoice line items.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

invoice_id (FK)

BIGINT

REFERENCES invoices(id) NOT NULL

product_id (FK)

BIGINT

REFERENCES products(id)

description

TEXT

NOT NULL

quantity

DECIMAL(18,4)

NOT NULL

unit_price

DECIMAL(18,4)

NOT NULL

discount_pct

DECIMAL(5,2)

DEFAULT 0

tax_id (FK)

BIGINT

REFERENCES taxes(id)

tax_amount

DECIMAL(18,2)

NOT NULL DEFAULT 0

line_total

DECIMAL(18,2)

NOT NULL

gl_account_id (FK)

BIGINT

REFERENCES gl_accounts(id)

Revenue GL account

accounting.vendor_bills

Supplier bills (AP). Mirror of invoices for payables.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

number

VARCHAR(50)

NOT NULL

supplier_ref

VARCHAR(100)

Supplier's own invoice number

purchase_order_id (FK)

BIGINT

REFERENCES purchase_orders(id)

supplier_id (FK)

BIGINT

REFERENCES suppliers(id) NOT NULL

bill_date

DATE

NOT NULL

due_date

DATE

NOT NULL

currency_id (FK)

BIGINT

REFERENCES currencies(id) NOT NULL

subtotal

DECIMAL(18,2)

NOT NULL DEFAULT 0

tax_amount

DECIMAL(18,2)

NOT NULL DEFAULT 0

total_amount

DECIMAL(18,2)

NOT NULL DEFAULT 0

amount_paid

DECIMAL(18,2)

NOT NULL DEFAULT 0

balance_due

DECIMAL(18,2)

NOT NULL DEFAULT 0

status

VARCHAR(20)

NOT NULL DEFAULT 'draft'

draft | posted | partial | paid | cancelled

journal_entry_id (FK)

BIGINT

REFERENCES journal_entries(id)

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

created_by (FK)

BIGINT

REFERENCES users(id)

accounting.payments

Payment records for both AR and AP. Linked to bank accounts and journal entries.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

number

VARCHAR(50)

NOT NULL

direction

VARCHAR(20)

NOT NULL

inbound (AR) | outbound (AP)

invoice_id (FK)

BIGINT

REFERENCES invoices(id)

vendor_bill_id (FK)

BIGINT

REFERENCES vendor_bills(id)

payment_date

DATE

NOT NULL

amount

DECIMAL(18,2)

NOT NULL

currency_id (FK)

BIGINT

REFERENCES currencies(id)

method

VARCHAR(30)

NOT NULL

bank_transfer | cash | cheque | card

bank_account_id (FK)

BIGINT

REFERENCES bank_accounts(id)

reference

VARCHAR(100)

Cheque / wire reference

journal_entry_id (FK)

BIGINT

REFERENCES journal_entries(id)

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

created_by (FK)

BIGINT

REFERENCES users(id)

accounting.bank_accounts

Company bank accounts for cash management.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

account_name

VARCHAR(150)

NOT NULL

account_number

VARCHAR(50)

NOT NULL

bank_name

VARCHAR(150)

iban

VARCHAR(50)

swift_bic

VARCHAR(20)

currency_id (FK)

BIGINT

REFERENCES currencies(id) NOT NULL

gl_account_id (FK)

BIGINT

REFERENCES gl_accounts(id)

current_balance

DECIMAL(18,2)

NOT NULL DEFAULT 0

is_active

BOOLEAN

NOT NULL DEFAULT true


## HUMAN RESOURCES

hr.departments

Organizational departments. Hierarchical.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

name

VARCHAR(150)

NOT NULL

code

VARCHAR(20)

NOT NULL

parent_id (FK)

BIGINT

REFERENCES departments(id)

manager_id (FK)

BIGINT

REFERENCES employees(id)

cost_center

VARCHAR(50)

is_active

BOOLEAN

NOT NULL DEFAULT true

hr.job_positions

Defined job titles and levels within the org.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

title

VARCHAR(150)

NOT NULL

dept_id (FK)

BIGINT

REFERENCES departments(id)

level

VARCHAR(20)

junior | mid | senior | manager | executive

description

TEXT

is_active

BOOLEAN

NOT NULL DEFAULT true

hr.employees

HR employee records. Links to users table for system access.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

user_id (FK)

BIGINT

REFERENCES users(id)

System user account (optional)

employee_number

VARCHAR(30)

NOT NULL

first_name

VARCHAR(80)

NOT NULL

last_name

VARCHAR(80)

NOT NULL

email

VARCHAR(150)

NOT NULL

phone

VARCHAR(30)

dept_id (FK)

BIGINT

REFERENCES departments(id) NOT NULL

position_id (FK)

BIGINT

REFERENCES job_positions(id)

manager_id (FK)

BIGINT

REFERENCES employees(id)

hire_date

DATE

NOT NULL

termination_date

DATE

employment_type

VARCHAR(20)

NOT NULL

full_time | part_time | contractor

status

VARCHAR(20)

NOT NULL DEFAULT 'active'

active | on_leave | terminated

national_id

VARCHAR(50)

date_of_birth

DATE

address_id (FK)

BIGINT

REFERENCES addresses(id)

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

deleted_at

TIMESTAMPTZ

UNIQUE

(organization_id, employee_number)

hr.employee_contracts

Employment contract per employee.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

employee_id (FK)

BIGINT

REFERENCES employees(id) NOT NULL

start_date

DATE

NOT NULL

end_date

DATE

salary

DECIMAL(18,2)

NOT NULL

currency_id (FK)

BIGINT

REFERENCES currencies(id) NOT NULL

pay_frequency

VARCHAR(20)

NOT NULL

monthly | biweekly | weekly

type

VARCHAR(20)

NOT NULL

permanent | fixed_term | probation

is_active

BOOLEAN

NOT NULL DEFAULT true

notes

TEXT

hr.payroll_runs

Payroll batch header per pay period.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

period_name

VARCHAR(50)

NOT NULL

start_date

DATE

NOT NULL

end_date

DATE

NOT NULL

payment_date

DATE

NOT NULL

status

VARCHAR(20)

NOT NULL DEFAULT 'draft'

draft | confirmed | paid

total_gross

DECIMAL(18,2)

NOT NULL DEFAULT 0

total_deductions

DECIMAL(18,2)

NOT NULL DEFAULT 0

total_net

DECIMAL(18,2)

NOT NULL DEFAULT 0

journal_entry_id (FK)

BIGINT

REFERENCES journal_entries(id)

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

created_by (FK)

BIGINT

REFERENCES users(id)

hr.payroll_entries

Per-employee payslip within a payroll run.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

payroll_run_id (FK)

BIGINT

REFERENCES payroll_runs(id) NOT NULL

employee_id (FK)

BIGINT

REFERENCES employees(id) NOT NULL

base_salary

DECIMAL(18,2)

NOT NULL

allowances

DECIMAL(18,2)

NOT NULL DEFAULT 0

overtime

DECIMAL(18,2)

NOT NULL DEFAULT 0

bonuses

DECIMAL(18,2)

NOT NULL DEFAULT 0

gross_pay

DECIMAL(18,2)

NOT NULL

tax_deduction

DECIMAL(18,2)

NOT NULL DEFAULT 0

social_security

DECIMAL(18,2)

NOT NULL DEFAULT 0

other_deductions

DECIMAL(18,2)

NOT NULL DEFAULT 0

net_pay

DECIMAL(18,2)

NOT NULL

hr.attendance

Employee attendance / timekeeping records.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

employee_id (FK)

BIGINT

REFERENCES employees(id) NOT NULL

date

DATE

NOT NULL

clock_in

TIMESTAMPTZ

clock_out

TIMESTAMPTZ

hours_worked

DECIMAL(5,2)

NOT NULL DEFAULT 0

overtime_hours

DECIMAL(5,2)

NOT NULL DEFAULT 0

source

VARCHAR(20)

DEFAULT 'manual'

biometric | manual | app

notes

TEXT

hr.leave_types

Leave policy types per org.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

name

VARCHAR(100)

NOT NULL

e.g. Annual Leave, Sick Leave

max_days_per_year

INT

is_paid

BOOLEAN

NOT NULL DEFAULT true

requires_approval

BOOLEAN

NOT NULL DEFAULT true

hr.leave_requests

Employee leave applications with approval workflow.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

employee_id (FK)

BIGINT

REFERENCES employees(id) NOT NULL

leave_type_id (FK)

BIGINT

REFERENCES leave_types(id) NOT NULL

start_date

DATE

NOT NULL

end_date

DATE

NOT NULL

days

DECIMAL(5,1)

NOT NULL

status

VARCHAR(20)

NOT NULL DEFAULT 'pending'

pending | approved | rejected | cancelled

approved_by (FK)

BIGINT

REFERENCES employees(id)

approved_at

TIMESTAMPTZ

reason

TEXT

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

hr.recruitment_jobs

Open job vacancies.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

title

VARCHAR(150)

NOT NULL

dept_id (FK)

BIGINT

REFERENCES departments(id)

position_id (FK)

BIGINT

REFERENCES job_positions(id)

description

TEXT

vacancies

INT

NOT NULL DEFAULT 1

status

VARCHAR(20)

NOT NULL DEFAULT 'open'

open | closed | cancelled

deadline

DATE

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

hr.job_applications

Applications for open vacancies.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

job_id (FK)

BIGINT

REFERENCES recruitment_jobs(id) NOT NULL

applicant_name

VARCHAR(150)

NOT NULL

email

VARCHAR(150)

NOT NULL

phone

VARCHAR(30)

resume_url

TEXT

stage

VARCHAR(30)

NOT NULL DEFAULT 'applied'

applied | screening | interview | offer | hired | rejected

score

INT

notes

TEXT

applied_at

TIMESTAMPTZ

NOT NULL DEFAULT now()


## CORPORATE PERFORMANCE & GOVERNANCE

governance.strategic_objectives

High-level org objectives tied to fiscal years.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

title

VARCHAR(200)

NOT NULL

description

TEXT

owner_id (FK)

BIGINT

REFERENCES employees(id)

fiscal_year_id (FK)

BIGINT

REFERENCES fiscal_years(id)

status

VARCHAR(20)

NOT NULL DEFAULT 'on_track'

on_track | at_risk | achieved | failed

priority

VARCHAR(10)

DEFAULT 'medium'

high | medium | low

governance.kpis

Key Performance Indicators linked to objectives.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

name

VARCHAR(200)

NOT NULL

description

TEXT

Formula and measurement method

objective_id (FK)

BIGINT

REFERENCES strategic_objectives(id)

owner_id (FK)

BIGINT

REFERENCES employees(id)

unit

VARCHAR(50)

%, $, count, days …

frequency

VARCHAR(20)

NOT NULL

daily | weekly | monthly | quarterly

target_value

DECIMAL(18,4)

direction

VARCHAR(10)

DEFAULT 'higher'

higher | lower (which is better)

is_active

BOOLEAN

NOT NULL DEFAULT true

governance.kpi_values

Actual KPI measurements per period.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

kpi_id (FK)

BIGINT

REFERENCES kpis(id) NOT NULL

period

VARCHAR(30)

NOT NULL

e.g. 2024-03

actual_value

DECIMAL(18,4)

NOT NULL

target_value

DECIMAL(18,4)

variance

DECIMAL(18,4)

notes

TEXT

recorded_by (FK)

BIGINT

REFERENCES users(id)

recorded_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

governance.risks

Enterprise risk register.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

title

VARCHAR(200)

NOT NULL

description

TEXT

category

VARCHAR(50)

operational | financial | strategic | compliance | IT

owner_id (FK)

BIGINT

REFERENCES employees(id)

likelihood

SMALLINT

CHECK (likelihood BETWEEN 1 AND 5)

impact

SMALLINT

CHECK (impact BETWEEN 1 AND 5)

risk_score

SMALLINT

GENERATED ALWAYS AS (likelihood * impact) STORED

status

VARCHAR(20)

NOT NULL DEFAULT 'open'

open | mitigated | accepted | closed

mitigation_plan

TEXT

reviewed_at

TIMESTAMPTZ

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

governance.policies

Corporate policy document registry.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

title

VARCHAR(200)

NOT NULL

category

VARCHAR(50)

HR | Finance | IT | Compliance | Operations

version

VARCHAR(20)

NOT NULL DEFAULT '1.0'

effective_date

DATE

NOT NULL

expiry_date

DATE

owner_id (FK)

BIGINT

REFERENCES employees(id)

status

VARCHAR(20)

NOT NULL DEFAULT 'draft'

draft | active | superseded

notes

TEXT

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()


## CUSTOMER SERVICE & CRM

crm.leads

Inbound prospects before customer conversion.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

first_name

VARCHAR(80)

NOT NULL

last_name

VARCHAR(80)

company

VARCHAR(200)

email

VARCHAR(150)

phone

VARCHAR(30)

source

VARCHAR(50)

web | referral | event | social | email | cold_call

status

VARCHAR(20)

NOT NULL DEFAULT 'new'

new | contacted | qualified | unqualified | converted

assigned_to (FK)

BIGINT

REFERENCES users(id)

converted_customer_id (FK)

BIGINT

REFERENCES customers(id)

estimated_value

DECIMAL(18,2)

notes

TEXT

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

created_by (FK)

BIGINT

REFERENCES users(id)

crm.opportunities

Sales pipeline deals per customer.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

name

VARCHAR(200)

NOT NULL

customer_id (FK)

BIGINT

REFERENCES customers(id) NOT NULL

lead_id (FK)

BIGINT

REFERENCES leads(id)

owner_id (FK)

BIGINT

REFERENCES users(id) NOT NULL

stage

VARCHAR(30)

NOT NULL DEFAULT 'prospecting'

prospecting | proposal | negotiation | won | lost

probability

DECIMAL(5,2)

DEFAULT 0

expected_value

DECIMAL(18,2)

close_date

DATE

lost_reason

TEXT

notes

TEXT

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

crm.campaigns

Marketing campaigns per org/channel.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

name

VARCHAR(200)

NOT NULL

type

VARCHAR(30)

email | social | event | sms | paid_ads

status

VARCHAR(20)

NOT NULL DEFAULT 'draft'

draft | active | paused | completed

start_date

DATE

end_date

DATE

budget

DECIMAL(18,2)

DEFAULT 0

actual_spend

DECIMAL(18,2)

DEFAULT 0

goal

TEXT

owner_id (FK)

BIGINT

REFERENCES users(id)

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

crm.support_tickets

Customer support and service tickets.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

number

VARCHAR(30)

NOT NULL

customer_id (FK)

BIGINT

REFERENCES customers(id) NOT NULL

contact_name

VARCHAR(150)

contact_email

VARCHAR(150)

subject

VARCHAR(300)

NOT NULL

description

TEXT

category

VARCHAR(50)

billing | technical | delivery | general

priority

VARCHAR(10)

NOT NULL DEFAULT 'medium'

low | medium | high | urgent

status

VARCHAR(20)

NOT NULL DEFAULT 'open'

open | in_progress | pending | resolved | closed

assigned_to (FK)

BIGINT

REFERENCES users(id)

sla_id (FK)

BIGINT

REFERENCES sla_policies(id)

first_response_at

TIMESTAMPTZ

resolved_at

TIMESTAMPTZ

satisfaction_score

SMALLINT

1-5

channel

VARCHAR(20)

email | phone | chat | portal

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

created_by (FK)

BIGINT

REFERENCES users(id)

crm.ticket_comments

Thread of comments/replies on support tickets.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

ticket_id (FK)

BIGINT

REFERENCES support_tickets(id) NOT NULL

author_id (FK)

BIGINT

REFERENCES users(id)

is_customer_reply

BOOLEAN

NOT NULL DEFAULT false

body

TEXT

NOT NULL

is_internal

BOOLEAN

NOT NULL DEFAULT false

Internal note

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

crm.sla_policies

SLA rules by priority level.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

name

VARCHAR(100)

NOT NULL

priority

VARCHAR(10)

NOT NULL

low | medium | high | urgent

first_response_hours

INT

NOT NULL

resolution_hours

INT

NOT NULL

is_active

BOOLEAN

NOT NULL DEFAULT true


## ECOMMERCE

ecom.storefronts

Ecommerce storefronts per org. Supports B2B and B2C channels.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

name

VARCHAR(100)

NOT NULL

domain

VARCHAR(200)

type

VARCHAR(20)

DEFAULT 'b2c'

b2b | b2c | marketplace

currency_id (FK)

BIGINT

REFERENCES currencies(id)

is_active

BOOLEAN

NOT NULL DEFAULT true

settings

JSONB

DEFAULT '{}'

Theme, payment gateways, shipping config

ecom.store_categories

Ecommerce display categories per storefront.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

storefront_id (FK)

BIGINT

REFERENCES storefronts(id) NOT NULL

name

VARCHAR(100)

NOT NULL

slug

VARCHAR(120)

NOT NULL

parent_id (FK)

BIGINT

REFERENCES store_categories(id)

image_url

TEXT

sort_order

INT

DEFAULT 0

is_active

BOOLEAN

NOT NULL DEFAULT true

ecom.product_listings

Store-specific product listing with SEO, pricing, and content overrides.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

storefront_id (FK)

BIGINT

REFERENCES storefronts(id) NOT NULL

product_id (FK)

BIGINT

REFERENCES products(id) NOT NULL

store_category_id (FK)

BIGINT

REFERENCES store_categories(id)

slug

VARCHAR(200)

NOT NULL

title

VARCHAR(200)

NOT NULL

description_html

TEXT

images

JSONB

Array of image URLs

online_price

DECIMAL(18,4)

NOT NULL

compare_price

DECIMAL(18,4)

Crossed-out price

is_featured

BOOLEAN

NOT NULL DEFAULT false

is_active

BOOLEAN

NOT NULL DEFAULT true

meta_title

VARCHAR(200)

meta_description

VARCHAR(500)

ecom.promotions

Discount codes and rules.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

storefront_id (FK)

BIGINT

REFERENCES storefronts(id)

code

VARCHAR(50)


### UNIQUE NOT NULL

name

VARCHAR(150)

NOT NULL

type

VARCHAR(20)

NOT NULL

percentage | fixed_amount | free_shipping

discount_value

DECIMAL(10,4)

NOT NULL

min_order_value

DECIMAL(18,2)

DEFAULT 0

max_uses

INT

used_count

INT

NOT NULL DEFAULT 0

start_date

TIMESTAMPTZ

end_date

TIMESTAMPTZ

is_active

BOOLEAN

NOT NULL DEFAULT true

ecom.carts

Shopping carts — one per session or logged-in customer.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

storefront_id (FK)

BIGINT

REFERENCES storefronts(id) NOT NULL

customer_id (FK)

BIGINT

REFERENCES customers(id)

null if guest

session_token

VARCHAR(200)

Guest session identifier

status

VARCHAR(20)

NOT NULL DEFAULT 'active'

active | abandoned | checked_out

promotion_id (FK)

BIGINT

REFERENCES promotions(id)

subtotal

DECIMAL(18,2)

NOT NULL DEFAULT 0

discount_amount

DECIMAL(18,2)

NOT NULL DEFAULT 0

tax_amount

DECIMAL(18,2)

NOT NULL DEFAULT 0

total_amount

DECIMAL(18,2)

NOT NULL DEFAULT 0

currency_id (FK)

BIGINT

REFERENCES currencies(id)

expires_at

TIMESTAMPTZ

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

ecom.cart_items

Items in a shopping cart.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

cart_id (FK)

BIGINT

REFERENCES carts(id) NOT NULL

product_id (FK)

BIGINT

REFERENCES products(id) NOT NULL

variant_id (FK)

BIGINT

REFERENCES product_variants(id)

quantity

INT

NOT NULL DEFAULT 1

unit_price

DECIMAL(18,4)

NOT NULL

line_total

DECIMAL(18,2)

NOT NULL

added_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

ecom.online_orders

Orders placed via storefront. Creates a corresponding sales_order in ERP.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

storefront_id (FK)

BIGINT

REFERENCES storefronts(id) NOT NULL

number

VARCHAR(50)

NOT NULL

cart_id (FK)

BIGINT

REFERENCES carts(id)

customer_id (FK)

BIGINT

REFERENCES customers(id)

null = guest

guest_email

VARCHAR(150)

sales_order_id (FK)

BIGINT

REFERENCES sales_orders(id)

Linked ERP order

billing_address

JSONB

NOT NULL

Snapshot at order time

shipping_address

JSONB

NOT NULL

subtotal

DECIMAL(18,2)

NOT NULL

discount_amount

DECIMAL(18,2)

NOT NULL DEFAULT 0

shipping_cost

DECIMAL(18,2)

NOT NULL DEFAULT 0

tax_amount

DECIMAL(18,2)

NOT NULL DEFAULT 0

total_amount

DECIMAL(18,2)

NOT NULL

currency_id (FK)

BIGINT

REFERENCES currencies(id)

payment_status

VARCHAR(20)

NOT NULL DEFAULT 'pending'

pending | paid | refunded | failed

fulfillment_status

VARCHAR(20)

NOT NULL DEFAULT 'unfulfilled'

unfulfilled | partial | fulfilled

placed_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

ecom.online_payments

Payment gateway transactions for online orders.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

online_order_id (FK)

BIGINT

REFERENCES online_orders(id) NOT NULL

gateway

VARCHAR(50)

NOT NULL

stripe | paypal | tap | 2checkout

gateway_txn_id

VARCHAR(200)

amount

DECIMAL(18,2)

NOT NULL

currency_id (FK)

BIGINT

REFERENCES currencies(id)

status

VARCHAR(20)

NOT NULL

pending | success | failed | refunded

method

VARCHAR(30)

card | wallet | cod | bank_transfer

paid_at

TIMESTAMPTZ

raw_response

JSONB

Gateway response payload

ecom.product_reviews

Customer product reviews with moderation.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

product_id (FK)

BIGINT

REFERENCES products(id) NOT NULL

storefront_id (FK)

BIGINT

REFERENCES storefronts(id) NOT NULL

customer_id (FK)

BIGINT

REFERENCES customers(id)

rating

SMALLINT

NOT NULL CHECK (rating BETWEEN 1 AND 5)

title

VARCHAR(200)

body

TEXT

status

VARCHAR(20)

NOT NULL DEFAULT 'pending'

pending | approved | rejected

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()


## BUSINESS INTELLIGENCE & ANALYTICS

bi.bi_data_sources

Connected data sources (internal DB, APIs, CSV uploads).

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

name

VARCHAR(100)

NOT NULL

type

VARCHAR(30)

NOT NULL

postgres | rest_api | csv | bigquery | redshift

config

JSONB

Encrypted connection config

schema_cache

JSONB

Cached table/column metadata

is_active

BOOLEAN

NOT NULL DEFAULT true

last_synced_at

TIMESTAMPTZ

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

bi.bi_datasets

Named queryable datasets. SQL or visual query builder output.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

source_id (FK)

BIGINT

REFERENCES bi_data_sources(id) NOT NULL

name

VARCHAR(150)

NOT NULL

query_sql

TEXT

NOT NULL

parameters

JSONB

refresh_schedule

VARCHAR(50)

cron expression

last_refreshed_at

TIMESTAMPTZ

row_count_cache

BIGINT

owner_id (FK)

BIGINT

REFERENCES users(id)

is_active

BOOLEAN

NOT NULL DEFAULT true

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

bi.bi_reports

Saved reports with configuration and schedule.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

name

VARCHAR(200)

NOT NULL

description

TEXT

dataset_id (FK)

BIGINT

REFERENCES bi_datasets(id) NOT NULL

config

JSONB

Columns, grouping, sorting, chart type

format

VARCHAR(10)

DEFAULT 'table'

table | chart | pivot | summary

schedule

VARCHAR(50)

cron schedule

is_public

BOOLEAN

NOT NULL DEFAULT false

owner_id (FK)

BIGINT

REFERENCES users(id) NOT NULL

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

bi.bi_dashboards

Dashboard containers grouping multiple widgets.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

name

VARCHAR(200)

NOT NULL

description

TEXT

layout_config

JSONB

Grid layout JSON

is_public

BOOLEAN

NOT NULL DEFAULT false

is_pinned

BOOLEAN

NOT NULL DEFAULT false

owner_id (FK)

BIGINT

REFERENCES users(id) NOT NULL

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

bi.bi_dashboard_widgets

Individual chart/metric tiles on a dashboard.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

dashboard_id (FK)

BIGINT

REFERENCES bi_dashboards(id) NOT NULL

report_id (FK)

BIGINT

REFERENCES bi_reports(id)

title

VARCHAR(150)

NOT NULL

chart_type

VARCHAR(30)

bar | line | pie | kpi_card | table | map

config

JSONB

Axes, colors, thresholds

pos_x

INT

DEFAULT 0

pos_y

INT

DEFAULT 0

width

INT

DEFAULT 4

height

INT

DEFAULT 3

bi.bi_report_runs

Execution log for reports (manual and scheduled).

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

report_id (FK)

BIGINT

REFERENCES bi_reports(id) NOT NULL

triggered_by (FK)

BIGINT

REFERENCES users(id)

null = scheduler

parameters_used

JSONB

row_count

BIGINT

duration_ms

INT

status

VARCHAR(20)

NOT NULL

success | error

error_message

TEXT

started_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

completed_at

TIMESTAMPTZ


## ENTERPRISE ASSET MANAGEMENT

eam.asset_categories

Hierarchical asset types with default depreciation settings.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

name

VARCHAR(100)

NOT NULL

parent_id (FK)

BIGINT

REFERENCES asset_categories(id)

useful_life_years

INT

depreciation_method

VARCHAR(20)

straight_line | declining_balance

salvage_pct

DECIMAL(5,2)

eam.assets

Company asset register. Central EAM entity.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

asset_number

VARCHAR(50)

NOT NULL

name

VARCHAR(200)

NOT NULL

category_id (FK)

BIGINT

REFERENCES asset_categories(id) NOT NULL

location_id (FK)

BIGINT

REFERENCES addresses(id)

Physical location

assigned_to (FK)

BIGINT

REFERENCES employees(id)

dept_id (FK)

BIGINT

REFERENCES departments(id)

serial_number

VARCHAR(100)

model

VARCHAR(100)

manufacturer

VARCHAR(100)

purchase_date

DATE

purchase_order_id (FK)

BIGINT

REFERENCES purchase_orders(id)

purchase_cost

DECIMAL(18,2)

NOT NULL

current_value

DECIMAL(18,2)

NOT NULL

salvage_value

DECIMAL(18,2)

NOT NULL DEFAULT 0

useful_life_years

INT

depreciation_method

VARCHAR(20)

status

VARCHAR(20)

NOT NULL DEFAULT 'active'

active | under_maintenance | disposed | transferred

condition

VARCHAR(20)

DEFAULT 'good'

new | good | fair | poor

warranty_expiry

DATE

barcode

VARCHAR(100)

notes

TEXT

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

created_by (FK)

BIGINT

REFERENCES users(id)

UNIQUE

(organization_id, asset_number)

eam.depreciation_schedules

Calculated depreciation per asset per accounting period.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

asset_id (FK)

BIGINT

REFERENCES assets(id) NOT NULL

period_id (FK)

BIGINT

REFERENCES accounting_periods(id) NOT NULL

depreciation_amount

DECIMAL(18,2)

NOT NULL

accumulated_depreciation

DECIMAL(18,2)

NOT NULL

book_value_after

DECIMAL(18,2)

NOT NULL

journal_entry_id (FK)

BIGINT

REFERENCES journal_entries(id)

is_posted

BOOLEAN

NOT NULL DEFAULT false

eam.maintenance_orders

Asset maintenance and repair work orders.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

branch_id (FK)

BIGINT

REFERENCES branches(id)

number

VARCHAR(50)

NOT NULL

asset_id (FK)

BIGINT

REFERENCES assets(id) NOT NULL

type

VARCHAR(20)

NOT NULL

preventive | corrective | predictive

priority

VARCHAR(10)

NOT NULL DEFAULT 'medium'

low | medium | high | critical

assigned_to (FK)

BIGINT

REFERENCES employees(id)

reported_by (FK)

BIGINT

REFERENCES users(id)

scheduled_date

DATE

started_at

TIMESTAMPTZ

completed_at

TIMESTAMPTZ

status

VARCHAR(20)

NOT NULL DEFAULT 'open'

open | in_progress | on_hold | closed | cancelled

description

TEXT

NOT NULL

resolution_notes

TEXT

parts_cost

DECIMAL(18,2)

NOT NULL DEFAULT 0

labour_cost

DECIMAL(18,2)

NOT NULL DEFAULT 0

total_cost

DECIMAL(18,2)

NOT NULL DEFAULT 0

downtime_hours

DECIMAL(8,2)

NOT NULL DEFAULT 0

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

created_by (FK)

BIGINT

REFERENCES users(id)

eam.asset_transfers

Asset relocations between locations/employees.

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

asset_id (FK)

BIGINT

REFERENCES assets(id) NOT NULL

from_branch_id (FK)

BIGINT

REFERENCES branches(id)

to_branch_id (FK)

BIGINT

REFERENCES branches(id)

from_employee_id (FK)

BIGINT

REFERENCES employees(id)

to_employee_id (FK)

BIGINT

REFERENCES employees(id)

transfer_date

DATE

NOT NULL

reason

TEXT

approved_by (FK)

BIGINT

REFERENCES users(id)

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

eam.asset_disposals

Asset disposal records (sale, scrap, write-off).

Column

Type

Constraints

Description

id (PK)

BIGSERIAL


### PRIMARY KEY

organization_id (FK)

BIGINT

REFERENCES organizations(id) NOT NULL

asset_id (FK)

BIGINT

REFERENCES assets(id) NOT NULL

disposal_date

DATE

NOT NULL

method

VARCHAR(20)

NOT NULL

sale | scrap | donation | write_off

proceeds

DECIMAL(18,2)

NOT NULL DEFAULT 0

book_value_at_disposal

DECIMAL(18,2)

NOT NULL

gain_loss

DECIMAL(18,2)

NOT NULL

journal_entry_id (FK)

BIGINT

REFERENCES journal_entries(id)

approved_by (FK)

BIGINT

REFERENCES users(id)

notes

TEXT

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()


## DATA FLOW & MODULE RELATIONSHIPS

Flow

Modules Involved

Lead → Customer → Opportunity → Quotation → Sales Order → Delivery → Invoice → Payment

CRM → Sales → Inventory → Accounting

Purchase Request → RFQ → Purchase Order → Goods Receipt → Vendor Bill → Payment

Procurement → Inventory → Accounting

Sales Order → Work Order (if manufactured) → BOM Consumption → Inventory Movement

Sales → Production → Inventory

Employee Contract → Payroll Run → Payroll Entries → Journal Entry

HR → Accounting

Asset Purchase → Asset Register → Depreciation Schedule → Journal Entry

EAM → Accounting (via PO)

Storefront Order → Online Order → Sales Order (ERP sync) → Delivery → Fulfillment

Ecommerce → Sales → Inventory

KPI defined → KPI Values recorded → Dashboard Widget → BI Report

Governance → BI

Any action → audit_logs (immutable) + notifications (user-facing)

All Modules → Core


## PRISMA IMPLEMENTATION NOTES

Topic

Recommendation

Multi-tenancy enforcement

Use Prisma $extends or prisma.$use() middleware to inject organization_id into every query. Create a factory function createPrismaClient(orgId) that returns a scoped client.

Soft deletes

All domain tables have deleted_at. Use Prisma middleware to transform findMany to WHERE deleted_at IS NULL automatically.

Audit logging

Implement a NestJS interceptor that writes to audit_logs after every mutation. Pass organization_id, user_id, action, resource, record_id, old/new values.

number_sequences

Use a PostgreSQL advisory lock (pg_advisory_xact_lock) when generating document numbers to prevent duplicates under concurrent inserts.

JSONB fields

Use Prisma Json type. Define TypeScript interfaces for each JSONB field shape (e.g. SubscriptionFeatures, StoreSettings) — validate with Zod on input.

Computed columns

PostgreSQL GENERATED ALWAYS AS columns (e.g. qty_available, risk_score) are read-only in Prisma — mark them with @default(0) and do not include in create/update operations.

Cascades

Use onDelete: Restrict for financial records. Use onDelete: Cascade only for line items whose parent is explicitly deleted. Never cascade-delete audit_logs.

Indexes

Index all FK columns. Add composite indexes on (organization_id, status), (organization_id, created_at DESC) for common query patterns.

Schema grouping

Group Prisma models in separate files by module (sales.prisma, accounting.prisma) and use prisma --schema=schema.prisma with @import if using Prisma 5.15+.


## STANDARD FIELDS REFERENCE

Applied consistently to all domain tables. Enforced via a shared Prisma mixin or base schema.

Field

Type

Rule

Purpose

id

BIGSERIAL


### PRIMARY KEY

Auto-increment primary key

organization_id


### BIGINT NOT NULL

REFERENCES organizations(id)

Tenant scope — never nullable on business tables

branch_id

BIGINT

REFERENCES branches(id)

Branch scope — nullable means all branches

created_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

Creation timestamp

updated_at

TIMESTAMPTZ

NOT NULL DEFAULT now()

Last mutation — updated by trigger or app

created_by

BIGINT

REFERENCES users(id)

User who created the record

updated_by

BIGINT

REFERENCES users(id)

User who last updated the record

deleted_at

TIMESTAMPTZ

DEFAULT NULL

Soft delete — null = active, timestamp = deleted
