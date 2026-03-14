"""
Financial Management Module - Accounting, Invoices, Expenses, Reports
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QTabWidget, QMessageBox,
    QDateEdit, QComboBox, QLineEdit, QDoubleSpinBox, QTextEdit, QDialog
)
from PyQt6.QtCore import Qt, QDate
from PyQt6.QtGui import QColor
from loguru import logger
from datetime import datetime, date
from src.database.connection import get_db_session
from src.database.models import (
    Account, Transaction, Invoice, Expense, Tax,
    Customer, Supplier, Order
)
from src.gui.add_expense_dialog import AddExpenseDialog
from src.gui.design_system import (
    DATA_TABLE_STYLE,
    FILTER_COMBO_STYLE,
    PRIMARY_BUTTON_STYLE,
    TAB_WIDGET_STYLE,
)
from src.gui.table_utils import enable_table_auto_resize


class FinancialManagementView(QWidget):
    """Financial Management View with tabs"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        self.load_data()
    
    def setup_ui(self):
        """Setup financial management UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header spacing alignment
        header_layout = QHBoxLayout()
        header_layout.addStretch()
        
        layout.addLayout(header_layout)
        layout.addSpacing(12)
        
        # Tabs
        self.tabs = QTabWidget()
        self.tabs.setStyleSheet(TAB_WIDGET_STYLE)
        
        # Accounts Tab
        self.accounts_tab = self.create_accounts_tab()
        self.tabs.addTab(self.accounts_tab, "Chart of Accounts")
        
        # Transactions Tab
        self.transactions_tab = self.create_transactions_tab()
        self.tabs.addTab(self.transactions_tab, "Transactions")
        
        # Invoices Tab
        self.invoices_tab = self.create_invoices_tab()
        self.tabs.addTab(self.invoices_tab, "Invoices")
        
        # Expenses Tab
        self.expenses_tab = self.create_expenses_tab()
        self.tabs.addTab(self.expenses_tab, "Expenses")
        
        # Tax Tab
        self.tax_tab = self.create_tax_tab()
        self.tabs.addTab(self.tax_tab, "Tax Configuration")
        
        # Reports Tab
        self.reports_tab = self.create_reports_tab()
        self.tabs.addTab(self.reports_tab, "Financial Reports")
        
        layout.addWidget(self.tabs)
    
    def create_accounts_tab(self):
        """Create Chart of Accounts tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(16)
        layout.setContentsMargins(16, 16, 16, 16)
        
        # Header
        header = QHBoxLayout()
        header.addWidget(QLabel("Chart of Accounts"))
        header.addStretch()
        
        add_btn = QPushButton("Add Account")
        add_btn.setStyleSheet(self.get_button_style())
        add_btn.clicked.connect(self.handle_add_account)
        header.addWidget(add_btn)
        
        layout.addLayout(header)
        
        # Accounts table
        self.accounts_table = QTableWidget()
        self.accounts_table.setColumnCount(6)
        self.accounts_table.setHorizontalHeaderLabels([
            "Code", "Account Name", "Type", "Balance", "Currency", "Status"
        ])
        self.accounts_table.setStyleSheet(self.get_table_style())
        enable_table_auto_resize(self.accounts_table)
        layout.addWidget(self.accounts_table)
        
        return widget
    
    def create_transactions_tab(self):
        """Create Transactions tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(16)
        layout.setContentsMargins(16, 16, 16, 16)
        
        # Filters
        filter_layout = QHBoxLayout()
        filter_layout.addWidget(QLabel("From:"))
        self.trans_from_date = QDateEdit()
        self.trans_from_date.setDate(QDate.currentDate().addMonths(-1))
        self.trans_from_date.setCalendarPopup(True)
        filter_layout.addWidget(self.trans_from_date)
        
        filter_layout.addWidget(QLabel("To:"))
        self.trans_to_date = QDateEdit()
        self.trans_to_date.setDate(QDate.currentDate())
        self.trans_to_date.setCalendarPopup(True)
        filter_layout.addWidget(self.trans_to_date)
        
        filter_layout.addWidget(QLabel("Account:"))
        self.trans_account_combo = QComboBox()
        self.trans_account_combo.addItem("All Accounts")
        filter_layout.addWidget(self.trans_account_combo)
        
        filter_btn = QPushButton("Filter")
        filter_btn.setStyleSheet(self.get_button_style())
        filter_btn.clicked.connect(self.load_transactions)
        filter_layout.addWidget(filter_btn)
        
        filter_layout.addStretch()
        layout.addLayout(filter_layout)
        
        # Transactions table
        self.transactions_table = QTableWidget()
        self.transactions_table.setColumnCount(7)
        self.transactions_table.setHorizontalHeaderLabels([
            "Date", "Account", "Type", "Amount", "Currency", "Description", "Reference"
        ])
        self.transactions_table.setStyleSheet(self.get_table_style())
        enable_table_auto_resize(self.transactions_table)
        layout.addWidget(self.transactions_table)
        
        return widget
    
    def create_invoices_tab(self):
        """Create Invoices tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(16)
        layout.setContentsMargins(16, 16, 16, 16)
        
        # Header
        header = QHBoxLayout()
        header.addWidget(QLabel("Invoices"))
        header.addStretch()
        
        add_btn = QPushButton("Create Invoice")
        add_btn.setStyleSheet(self.get_button_style())
        add_btn.clicked.connect(self.handle_create_invoice)
        header.addWidget(add_btn)
        
        layout.addLayout(header)
        
        # Invoices table
        self.invoices_table = QTableWidget()
        self.invoices_table.setColumnCount(8)
        self.invoices_table.setHorizontalHeaderLabels([
            "Invoice #", "Type", "Customer/Supplier", "Amount", "Tax", "Total", "Status", "Date"
        ])
        self.invoices_table.setStyleSheet(self.get_table_style())
        enable_table_auto_resize(self.invoices_table)
        layout.addWidget(self.invoices_table)
        
        return widget
    
    def create_expenses_tab(self):
        """Create Expenses tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(16)
        layout.setContentsMargins(16, 16, 16, 16)
        
        # Header
        header = QHBoxLayout()
        header.addWidget(QLabel("Expenses"))
        header.addStretch()
        
        add_btn = QPushButton("Add Expense")
        add_btn.setStyleSheet(self.get_button_style())
        add_btn.clicked.connect(self.handle_add_expense)
        header.addWidget(add_btn)
        
        layout.addLayout(header)
        
        # Expenses table
        self.expenses_table = QTableWidget()
        self.expenses_table.setColumnCount(7)
        self.expenses_table.setHorizontalHeaderLabels([
            "Date", "Category", "Description", "Amount", "Currency", "Supplier/Staff", "Status"
        ])
        self.expenses_table.setStyleSheet(self.get_table_style())
        enable_table_auto_resize(self.expenses_table)
        layout.addWidget(self.expenses_table)
        
        return widget
    
    def create_tax_tab(self):
        """Create Tax Configuration tab"""
        from src.gui.tax_management import TaxManagementView
        tax_view = TaxManagementView(self.user_id)
        return tax_view
    
    def create_reports_tab(self):
        """Create Financial Reports tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(16)
        layout.setContentsMargins(16, 16, 16, 16)
        
        # Report buttons
        reports_layout = QHBoxLayout()
        
        pl_btn = QPushButton("Profit & Loss")
        pl_btn.setStyleSheet(self.get_button_style())
        pl_btn.clicked.connect(self.generate_profit_loss)
        reports_layout.addWidget(pl_btn)
        
        balance_btn = QPushButton("Balance Sheet")
        balance_btn.setStyleSheet(self.get_button_style())
        balance_btn.clicked.connect(self.generate_balance_sheet)
        reports_layout.addWidget(balance_btn)
        
        cashflow_btn = QPushButton("Cash Flow")
        cashflow_btn.setStyleSheet(self.get_button_style())
        cashflow_btn.clicked.connect(self.generate_cash_flow)
        reports_layout.addWidget(cashflow_btn)
        
        reports_layout.addStretch()
        layout.addLayout(reports_layout)
        
        # Date range for reports
        date_layout = QHBoxLayout()
        date_layout.addWidget(QLabel("From:"))
        self.report_from_date = QDateEdit()
        self.report_from_date.setDate(QDate.currentDate().addMonths(-1))
        self.report_from_date.setCalendarPopup(True)
        self.report_from_date.setStyleSheet(FILTER_COMBO_STYLE)
        date_layout.addWidget(self.report_from_date)
        
        date_layout.addWidget(QLabel("To:"))
        self.report_to_date = QDateEdit()
        self.report_to_date.setDate(QDate.currentDate())
        self.report_to_date.setCalendarPopup(True)
        self.report_to_date.setStyleSheet(FILTER_COMBO_STYLE)
        date_layout.addWidget(self.report_to_date)
        
        date_layout.addStretch()
        layout.addLayout(date_layout)
        
        # Report display area
        self.report_text = QTextEdit()
        self.report_text.setReadOnly(True)
        self.report_text.setStyleSheet(
            "QTextEdit { border: 1px solid rgba(147, 167, 198, 0.36); border-radius: 14px; "
            "padding: 14px; font-family: 'Consolas', 'Cascadia Mono', monospace; font-size: 12px; "
            "background-color: rgba(255, 255, 255, 0.92); }"
        )
        layout.addWidget(self.report_text)
        
        return widget
    
    def load_data(self):
        """Load all financial data"""
        self.load_accounts()
        self.load_transactions()
        self.load_invoices()
        self.load_expenses()
        self.load_taxes()
        self.load_account_combo()
    
    def load_accounts(self):
        """Load chart of accounts"""
        try:
            db = get_db_session()
            accounts = db.query(Account).filter(Account.is_active == True).all()
            
            self.accounts_table.setRowCount(len(accounts))
            for row, account in enumerate(accounts):
                self.accounts_table.setItem(row, 0, QTableWidgetItem(account.account_code))
                self.accounts_table.setItem(row, 1, QTableWidgetItem(account.account_name))
                self.accounts_table.setItem(row, 2, QTableWidgetItem(account.account_type))
                self.accounts_table.setItem(row, 3, QTableWidgetItem(f"{account.balance:,.2f}"))
                self.accounts_table.setItem(row, 4, QTableWidgetItem(account.currency))
                status_item = QTableWidgetItem("Active" if account.is_active else "Inactive")
                if not account.is_active:
                    status_item.setForeground(QColor("#D92D20"))
                self.accounts_table.setItem(row, 5, status_item)
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading accounts: {e}")
            QMessageBox.critical(self, "Error", f"Failed to load accounts: {str(e)}")
    
    def load_transactions(self):
        """Load transactions"""
        try:
            db = get_db_session()
            from_date = self.trans_from_date.date().toPyDate()
            to_date = self.trans_to_date.date().toPyDate()
            
            query = db.query(Transaction).filter(
                Transaction.transaction_date >= from_date,
                Transaction.transaction_date <= to_date
            )
            
            account_filter = self.trans_account_combo.currentText()
            if account_filter != "All Accounts":
                account_id = int(account_filter.split(" - ")[0])
                query = query.filter(Transaction.account_id == account_id)
            
            transactions = query.order_by(Transaction.transaction_date.desc()).all()
            
            self.transactions_table.setRowCount(len(transactions))
            for row, trans in enumerate(transactions):
                self.transactions_table.setItem(row, 0, QTableWidgetItem(
                    trans.transaction_date.strftime("%Y-%m-%d %H:%M")
                ))
                self.transactions_table.setItem(row, 1, QTableWidgetItem(trans.account.account_name))
                self.transactions_table.setItem(row, 2, QTableWidgetItem(trans.transaction_type))
                amount_item = QTableWidgetItem(f"{trans.amount:,.2f}")
                if trans.transaction_type == "debit":
                    amount_item.setForeground(QColor("#D92D20"))
                else:
                    amount_item.setForeground(QColor("#14B8A6"))
                self.transactions_table.setItem(row, 3, amount_item)
                self.transactions_table.setItem(row, 4, QTableWidgetItem(trans.currency))
                self.transactions_table.setItem(row, 5, QTableWidgetItem(trans.description or ""))
                ref = f"{trans.reference_type}: {trans.reference_id}" if trans.reference_type else ""
                self.transactions_table.setItem(row, 6, QTableWidgetItem(ref))
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading transactions: {e}")
            QMessageBox.critical(self, "Error", f"Failed to load transactions: {str(e)}")
    
    def load_invoices(self):
        """Load invoices"""
        try:
            db = get_db_session()
            invoices = db.query(Invoice).order_by(Invoice.issue_date.desc()).limit(100).all()
            
            self.invoices_table.setRowCount(len(invoices))
            for row, invoice in enumerate(invoices):
                self.invoices_table.setItem(row, 0, QTableWidgetItem(invoice.invoice_number))
                self.invoices_table.setItem(row, 1, QTableWidgetItem(invoice.invoice_type))
                
                customer_supplier = ""
                if invoice.customer:
                    customer_supplier = f"{invoice.customer.first_name} {invoice.customer.last_name}"
                elif invoice.supplier:
                    customer_supplier = invoice.supplier.name
                
                self.invoices_table.setItem(row, 2, QTableWidgetItem(customer_supplier))
                self.invoices_table.setItem(row, 3, QTableWidgetItem(f"{invoice.subtotal:,.2f}"))
                self.invoices_table.setItem(row, 4, QTableWidgetItem(f"{invoice.tax_amount:,.2f}"))
                self.invoices_table.setItem(row, 5, QTableWidgetItem(f"{invoice.total_amount:,.2f}"))
                
                status_item = QTableWidgetItem(invoice.status)
                if invoice.status == "paid":
                    status_item.setForeground(QColor("#14B8A6"))
                elif invoice.status == "overdue":
                    status_item.setForeground(QColor("#D92D20"))
                self.invoices_table.setItem(row, 6, status_item)
                
                self.invoices_table.setItem(row, 7, QTableWidgetItem(
                    invoice.issue_date.strftime("%Y-%m-%d")
                ))
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading invoices: {e}")
            QMessageBox.critical(self, "Error", f"Failed to load invoices: {str(e)}")
    
    def load_expenses(self):
        """Load expenses"""
        try:
            db = get_db_session()
            expenses = db.query(Expense).order_by(Expense.expense_date.desc()).limit(100).all()
            
            self.expenses_table.setRowCount(len(expenses))
            for row, expense in enumerate(expenses):
                self.expenses_table.setItem(row, 0, QTableWidgetItem(
                    expense.expense_date.strftime("%Y-%m-%d")
                ))
                self.expenses_table.setItem(row, 1, QTableWidgetItem(expense.expense_category))
                self.expenses_table.setItem(row, 2, QTableWidgetItem(expense.description))
                self.expenses_table.setItem(row, 3, QTableWidgetItem(f"{expense.amount:,.2f}"))
                self.expenses_table.setItem(row, 4, QTableWidgetItem(expense.currency))
                
                supplier_staff = ""
                if expense.supplier:
                    supplier_staff = expense.supplier.name
                elif expense.staff:
                    supplier_staff = f"{expense.staff.first_name} {expense.staff.last_name}"
                
                self.expenses_table.setItem(row, 5, QTableWidgetItem(supplier_staff))
                self.expenses_table.setItem(row, 6, QTableWidgetItem("Recorded"))
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading expenses: {e}")
            QMessageBox.critical(self, "Error", f"Failed to load expenses: {str(e)}")
    
    def load_taxes(self):
        """Load tax configuration - now handled by TaxManagementView"""
        pass
    
    def load_account_combo(self):
        """Load accounts into combo box"""
        try:
            db = get_db_session()
            accounts = db.query(Account).filter(Account.is_active == True).all()
            
            self.trans_account_combo.clear()
            self.trans_account_combo.addItem("All Accounts")
            for account in accounts:
                self.trans_account_combo.addItem(f"{account.account_id} - {account.account_name}")
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading accounts combo: {e}")
    
    def generate_profit_loss(self):
        """Generate Profit & Loss statement"""
        try:
            from_date = self.report_from_date.date().toPyDate()
            to_date = self.report_to_date.date().toPyDate()
            
            db = get_db_session()
            
            # Revenue
            revenue_accounts = db.query(Account).filter(
                Account.account_type == "revenue",
                Account.is_active == True
            ).all()
            
            total_revenue = 0
            revenue_lines = ["REVENUE", "=" * 50]
            for account in revenue_accounts:
                transactions = db.query(Transaction).filter(
                    Transaction.account_id == account.account_id,
                    Transaction.transaction_date >= from_date,
                    Transaction.transaction_date <= to_date,
                    Transaction.transaction_type == "credit"
                ).all()
                account_total = sum(t.amount for t in transactions)
                total_revenue += account_total
                revenue_lines.append(f"  {account.account_name:40} {account_total:>10,.2f}")
            revenue_lines.append(f"{'Total Revenue':40} {total_revenue:>10,.2f}")
            revenue_lines.append("")
            
            # Expenses
            expense_accounts = db.query(Account).filter(
                Account.account_type == "expense",
                Account.is_active == True
            ).all()
            
            total_expenses = 0
            expense_lines = ["EXPENSES", "=" * 50]
            for account in expense_accounts:
                transactions = db.query(Transaction).filter(
                    Transaction.account_id == account.account_id,
                    Transaction.transaction_date >= from_date,
                    Transaction.transaction_date <= to_date,
                    Transaction.transaction_type == "debit"
                ).all()
                account_total = sum(t.amount for t in transactions)
                total_expenses += account_total
                expense_lines.append(f"  {account.account_name:40} {account_total:>10,.2f}")
            expense_lines.append(f"{'Total Expenses':40} {total_expenses:>10,.2f}")
            expense_lines.append("")
            
            # Net Income
            net_income = total_revenue - total_expenses
            net_lines = [
                "=" * 50,
                f"{'Net Income':40} {net_income:>10,.2f}",
                "=" * 50
            ]
            
            report = "\n".join(revenue_lines + expense_lines + net_lines)
            self.report_text.setPlainText(report)
            
            db.close()
        except Exception as e:
            logger.error(f"Error generating P&L: {e}")
            QMessageBox.critical(self, "Error", f"Failed to generate report: {str(e)}")
    
    def generate_balance_sheet(self):
        """Generate Balance Sheet"""
        try:
            to_date = self.report_to_date.date().toPyDate()
            
            db = get_db_session()
            
            report_lines = ["BALANCE SHEET", f"As of {to_date.strftime('%Y-%m-%d')}", "=" * 50, ""]
            
            # Assets
            asset_accounts = db.query(Account).filter(
                Account.account_type == "asset",
                Account.is_active == True
            ).all()
            
            total_assets = 0
            report_lines.append("ASSETS")
            report_lines.append("-" * 50)
            for account in asset_accounts:
                # Calculate balance up to date
                debits = db.query(Transaction).filter(
                    Transaction.account_id == account.account_id,
                    Transaction.transaction_date <= to_date,
                    Transaction.transaction_type == "debit"
                ).all()
                credits = db.query(Transaction).filter(
                    Transaction.account_id == account.account_id,
                    Transaction.transaction_date <= to_date,
                    Transaction.transaction_type == "credit"
                ).all()
                balance = sum(t.amount for t in debits) - sum(t.amount for t in credits)
                total_assets += balance
                report_lines.append(f"  {account.account_name:40} {balance:>10,.2f}")
            report_lines.append(f"{'Total Assets':40} {total_assets:>10,.2f}")
            report_lines.append("")
            
            # Liabilities
            liability_accounts = db.query(Account).filter(
                Account.account_type == "liability",
                Account.is_active == True
            ).all()
            
            total_liabilities = 0
            report_lines.append("LIABILITIES")
            report_lines.append("-" * 50)
            for account in liability_accounts:
                credits = db.query(Transaction).filter(
                    Transaction.account_id == account.account_id,
                    Transaction.transaction_date <= to_date,
                    Transaction.transaction_type == "credit"
                ).all()
                debits = db.query(Transaction).filter(
                    Transaction.account_id == account.account_id,
                    Transaction.transaction_date <= to_date,
                    Transaction.transaction_type == "debit"
                ).all()
                balance = sum(t.amount for t in credits) - sum(t.amount for t in debits)
                total_liabilities += balance
                report_lines.append(f"  {account.account_name:40} {balance:>10,.2f}")
            report_lines.append(f"{'Total Liabilities':40} {total_liabilities:>10,.2f}")
            report_lines.append("")
            
            # Equity
            equity_accounts = db.query(Account).filter(
                Account.account_type == "equity",
                Account.is_active == True
            ).all()
            
            total_equity = 0
            report_lines.append("EQUITY")
            report_lines.append("-" * 50)
            for account in equity_accounts:
                credits = db.query(Transaction).filter(
                    Transaction.account_id == account.account_id,
                    Transaction.transaction_date <= to_date,
                    Transaction.transaction_type == "credit"
                ).all()
                debits = db.query(Transaction).filter(
                    Transaction.account_id == account.account_id,
                    Transaction.transaction_date <= to_date,
                    Transaction.transaction_type == "debit"
                ).all()
                balance = sum(t.amount for t in credits) - sum(t.amount for t in debits)
                total_equity += balance
                report_lines.append(f"  {account.account_name:40} {balance:>10,.2f}")
            report_lines.append(f"{'Total Equity':40} {total_equity:>10,.2f}")
            report_lines.append("")
            report_lines.append("=" * 50)
            report_lines.append(f"{'Total Liabilities + Equity':40} {total_liabilities + total_equity:>10,.2f}")
            
            report = "\n".join(report_lines)
            self.report_text.setPlainText(report)
            
            db.close()
        except Exception as e:
            logger.error(f"Error generating balance sheet: {e}")
            QMessageBox.critical(self, "Error", f"Failed to generate report: {str(e)}")
    
    def generate_cash_flow(self):
        """Generate Cash Flow statement"""
        try:
            from_date = self.report_from_date.date().toPyDate()
            to_date = self.report_to_date.date().toPyDate()
            
            db = get_db_session()
            
            # Get cash accounts
            cash_accounts = db.query(Account).filter(
                Account.account_type == "asset",
                Account.account_name.ilike("%cash%"),
                Account.is_active == True
            ).all()
            
            report_lines = [
                "CASH FLOW STATEMENT",
                f"Period: {from_date.strftime('%Y-%m-%d')} to {to_date.strftime('%Y-%m-%d')}",
                "=" * 50,
                ""
            ]
            
            # Operating Activities
            report_lines.append("OPERATING ACTIVITIES")
            report_lines.append("-" * 50)
            
            # Cash from sales
            sales_transactions = db.query(Transaction).join(Account).filter(
                Account.account_type == "revenue",
                Transaction.transaction_date >= from_date,
                Transaction.transaction_date <= to_date,
                Transaction.transaction_type == "credit"
            ).all()
            cash_from_sales = sum(t.amount for t in sales_transactions)
            report_lines.append(f"  Cash from Sales{'':30} {cash_from_sales:>10,.2f}")
            
            # Cash for expenses
            expense_transactions = db.query(Transaction).join(Account).filter(
                Account.account_type == "expense",
                Transaction.transaction_date >= from_date,
                Transaction.transaction_date <= to_date,
                Transaction.transaction_type == "debit"
            ).all()
            cash_for_expenses = sum(t.amount for t in expense_transactions)
            report_lines.append(f"  Cash for Expenses{'':28} {cash_for_expenses:>10,.2f}")
            
            net_operating = cash_from_sales - cash_for_expenses
            report_lines.append(f"{'Net Cash from Operating Activities':40} {net_operating:>10,.2f}")
            report_lines.append("")
            
            # Investing Activities
            report_lines.append("INVESTING ACTIVITIES")
            report_lines.append("-" * 50)
            
            # Capital expenditures (asset purchases)
            asset_purchases = db.query(Transaction).join(Account).filter(
                Account.account_type == "asset",
                ~Account.account_name.ilike("%cash%"),
                Transaction.transaction_date >= from_date,
                Transaction.transaction_date <= to_date,
                Transaction.transaction_type == "debit"
            ).all()
            cash_for_assets = sum(t.amount for t in asset_purchases)
            if cash_for_assets > 0:
                report_lines.append(f"  Purchase of Assets{'':28} {cash_for_assets:>10,.2f}")
            
            # Asset sales
            asset_sales = db.query(Transaction).join(Account).filter(
                Account.account_type == "asset",
                ~Account.account_name.ilike("%cash%"),
                Transaction.transaction_date >= from_date,
                Transaction.transaction_date <= to_date,
                Transaction.transaction_type == "credit"
            ).all()
            cash_from_assets = sum(t.amount for t in asset_sales)
            if cash_from_assets > 0:
                report_lines.append(f"  Sale of Assets{'':32} {cash_from_assets:>10,.2f}")
            
            net_investing = cash_from_assets - cash_for_assets
            if net_investing == 0 and cash_for_assets == 0 and cash_from_assets == 0:
                report_lines.append(f"  (No investing activities recorded){'':10} {0:>10,.2f}")
            else:
                report_lines.append(f"{'Net Cash from Investing Activities':40} {net_investing:>10,.2f}")
            report_lines.append("")
            
            # Financing Activities
            report_lines.append("FINANCING ACTIVITIES")
            report_lines.append("-" * 50)
            
            # Loans/borrowings (liability increases)
            loan_proceeds = db.query(Transaction).join(Account).filter(
                Account.account_type == "liability",
                Transaction.transaction_date >= from_date,
                Transaction.transaction_date <= to_date,
                Transaction.transaction_type == "credit"
            ).all()
            cash_from_loans = sum(t.amount for t in loan_proceeds)
            if cash_from_loans > 0:
                report_lines.append(f"  Proceeds from Loans{'':26} {cash_from_loans:>10,.2f}")
            
            # Loan repayments (liability decreases)
            loan_repayments = db.query(Transaction).join(Account).filter(
                Account.account_type == "liability",
                Transaction.transaction_date >= from_date,
                Transaction.transaction_date <= to_date,
                Transaction.transaction_type == "debit"
            ).all()
            cash_for_loans = sum(t.amount for t in loan_repayments)
            if cash_for_loans > 0:
                report_lines.append(f"  Loan Repayments{'':30} {cash_for_loans:>10,.2f}")
            
            # Equity contributions
            equity_contributions = db.query(Transaction).join(Account).filter(
                Account.account_type == "equity",
                Transaction.transaction_date >= from_date,
                Transaction.transaction_date <= to_date,
                Transaction.transaction_type == "credit"
            ).all()
            cash_from_equity = sum(t.amount for t in equity_contributions)
            if cash_from_equity > 0:
                report_lines.append(f"  Equity Contributions{'':25} {cash_from_equity:>10,.2f}")
            
            # Equity distributions/dividends
            equity_distributions = db.query(Transaction).join(Account).filter(
                Account.account_type == "equity",
                Transaction.transaction_date >= from_date,
                Transaction.transaction_date <= to_date,
                Transaction.transaction_type == "debit"
            ).all()
            cash_for_equity = sum(t.amount for t in equity_distributions)
            if cash_for_equity > 0:
                report_lines.append(f"  Equity Distributions{'':26} {cash_for_equity:>10,.2f}")
            
            net_financing = cash_from_loans + cash_from_equity - cash_for_loans - cash_for_equity
            if net_financing == 0 and cash_from_loans == 0 and cash_for_loans == 0 and cash_from_equity == 0 and cash_for_equity == 0:
                report_lines.append(f"  (No financing activities recorded){'':9} {0:>10,.2f}")
            else:
                report_lines.append(f"{'Net Cash from Financing Activities':40} {net_financing:>10,.2f}")
            report_lines.append("")
            
            report_lines.append("=" * 50)
            net_change = net_operating + net_investing + net_financing
            report_lines.append(f"{'Net Change in Cash':40} {net_change:>10,.2f}")
            
            report = "\n".join(report_lines)
            self.report_text.setPlainText(report)
            
            db.close()
        except Exception as e:
            logger.error(f"Error generating cash flow: {e}")
            QMessageBox.critical(self, "Error", f"Failed to generate report: {str(e)}")
    
    def handle_add_account(self):
        """Handle add account"""
        from src.gui.add_account_dialog import AddAccountDialog
        dialog = AddAccountDialog(self.user_id, self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            self.load_accounts()  # Refresh the list
    
    def handle_create_invoice(self):
        """Handle create invoice"""
        from src.gui.create_invoice_dialog import CreateInvoiceDialog
        dialog = CreateInvoiceDialog(self.user_id, self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            self.load_invoices()  # Refresh the list
    
    def handle_add_expense(self):
        """Handle add expense"""
        dialog = AddExpenseDialog(self.user_id, self)
        if dialog.exec():
            self.load_expenses()
    
    def handle_add_tax(self):
        """Handle add tax - now handled by TaxManagementView"""
        pass
    
    def get_button_style(self):
        """Get standard button style"""
        return PRIMARY_BUTTON_STYLE
    
    def get_table_style(self):
        """Get standard table style"""
        return DATA_TABLE_STYLE

