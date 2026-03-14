"""
Refund Dialog - Process refunds for orders
"""

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QDoubleSpinBox, QComboBox,
    QTextEdit, QFormLayout, QMessageBox
)
from PyQt6.QtCore import Qt
from loguru import logger
from datetime import datetime
from src.database.connection import get_db_session
from src.database.models import Order, OrderItem, Payment


class RefundDialog(QDialog):
    """Dialog for processing refunds"""
    
    def __init__(self, order_id: int, user_id: int, parent=None):
        super().__init__(parent)
        self.order_id = order_id
        self.user_id = user_id
        self.setWindowTitle(f"Refund - Order #{order_id}")
        self.setModal(True)
        self.setMinimumWidth(600)
        self.setup_ui()
        self.load_order_info()
    
    def setup_ui(self):
        """Setup dialog UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(24, 24, 24, 24)
        
        # Order info
        info_label = QLabel("Order Information")
        info_label.setStyleSheet("""
            color: #162640;
            font-size: 16px;
            font-weight: 600;
        """)
        layout.addWidget(info_label)
        
        self.order_info_label = QLabel()
        self.order_info_label.setStyleSheet("""
            color: #5D6F8B;
            font-size: 14px;
            padding: 12px;
            background-color: #F9FAFB;
            border-radius: 6px;
        """)
        layout.addWidget(self.order_info_label)
        
        # Refund amount
        form_layout = QFormLayout()
        form_layout.setSpacing(12)
        
        self.refund_amount = QDoubleSpinBox()
        self.refund_amount.setMinimum(0.01)
        self.refund_amount.setMaximum(99999.99)
        self.refund_amount.setDecimals(2)
        self.refund_amount.setPrefix("$")
        form_layout.addRow("Refund Amount:", self.refund_amount)
        
        self.refund_reason = QComboBox()
        self.refund_reason.addItems([
            "Customer Request",
            "Order Error",
            "Quality Issue",
            "Duplicate Payment",
            "Other"
        ])
        form_layout.addRow("Reason:", self.refund_reason)
        
        self.notes_input = QTextEdit()
        self.notes_input.setPlaceholderText("Additional notes (optional)...")
        self.notes_input.setMaximumHeight(80)
        form_layout.addRow("Notes:", self.notes_input)
        
        layout.addLayout(form_layout)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        process_btn = QPushButton("Process Refund")
        process_btn.setStyleSheet("""
            QPushButton {
                background-color: #D92D20;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #DC2626;
            }
        """)
        process_btn.clicked.connect(self.process_refund)
        buttons_layout.addWidget(process_btn)
        
        layout.addLayout(buttons_layout)
    
    def load_order_info(self):
        """Load order information"""
        db = get_db_session()
        try:
            order = db.query(Order).filter(Order.order_id == self.order_id).first()
            if not order:
                QMessageBox.critical(self, "Error", "Order not found")
                self.reject()
                return
            
            info_text = f"Order #{order.order_id} - Total: ${order.total_amount:.2f}"
            self.order_info_label.setText(info_text)
            self.refund_amount.setValue(order.total_amount)
            self.refund_amount.setMaximum(order.total_amount)
            
        except Exception as e:
            logger.error(f"Error loading order info: {e}")
        finally:
            db.close()
    
    def process_refund(self):
        """Process the refund"""
        refund_amount = self.refund_amount.value()
        if refund_amount <= 0:
            QMessageBox.warning(self, "Invalid Amount", "Refund amount must be greater than 0")
            return
        
        db = get_db_session()
        try:
            order = db.query(Order).filter(Order.order_id == self.order_id).first()
            if not order:
                QMessageBox.critical(self, "Error", "Order not found")
                return
            
            if refund_amount > order.total_amount:
                QMessageBox.warning(self, "Invalid Amount", 
                    f"Refund amount cannot exceed order total (${order.total_amount:.2f})")
                return
            
            # Create refund payment record
            refund_payment = Payment(
                order_id=self.order_id,
                amount=-refund_amount,  # Negative for refund
                method=order.payment_method or "refund",
                payment_datetime=datetime.now(),
                status="refunded"
            )
            db.add(refund_payment)
            
            # Update order status
            order.order_status = "refunded"
            
            db.commit()
            
            logger.info(f"Refund processed for order {self.order_id}: ${refund_amount:.2f}")
            QMessageBox.information(self, "Refund Processed", 
                f"Refund of ${refund_amount:.2f} has been processed successfully.")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error processing refund: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to process refund:\n{str(e)}")
        finally:
            db.close()

