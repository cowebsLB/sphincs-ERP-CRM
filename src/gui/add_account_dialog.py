"""
Add Account Dialog - Create new chart of accounts entries
"""

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QLineEdit, QComboBox, QDoubleSpinBox, QFormLayout, QMessageBox,
    QCheckBox
)
from PyQt6.QtCore import Qt
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import Account


class AddAccountDialog(QDialog):
    """Dialog for adding a new account to the chart of accounts"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setWindowTitle("Add Account")
        self.setModal(True)
        self.setMinimumWidth(500)
        self.setup_ui()
    
    def setup_ui(self):
        """Setup dialog UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(24, 24, 24, 24)
        
        form_layout = QFormLayout()
        form_layout.setSpacing(12)
        
        # Account code
        self.code_input = QLineEdit()
        self.code_input.setPlaceholderText("e.g., 1000, 2000, 3000")
        form_layout.addRow("Account Code *:", self.code_input)
        
        # Account name
        self.name_input = QLineEdit()
        self.name_input.setPlaceholderText("e.g., Cash, Accounts Receivable, Sales Revenue")
        form_layout.addRow("Account Name *:", self.name_input)
        
        # Account type
        self.type_combo = QComboBox()
        self.type_combo.addItems([
            "asset",
            "liability",
            "equity",
            "revenue",
            "expense"
        ])
        form_layout.addRow("Account Type *:", self.type_combo)
        
        # Parent account (optional)
        self.parent_combo = QComboBox()
        self.parent_combo.addItem("None (Top-level account)", None)
        self.load_parent_accounts()
        form_layout.addRow("Parent Account:", self.parent_combo)
        
        # Initial balance
        self.balance_input = QDoubleSpinBox()
        self.balance_input.setMinimum(-999999999.99)
        self.balance_input.setMaximum(999999999.99)
        self.balance_input.setDecimals(2)
        self.balance_input.setPrefix("$")
        self.balance_input.setValue(0.0)
        form_layout.addRow("Initial Balance:", self.balance_input)
        
        # Currency
        self.currency_combo = QComboBox()
        self.currency_combo.addItems(["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CNY"])
        self.currency_combo.setCurrentText("USD")
        form_layout.addRow("Currency:", self.currency_combo)
        
        # Active status
        self.active_checkbox = QCheckBox()
        self.active_checkbox.setChecked(True)
        form_layout.addRow("Active:", self.active_checkbox)
        
        layout.addLayout(form_layout)
        
        # Info label
        info_label = QLabel(
            "Account codes are typically numeric (e.g., 1000-1999 for Assets, "
            "2000-2999 for Liabilities, 3000-3999 for Equity, 4000-4999 for Revenue, "
            "5000-5999 for Expenses)."
        )
        info_label.setWordWrap(True)
        info_label.setStyleSheet("""
            color: #5D6F8B;
            font-size: 12px;
            padding: 12px;
            background-color: #F9FAFB;
            border-radius: 6px;
        """)
        layout.addWidget(info_label)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        save_btn = QPushButton("Add Account")
        save_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #1D66EA;
            }
        """)
        save_btn.clicked.connect(self.handle_save)
        buttons_layout.addWidget(save_btn)
        
        layout.addLayout(buttons_layout)
    
    def load_parent_accounts(self):
        """Load parent accounts"""
        db = get_db_session()
        try:
            accounts = db.query(Account).filter(Account.is_active == True).all()
            for account in accounts:
                self.parent_combo.addItem(
                    f"{account.account_code} - {account.account_name}",
                    account.account_id
                )
        except Exception as e:
            logger.error(f"Error loading parent accounts: {e}")
        finally:
            db.close()
    
    def handle_save(self):
        """Handle save button click"""
        code = self.code_input.text().strip()
        if not code:
            QMessageBox.warning(self, "Validation Error", "Account code is required.")
            return
        
        name = self.name_input.text().strip()
        if not name:
            QMessageBox.warning(self, "Validation Error", "Account name is required.")
            return
        
        account_type = self.type_combo.currentText()
        parent_id = self.parent_combo.currentData()
        balance = self.balance_input.value()
        currency = self.currency_combo.currentText()
        
        db = get_db_session()
        try:
            # Check if account code already exists
            existing = db.query(Account).filter(Account.account_code == code).first()
            if existing:
                QMessageBox.warning(self, "Validation Error", 
                    f"Account code '{code}' already exists. Please use a different code.")
                return
            
            new_account = Account(
                account_code=code,
                account_name=name,
                account_type=account_type,
                parent_account_id=parent_id,
                balance=balance,
                currency=currency,
                is_active=self.active_checkbox.isChecked()
            )
            
            db.add(new_account)
            db.commit()
            
            logger.info(f"New account added: {code} - {name}")
            QMessageBox.information(self, "Success", f"Account '{name}' added successfully!")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error adding account: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to add account:\n{str(e)}")
        finally:
            db.close()

