"""
Payment Dialog - Process payments for orders
"""

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QDoubleSpinBox, QComboBox, QLineEdit, QFormLayout, QMessageBox
)
from PyQt6.QtCore import Qt
from loguru import logger
from datetime import datetime
from src.database.connection import get_db_session
from src.database.models import Payment, Order
from src.utils.notification_center import NotificationCenter


class PaymentDialog(QDialog):
    """Dialog for processing payments"""
    
    def __init__(self, order_id: int, order_total: float, user_id: int, parent=None):
        super().__init__(parent)
        self.order_id = order_id
        self.order_total = order_total
        self.user_id = user_id
        self.payment_method = "cash"
        self.amount_paid = order_total
        self.setWindowTitle("Process Payment")
        self.setModal(True)
        self.setMinimumWidth(400)
        self.setup_ui()
    
    def setup_ui(self):
        """Setup dialog UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(24, 24, 24, 24)
        
        # Order total
        total_label = QLabel(f"Order Total: ${self.order_total:.2f}")
        total_label.setStyleSheet("""
            color: #162640;
            font-size: 18px;
            font-weight: 700;
            padding: 12px;
            background-color: #F9FAFB;
            border-radius: 6px;
        """)
        layout.addWidget(total_label)
        
        form_layout = QFormLayout()
        form_layout.setSpacing(12)
        
        # Payment method
        self.payment_method_combo = QComboBox()
        self.payment_method_combo.addItems([
            "Cash",
            "Credit Card",
            "Debit Card",
            "Mobile Payment",
            "Gift Card",
            "Other"
        ])
        form_layout.addRow("Payment Method:", self.payment_method_combo)
        
        # Amount paid
        self.amount_paid_input = QDoubleSpinBox()
        self.amount_paid_input.setMinimum(0.01)
        self.amount_paid_input.setMaximum(99999.99)
        self.amount_paid_input.setDecimals(2)
        self.amount_paid_input.setPrefix("$")
        self.amount_paid_input.setValue(self.order_total)
        form_layout.addRow("Amount Paid:", self.amount_paid_input)
        
        # Change display
        self.change_label = QLabel("Change: $0.00")
        self.change_label.setStyleSheet("""
            color: #059669;
            font-size: 16px;
            font-weight: 600;
        """)
        form_layout.addRow("", self.change_label)
        
        # Update change when amount changes
        self.amount_paid_input.valueChanged.connect(self.update_change)
        
        layout.addLayout(form_layout)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        process_btn = QPushButton("Process Payment")
        process_btn.setStyleSheet("""
            QPushButton {
                background-color: #14B8A6;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #059669;
            }
        """)
        process_btn.clicked.connect(self.process_payment)
        buttons_layout.addWidget(process_btn)
        
        layout.addLayout(buttons_layout)
        self.update_change()
    
    def update_change(self):
        """Update change amount"""
        amount_paid = self.amount_paid_input.value()
        change = max(0, amount_paid - self.order_total)
        self.change_label.setText(f"Change: ${change:.2f}")
        if change > 0:
            self.change_label.setStyleSheet("""
                color: #059669;
                font-size: 16px;
                font-weight: 600;
            """)
        else:
            self.change_label.setStyleSheet("""
                color: #5D6F8B;
                font-size: 16px;
                font-weight: 600;
            """)
    
    def process_payment(self):
        """Process the payment"""
        amount_paid = self.amount_paid_input.value()
        payment_method = self.payment_method_combo.currentText().lower().replace(" ", "_")
        
        if amount_paid < self.order_total:
            QMessageBox.warning(self, "Insufficient Payment", 
                f"Amount paid (${amount_paid:.2f}) is less than order total (${self.order_total:.2f})")
            return
        
        db = get_db_session()
        try:
            # Create payment record
            payment = Payment(
                order_id=self.order_id,
                amount=self.order_total,
                method=payment_method,
                payment_datetime=datetime.now(),
                status="completed"
            )
            db.add(payment)
            
            # Update order status
            order = db.query(Order).filter(Order.order_id == self.order_id).first()
            if order:
                order.order_status = "completed"
                order.payment_method = payment_method
            
            db.commit()
            
            # Award loyalty points if customer exists
            if order and order.customer_id:
                try:
                    from src.utils.loyalty_points import award_loyalty_points
                    result = award_loyalty_points(self.order_id)
                    if result.get('success'):
                        logger.info(f"Awarded {result.get('points_awarded')} loyalty points to customer {order.customer_id}")
                except Exception as e:
                    logger.error(f"Error awarding loyalty points: {e}")
                    # Don't fail payment if loyalty points fail
            
            self.payment_method = payment_method
            self.amount_paid = amount_paid
            
            logger.info(f"Payment processed for order {self.order_id}: ${self.order_total:.2f} via {payment_method}")
            
            NotificationCenter.instance().resolve_for_source("pos_order", self.order_id)
            
            self.accept()
            
        except Exception as e:
            logger.error(f"Error processing payment: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to process payment:\n{str(e)}")
        finally:
            db.close()
    
    def get_payment_info(self):
        """Get payment information"""
        return {
            'method': self.payment_method,
            'amount_paid': self.amount_paid,
            'change': max(0, self.amount_paid - self.order_total)
        }

