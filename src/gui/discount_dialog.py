"""
Discount Dialog - Apply discounts to orders
"""

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QDoubleSpinBox, QComboBox, QRadioButton, QButtonGroup,
    QFormLayout, QMessageBox
)
from PyQt6.QtCore import Qt
from loguru import logger


class DiscountDialog(QDialog):
    """Dialog for applying discounts to orders"""
    
    def __init__(self, order_total: float, parent=None):
        super().__init__(parent)
        self.order_total = order_total
        self.discount_amount = 0.0
        self.discount_type = "percentage"  # or "fixed"
        self.setWindowTitle("Apply Discount")
        self.setModal(True)
        self.setup_ui()
    
    def setup_ui(self):
        """Setup dialog UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(24, 24, 24, 24)
        
        # Order total display
        total_label = QLabel(f"Order Total: ${self.order_total:.2f}")
        total_label.setStyleSheet("""
            color: #162640;
            font-size: 16px;
            font-weight: 600;
            padding: 12px;
            background-color: #F9FAFB;
            border-radius: 6px;
        """)
        layout.addWidget(total_label)
        
        # Discount type
        type_group = QButtonGroup(self)
        form_layout = QFormLayout()
        form_layout.setSpacing(12)
        
        self.percentage_radio = QRadioButton("Percentage")
        self.percentage_radio.setChecked(True)
        type_group.addButton(self.percentage_radio)
        form_layout.addRow("Discount Type:", self.percentage_radio)
        
        self.fixed_radio = QRadioButton("Fixed Amount")
        type_group.addButton(self.fixed_radio)
        form_layout.addRow("", self.fixed_radio)
        
        # Discount value
        self.discount_value = QDoubleSpinBox()
        self.discount_value.setMinimum(0.0)
        self.discount_value.setMaximum(100.0)
        self.discount_value.setDecimals(2)
        self.discount_value.setSuffix("%")
        form_layout.addRow("Discount Value:", self.discount_value)
        
        # Connect radio buttons to update suffix
        self.percentage_radio.toggled.connect(self.update_discount_type)
        self.fixed_radio.toggled.connect(self.update_discount_type)
        
        layout.addLayout(form_layout)
        
        # Discount amount preview
        self.preview_label = QLabel("Discount Amount: $0.00")
        self.preview_label.setStyleSheet("""
            color: #2F7DFF;
            font-size: 14px;
            font-weight: 600;
        """)
        layout.addWidget(self.preview_label)
        
        # Update preview when value changes
        self.discount_value.valueChanged.connect(self.update_preview)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        apply_btn = QPushButton("Apply Discount")
        apply_btn.setStyleSheet("""
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
        apply_btn.clicked.connect(self.apply_discount)
        buttons_layout.addWidget(apply_btn)
        
        layout.addLayout(buttons_layout)
        self.update_preview()
    
    def update_discount_type(self):
        """Update discount input based on type"""
        if self.percentage_radio.isChecked():
            self.discount_value.setMaximum(100.0)
            self.discount_value.setSuffix("%")
            self.discount_value.setDecimals(2)
        else:
            self.discount_value.setMaximum(self.order_total)
            self.discount_value.setSuffix("")
            self.discount_value.setDecimals(2)
        self.update_preview()
    
    def update_preview(self):
        """Update discount preview"""
        value = self.discount_value.value()
        if self.percentage_radio.isChecked():
            self.discount_amount = (self.order_total * value) / 100.0
        else:
            self.discount_amount = min(value, self.order_total)
        
        self.preview_label.setText(f"Discount Amount: ${self.discount_amount:.2f}")
    
    def apply_discount(self):
        """Apply the discount"""
        if self.discount_amount <= 0:
            QMessageBox.warning(self, "Invalid Discount", "Discount amount must be greater than 0")
            return
        
        if self.discount_amount > self.order_total:
            QMessageBox.warning(self, "Invalid Discount", 
                f"Discount cannot exceed order total (${self.order_total:.2f})")
            return
        
        self.discount_type = "percentage" if self.percentage_radio.isChecked() else "fixed"
        self.accept()
    
    def get_discount_info(self):
        """Get discount information"""
        return {
            'amount': self.discount_amount,
            'type': self.discount_type,
            'value': self.discount_value.value()
        }

