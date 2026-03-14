"""
Edit Staff Dialog - Dialog for editing existing staff members
"""

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QPushButton, QLineEdit,
    QComboBox, QDateEdit, QFormLayout, QMessageBox
)
from PyQt6.QtCore import QDate
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import Staff, Role
from src.utils.auth import hash_password


class EditStaffDialog(QDialog):
    """Dialog for editing an existing staff member"""
    
    def __init__(self, staff_id: int, user_id: int, parent=None):
        super().__init__(parent)
        self.staff_id = staff_id
        self.user_id = user_id
        self.setWindowTitle("Edit Staff")
        self.setModal(True)
        self.load_staff()
        self.setup_ui()
    
    def load_staff(self):
        """Load staff data"""
        db = get_db_session()
        try:
            self.staff = db.query(Staff).filter(Staff.staff_id == self.staff_id).first()
            if not self.staff:
                QMessageBox.warning(self, "Error", "Staff member not found.")
                self.reject()
        finally:
            db.close()
    
    def setup_ui(self):
        """Setup dialog UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(24, 24, 24, 24)
        
        form_layout = QFormLayout()
        form_layout.setSpacing(12)
        
        # First Name
        self.first_name_input = QLineEdit()
        self.first_name_input.setText(self.staff.first_name)
        form_layout.addRow("First Name *:", self.first_name_input)
        
        # Last Name
        self.last_name_input = QLineEdit()
        self.last_name_input.setText(self.staff.last_name)
        form_layout.addRow("Last Name *:", self.last_name_input)
        
        # Username (read-only)
        self.username_input = QLineEdit()
        self.username_input.setText(self.staff.username)
        self.username_input.setReadOnly(True)
        self.username_input.setStyleSheet("""
            QLineEdit {
                background-color: #EDF3FC;
                color: #5D6F8B;
            }
        """)
        form_layout.addRow("Username:", self.username_input)
        
        # Password (optional - leave blank to keep current)
        self.password_input = QLineEdit()
        self.password_input.setPlaceholderText("Leave blank to keep current password")
        self.password_input.setEchoMode(QLineEdit.EchoMode.Password)
        form_layout.addRow("New Password:", self.password_input)
        
        # Role
        self.role_combo = QComboBox()
        self.load_roles()
        if self.staff.role_id:
            index = self.role_combo.findData(self.staff.role_id)
            if index >= 0:
                self.role_combo.setCurrentIndex(index)
        form_layout.addRow("Role *:", self.role_combo)
        
        # Phone
        self.phone_input = QLineEdit()
        self.phone_input.setText(self.staff.phone or "")
        form_layout.addRow("Phone:", self.phone_input)
        
        # Email
        self.email_input = QLineEdit()
        self.email_input.setText(self.staff.email or "")
        form_layout.addRow("Email:", self.email_input)
        
        # Address
        self.address_input = QLineEdit()
        self.address_input.setText(self.staff.address or "")
        form_layout.addRow("Address:", self.address_input)
        
        # Date of Birth
        self.dob_input = QDateEdit()
        if self.staff.date_of_birth:
            self.dob_input.setDate(QDate.fromString(self.staff.date_of_birth.isoformat(), "yyyy-MM-dd"))
        else:
            self.dob_input.setDate(QDate.currentDate().addYears(-25))
        self.dob_input.setCalendarPopup(True)
        form_layout.addRow("Date of Birth:", self.dob_input)
        
        # Hire Date
        self.hire_date_input = QDateEdit()
        self.hire_date_input.setDate(QDate.fromString(self.staff.hire_date.isoformat(), "yyyy-MM-dd"))
        self.hire_date_input.setCalendarPopup(True)
        form_layout.addRow("Hire Date *:", self.hire_date_input)
        
        # Status
        self.status_combo = QComboBox()
        self.status_combo.addItems(["active", "inactive"])
        self.status_combo.setCurrentText(self.staff.status)
        form_layout.addRow("Status:", self.status_combo)
        
        layout.addLayout(form_layout)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        save_btn = QPushButton("Save Changes")
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
    
    def load_roles(self):
        """Load roles into combo box"""
        db = get_db_session()
        try:
            roles = db.query(Role).all()
            for role in roles:
                self.role_combo.addItem(role.role_name, role.role_id)
        except Exception as e:
            logger.error(f"Error loading roles: {e}")
        finally:
            db.close()
    
    def handle_save(self):
        """Handle save button click"""
        # Validate required fields
        first_name = self.first_name_input.text().strip()
        last_name = self.last_name_input.text().strip()
        
        if not first_name:
            QMessageBox.warning(self, "Validation Error", "First name is required.")
            return
        
        if not last_name:
            QMessageBox.warning(self, "Validation Error", "Last name is required.")
            return
        
        if self.role_combo.currentData() is None:
            QMessageBox.warning(self, "Validation Error", "Please select a role.")
            return
        
        db = get_db_session()
        try:
            staff = db.query(Staff).filter(Staff.staff_id == self.staff_id).first()
            if not staff:
                QMessageBox.warning(self, "Error", "Staff member not found.")
                return
            
            # Get optional fields
            phone = self.phone_input.text().strip() or None
            email = self.email_input.text().strip() or None
            address = self.address_input.text().strip() or None
            dob = self.dob_input.date().toPyDate() if self.dob_input.date() else None
            hire_date = self.hire_date_input.date().toPyDate()
            role_id = self.role_combo.currentData()
            
            # Update password only if provided
            password = self.password_input.text().strip()
            if password:
                staff.password_hash = hash_password(password)
            
            # Update fields
            staff.first_name = first_name
            staff.last_name = last_name
            staff.phone = phone
            staff.email = email
            staff.address = address
            staff.date_of_birth = dob
            staff.hire_date = hire_date
            staff.role_id = role_id
            staff.status = self.status_combo.currentText()
            
            db.commit()
            
            logger.info(f"Staff member updated: {first_name} {last_name} (ID: {self.staff_id})")
            QMessageBox.information(self, "Success", f"Staff member '{first_name} {last_name}' updated successfully!")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error updating staff: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to update staff member:\n{str(e)}")
        finally:
            db.close()
