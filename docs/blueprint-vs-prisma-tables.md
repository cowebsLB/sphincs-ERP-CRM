# Blueprint vs Prisma tables

The Word blueprint defines **107** logical tables. The live Prisma schema implements a **beta subset** plus **distribution / WMS-style** tables.

Regenerate:

```bash
pnpm compare:blueprint
```

```
Blueprint tables: 107
Prisma @@map tables: 40

Renamed in implementation (blueprint -> Prisma): 2
  - procurement.purchase_order_lines -> `purchase_order_line_items`
  - inventory.products -> `items`

MISSING in Prisma (no model yet): 88
  - accounting.accounting_periods
  - shared.addresses
  - eam.asset_categories
  - eam.asset_disposals
  - eam.asset_transfers
  - eam.assets
  - shared.attachments
  - hr.attendance
  - accounting.bank_accounts
  - bi.bi_dashboard_widgets
  - bi.bi_dashboards
  - bi.bi_data_sources
  - bi.bi_datasets
  - bi.bi_report_runs
  - bi.bi_reports
  - production.bill_of_materials
  - production.bom_components
  - crm.campaigns
  - ecom.cart_items
  - ecom.carts
  - shared.countries
  - shared.currencies
  - sales.customers
  - sales.deliveries
  - sales.delivery_lines
  - hr.departments
  - eam.depreciation_schedules
  - hr.employee_contracts
  - hr.employees
  - shared.entity_tags
  - accounting.fiscal_years
  - accounting.gl_accounts
  - inventory.inventory
  - accounting.invoice_lines
  - accounting.invoices
  - hr.job_applications
  - hr.job_positions
  - accounting.journal_entries
  - accounting.journal_entry_lines
  - governance.kpi_values
  - governance.kpis
  - hr.leave_requests
  - hr.leave_types
  - eam.maintenance_orders
  - core.member_roles
  - core.notifications
  - shared.number_sequences
  - ecom.online_orders
  - ecom.online_payments
  - core.organization_members
  - shared.payment_terms
  - accounting.payments
  - hr.payroll_entries
  - hr.payroll_runs
  - governance.policies
  - sales.price_list_items
  - sales.price_lists
  - inventory.product_categories
  - production.product_lifecycle_events
  - ecom.product_listings
  - ecom.product_reviews
  - inventory.product_variants
  - ecom.promotions
  - procurement.purchase_requests
  - sales.quotation_lines
  - sales.quotations
  - hr.recruitment_jobs
  - procurement.rfq_lines
  - procurement.rfqs
  - governance.risks
  - sales.sales_order_lines
  - sales.sales_orders
  - crm.sla_policies
  - ecom.store_categories
  - ecom.storefronts
  - governance.strategic_objectives
  - procurement.supplier_contracts
  - procurement.supplier_evaluations
  - crm.support_tickets
  - shared.tags
  - shared.taxes
  - crm.ticket_comments
  - shared.units_of_measure
  - core.user_sessions
  - accounting.vendor_bills
  - inventory.warehouses
  - production.work_centers
  - production.work_orders

EXTRA in Prisma (not in blueprint 107 list - auth, distribution, WMS detail): 21
  - dispatch_pack_jobs
  - dispatch_pack_lines
  - dispatch_pick_jobs
  - dispatch_pick_lines
  - inventory_lot_balances
  - inventory_lots
  - inventory_reservations
  - inventory_stocks
  - refresh_tokens
  - reorder_rules
  - stock_adjustment_lines
  - stock_adjustments
  - stock_alerts
  - stock_dispatch_lines
  - stock_dispatches
  - stock_return_lines
  - stock_returns
  - stock_transfer_lines
  - stock_transfers
  - user_roles
  - warehouse_locations
```
