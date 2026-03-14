# Sphincs ERP

Integrated Enterprise Resource Planning system for Windows.

## Overview

Sphincs ERP is a comprehensive business management system for inventory, staff, reporting, finance, and operations.

Legacy POS code has been retired from active runtime and archived under `archive/pos/`.

### Fully Integrated Architecture

- **Single Source of Truth**: Every ERP, mobile, and analytics component reads/writes through the same SQLAlchemy models, so data stays consistent automatically.
- **Advanced Operations Hub**: A dedicated module inside the ERP consolidates Reservations, Vendor Contracts, Training, Audits, Maintenance, Delivery, Menu Engineering, Events, and Safety workflows with matching UI styling and shared permissions.
- **Shared Services**: Authentication, roles/permissions, logging, audit trails, PDF generation, predictive analytics, and integrations are reused across modules (desktop + mobile + API).

## Documentation Index

- [Documentation Hub](docs/INDEX.md)
- [ERP UI/UX Roadmap](docs/erp/uiux-roadmap.md)
- [ERP UI/UX Baseline Audit](docs/erp/uiux-audit-baseline.md)
- [ERP UI/UX Phase 1 Shell Refresh](docs/erp/uiux-phase1-shell-refresh.md)
- [ERP UI/UX Phase 2 Global Refresh](docs/erp/uiux-phase2-global-refresh.md)
- [ERP Worklog](docs/erp/worklog.md)
- [ERP Implementation Summary (2026-03-09)](docs/erp/implementation-summary-2026-03-09.md)
- [ERP Implementation Summary (2026-03-14)](docs/erp/implementation-summary-2026-03-14.md)
- [ERP Folder Structure](docs/erp/folder-structure.md)
- [ERP Module Map](docs/erp/module-map.md)
- [Design Notes](design.md)
- [Project Plan](plan.md)

## Features

### Sphincs ERP

#### ✅ Implemented Modules

- **Dashboard**
  - Welcome section with user info
  - Today's summary cards (sales, orders, customers, inventory)
  - Quick actions
  - Recent activity feed
  - Alerts & Notifications panel with severity colors, per-user channel preferences, snooze durations, and tray/mobile sync
  - Modern, responsive UI

- **Product Management**
  - Full CRUD operations for products/dishes
  - Category management with automatic default categories
  - Product status tracking (active/inactive)
  - Search and filter functionality
  - Price and cost management
  - Recipe management with automatic cost calculation
  - Image support for products

- **Inventory Management**
  - Ingredient tracking with multiple tabs:
    - Ingredients list with stock monitoring
    - Add Ingredient dialog for new ingredients
    - Edit Ingredient dialog for updating ingredients
    - Expiry tracking and alerts with Add Expiry Record dialog
    - Waste analysis dashboard
    - Barcode/RFID management
    - Predictive analytics for demand forecasting
  - Stock level monitoring with reorder alerts
  - Add/edit/delete ingredients
  - Cost per unit tracking
  - Stock adjustments
  - Auto-generate purchase orders at stock threshold

- **Supplier Management**
  - Complete supplier database
  - Contact information management (person, phone, email)
  - Supplier status tracking
  - Search and filter capabilities
  - Supplier rating system (on-time delivery, quality, price, communication)
  - Procurement automation

- **Customer Management**
  - Customer database with contact details
  - Loyalty points tracking
  - Customer status management
  - Search and filter functionality
  - Customer segmentation (VIP, Regular, New)
  - Loyalty programs with Add Program dialog
  - Points per currency rate configuration
  - Coupon management with Add Coupon dialog
  - Coupon code validation and usage tracking
  - Discount types (percentage and fixed amount)
  - Customer feedback collection with sentiment tracking
  - Email & SMS marketing campaigns

