"""
Marketing Campaign Dialog - Send email or SMS campaigns
"""

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QLineEdit, QTextEdit, QMessageBox, QFormLayout, QComboBox
)
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import Customer
from src.utils.email_marketing import get_email_marketing
from src.utils.sms_marketing import get_sms_marketing


class MarketingCampaignDialog(QDialog):
    """Dialog for sending marketing campaigns"""
    
    def __init__(self, user_id: int, campaign_type: str, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.campaign_type = campaign_type  # 'email' or 'sms'
        self.setWindowTitle(f"Send {campaign_type.upper()} Campaign")
        self.setMinimumSize(500, 400)
        self.setup_ui()
    
    def setup_ui(self):
        """Setup marketing campaign dialog UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(20, 20, 20, 20)
        
        form = QFormLayout()
        
        # Recipients
        self.recipients_combo = QComboBox()
        self.recipients_combo.addItems([
            "All Customers",
            "VIP Customers",
            "Regular Customers",
            "New Customers"
        ])
        form.addRow("Recipients:", self.recipients_combo)
        
        # Subject (for email)
        if self.campaign_type == "email":
            self.subject_input = QLineEdit()
            self.subject_input.setPlaceholderText("Enter email subject")
            form.addRow("Subject *:", self.subject_input)
        
        # Message
        self.message_input = QTextEdit()
        self.message_input.setPlaceholderText("Enter your message here...")
        self.message_input.setMinimumHeight(150)
        form.addRow("Message *:", self.message_input)
        
        layout.addLayout(form)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        send_btn = QPushButton(f"Send {self.campaign_type.upper()}")
        send_btn.setStyleSheet("""
            QPushButton {
                background-color: #14B8A6;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-weight: 600;
            }
        """)
        send_btn.clicked.connect(self.handle_send)
        buttons_layout.addWidget(send_btn)
        
        layout.addLayout(buttons_layout)
    
    def handle_send(self):
        """Handle send campaign"""
        try:
            message = self.message_input.toPlainText().strip()
            if not message:
                QMessageBox.warning(self, "Validation Error", "Message is required")
                return
            
            if self.campaign_type == "email":
                subject = self.subject_input.text().strip()
                if not subject:
                    QMessageBox.warning(self, "Validation Error", "Subject is required")
                    return
            
            # Get customer IDs based on selection
            db = get_db_session()
            customers = db.query(Customer).filter(Customer.status == 'active').all()
            
            recipient_type = self.recipients_combo.currentText()
            customer_ids = []
            
            for customer in customers:
                if recipient_type == "All Customers":
                    customer_ids.append(customer.customer_id)
                elif recipient_type == "VIP Customers":
                    if customer.loyalty_points > 500:
                        customer_ids.append(customer.customer_id)
                elif recipient_type == "Regular Customers":
                    from src.database.models import Order
                    orders = db.query(Order).filter(Order.customer_id == customer.customer_id).count()
                    if orders > 5:
                        customer_ids.append(customer.customer_id)
                elif recipient_type == "New Customers":
                    # New customers (would need to check registration date)
                    customer_ids.append(customer.customer_id)
            
            db.close()
            
            if not customer_ids:
                QMessageBox.warning(self, "No Recipients", "No customers match the selected criteria")
                return
            
            # Send campaign
            if self.campaign_type == "email":
                email_marketing = get_email_marketing()
                result = email_marketing.send_promotional_email(
                    customer_ids, subject, message
                )
                QMessageBox.information(
                    self,
                    "Campaign Sent",
                    f"Email campaign sent to {result['sent']} customers.\n"
                    f"Failed: {result['failed']}"
                )
            else:  # SMS
                sms_marketing = get_sms_marketing()
                result = sms_marketing.send_promotional_sms(customer_ids, message)
                QMessageBox.information(
                    self,
                    "Campaign Sent",
                    f"SMS campaign sent to {result['sent']} customers.\n"
                    f"Failed: {result['failed']}"
                )
            
            self.accept()
            
        except Exception as e:
            logger.error(f"Error sending campaign: {e}")
            QMessageBox.critical(self, "Error", f"Failed to send campaign: {str(e)}")

