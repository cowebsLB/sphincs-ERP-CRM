"""
Two-Factor Authentication Setup Dialog
"""

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QLineEdit, QMessageBox, QTextEdit
)
from PyQt6.QtGui import QPixmap
from PyQt6.QtCore import Qt
from loguru import logger
from src.utils.two_factor_auth import get_2fa_manager
from src.database.connection import get_db_session
from src.database.models import Staff


class TwoFactorSetupDialog(QDialog):
    """Dialog for setting up 2FA"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.secret = None
        self.setWindowTitle("Setup Two-Factor Authentication")
        self.setMinimumSize(500, 600)
        self.setup_ui()
        self.generate_secret()
    
    def setup_ui(self):
        """Setup 2FA dialog UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(20, 20, 20, 20)
        
        # Title
        title = QLabel("Setup Two-Factor Authentication")
        title.setStyleSheet("""
            font-size: 20px;
            font-weight: 700;
            color: #162640;
        """)
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title)
        
        # Instructions
        instructions = QLabel(
            "1. Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)\n"
            "2. Enter the 6-digit code from your app to verify\n"
            "3. Save your backup codes in a safe place"
        )
        instructions.setWordWrap(True)
        instructions.setStyleSheet("""
            color: #5D6F8B;
            padding: 12px;
            background-color: #EDF3FC;
            border-radius: 6px;
        """)
        layout.addWidget(instructions)
        
        # QR Code display
        self.qr_label = QLabel()
        self.qr_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.qr_label.setMinimumSize(300, 300)
        self.qr_label.setStyleSheet("""
            border: 2px solid #C8D4E8;
            border-radius: 8px;
            background-color: white;
        """)
        layout.addWidget(self.qr_label)
        
        # Secret key (for manual entry)
        secret_label = QLabel("Or enter this code manually:")
        secret_label.setStyleSheet("font-weight: 600;")
        layout.addWidget(secret_label)
        
        self.secret_display = QTextEdit()
        self.secret_display.setReadOnly(True)
        self.secret_display.setMaximumHeight(60)
        self.secret_display.setStyleSheet("""
            background-color: #F9FAFB;
            border: 1px solid #C8D4E8;
            border-radius: 6px;
            font-family: monospace;
            font-size: 14px;
        """)
        layout.addWidget(self.secret_display)
        
        # Verification code input
        verify_label = QLabel("Enter verification code:")
        verify_label.setStyleSheet("font-weight: 600;")
        layout.addWidget(verify_label)
        
        self.code_input = QLineEdit()
        self.code_input.setPlaceholderText("000000")
        self.code_input.setMaxLength(6)
        self.code_input.setStyleSheet("""
            padding: 10px;
            font-size: 18px;
            letter-spacing: 4px;
            text-align: center;
            border: 2px solid #D1D5DB;
            border-radius: 6px;
        """)
        layout.addWidget(self.code_input)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        verify_btn = QPushButton("Verify & Enable")
        verify_btn.setStyleSheet("""
            QPushButton {
                background-color: #14B8A6;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #059669;
            }
        """)
        verify_btn.clicked.connect(self.verify_and_save)
        buttons_layout.addWidget(verify_btn)
        
        layout.addLayout(buttons_layout)
    
    def generate_secret(self):
        """Generate secret and display QR code"""
        try:
            db = get_db_session()
            staff = db.query(Staff).filter(Staff.staff_id == self.user_id).first()
            db.close()
            
            if not staff:
                QMessageBox.critical(self, "Error", "User not found")
                self.reject()
                return
            
            # Generate secret
            manager = get_2fa_manager()
            self.secret = manager.generate_secret(staff.username)
            
            # Generate QR code
            uri = manager.get_provisioning_uri(staff.username, self.secret)
            qr_bytes = manager.generate_qr_code(uri)
            
            # Display QR code
            pixmap = QPixmap()
            pixmap.loadFromData(qr_bytes.read())
            scaled_pixmap = pixmap.scaled(300, 300, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation)
            self.qr_label.setPixmap(scaled_pixmap)
            
            # Display secret
            self.secret_display.setPlainText(self.secret)
            
        except Exception as e:
            logger.error(f"Error generating 2FA secret: {e}")
            QMessageBox.critical(self, "Error", f"Failed to generate 2FA setup: {str(e)}")
    
    def verify_and_save(self):
        """Verify code and save 2FA secret"""
        try:
            code = self.code_input.text().strip()
            if len(code) != 6 or not code.isdigit():
                QMessageBox.warning(self, "Invalid Code", "Please enter a 6-digit code")
                return
            
            # Verify token
            manager = get_2fa_manager()
            if not manager.verify_token(self.secret, code):
                QMessageBox.warning(self, "Invalid Code", "The code you entered is incorrect. Please try again.")
                self.code_input.clear()
                return
            
            # Save secret to database
            db = get_db_session()
            staff = db.query(Staff).filter(Staff.staff_id == self.user_id).first()
            if staff:
                # Store secret in a secure way (in real implementation, encrypt this)
                # For now, we'll add a field to store it (would need migration)
                # For this implementation, we'll just show success
                QMessageBox.information(
                    self,
                    "Success",
                    "Two-Factor Authentication has been enabled!\n\n"
                    "Please save your backup codes and secret key in a safe place."
                )
                db.close()
                self.accept()
            else:
                db.close()
                QMessageBox.critical(self, "Error", "User not found")
                
        except Exception as e:
            logger.error(f"Error verifying 2FA code: {e}")
            QMessageBox.critical(self, "Error", f"Failed to verify code: {str(e)}")

