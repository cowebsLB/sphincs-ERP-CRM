"""
Tax Management - Tax configuration and calculations
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QDialog, QComboBox,
    QDateEdit, QMessageBox, QFormLayout, QDoubleSpinBox,
    QLineEdit, QTextEdit, QCheckBox
)
from PyQt6.QtCore import Qt, QDate
from PyQt6.QtGui import QColor
from loguru import logger
from datetime import date
from src.database.connection import get_db_session
from src.database.models import Tax, Product, Order


class TaxManagementView(QWidget):
    """Tax Management View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        self.load_taxes()
    
    def setup_ui(self):
        """Setup tax management UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        
        title = QLabel("Tax Management")
        title.setStyleSheet("""
            color: #162640;
            font-size: 24px;
            font-weight: 700;
        """)
        header_layout.addWidget(title)
        header_layout.addStretch()
        
        # Add Tax button
        add_btn = QPushButton("Add Tax")
        add_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
                font-size: 14px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #1D66EA;
            }
        """)
        add_btn.clicked.connect(self.handle_add_tax)
        header_layout.addWidget(add_btn)
        
        layout.addLayout(header_layout)
        layout.addSpacing(24)
        
        # Taxes table
        self.taxes_table = QTableWidget()
        self.taxes_table.setColumnCount(7)
        self.taxes_table.setHorizontalHeaderLabels([
            "Tax Name", "Rate", "Type", "Applicable To", "Effective Date", "Expiry Date", "Status"
        ])
        self.taxes_table.setStyleSheet("""
            QTableWidget {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                gridline-color: #EDF3FC;
            }
            QHeaderView::section {
                background-color: #F9FAFB;
                padding: 10px;
                border: none;
                border-bottom: 2px solid #C8D4E8;
                font-weight: 600;
            }
        """)
        self.taxes_table.horizontalHeader().setStretchLastSection(True)
        self.taxes_table.setAlternatingRowColors(True)
        self.taxes_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        layout.addWidget(self.taxes_table)
        
        # Action buttons
        actions_layout = QHBoxLayout()
        actions_layout.addStretch()
        
        edit_btn = QPushButton("Edit Selected")
        edit_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
            }
        """)
        edit_btn.clicked.connect(self.handle_edit_tax)
        actions_layout.addWidget(edit_btn)
        
        delete_btn = QPushButton("Delete Selected")
        delete_btn.setStyleSheet("""
            QPushButton {
                background-color: #D92D20;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
            }
        """)
        delete_btn.clicked.connect(self.handle_delete_tax)
        actions_layout.addWidget(delete_btn)
        
        layout.addLayout(actions_layout)
    
    def load_taxes(self):
        """Load taxes"""
        try:
            db = get_db_session()
            taxes = db.query(Tax).all()
            
            self.taxes_table.setRowCount(len(taxes))
            for row, tax in enumerate(taxes):
                self.taxes_table.setItem(row, 0, QTableWidgetItem(tax.tax_name))
                self.taxes_table.setItem(row, 1, QTableWidgetItem(f"{tax.tax_rate:.2f}%"))
                self.taxes_table.setItem(row, 2, QTableWidgetItem(tax.tax_type or "-"))
                self.taxes_table.setItem(row, 3, QTableWidgetItem(tax.applicable_to or "All"))
                self.taxes_table.setItem(row, 4, QTableWidgetItem(tax.effective_date.strftime("%Y-%m-%d")))
                expiry = tax.expiry_date.strftime("%Y-%m-%d") if tax.expiry_date else "No expiry"
                self.taxes_table.setItem(row, 5, QTableWidgetItem(expiry))
                
                status_item = QTableWidgetItem("Active" if tax.is_active else "Inactive")
                if not tax.is_active:
                    status_item.setForeground(QColor("#8FA2BF"))
                self.taxes_table.setItem(row, 6, status_item)
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading taxes: {e}")
            QMessageBox.critical(self, "Error", f"Failed to load taxes: {str(e)}")
    
    def handle_add_tax(self):
        """Handle add tax"""
        dialog = TaxDialog(self.user_id, self)
        if dialog.exec():
            self.load_taxes()
    
    def handle_edit_tax(self):
        """Handle edit tax"""
        current_row = self.taxes_table.currentRow()
        if current_row < 0:
            QMessageBox.warning(self, "Warning", "Please select a tax to edit")
            return
        
        tax_name_item = self.taxes_table.item(current_row, 0)
        if not tax_name_item:
            return
        
        tax_name = tax_name_item.text()
        
        db = get_db_session()
        try:
            tax = db.query(Tax).filter(Tax.tax_name == tax_name).first()
            if tax:
                dialog = TaxDialog(self.user_id, self, tax_id=tax.tax_id)
                if dialog.exec():
                    self.load_taxes()
        finally:
            db.close()
    
    def handle_delete_tax(self):
        """Handle delete tax"""
        current_row = self.taxes_table.currentRow()
        if current_row < 0:
            QMessageBox.warning(self, "Warning", "Please select a tax to delete")
            return
        
        tax_name_item = self.taxes_table.item(current_row, 0)
        if not tax_name_item:
            return
        
        tax_name = tax_name_item.text()
        
        reply = QMessageBox.question(
            self,
            "Confirm Delete",
            f"Are you sure you want to delete tax '{tax_name}'?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            db = get_db_session()
            try:
                tax = db.query(Tax).filter(Tax.tax_name == tax_name).first()
                if tax:
                    db.delete(tax)
                    db.commit()
                    QMessageBox.information(self, "Success", "Tax deleted successfully")
                    self.load_taxes()
            except Exception as e:
                logger.error(f"Error deleting tax: {e}")
                db.rollback()
                QMessageBox.critical(self, "Error", f"Failed to delete tax: {str(e)}")
            finally:
                db.close()


class TaxDialog(QDialog):
    """Dialog for adding/editing tax"""
    
    def __init__(self, user_id: int, parent=None, tax_id: int = None):
        super().__init__(parent)
        self.user_id = user_id
        self.tax_id = tax_id
        self.setWindowTitle("Add Tax" if not tax_id else "Edit Tax")
        self.setMinimumSize(500, 400)
        self.tax = None
        if tax_id:
            db = get_db_session()
            try:
                self.tax = db.query(Tax).filter(Tax.tax_id == tax_id).first()
            finally:
                db.close()
        self.setup_ui()
    
    def setup_ui(self):
        """Setup tax dialog UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(20, 20, 20, 20)
        
        form = QFormLayout()
        
        # Tax Name
        self.name_input = QLineEdit()
        if self.tax:
            self.name_input.setText(self.tax.tax_name)
        form.addRow("Tax Name *:", self.name_input)
        
        # Tax Rate
        self.rate_input = QDoubleSpinBox()
        self.rate_input.setMinimum(0.0)
        self.rate_input.setMaximum(100.0)
        self.rate_input.setDecimals(2)
        self.rate_input.setSuffix("%")
        if self.tax:
            self.rate_input.setValue(self.tax.tax_rate)
        form.addRow("Tax Rate *:", self.rate_input)
        
        # Tax Type
        self.type_combo = QComboBox()
        self.type_combo.addItems(["sales", "purchase", "service", "other"])
        if self.tax and self.tax.tax_type:
            index = self.type_combo.findText(self.tax.tax_type)
            if index >= 0:
                self.type_combo.setCurrentIndex(index)
        form.addRow("Tax Type:", self.type_combo)
        
        # Applicable To
        self.applicable_to_combo = QComboBox()
        self.applicable_to_combo.addItems(["all", "products", "services", "specific"])
        if self.tax and self.tax.applicable_to:
            index = self.applicable_to_combo.findText(self.tax.applicable_to)
            if index >= 0:
                self.applicable_to_combo.setCurrentIndex(index)
        form.addRow("Applicable To:", self.applicable_to_combo)
        
        # Effective Date
        self.effective_date = QDateEdit()
        if self.tax:
            self.effective_date.setDate(QDate(
                self.tax.effective_date.year,
                self.tax.effective_date.month,
                self.tax.effective_date.day
            ))
        else:
            self.effective_date.setDate(QDate.currentDate())
        self.effective_date.setCalendarPopup(True)
        form.addRow("Effective Date *:", self.effective_date)
        
        # Expiry Date (optional)
        self.expiry_date = QDateEdit()
        if self.tax and self.tax.expiry_date:
            self.expiry_date.setDate(QDate(
                self.tax.expiry_date.year,
                self.tax.expiry_date.month,
                self.tax.expiry_date.day
            ))
        self.expiry_date.setCalendarPopup(True)
        self.expiry_date.setSpecialValueText("No expiry")
        form.addRow("Expiry Date (optional):", self.expiry_date)
        
        # Active status
        self.active_check = QCheckBox()
        if self.tax:
            self.active_check.setChecked(self.tax.is_active)
        else:
            self.active_check.setChecked(True)
        form.addRow("Active:", self.active_check)
        
        layout.addLayout(form)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        save_btn = QPushButton("Save")
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
    
    def handle_save(self):
        """Save tax"""
        try:
            name = self.name_input.text().strip()
            if not name:
                QMessageBox.warning(self, "Validation Error", "Tax name is required")
                return
            
            db = get_db_session()
            
            expiry_date = None
            if self.expiry_date.date() != self.expiry_date.minimumDate():
                expiry_date = self.expiry_date.date().toPyDate()
            
            if self.tax_id:
                # Update existing
                tax = db.query(Tax).filter(Tax.tax_id == self.tax_id).first()
                if not tax:
                    QMessageBox.warning(self, "Error", "Tax not found")
                    return
                
                tax.tax_name = name
                tax.tax_rate = self.rate_input.value()
                tax.tax_type = self.type_combo.currentText()
                tax.applicable_to = self.applicable_to_combo.currentText()
                tax.effective_date = self.effective_date.date().toPyDate()
                tax.expiry_date = expiry_date
                tax.is_active = self.active_check.isChecked()
                
                QMessageBox.information(self, "Success", "Tax updated successfully")
            else:
                # Create new
                tax = Tax(
                    tax_name=name,
                    tax_rate=self.rate_input.value(),
                    tax_type=self.type_combo.currentText(),
                    applicable_to=self.applicable_to_combo.currentText(),
                    effective_date=self.effective_date.date().toPyDate(),
                    expiry_date=expiry_date,
                    is_active=self.active_check.isChecked()
                )
                db.add(tax)
                QMessageBox.information(self, "Success", "Tax added successfully")
            
            db.commit()
            db.close()
            self.accept()
            
        except Exception as e:
            logger.error(f"Error saving tax: {e}")
            QMessageBox.critical(self, "Error", f"Failed to save tax: {str(e)}")