- **Staff Management**
  - Comprehensive staff database
  - Role-based access control (28 predefined roles)
  - Staff information management (name, username, email, phone, address)
  - Add Staff dialog with full employee details
  - Edit Staff dialog for updating information
  - Status tracking (active/inactive)
  - Search and filter capabilities
  - Attendance tracking with clock in/out
  - Staff attendance view for monitoring
  - Weekly shift scheduling (table view) with Add Schedule dialog
  - Payroll calculations (base salary, hours, overtime, tips, bonuses, deductions)
  - Performance reports (sales per staff, order counts, performance scores)

- **Sales Management**
  - Order history and tracking
  - Order status management
  - Transaction details dialog with full order information
  - Refund processing with reason tracking
  - Coupon code application to orders
  - Loyalty points redemption for discounts
  - Date range filtering
  - Multiple order types (dine-in, takeaway, delivery)

- **Financial Management**
  - Chart of Accounts management with Add Account dialog
  - Account hierarchy support (parent/child accounts)
  - Transaction recording and tracking
  - Invoice creation dialog (sales and purchase invoices)
  - Invoice item management with product selection
  - Invoice generation (with PDF export)
  - Expense tracking with categories
  - Tax configuration and management
  - Financial Reports:
    - Profit & Loss statements
    - Balance sheets
    - Cash Flow statements (Operating, Investing, Financing activities)
    - Cash flow tracking
  - Multi-currency support

- **Reports & Analytics**
  - Sales reports with date filtering
  - Sales analytics with heatmaps (by hour, by day)
  - Top-selling products analysis
  - Custom reports builder (selectable data sources and columns)
  - Cross-branch reporting
  - Real-time dashboard KPIs
  - Predictive analytics

- **Mobile Companion App**
  - Mobile-optimized web interface
  - REST API for native mobile apps
  - Dashboard with real-time KPIs
  - Order creation and management
  - Inventory alerts monitoring
  - Staff clock in/out
  - Attendance tracking
  - API server management interface
  - Notification feed with per-user filtering and acknowledgement endpoint

- **Settings**
  - Application configuration
  - System preferences
  - Audit trail viewer
  - Location/Branch management
  - Granular permissions management
  - Cloud sync configuration
  - Integrations management:
    - Online ordering platforms (UberEats, DoorDash framework)
    - Accounting software sync (QuickBooks, Xero framework)
    - Payment gateway integration (Stripe, PayPal, Square framework)
  - Notification preferences tab with per-user channel toggles, desktop/mobile delivery switches, severity thresholds, and snooze controls

- **Advanced Operations Hub** (Consolidated Module)
  - **Reservations & Table Management**
    - Centralized reservations and waitlist board
    - Channels (phone, web, walk-in) with reminder tracking
    - Status workflows (pending, confirmed, seated, completed, cancelled)
    - Special requests and seating notes
  - **Vendor Contracts & Procurement SLAs**
    - Contract repository with SLA terms and penalty tracking
    - Renewal reminders and auto-renew flag
    - Contract value monitoring and status changes
  - **Training & Certification Portal**
    - Training module library with duration and category
    - Staff assignments with due dates and completion tracking
    - Certification vault with renewal alerts
  - **Quality & Compliance Audits**
    - Location-based inspections with scores
    - Findings, corrective actions, and follow-up scheduling
    - Status workflows (open, in progress, closed)
  - **Maintenance & Asset Management**
    - Asset registry with warranty tracking
    - Preventive maintenance tasks and priorities
    - Work orders with staff assignments and completion logging
  - **Delivery Fleet & Routing**
    - Vehicle roster with service history
    - Driver assignments tied to orders and vehicles
    - Status workflows (assigned, in transit, delivered, failed)
  - **Menu Engineering & Profitability**
    - Popularity/profitability indexes per product
    - Menu class recommendations (star, plow horse, puzzle, dog)
    - Notes for pricing or promotional actions
  - **Events & Catering Management**
    - Event bookings with budgets, guest counts, and requirements
    - Staffing assignments per event with role/hours tracking
  - **Health & Safety Incident Tracking**
    - Incident reporting with severity, category, and injuries
    - Corrective actions and follow-up scheduling
    - Status workflows for compliance sign-off

