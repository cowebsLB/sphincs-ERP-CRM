"""
Transaction Details Dialog - View detailed order/transaction information
"""

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QFrame
)
from PyQt6.QtCore import Qt
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import Order, OrderItem, Product, Customer, Staff


class TransactionDetailsDialog(QDialog):
    """Dialog showing detailed transaction/order information"""
    
    def __init__(self, order_id: int, parent=None):
        super().__init__(parent)
        self.order_id = order_id
        self.setWindowTitle(f"Transaction Details - Order #{order_id}")
        self.setModal(True)
        self.setMinimumWidth(700)
        self.setup_ui()
        self.load_order_details()
    
    def setup_ui(self):
        """Setup dialog UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(24, 24, 24, 24)
        
        # Order info section
        info_frame = QFrame()
        info_frame.setStyleSheet("""
            QFrame {
                background-color: white;
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                padding: 16px;
            }
        """)
        info_layout = QVBoxLayout(info_frame)
        info_layout.setSpacing(8)
        
        self.order_info_label = QLabel()
        self.order_info_label.setStyleSheet("""
            color: #162640;
            font-size: 14px;
        """)
        info_layout.addWidget(self.order_info_label)
        
        layout.addWidget(info_frame)
        
        # Order items table
        items_label = QLabel("Order Items")
        items_label.setStyleSheet("""
            color: #162640;
            font-size: 16px;
            font-weight: 600;
        """)
        layout.addWidget(items_label)
        
        self.items_table = QTableWidget()
        self.items_table.setColumnCount(4)
        self.items_table.setHorizontalHeaderLabels([
            "Product", "Quantity", "Unit Price", "Total"
        ])
        self.items_table.horizontalHeader().setStretchLastSection(True)
        self.items_table.setStyleSheet("""
            QTableWidget {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background-color: white;
            }
            QHeaderView::section {
                background-color: #F9FAFB;
                padding: 10px;
                border: none;
                font-weight: 600;
            }
        """)
        layout.addWidget(self.items_table)
        
        # Total section
        total_frame = QFrame()
        total_frame.setStyleSheet("""
            QFrame {
                background-color: #F9FAFB;
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                padding: 16px;
            }
        """)
        total_layout = QHBoxLayout(total_frame)
        
        total_label = QLabel("Total Amount:")
        total_label.setStyleSheet("""
            color: #162640;
            font-size: 16px;
            font-weight: 600;
        """)
        total_layout.addWidget(total_label)
        total_layout.addStretch()
        
        self.total_label = QLabel("$0.00")
        self.total_label.setStyleSheet("""
            color: #2F7DFF;
            font-size: 20px;
            font-weight: 700;
        """)
        total_layout.addWidget(self.total_label)
        
        layout.addWidget(total_frame)
        
        # Close button
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        close_btn = QPushButton("Close")
        close_btn.setStyleSheet("""
            QPushButton {
                background-color: #5D6F8B;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #4B5563;
            }
        """)
        close_btn.clicked.connect(self.accept)
        buttons_layout.addWidget(close_btn)
        
        layout.addLayout(buttons_layout)
    
    def load_order_details(self):
        """Load order details from database"""
        db = get_db_session()
        try:
            order = db.query(Order).filter(Order.order_id == self.order_id).first()
            if not order:
                logger.error(f"Order {self.order_id} not found")
                return
            
            # Order info
            customer_name = f"{order.customer.first_name} {order.customer.last_name}" if order.customer else "Walk-in"
            staff_name = f"{order.staff.first_name} {order.staff.last_name}" if order.staff else "Unknown"
            order_date = order.order_datetime.strftime("%Y-%m-%d %H:%M:%S")
            
            info_text = f"""
            <b>Order ID:</b> {order.order_id}<br>
            <b>Date:</b> {order_date}<br>
            <b>Customer:</b> {customer_name}<br>
            <b>Staff:</b> {staff_name}<br>
            <b>Type:</b> {order.order_type}<br>
            <b>Status:</b> {order.order_status}<br>
            <b>Payment Method:</b> {order.payment_method or 'N/A'}
            """
            if order.table_number:
                info_text += f"<br><b>Table:</b> {order.table_number}"
            
            # Show loyalty points if customer exists
            if order.customer:
                info_text += f"<br><b>Loyalty Points:</b> {order.customer.loyalty_points} points"
            
            self.order_info_label.setText(info_text)
            
            # Order items
            items = db.query(OrderItem).filter(OrderItem.order_id == self.order_id).all()
            self.items_table.setRowCount(len(items))
            
            total_amount = 0
            for row, item in enumerate(items):
                product_name = item.product.name if item.product else "Unknown"
                self.items_table.setItem(row, 0, QTableWidgetItem(product_name))
                self.items_table.setItem(row, 1, QTableWidgetItem(str(item.quantity)))
                self.items_table.setItem(row, 2, QTableWidgetItem(f"${item.unit_price:.2f}"))
                self.items_table.setItem(row, 3, QTableWidgetItem(f"${item.total_price:.2f}"))
                total_amount += item.total_price
            
            self.total_label.setText(f"${total_amount:.2f}")
            
        except Exception as e:
            logger.error(f"Error loading order details: {e}")
        finally:
            db.close()

