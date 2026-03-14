"""
Coupon Redemption Dialog - Apply coupon codes to orders
"""

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QLineEdit, QFormLayout, QMessageBox
)
from PyQt6.QtCore import Qt
from loguru import logger
from datetime import date
from src.database.connection import get_db_session
from src.database.models import Coupon
from src.utils.notification_center import NotificationCenter


class CouponRedemptionDialog(QDialog):
    """Dialog for applying coupon codes to orders"""
    
    def __init__(self, order_total: float, parent=None):
        super().__init__(parent)
        self.order_total = order_total
        self.applied_coupon = None
        self.discount_amount = 0.0
        self.setWindowTitle("Apply Coupon")
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
            font-size: 16px;
            font-weight: 600;
            padding: 12px;
            background-color: #F9FAFB;
            border-radius: 6px;
        """)
        layout.addWidget(total_label)
        
        form_layout = QFormLayout()
        form_layout.setSpacing(12)
        
        # Coupon code input
        self.coupon_code_input = QLineEdit()
        self.coupon_code_input.setPlaceholderText("Enter coupon code")
        self.coupon_code_input.textChanged.connect(self.validate_coupon)
        form_layout.addRow("Coupon Code:", self.coupon_code_input)
        
        # Coupon info display
        self.coupon_info_label = QLabel()
        self.coupon_info_label.setStyleSheet("""
            color: #5D6F8B;
            font-size: 14px;
            padding: 8px;
            background-color: #EDF3FC;
            border-radius: 4px;
        """)
        self.coupon_info_label.setWordWrap(True)
        self.coupon_info_label.setVisible(False)
        form_layout.addRow("", self.coupon_info_label)
        
        # Discount preview
        self.discount_preview_label = QLabel()
        self.discount_preview_label.setStyleSheet("""
            color: #14B8A6;
            font-size: 16px;
            font-weight: 600;
        """)
        self.discount_preview_label.setVisible(False)
        form_layout.addRow("Discount:", self.discount_preview_label)
        
        layout.addLayout(form_layout)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        self.apply_btn = QPushButton("Apply Coupon")
        self.apply_btn.setEnabled(False)
        self.apply_btn.setStyleSheet("""
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
        self.apply_btn.clicked.connect(self.apply_coupon)
        buttons_layout.addWidget(self.apply_btn)
        
        layout.addLayout(buttons_layout)
    
    def validate_coupon(self):
        """Validate coupon code as user types"""
        code = self.coupon_code_input.text().strip().upper()
        
        if not code:
            self.coupon_info_label.setVisible(False)
            self.discount_preview_label.setVisible(False)
            self.apply_btn.setEnabled(False)
            return
        
        db = get_db_session()
        try:
            coupon = db.query(Coupon).filter(
                Coupon.coupon_code == code,
                Coupon.is_active == True
            ).first()
            
            if not coupon:
                self.coupon_info_label.setText("❌ Coupon code not found or inactive")
                self.coupon_info_label.setStyleSheet("""
                    color: #D92D20;
                    font-size: 14px;
                    padding: 8px;
                    background-color: #FFE9E8;
                    border-radius: 4px;
                """)
                self.coupon_info_label.setVisible(True)
                self.discount_preview_label.setVisible(False)
                self.apply_btn.setEnabled(False)
                return
            
            # Check date validity
            today = date.today()
            if coupon.start_date > today:
                self.coupon_info_label.setText(f"❌ Coupon not yet valid (starts {coupon.start_date})")
                self.coupon_info_label.setStyleSheet("""
                    color: #D92D20;
                    font-size: 14px;
                    padding: 8px;
                    background-color: #FFE9E8;
                    border-radius: 4px;
                """)
                self.coupon_info_label.setVisible(True)
                self.discount_preview_label.setVisible(False)
                self.apply_btn.setEnabled(False)
                return
            
            if coupon.end_date and coupon.end_date < today:
                self.coupon_info_label.setText(f"❌ Coupon expired (ended {coupon.end_date})")
                self.coupon_info_label.setStyleSheet("""
                    color: #D92D20;
                    font-size: 14px;
                    padding: 8px;
                    background-color: #FFE9E8;
                    border-radius: 4px;
                """)
                self.coupon_info_label.setVisible(True)
                self.discount_preview_label.setVisible(False)
                self.apply_btn.setEnabled(False)
                return
            
            # Check usage limit
            if coupon.usage_limit and coupon.usage_count >= coupon.usage_limit:
                self.coupon_info_label.setText("❌ Coupon usage limit reached")
                self.coupon_info_label.setStyleSheet("""
                    color: #D92D20;
                    font-size: 14px;
                    padding: 8px;
                    background-color: #FFE9E8;
                    border-radius: 4px;
                """)
                self.coupon_info_label.setVisible(True)
                self.discount_preview_label.setVisible(False)
                self.apply_btn.setEnabled(False)
                return
            
            # Check minimum purchase
            if coupon.min_purchase_amount and self.order_total < coupon.min_purchase_amount:
                self.coupon_info_label.setText(
                    f"❌ Minimum purchase of ${coupon.min_purchase_amount:.2f} required"
                )
                self.coupon_info_label.setStyleSheet("""
                    color: #D92D20;
                    font-size: 14px;
                    padding: 8px;
                    background-color: #FFE9E8;
                    border-radius: 4px;
                """)
                self.coupon_info_label.setVisible(True)
                self.discount_preview_label.setVisible(False)
                self.apply_btn.setEnabled(False)
                return
            
            # Valid coupon - show info
            discount_text = f"{coupon.discount_value}%"
            if coupon.discount_type == "fixed":
                discount_text = f"${coupon.discount_value:.2f}"
            
            # Calculate discount
            if coupon.discount_type == "percentage":
                discount = (self.order_total * coupon.discount_value) / 100.0
                if coupon.max_discount_amount:
                    discount = min(discount, coupon.max_discount_amount)
            else:
                discount = min(coupon.discount_value, self.order_total)
            
            self.coupon_info_label.setText(f"✅ {coupon.coupon_name} - {discount_text} off")
            self.coupon_info_label.setStyleSheet("""
                color: #059669;
                font-size: 14px;
                padding: 8px;
                background-color: #D1FAE5;
                border-radius: 4px;
            """)
            self.coupon_info_label.setVisible(True)
            
            self.discount_preview_label.setText(f"-${discount:.2f}")
            self.discount_preview_label.setVisible(True)
            self.apply_btn.setEnabled(True)
            
        except Exception as e:
            logger.error(f"Error validating coupon: {e}")
            self.coupon_info_label.setText("❌ Error validating coupon")
            self.coupon_info_label.setStyleSheet("""
                color: #D92D20;
                font-size: 14px;
                padding: 8px;
                background-color: #FFE9E8;
                border-radius: 4px;
            """)
            self.coupon_info_label.setVisible(True)
            self.apply_btn.setEnabled(False)
        finally:
            db.close()
    
    def apply_coupon(self):
        """Apply the coupon"""
        code = self.coupon_code_input.text().strip().upper()
        
        db = get_db_session()
        try:
            coupon = db.query(Coupon).filter(
                Coupon.coupon_code == code,
                Coupon.is_active == True
            ).first()
            
            if not coupon:
                QMessageBox.warning(self, "Invalid Coupon", "Coupon code not found")
                return
            
            # Calculate discount
            if coupon.discount_type == "percentage":
                discount = (self.order_total * coupon.discount_value) / 100.0
                if coupon.max_discount_amount:
                    discount = min(discount, coupon.max_discount_amount)
            else:
                discount = min(coupon.discount_value, self.order_total)
            
            self.applied_coupon = coupon
            self.discount_amount = discount
            
            # Increment usage count
            coupon.usage_count += 1
            db.commit()
            
            logger.info(f"Coupon {code} applied: ${discount:.2f} discount")
            
            NotificationCenter.instance().emit_notification(
                module="Sales",
                title="Coupon redeemed",
                message=f"{code} applied for ${discount:.2f}",
                severity="info",
                source_type="coupon",
                source_id=coupon.coupon_id,
                payload={
                    "coupon_id": coupon.coupon_id,
                    "discount": float(discount),
                    "type": coupon.discount_type,
                },
            )
            self.accept()
            
        except Exception as e:
            logger.error(f"Error applying coupon: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to apply coupon:\n{str(e)}")
        finally:
            db.close()
    
    def get_coupon_info(self):
        """Get applied coupon information"""
        return {
            'coupon': self.applied_coupon,
            'discount_amount': self.discount_amount
        }