- **Industry-Specific Modules**
  - **Retail & E-Commerce**
    - Online sales tracking and reporting
    - E-commerce platform integration (Shopify, WooCommerce, Magento framework)
    - Warehouse inventory tracking
    - Predictive restocking analytics
  - **Healthcare / Clinics / Pharmacies**
    - Patient management (adapted from customer management)
    - Appointment scheduling (adapted from reservations)
    - Prescription management (adapted from product management)
    - Medical inventory tracking
    - Billing & insurance integration
  - **Education / Training Centers**
    - Student management (adapted from customer management)
    - Course management (adapted from product management)
    - Class scheduling and attendance
    - Performance tracking
    - Events & workshops management
  - **Manufacturing**
    - Production schedule management
    - Raw materials inventory tracking
    - Finished goods tracking
    - Quality control workflows
    - Demand forecasting for production lines
  - **Logistics / Delivery / Fleet Management**
    - Fleet management and vehicle tracking
    - Delivery assignment and tracking
    - Routing optimization
    - Warehouse inventory management
    - Driver and shift management
- **Notifications & System Tray Agent**
  - Unified `Notification` model with severity levels, module tags, and read/unread tracking for every alert.
  - Background worker thread scans low stock, expiry batches, overdue maintenance, quality follow-ups, safety incidents, and fresh POS orders on a rolling interval.
  - In-app dashboard panel with severity colors, timestamps, snooze durations, per-user channel filters, and one-click "Mark All Read."
  - Windows system tray icon with toast pop-ups, unread badge, quick actions (Open ERP, View Notifications, Sync Now, Exit), and optional restoration when minimized.
  - Mobile companion API exposes `/api/mobile/notifications` and `/api/mobile/notifications/read` for managers on the go.
  - Sales events (loyalty awards, coupon redemptions, order payments) emit notifications instantly through the shared `NotificationCenter`.

#### 🎨 User Interface

- **Collapsible Sidebar Navigation**
  - Icon-based navigation with tooltips
  - Expandable/collapsible sidebar (80px collapsed, 240px expanded)
  - Grouped navigation sections (Overview, Sales CRM, Inventory Supply, Staff HR, Finance Ops, Operations, Industry Solutions)
  - Collapsible groups for related modules within each section
  - Scrollable sidebar for long navigation lists
  - User info display
  - Logout button in header (⇱ icon)
  - Modern dark theme (fixed)

- **UX Enhancements**
  - Keyboard shortcuts for power users (Ctrl+N, Ctrl+S, Ctrl+F, etc.)
  - Customizable dashboard layouts
  - Responsive design
  - Scrollable sidebar for better navigation

- **Authentication**
  - Secure login with password hashing (bcrypt)
  - "Remember me" functionality using Windows keyring
  - Role-based access control (28 predefined roles)
  - Two-Factor Authentication (2FA) support for admin roles
  - Granular permissions system
  - Session management
  - Full audit trail logging

## Requirements

- Python 3.9 or higher
- Windows 10/11
- SQLite 3 (included with Python)
- Internet connection (for cloud sync and updates)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd sphincs-erp-pos
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Initialize Database

The database will be automatically created on first run. Default roles (28 roles) are automatically created on first launch. However, you need to create an admin user:

```bash
# Create admin staff user (username: admin, password: admin)
python src/utils/create_admin_staff.py
```

**Note**: The system automatically creates 28 predefined roles on first run, organized into:
- System & ERP Admin (3 roles)
- Corporate Management (6 roles)
- Branch-Level Management (4 roles)
- Operational / Staff (8 roles)
- Specialized / Optional (4 roles)

### 4. Launch ERP

**Sphincs ERP:**
```bash
python src/erp_main.py
```

## Automated Testing

An end-to-end regression script, `test_all_features.py`, exercises every major subsystem (database, models, CRUD, utilities, dialogs, GUI imports, APIs, integrations, configuration, notification flows, and performance checks).

```bash
python test_all_features.py
```

