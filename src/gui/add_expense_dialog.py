"""
Add Expense Dialog - Record business expenses
"""

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QFormLayout, QLineEdit, QComboBox, QDoubleSpinBox, QDateEdit,
    QTextEdit, QMessageBox, QCheckBox
)
from PyQt6.QtCore import QDate
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import Expense, Supplier, Staff


class AddExpenseDialog(QDialog):
    """Dialog for adding an expense"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setWindowTitle("Add Expense")
        self.setMinimumSize(500, 500)
        self.setup_ui()
    
    def setup_ui(self):
        """Setup dialog UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(20, 20, 20, 20)
        
        form = QFormLayout()
        
        # Expense Category
        self.category_combo = QComboBox()
        self.category_combo.setEditable(True)
        self.category_combo.addItems([
            "utilities", "salaries", "supplies", "rent", "marketing",
            "maintenance", "insurance", "travel", "meals", "other"
        ])
        form.addRow("Category *:", self.category_combo)
        
        # Description
        self.description_input = QTextEdit()
        self.description_input.setMaximumHeight(80)
        self.description_input.setPlaceholderText("Expense description...")
        form.addRow("Description *:", self.description_input)
        
        # Amount
        self.amount_input = QDoubleSpinBox()
        self.amount_input.setMinimum(0.01)
        self.amount_input.setMaximum(999999.99)
        self.amount_input.setDecimals(2)
        self.amount_input.setPrefix("$")
        form.addRow("Amount *:", self.amount_input)
        
        # Currency
        self.currency_combo = QComboBox()
        self.currency_combo.addItems(["USD", "EUR", "GBP", "CAD", "AUD"])
        form.addRow("Currency:", self.currency_combo)
        
        # Expense Date
        self.expense_date = QDateEdit()
        self.expense_date.setDate(QDate.currentDate())
        self.expense_date.setCalendarPopup(True)
        form.addRow("Expense Date *:", self.expense_date)
        
        # Supplier (optional)
        self.supplier_combo = QComboBox()
        self.supplier_combo.addItem("None")
        self.load_suppliers()
        form.addRow("Supplier (optional):", self.supplier_combo)
        
        # Staff (optional)
        self.staff_combo = QComboBox()
        self.staff_combo.addItem("None")
        self.load_staff()
        form.addRow("Staff (optional):", self.staff_combo)
        
        # Payment Method
        self.payment_method_combo = QComboBox()
        self.payment_method_combo.addItems([
            "cash", "credit_card", "debit_card", "bank_transfer", "check", "other"
        ])
        form.addRow("Payment Method:", self.payment_method_combo)
        
        # Recurring
        self.recurring_check = QCheckBox()
        form.addRow("Recurring Expense:", self.recurring_check)
        
        # Recurring Frequency (only if recurring is checked)
        self.recurring_freq_combo = QComboBox()
        self.recurring_freq_combo.addItems(["weekly", "monthly", "quarterly", "yearly"])
        self.recurring_freq_combo.setEnabled(False)
        self.recurring_check.toggled.connect(self.recurring_freq_combo.setEnabled)
        form.addRow("Recurring Frequency:", self.recurring_freq_combo)
        
        layout.addLayout(form)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        save_btn = QPushButton("Save Expense")
        save_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-weight: 600;
            }
        """)
        save_btn.clicked.connect(self.handle_save)
        buttons_layout.addWidget(save_btn)
        
        layout.addLayout(buttons_layout)
    
    def load_suppliers(self):
        """Load suppliers"""
        try:
            db = get_db_session()
            suppliers = db.query(Supplier).filter(Supplier.status == 'active').all()
            for supplier in suppliers:
                self.supplier_combo.addItem(supplier.name, supplier.supplier_id)
            db.close()
        except Exception as e:
            logger.error(f"Error loading suppliers: {e}")
    
    def load_staff(self):
        """Load staff"""
        try:
            db = get_db_session()
            staff_list = db.query(Staff).filter(Staff.status == 'active').all()
            for staff in staff_list:
                self.staff_combo.addItem(
                    f"{staff.first_name} {staff.last_name}",
                    staff.staff_id
                )
            db.close()
        except Exception as e:
            logger.error(f"Error loading staff: {e}")
    
    def handle_save(self):
        """Save expense"""
        try:
            category = self.category_combo.currentText().strip()
            description = self.description_input.toPlainText().strip()
            
            if not category:
                QMessageBox.warning(self, "Validation Error", "Category is required")
                return
            
            if not description:
                QMessageBox.warning(self, "Validation Error", "Description is required")
                return
            
            db = get_db_session()
            
            supplier_id = None
            if self.supplier_combo.currentIndex() > 0:
                supplier_id = self.supplier_combo.currentData()
            
            staff_id = None
            if self.staff_combo.currentIndex() > 0:
                staff_id = self.staff_combo.currentData()
            
            expense = Expense(
                expense_category=category,
                description=description,
                amount=self.amount_input.value(),
                currency=self.currency_combo.currentText(),
                expense_date=self.expense_date.date().toPyDate(),
                supplier_id=supplier_id,
                staff_id=staff_id,
                payment_method=self.payment_method_combo.currentText(),
                is_recurring=self.recurring_check.isChecked(),
                recurring_frequency=self.recurring_freq_combo.currentText() if self.recurring_check.isChecked() else None
            )
            
            db.add(expense)
            db.commit()
            db.close()
            
            QMessageBox.information(self, "Success", "Expense added successfully")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error saving expense: {e}")
            QMessageBox.critical(self, "Error", f"Failed to save expense: {str(e)}")

