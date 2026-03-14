"""
Loyalty Points Redemption Dialog - Redeem loyalty points for discounts
"""

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QComboBox, QLineEdit, QFormLayout, QMessageBox, QSpinBox
)
from PyQt6.QtCore import Qt
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import Customer, LoyaltyProgram


class LoyaltyPointsDialog(QDialog):
    """Dialog for redeeming loyalty points"""
    
    def __init__(self, customer_id: int, order_total: float, parent=None):
        super().__init__(parent)
        self.customer_id = customer_id
        self.order_total = order_total
        self.points_redeemed = 0
        self.discount_amount = 0.0
        self.setWindowTitle("Redeem Loyalty Points")
        self.setModal(True)
        self.setMinimumWidth(400)
        self.setup_ui()
        self.load_customer_info()
    
    def setup_ui(self):
        """Setup dialog UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(24, 24, 24, 24)
        
        # Customer info
        self.customer_info_label = QLabel()
        self.customer_info_label.setStyleSheet("""
            color: #162640;
            font-size: 14px;
            padding: 12px;
            background-color: #F9FAFB;
            border-radius: 6px;
        """)
        layout.addWidget(self.customer_info_label)
        
        # Order total
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
        
        form_layout = QFormLayout()
        form_layout.setSpacing(12)
        
        # Available points
        self.available_points_label = QLabel("0 points")
        self.available_points_label.setStyleSheet("""
            color: #2F7DFF;
            font-size: 16px;
            font-weight: 600;
        """)
        form_layout.addRow("Available Points:", self.available_points_label)
        
        # Points to redeem
        self.points_input = QSpinBox()
        self.points_input.setMinimum(0)
        self.points_input.setMaximum(0)  # Will be updated
        self.points_input.setSuffix(" points")
        self.points_input.valueChanged.connect(self.calculate_discount)
        form_layout.addRow("Points to Redeem:", self.points_input)
        
        # Exchange rate info
        self.exchange_rate_label = QLabel()
        self.exchange_rate_label.setStyleSheet("""
            color: #5D6F8B;
            font-size: 12px;
        """)
        form_layout.addRow("", self.exchange_rate_label)
        
        # Discount preview
        self.discount_preview_label = QLabel("$0.00")
        self.discount_preview_label.setStyleSheet("""
            color: #14B8A6;
            font-size: 18px;
            font-weight: 700;
        """)
        form_layout.addRow("Discount Amount:", self.discount_preview_label)
        
        # Remaining points after redemption
        self.remaining_points_label = QLabel("0 points")
        self.remaining_points_label.setStyleSheet("""
            color: #5D6F8B;
            font-size: 14px;
        """)
        form_layout.addRow("Remaining Points:", self.remaining_points_label)
        
        layout.addLayout(form_layout)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        self.redeem_btn = QPushButton("Redeem Points")
        self.redeem_btn.setEnabled(False)
        self.redeem_btn.setStyleSheet("""
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
            QPushButton:disabled {
                background-color: #C8D4E8;
                color: #8FA2BF;
            }
        """)
        self.redeem_btn.clicked.connect(self.redeem_points)
        buttons_layout.addWidget(self.redeem_btn)
        
        layout.addLayout(buttons_layout)
    
    def load_customer_info(self):
        """Load customer and loyalty program info"""
        db = get_db_session()
        try:
            customer = db.query(Customer).filter(Customer.customer_id == self.customer_id).first()
            if not customer:
                QMessageBox.critical(self, "Error", "Customer not found")
                self.reject()
                return
            
            # Get active loyalty program
            from datetime import date
            loyalty_program = db.query(LoyaltyProgram).filter(
                LoyaltyProgram.is_active == True,
                LoyaltyProgram.start_date <= date.today(),
                (LoyaltyProgram.end_date.is_(None)) | (LoyaltyProgram.end_date >= date.today())
            ).first()
            
            if not loyalty_program:
                QMessageBox.warning(self, "No Loyalty Program", 
                    "No active loyalty program found. Points redemption is not available.")
                self.reject()
                return
            
            # Display customer info
            self.customer_info_label.setText(
                f"Customer: {customer.first_name} {customer.last_name} "
                f"({customer.phone or customer.email or 'No contact'})"
            )
            
            # Set available points
            available_points = customer.loyalty_points
            self.available_points_label.setText(f"{available_points} points")
            self.points_input.setMaximum(available_points)
            
            # Exchange rate (typically 100 points = $1, but configurable)
            # Default: 100 points per $1 if not specified
            points_per_dollar = loyalty_program.points_per_currency
            if points_per_dollar <= 0:
                points_per_dollar = 100  # Default
            
            self.points_per_dollar = points_per_dollar
            self.exchange_rate_label.setText(
                f"Exchange rate: {points_per_dollar} points = $1.00"
            )
            
            if available_points == 0:
                self.redeem_btn.setEnabled(False)
                QMessageBox.information(self, "No Points", 
                    "This customer has no loyalty points to redeem.")
            
        except Exception as e:
            logger.error(f"Error loading customer info: {e}")
            QMessageBox.critical(self, "Error", f"Failed to load customer information:\n{str(e)}")
            self.reject()
        finally:
            db.close()
    
    def calculate_discount(self):
        """Calculate discount based on points redeemed"""
        points = self.points_input.value()
        
        if points == 0:
            self.discount_amount = 0.0
            self.discount_preview_label.setText("$0.00")
            self.redeem_btn.setEnabled(False)
            
            db = get_db_session()
            try:
                customer = db.query(Customer).filter(Customer.customer_id == self.customer_id).first()
                if customer:
                    self.remaining_points_label.setText(f"{customer.loyalty_points} points")
            finally:
                db.close()
            return
        
        # Calculate discount (points / points_per_dollar)
        discount = points / self.points_per_dollar
        
        # Don't allow discount to exceed order total
        if discount > self.order_total:
            discount = self.order_total
            max_points = int(self.order_total * self.points_per_dollar)
            self.points_input.setValue(max_points)
            points = max_points
        
        self.discount_amount = discount
        self.discount_preview_label.setText(f"${discount:.2f}")
        
        # Calculate remaining points
        db = get_db_session()
        try:
            customer = db.query(Customer).filter(Customer.customer_id == self.customer_id).first()
            if customer:
                remaining = customer.loyalty_points - points
                self.remaining_points_label.setText(f"{remaining} points")
        finally:
            db.close()
        
        self.redeem_btn.setEnabled(points > 0)
    
    def redeem_points(self):
        """Redeem the loyalty points"""
        points = self.points_input.value()
        
        if points <= 0:
            QMessageBox.warning(self, "Invalid Amount", "Please enter points to redeem")
            return
        
        db = get_db_session()
        try:
            customer = db.query(Customer).filter(Customer.customer_id == self.customer_id).first()
            if not customer:
                QMessageBox.critical(self, "Error", "Customer not found")
                return
            
            if customer.loyalty_points < points:
                QMessageBox.warning(self, "Insufficient Points", 
                    f"Customer only has {customer.loyalty_points} points available")
                return
            
            # Deduct points
            customer.loyalty_points -= points
            self.points_redeemed = points
            
            db.commit()
            
            logger.info(f"Redeemed {points} loyalty points for customer {self.customer_id}: ${self.discount_amount:.2f} discount")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error redeeming points: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to redeem points:\n{str(e)}")
        finally:
            db.close()
    
    def get_redemption_info(self):
        """Get redemption information"""
        return {
            'points_redeemed': self.points_redeemed,
            'discount_amount': self.discount_amount
        }