- Produces real-time console output plus a timestamped report file (e.g. `test_report_YYYYMMDD_HHMMSS.txt`) summarizing pass/fail counts per category.
- Covers 380+ assertions, ensuring recent changes haven’t broken ERP or API modules.
- Optional dependencies: install `pyotp` and `qrcode[pil]` if you want Two-Factor Authentication tests to run as well.

## Building Executables

The project ships an ERP PyInstaller spec (`erp.spec`) and a helper script (`build_exe.py`) so you can generate a Windows executable for ERP.

1. Install PyInstaller (once per environment):
   ```bash
   pip install pyinstaller
   ```
2. Run the automated build script from the project root:
   ```bash
   python build_exe.py
   ```

The script runs the ERP spec, bundles icons plus configuration assets, and drops `SphincsERP.exe` into `dist/`. See `BUILD_INSTRUCTIONS.md` for advanced packaging notes (custom icons, hidden imports, signing, etc.).

## First Run Setup

1. **Database Initialization**
   - The application automatically creates the SQLite database at `%APPDATA%\Sphincs ERP+POS\sphincs.db`
   - Run the role and admin creation scripts (see Installation step 3)

2. **Login**
   - Default admin credentials:
     - Username: `admin`
     - Password: `admin`
   - **Important**: Change the default password after first login

