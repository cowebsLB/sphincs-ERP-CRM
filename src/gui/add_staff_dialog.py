"""
Add Staff Dialog - Dialog for adding new staff members
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


class AddStaffDialog(QDialog):
    """Dialog for adding a new staff member"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setWindowTitle("Add Staff")
        self.setModal(True)
        self.setup_ui()
    
    def setup_ui(self):
        """Setup dialog UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(24, 24, 24, 24)
        
        form_layout = QFormLayout()
        form_layout.setSpacing(12)
        
        # First Name
        self.first_name_input = QLineEdit()
        self.first_name_input.setPlaceholderText("First name")
        form_layout.addRow("First Name *:", self.first_name_input)
        
        # Last Name
        self.last_name_input = QLineEdit()
        self.last_name_input.setPlaceholderText("Last name")
        form_layout.addRow("Last Name *:", self.last_name_input)
        
        # Username
        self.username_input = QLineEdit()
        self.username_input.setPlaceholderText("username")
        form_layout.addRow("Username *:", self.username_input)
        
        # Password
        self.password_input = QLineEdit()
        self.password_input.setPlaceholderText("Password")
        self.password_input.setEchoMode(QLineEdit.EchoMode.Password)
        form_layout.addRow("Password *:", self.password_input)
        
        # Role
        self.role_combo = QComboBox()
        self.load_roles()
        form_layout.addRow("Role *:", self.role_combo)
        
        # Phone
        self.phone_input = QLineEdit()
        self.phone_input.setPlaceholderText("+1234567890")
        form_layout.addRow("Phone:", self.phone_input)
        
        # Email
        self.email_input = QLineEdit()
        self.email_input.setPlaceholderText("email@example.com")
        form_layout.addRow("Email:", self.email_input)
        
        # Address
        self.address_input = QLineEdit()
        self.address_input.setPlaceholderText("Street address, City, State")
        form_layout.addRow("Address:", self.address_input)
        
        # Date of Birth
        self.dob_input = QDateEdit()
        self.dob_input.setDate(QDate.currentDate().addYears(-25))
        self.dob_input.setCalendarPopup(True)
        form_layout.addRow("Date of Birth:", self.dob_input)
        
        # Hire Date
        self.hire_date_input = QDateEdit()
        self.hire_date_input.setDate(QDate.currentDate())
        self.hire_date_input.setCalendarPopup(True)
        form_layout.addRow("Hire Date *:", self.hire_date_input)
        
        layout.addLayout(form_layout)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        save_btn = QPushButton("Add Staff")
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
        username = self.username_input.text().strip()
        password = self.password_input.text().strip()
        
        if not first_name:
            QMessageBox.warning(self, "Validation Error", "First name is required.")
            return
        
        if not last_name:
            QMessageBox.warning(self, "Validation Error", "Last name is required.")
            return
        
        if not username:
            QMessageBox.warning(self, "Validation Error", "Username is required.")
            return
        
        if not password:
            QMessageBox.warning(self, "Validation Error", "Password is required.")
            return
        
        if self.role_combo.currentData() is None:
            QMessageBox.warning(self, "Validation Error", "Please select a role.")
            return
        
        db = get_db_session()
        try:
            # Check for duplicate username
            existing = db.query(Staff).filter(Staff.username == username).first()
            if existing:
                QMessageBox.warning(self, "Validation Error", "A staff member with this username already exists.")
                return
            
            # Get optional fields
            phone = self.phone_input.text().strip() or None
            email = self.email_input.text().strip() or None
            address = self.address_input.text().strip() or None
            dob = self.dob_input.date().toPyDate() if self.dob_input.date() else None
            hire_date = self.hire_date_input.date().toPyDate()
            role_id = self.role_combo.currentData()
            
            # Hash password
            password_hash = hash_password(password)
            
            # Create new staff
            new_staff = Staff(
                first_name=first_name,
                last_name=last_name,
                username=username,
                password_hash=password_hash,
                role_id=role_id,
                phone=phone,
                email=email,
                address=address,
                date_of_birth=dob,
                hire_date=hire_date,
                status="active",
                user_id=self.user_id
            )
            
            db.add(new_staff)
            db.commit()
            
            logger.info(f"New staff member added: {first_name} {last_name} ({username})")
            QMessageBox.information(self, "Success", f"Staff member '{first_name} {last_name}' added successfully!")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error adding staff: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to add staff member:\n{str(e)}")
        finally:
            db.close()
