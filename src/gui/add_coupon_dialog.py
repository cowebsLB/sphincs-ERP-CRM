"""
Add Coupon Dialog - Create new coupons/promotional codes
"""

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QLineEdit, QDoubleSpinBox, QDateEdit, QFormLayout, QMessageBox,
    QComboBox, QSpinBox, QCheckBox
)
from PyQt6.QtCore import Qt, QDate
from loguru import logger
from datetime import date
from src.database.connection import get_db_session
from src.database.models import Coupon


class AddCouponDialog(QDialog):
    """Dialog for adding a new coupon"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setWindowTitle("Add Coupon")
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
        
        # Coupon code
        self.code_input = QLineEdit()
        self.code_input.setPlaceholderText("e.g., SAVE20, WELCOME10")
        self.code_input.textChanged.connect(self.validate_code)
        form_layout.addRow("Coupon Code *:", self.code_input)
        
        # Code validation label
        self.code_validation_label = QLabel()
        self.code_validation_label.setStyleSheet("""
            color: #D92D20;
            font-size: 12px;
        """)
        self.code_validation_label.setVisible(False)
        form_layout.addRow("", self.code_validation_label)
        
        # Coupon name
        self.name_input = QLineEdit()
        self.name_input.setPlaceholderText("e.g., 20% Off Summer Sale")
        form_layout.addRow("Coupon Name *:", self.name_input)
        
        # Discount type
        self.discount_type = QComboBox()
        self.discount_type.addItems(["Percentage", "Fixed Amount"])
        self.discount_type.currentTextChanged.connect(self.update_discount_input)
        form_layout.addRow("Discount Type *:", self.discount_type)
        
        # Discount value
        self.discount_value = QDoubleSpinBox()
        self.discount_value.setMinimum(0.01)
        self.discount_value.setMaximum(100.0)
        self.discount_value.setDecimals(2)
        self.discount_value.setSuffix("%")
        self.discount_value.setValue(10.0)
        form_layout.addRow("Discount Value *:", self.discount_value)
        
        # Max discount amount (for percentage)
        self.max_discount = QDoubleSpinBox()
        self.max_discount.setMinimum(0.0)
        self.max_discount.setMaximum(99999.99)
        self.max_discount.setDecimals(2)
        self.max_discount.setPrefix("$")
        self.max_discount.setSpecialValueText("No limit")
        self.max_discount.setValue(0.0)
        form_layout.addRow("Max Discount Amount:", self.max_discount)
        
        # Minimum purchase amount
        self.min_purchase = QDoubleSpinBox()
        self.min_purchase.setMinimum(0.0)
        self.min_purchase.setMaximum(99999.99)
        self.min_purchase.setDecimals(2)
        self.min_purchase.setPrefix("$")
        self.min_purchase.setSpecialValueText("No minimum")
        self.min_purchase.setValue(0.0)
        form_layout.addRow("Minimum Purchase:", self.min_purchase)
        
        # Usage limit
        self.usage_limit = QSpinBox()
        self.usage_limit.setMinimum(0)
        self.usage_limit.setMaximum(999999)
        self.usage_limit.setSpecialValueText("Unlimited")
        self.usage_limit.setValue(0)
        form_layout.addRow("Usage Limit:", self.usage_limit)
        
        # Start date
        self.start_date = QDateEdit()
        self.start_date.setDate(QDate.currentDate())
        self.start_date.setCalendarPopup(True)
        form_layout.addRow("Start Date *:", self.start_date)
        
        # End date (optional)
        self.end_date = QDateEdit()
        self.end_date.setDate(QDate.currentDate().addMonths(1))
        self.end_date.setCalendarPopup(True)
        self.end_date.setMinimumDate(QDate(1900, 1, 1))
        self.end_date.setSpecialValueText("No end date")
        form_layout.addRow("End Date:", self.end_date)
        
        # Active status
        self.active_checkbox = QCheckBox()
        self.active_checkbox.setChecked(True)
        form_layout.addRow("Active:", self.active_checkbox)
        
        layout.addLayout(form_layout)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        save_btn = QPushButton("Add Coupon")
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
    
    def validate_code(self):
        """Validate coupon code uniqueness"""
        code = self.code_input.text().strip().upper()
        if not code:
            self.code_validation_label.setVisible(False)
            return
        
        db = get_db_session()
        try:
            existing = db.query(Coupon).filter(Coupon.coupon_code == code).first()
            if existing:
                self.code_validation_label.setText("⚠ This coupon code already exists")
                self.code_validation_label.setStyleSheet("""
                    color: #F59E0B;
                    font-size: 12px;
                """)
                self.code_validation_label.setVisible(True)
            else:
                self.code_validation_label.setText("✓ Code available")
                self.code_validation_label.setStyleSheet("""
                    color: #14B8A6;
                    font-size: 12px;
                """)
                self.code_validation_label.setVisible(True)
        except Exception as e:
            logger.error(f"Error validating coupon code: {e}")
        finally:
            db.close()
    
    def update_discount_input(self):
        """Update discount value input based on type"""
        discount_type = self.discount_type.currentText()
        if discount_type == "Percentage":
            self.discount_value.setMaximum(100.0)
            self.discount_value.setSuffix("%")
            self.max_discount.setEnabled(True)
        else:
            self.discount_value.setMaximum(99999.99)
            self.discount_value.setSuffix("")
            self.max_discount.setEnabled(False)
            self.max_discount.setValue(0.0)
    
    def handle_save(self):
        """Handle save button click"""
        code = self.code_input.text().strip().upper()
        if not code:
            QMessageBox.warning(self, "Validation Error", "Coupon code is required.")
            return
        
        name = self.name_input.text().strip()
        if not name:
            QMessageBox.warning(self, "Validation Error", "Coupon name is required.")
            return
        
        # Check code uniqueness
        db = get_db_session()
        try:
            existing = db.query(Coupon).filter(Coupon.coupon_code == code).first()
            if existing:
                QMessageBox.warning(self, "Validation Error", 
                    f"Coupon code '{code}' already exists. Please use a different code.")
                return
        finally:
            db.close()
        
        discount_type = self.discount_type.currentText().lower().replace(" ", "_")
        discount_value = self.discount_value.value()
        
        if discount_type == "percentage" and discount_value > 100:
            QMessageBox.warning(self, "Validation Error", "Percentage discount cannot exceed 100%.")
            return
        
        min_purchase = self.min_purchase.value() if self.min_purchase.value() > 0 else None
        max_discount = self.max_discount.value() if self.max_discount.value() > 0 else None
        usage_limit = self.usage_limit.value() if self.usage_limit.value() > 0 else None
        
        start_date = self.start_date.date().toPyDate()
        # Check if end date is set (not minimum date)
        end_date_val = self.end_date.date()
        end_date = end_date_val.toPyDate() if end_date_val != QDate(1900, 1, 1) else None
        
        if end_date and end_date < start_date:
            QMessageBox.warning(self, "Validation Error", "End date must be after start date.")
            return
        
        db = get_db_session()
        try:
            new_coupon = Coupon(
                coupon_code=code,
                coupon_name=name,
                discount_type=discount_type,
                discount_value=discount_value,
                min_purchase_amount=min_purchase,
                max_discount_amount=max_discount,
                usage_limit=usage_limit,
                usage_count=0,
                start_date=start_date,
                end_date=end_date,
                is_active=self.active_checkbox.isChecked()
            )
            
            db.add(new_coupon)
            db.commit()
            
            logger.info(f"New coupon added: {code} - {name}")
            QMessageBox.information(self, "Success", f"Coupon '{code}' added successfully!")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error adding coupon: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to add coupon:\n{str(e)}")
        finally:
            db.close()