3. **Configuration**
   - Configuration files are stored in `%APPDATA%\Sphincs ERP+POS\`
   - Edit `config.ini` to customize settings:
     - Database settings
     - Update settings (GitHub repository)
     - UI preferences
     - Hardware settings

## Database Schema

The system uses SQLAlchemy ORM with the following main models:

### Core Models
- **Roles**: User roles with permissions (28 predefined roles)
- **Permission**: Granular permissions for role-based access control
- **Staff**: Staff members with authentication and role assignment
- **Category**: Product categories
- **Product**: Products/dishes with pricing and category
- **Recipe**: Product recipes linking products to ingredients
- **Ingredient**: Inventory ingredients with cost tracking
- **Inventory**: Stock levels and inventory tracking
- **InventoryExpiry**: Expiry date tracking for inventory items
- **Barcode**: Barcode/RFID tracking for products and ingredients
- **Supplier**: Supplier information with contact details
- **SupplierRating**: Supplier performance ratings
- **Customer**: Customer database with loyalty points
- **LoyaltyProgram**: Loyalty program configurations
- **Coupon**: Discount coupons and promotions
- **CustomerFeedback**: Customer feedback and ratings
- **Order**: Sales transactions
- **OrderItem**: Individual items in orders
- **Payment**: Payment records
- **Discount**: Discount management
- **Waste**: Waste tracking
- **PurchaseOrder**: Purchase orders from suppliers
- **Table**: Restaurant table management

### Financial Models
- **Account**: Chart of accounts
- **Transaction**: Financial transactions
- **Invoice**: Invoices (customer and supplier)
- **Expense**: Expense tracking
- **Tax**: Tax configuration

### HR Models
- **Attendance**: Staff attendance records
- **ShiftSchedule**: Staff shift scheduling
- **Payroll**: Payroll records and calculations

### Multi-Location Models
- **Location**: Business locations/branches

### Security Models
- **AuditLog**: Complete audit trail of system actions

## Authentication & Roles

The system uses comprehensive role-based authentication with 28 predefined roles:

### System & ERP Admin Roles
- **sysadmin**: Full system access (DB, config, backups, cloud sync, logs)
- **erp_admin**: Manages users, roles, access control, audit logs, system settings
- **it_support**: Troubleshoots ERP/POS issues, installs updates, config changes

### Corporate Management Roles
- **general_manager**: Whole company oversight (finances, marketing, reports, decisions)
- **finance_manager**: Reports, payroll, accounting, budgets
- **marketing_manager**: Campaigns, promotions, loyalty programs, social media
- **hr_manager**: Staff management, recruitment, leave approvals, performance
- **operations_manager**: Operations efficiency, cross-branch KPIs
- **regional_manager**: Regional branch oversight, budget approvals

### Branch-Level Management
- **branch_manager**: Branch operations, reports, staffing, inventory decisions
- **floor_manager**: Front-of-house operations, table assignments, schedules
- **kitchen_manager**: Kitchen operations, recipes, prep schedules, food quality
- **bar_manager**: Bar operations, drinks, stock, bartenders

### Operational / Staff Roles
- **cashier**: Sales transactions, refunds, receipts
- **chef**: Prepares food, updates inventory usage
- **prep_cook**: Prepares ingredients, reports stock usage
- **server**: Front-of-house, table orders, marks served items
- **barista**: Drinks, POS interaction, inventory usage
- **inventory_clerk**: Tracks stock, receives deliveries, updates inventory
- **purchasing_officer**: Creates purchase orders, manages suppliers
- **cleaner**: Maintenance staff, shift scheduling

### Specialized / Optional Roles
- **trainer**: Access to training modules, onboarding guides
- **auditor**: View reports, stock, finances (read-only)
- **delivery_driver**: Tracks deliveries, updates delivery status
- **loyalty_operator**: Handles loyalty programs, promotions, marketing

### Authentication Features
1. **Roles**: 28 predefined roles automatically created on first run
2. **Permissions**: Granular permission system for fine-grained access control
3. **Staff Authentication**: Staff members authenticate directly (no separate User table)
4. **Password Security**: Passwords hashed using bcrypt
5. **Remember Me**: Credentials stored securely using Windows keyring
6. **Two-Factor Authentication**: TOTP-based 2FA support for admin roles
7. **Audit Trail**: Complete logging of all system actions

### Creating New Staff

Use the Staff Management module in the ERP to add new staff members. Each staff member must be assigned one of the 28 predefined roles.

## Project Structure

```
sphincs-erp-pos/
├── src/
│   ├── erp_main.py              # Sphincs ERP entry point
│   ├── pos_main.py              # POS retired stub (prints migration note)
│   ├── __init__.py              # Package initialization
│   │
│   ├── gui/                     # GUI components
│   │   ├── erp_dashboard.py     # Main ERP dashboard
│   │   ├── sidebar.py           # Collapsible sidebar with grouped sections
│   │   ├── login_window.py      # Login interface
│   │   ├── splash_screen.py     # Splash screen with updates
│   │   ├── product_management.py # Product/menu management
│   │   ├── recipe_management.py # Recipe management dialog
│   │   ├── inventory_management.py # Inventory with multiple tabs
│   │   ├── inventory_expiry_tracking.py # Expiry tracking
│   │   ├── waste_analysis.py    # Waste analysis dashboard
│   │   ├── barcode_management.py # Barcode/RFID management
│   │   ├── predictive_analytics_view.py # Predictive analytics
│   │   ├── supplier_management.py # Supplier management
│   │   ├── supplier_rating_view.py # Supplier ratings
│   │   ├── customer_management.py # Customer management
│   │   ├── customer_loyalty.py  # Loyalty programs & marketing
│   │   ├── marketing_campaign_dialog.py # Marketing campaigns
│   │   ├── staff_management.py  # Staff management with tabs
│   │   ├── staff_attendance.py  # Staff attendance view
│   │   ├── attendance_management.py # Attendance tracking management
│   │   ├── shift_scheduling.py  # Weekly shift scheduling
│   │   ├── payroll_management.py # Payroll calculations
│   │   ├── staff_performance_reports.py # Performance reports
│   │   ├── sales_management.py  # Sales/order management
│   │   ├── sales_reports.py     # Sales reports with tabs
│   │   ├── sales_analytics.py   # Sales analytics & heatmaps
│   │   ├── custom_reports_builder.py # Custom reports
│   │   ├── cross_branch_reporting.py # Cross-branch reports
│   │   ├── financial_management.py # Financial management
│   │   ├── tax_management.py    # Tax configuration
│   │   ├── add_expense_dialog.py # Expense entry
│   │   ├── mobile_view.py       # Mobile companion interface
│   │   ├── mobile_api_settings.py # Mobile API configuration
│   │   ├── settings_view.py     # Settings with multiple tabs
│   │   ├── audit_trail_view.py  # Audit trail viewer
│   │   ├── location_management.py # Location/branch management
│   │   ├── permissions_management.py # Permissions management
│   │   ├── cloud_sync_view.py   # Cloud sync configuration
│   │   ├── integrations_view.py # Integrations management
│   │   ├── two_factor_setup.py  # 2FA setup dialog
│   │   ├── operations_hub.py    # Advanced Operations Hub (9 modules)
│   │   ├── retail_ecommerce_view.py # Retail & E-Commerce module
│   │   ├── healthcare_view.py   # Healthcare/Clinics module
│   │   ├── education_view.py    # Education/Training module
│   │   ├── manufacturing_view.py # Manufacturing module
│   │   ├── logistics_view.py    # Logistics/Fleet module
│   │   ├── staff_attendance.py  # Staff attendance view
│   │   ├── add_account_dialog.py # Add Account dialog
│   │   ├── create_invoice_dialog.py # Create Invoice dialog
│   │   ├── add_invoice_item_dialog.py # Add Invoice Item dialog
│   │   ├── add_loyalty_program_dialog.py # Add Loyalty Program dialog
│   │   ├── add_coupon_dialog.py # Add Coupon dialog
│   │   ├── coupon_redemption_dialog.py # Coupon Redemption dialog
│   │   ├── loyalty_points_dialog.py # Loyalty Points Redemption dialog
│   │   ├── transaction_details_dialog.py # Transaction Details dialog
│   │   ├── refund_dialog.py     # Refund Processing dialog
│   │   ├── discount_dialog.py   # Discount Application dialog
│   │   ├── payment_dialog.py    # Payment Processing dialog
│   │   ├── add_schedule_dialog.py # Add Schedule dialog
│   │   ├── notification_tray.py # System tray manager for alerts
│   │   ├── notification_preferences_widget.py # Notification preferences tab
│   │   ├── add_expiry_dialog.py # Add Expiry Record dialog (in inventory_expiry_tracking.py)
│   │   ├── add_ingredient_dialog.py # Add Ingredient dialog
│   │   ├── edit_ingredient_dialog.py # Edit Ingredient dialog
│   │   ├── add_staff_dialog.py  # Add Staff dialog
│   │   └── edit_staff_dialog.py # Edit Staff dialog
│   │
│   ├── database/                # Database layer
│   │   ├── models.py            # SQLAlchemy ORM models
│   │   └── connection.py        # Database connection manager
│   │
│   ├── config/                  # Configuration
│   │   └── settings.py          # Application settings
│   │
│   ├── api/                     # API layer
│   │   ├── mobile_api.py        # Mobile companion REST API
│   │   └── start_mobile_api.py  # API server launcher
│   │
│   └── utils/                   # Utilities
│       ├── auth.py              # Authentication utilities
│       ├── logger.py            # Logging setup
│       ├── update_checker.py    # GitHub update checker
│       ├── create_roles.py      # Role initialization script (28 roles)
│       ├── create_admin_staff.py # Admin user creation script
│       ├── create_admin.py      # Admin user creation (alternative)
│       ├── create_staff.py      # Staff creation utility
│       ├── update_admin_pin.py  # Admin PIN update utility
│       ├── create_categories.py # Default category creation
│       ├── theme_manager.py     # Theme management (dark/light)
│       ├── keyboard_shortcuts.py # Keyboard shortcuts manager
│       ├── dashboard_analytics.py # Dashboard data utilities
│       ├── recipe_calculator.py # Recipe cost calculation
│       ├── procurement_automation.py # Auto-generate POs
│       ├── audit_logger.py      # Audit trail logging
│       ├── two_factor_auth.py   # 2FA utilities
│       ├── currency_manager.py  # Multi-currency support
│       ├── pdf_generator.py     # PDF generation (invoices, reports)
│       ├── predictive_analytics.py # Demand forecasting
│       ├── cloud_sync.py        # Cloud synchronization
│       ├── online_ordering.py   # Online ordering platform integration
│       ├── accounting_sync.py   # Accounting software integration
│       ├── payment_gateways.py  # Payment gateway integration
│       ├── email_marketing.py   # Email marketing campaigns
│       ├── sms_marketing.py     # SMS marketing campaigns
│       ├── receipt_printer.py   # Receipt printing utility
│       ├── loyalty_points.py    # Loyalty points awarding utility
│       ├── notification_center.py # Notification bus / persistence helper
│       ├── notification_worker.py # Background polling + alert worker
│       └── notification_preferences.py # User-level channel & snooze helpers
│
├── requirements.txt             # Python dependencies
├── README.md                    # This file
├── QUICKSTART.md                # Quick start guide
├── plan.md                      # Detailed architecture plan
└── design.md                    # Design documentation
```

## Usage

### ERP Dashboard

1. **Login**: Enter your username and password
2. **Navigation**: Use the sidebar to navigate between modules
3. **Sidebar Toggle**: Click the ☰ button to collapse/expand the sidebar
4. **Module Features**:
   - Each module supports Add, Edit, Delete operations
   - Search and filter functionality available
   - Data is automatically saved to the database

### Key Features

- **Collapsible Sidebar**: Click the hamburger menu (☰) to toggle between collapsed (icons only) and expanded (icons + text) views
- **Grouped Navigation**: Related modules are grouped into collapsible sections (e.g., Staff HR contains Staff, Attendance, Shift Scheduling, Payroll, Performance)
- **Scrollable Sidebar**: Sidebar automatically scrolls when content exceeds available space
- **Logout**: Click the ⇱ button in the sidebar header to logout
- **Remember Me**: Check the "Remember me" checkbox to save credentials securely
- **Role-Based Access**: 28 predefined roles with granular permissions system
- **Keyboard Shortcuts**: 
  - `Ctrl+N`: Add new item
  - `Ctrl+S`: Save
  - `Ctrl+F`: Search
  - `Ctrl+E`: Edit
  - `Delete`: Delete selected
  - `F5`: Refresh
  - `Ctrl+T`: Toggle theme
  - `Ctrl+1` to `Ctrl+9`: Navigate to modules

## Development

### Adding New Modules

1. Create a new view class in `src/gui/`
2. Add navigation item to `src/gui/sidebar.py`
3. Add view method to `src/gui/erp_dashboard.py`
4. Connect navigation in `handle_navigation()`

### Database Changes

1. Update models in `src/database/models.py`
2. Delete old database file to recreate schema (or use migrations)
3. Re-run initialization scripts if needed

### Logging

Logs are stored in: `%APPDATA%\Sphincs ERP+POS\logs\`

The system uses `loguru` for comprehensive logging.

## Configuration

Configuration file location: `%APPDATA%\Sphincs ERP+POS\config.ini`

Example configuration:

```ini
[Database]
path = %APPDATA%\Sphincs ERP+POS\sphincs.db

