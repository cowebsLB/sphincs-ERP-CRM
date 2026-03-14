"""
Add Loyalty Program Dialog - Create new loyalty programs
"""

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QLineEdit, QDoubleSpinBox, QDateEdit, QFormLayout, QMessageBox,
    QCheckBox, QTextEdit
)
from PyQt6.QtCore import Qt, QDate
from loguru import logger
from datetime import date
from src.database.connection import get_db_session
from src.database.models import LoyaltyProgram


class AddLoyaltyProgramDialog(QDialog):
    """Dialog for adding a new loyalty program"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setWindowTitle("Add Loyalty Program")
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
        
        # Program name
        self.name_input = QLineEdit()
        self.name_input.setPlaceholderText("e.g., VIP Rewards Program")
        form_layout.addRow("Program Name *:", self.name_input)
        
        # Points per currency
        self.points_per_currency = QDoubleSpinBox()
        self.points_per_currency.setMinimum(0.01)
        self.points_per_currency.setMaximum(1000.0)
        self.points_per_currency.setDecimals(2)
        self.points_per_currency.setValue(1.0)
        self.points_per_currency.setSuffix(" points per $1")
        form_layout.addRow("Points Rate *:", self.points_per_currency)
        
        # Start date
        self.start_date = QDateEdit()
        self.start_date.setDate(QDate.currentDate())
        self.start_date.setCalendarPopup(True)
        form_layout.addRow("Start Date *:", self.start_date)
        
        # End date (optional)
        self.end_date = QDateEdit()
        self.end_date.setDate(QDate.currentDate().addYears(1))
        self.end_date.setCalendarPopup(True)
        self.end_date.setMinimumDate(QDate(1900, 1, 1))
        self.end_date.setSpecialValueText("No end date")
        form_layout.addRow("End Date:", self.end_date)
        
        # Active status
        self.active_checkbox = QCheckBox()
        self.active_checkbox.setChecked(True)
        form_layout.addRow("Active:", self.active_checkbox)
        
        layout.addLayout(form_layout)
        
        # Info label
        info_label = QLabel(
            "Note: Points are automatically awarded to customers when they complete orders. "
            "The points rate determines how many points customers earn per dollar spent."
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
        
        save_btn = QPushButton("Add Program")
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
    
    def handle_save(self):
        """Handle save button click"""
        name = self.name_input.text().strip()
        if not name:
            QMessageBox.warning(self, "Validation Error", "Program name is required.")
            return
        
        points_per_currency = self.points_per_currency.value()
        if points_per_currency <= 0:
            QMessageBox.warning(self, "Validation Error", "Points rate must be greater than 0.")
            return
        
        start_date = self.start_date.date().toPyDate()
        # Check if end date is set (not minimum date)
        end_date_val = self.end_date.date()
        end_date = end_date_val.toPyDate() if end_date_val != QDate(1900, 1, 1) else None
        
        if end_date and end_date < start_date:
            QMessageBox.warning(self, "Validation Error", "End date must be after start date.")
            return
        
        db = get_db_session()
        try:
            new_program = LoyaltyProgram(
                program_name=name,
                points_per_currency=points_per_currency,
                start_date=start_date,
                end_date=end_date,
                is_active=self.active_checkbox.isChecked(),
                tier_system=None  # Can be extended later for tier systems
            )
            
            db.add(new_program)
            db.commit()
            
            logger.info(f"New loyalty program added: {name}")
            QMessageBox.information(self, "Success", f"Loyalty program '{name}' added successfully!")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error adding loyalty program: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to add loyalty program:\n{str(e)}")
        finally:
            db.close()