[Updates]
enabled = true
check_on_startup = true
github_repo_owner = your-username
github_repo_name = your-repo-name

[UI]
theme = light
language = en
```

## Troubleshooting

### Import Errors
- Make sure you're in the project root directory
- Verify all dependencies are installed: `pip list`
- Check Python path is set correctly

### Database Errors
- Check that the config directory is writable
- Verify SQLite is working: `python -c "import sqlite3; print(sqlite3.sqlite_version)"`
- Delete `sphincs.db` to recreate the database (data will be lost)

### Authentication Issues
- Ensure roles are created: `python src/utils/create_roles.py`
- Ensure admin user exists: `python src/utils/create_admin_staff.py`
- Check password hashing is working correctly

### GUI Not Showing
- Verify PyQt6 is installed: `python -c "from PyQt6.QtWidgets import QApplication; print('OK')"`
- Check for error messages in the console
- Review logs in `%APPDATA%\Sphincs ERP+POS\logs\`

## Mobile Companion App

The system includes a comprehensive mobile companion solution:

### Mobile Web Interface
- Access via "📱 Mobile" in the ERP sidebar
- Touch-optimized interface with tabs:
  - **Dashboard**: Real-time KPIs, quick actions, recent orders
  - **Orders**: View and create orders
  - **Inventory**: Monitor low stock alerts
  - **Staff**: Clock in/out, view attendance
- Auto-refresh every 30 seconds
- API settings management

### REST API
- Full REST API for native mobile app development
- 20+ endpoints covering all major features
- Optional API key authentication
- CORS enabled for cross-origin requests
- Available at: `http://localhost:5000/api/mobile`

**Start API Server:**
```bash
python src/api/start_mobile_api.py
```

See `MOBILE_API_README.md` for complete API documentation.

## Dependencies

### Core Dependencies
- PyQt6 - GUI framework
- SQLAlchemy - Database ORM
- loguru - Logging
- bcrypt - Password hashing
- keyring - Secure credential storage

### Optional Dependencies
- flask, flask-cors - Mobile API server
- pyotp, qrcode[pil] - Two-Factor Authentication
- reportlab - PDF generation

Install all dependencies:
```bash
pip install -r requirements.txt
```

For mobile API:
```bash
pip install flask flask-cors
```

For 2FA:
```bash
pip install pyotp qrcode[pil]
```

For PDF generation:
```bash
pip install reportlab
```

## Roadmap

### Completed Features ✅

- ✅ Enhanced Reports (inventory, staff, financial reports)
- ✅ Enhanced Dashboard with real-time data widgets
- ✅ Advanced analytics and reporting (heatmaps, trends)
- ✅ Multi-location support
- ✅ Cloud sync infrastructure
- ✅ Barcode/RFID tracking
- ✅ Mobile companion app (web interface + REST API)
- ✅ Financial/Accounting module
- ✅ Recipe cost calculation
- ✅ Staff attendance & scheduling
- ✅ Payroll calculations
- ✅ Customer loyalty programs
- ✅ Supplier rating system
- ✅ Audit trail system
- ✅ Two-Factor Authentication
- ✅ Granular permissions
- ✅ Dark/Light theme
- ✅ Keyboard shortcuts
- ✅ Custom reports builder
- ✅ Predictive analytics
- ✅ Receipt printing (saves to Documents/Sphincs Receipts)
- ✅ Transaction details dialog
- ✅ Refund processing dialog
- ✅ Discount dialog for POS
- ✅ Payment dialog with multiple payment methods
- ✅ Coupon redemption dialog with real-time validation
- ✅ Loyalty points redemption dialog
- ✅ Add Account dialog for Chart of Accounts
- ✅ Create Invoice dialog with item management
- ✅ Add Loyalty Program dialog
- ✅ Add Coupon dialog with code validation
- ✅ Add Expiry Record dialog
- ✅ Automatic loyalty points awarding on order completion
- ✅ Hold order functionality in POS
- ✅ POS product loading from database
- ✅ Quick action handlers in dashboard (New Product, Add Staff, Sync Data)
- ✅ Add Schedule dialog for staff scheduling
- ✅ Industry-specific modules (Retail, Healthcare, Education, Manufacturing, Logistics)
- ✅ Advanced Operations Hub with 9 integrated modules
- ✅ Dynamic form dialog system for reusable form generation
- ✅ Receipt printing utility
- ✅ Loyalty points utility for automatic point awarding
- ✅ Add/Edit Ingredient dialogs
- ✅ Add/Edit Staff dialogs
- ✅ POS login screen with secure authentication
- ✅ Staff attendance view (separate from attendance management)

### Future Enhancements

- [ ] Physical receipt printer integration
- [ ] Multi-language support
- [ ] Advanced reporting templates
- [ ] Mobile native apps (iOS/Android)

## Version

Current Version: **1.0.0**

## License

[To be determined]

## Support

For detailed architecture and implementation plans, see `plan.md`.

For quick setup instructions, see `QUICKSTART.md`.

