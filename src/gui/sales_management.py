"""
Sales Management Module - View and manage sales transactions
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QDateEdit, QComboBox, QLineEdit, QFrame,
    QMessageBox, QDialog
)
from PyQt6.QtCore import Qt, QDate
from PyQt6.QtGui import QColor
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import Order, OrderItem, Staff
from src.gui.design_system import (
    DATA_TABLE_STYLE,
    FILTER_COMBO_STYLE,
    PRIMARY_BUTTON_STYLE,
    SEARCH_INPUT_STYLE,
    SECONDARY_BUTTON_STYLE,
    TOOLBAR_CARD_STYLE,
)
from src.gui.table_utils import enable_table_auto_resize
from datetime import datetime, timedelta


class SalesManagementView(QWidget):
    """Sales Management View - Transaction Management"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        self.load_transactions()
    
    def setup_ui(self):
        """Setup sales management UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header spacing alignment
        header_layout = QHBoxLayout()
        header_layout.addStretch()
        layout.addLayout(header_layout)
        layout.addSpacing(12)
        
        # Filters
        filter_card = QFrame()
        filter_card.setStyleSheet(TOOLBAR_CARD_STYLE)
        filter_layout = QHBoxLayout(filter_card)
        filter_layout.setContentsMargins(14, 10, 14, 10)
        filter_layout.setSpacing(12)
        
        # Date filter
        date_label = QLabel("Date:")
        date_label.setStyleSheet("""
            color: #2A3A55;
            font-size: 14px;
            font-weight: 500;
        """)
        filter_layout.addWidget(date_label)
        
        self.date_filter = QDateEdit()
        self.date_filter.setDate(QDate.currentDate())
        self.date_filter.setCalendarPopup(True)
        self.date_filter.dateChanged.connect(self.load_transactions)
        self.date_filter.setStyleSheet(FILTER_COMBO_STYLE)
        filter_layout.addWidget(self.date_filter)
        
        # Status filter
        status_label = QLabel("Status:")
        status_label.setStyleSheet("""
            color: #2A3A55;
            font-size: 14px;
            font-weight: 500;
        """)
        filter_layout.addWidget(status_label)
        
        self.status_filter = QComboBox()
        self.status_filter.addItems(["All", "Completed", "Refunded", "Cancelled"])
        self.status_filter.currentTextChanged.connect(self.load_transactions)
        self.status_filter.setStyleSheet(FILTER_COMBO_STYLE)
        filter_layout.addWidget(self.status_filter)
        
        # Search
        search_label = QLabel("Search:")
        search_label.setStyleSheet("""
            color: #2A3A55;
            font-size: 14px;
            font-weight: 500;
        """)
        filter_layout.addWidget(search_label)
        
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Order number, table, staff...")
        self.search_input.textChanged.connect(self.load_transactions)
        self.search_input.setStyleSheet(SEARCH_INPUT_STYLE)
        filter_layout.addWidget(self.search_input)
        
        filter_layout.addStretch()
        layout.addWidget(filter_card)
        layout.addSpacing(12)
        
        # Transactions table
        self.transactions_table = QTableWidget()
        self.transactions_table.setColumnCount(7)
        self.transactions_table.setHorizontalHeaderLabels([
            "Receipt #", "Date/Time", "Staff", "Table", "Total", "Payment", "Status"
        ])
        
        self.transactions_table.setStyleSheet(DATA_TABLE_STYLE)
        enable_table_auto_resize(self.transactions_table)
        self.transactions_table.setAlternatingRowColors(True)
        self.transactions_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.transactions_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.transactions_table.doubleClicked.connect(self.handle_view_details)
        
        layout.addWidget(self.transactions_table)
        
        # Action buttons
        actions_layout = QHBoxLayout()
        actions_layout.addStretch()
        
        # Coupon button
        self.coupon_btn = QPushButton("Apply Coupon")
        self.coupon_btn.setStyleSheet(SECONDARY_BUTTON_STYLE)
        self.coupon_btn.clicked.connect(self.handle_apply_coupon)
        self.coupon_btn.setEnabled(False)
        actions_layout.addWidget(self.coupon_btn)
        
        # Loyalty points button
        self.loyalty_btn = QPushButton("Redeem Points")
        self.loyalty_btn.setStyleSheet(SECONDARY_BUTTON_STYLE)
        self.loyalty_btn.clicked.connect(self.handle_redeem_loyalty)
        self.loyalty_btn.setEnabled(False)
        actions_layout.addWidget(self.loyalty_btn)
        
        self.view_btn = QPushButton("View Details")
        self.view_btn.setStyleSheet(PRIMARY_BUTTON_STYLE)
        self.view_btn.clicked.connect(self.handle_view_details)
        self.view_btn.setEnabled(False)
        actions_layout.addWidget(self.view_btn)
        
        self.refund_btn = QPushButton("Refund")
        self.refund_btn.setStyleSheet(SECONDARY_BUTTON_STYLE)
        self.refund_btn.clicked.connect(self.handle_refund)
        self.refund_btn.setEnabled(False)
        actions_layout.addWidget(self.refund_btn)
        
        self.transactions_table.itemSelectionChanged.connect(self.update_action_buttons)
        layout.addLayout(actions_layout)
    
    def load_transactions(self):
        """Load transactions based on filters"""
        db = get_db_session()
        try:
            selected_date = self.date_filter.date().toPyDate()
            status_filter = self.status_filter.currentText()
            search_text = self.search_input.text().strip().lower()
            
            # Build query
            query = db.query(Order).filter(
                Order.order_datetime >= datetime.combine(selected_date, datetime.min.time()),
                Order.order_datetime < datetime.combine(selected_date, datetime.min.time()) + timedelta(days=1)
            )
            
            # Apply status filter
            if status_filter != "All":
                query = query.filter(Order.order_status == status_filter.lower())
            
            transactions = query.order_by(Order.order_datetime.desc()).all()
            
            # Apply search filter
            if search_text:
                filtered = []
                for order in transactions:
                    if (search_text in str(order.order_id) or
                        search_text in (order.table_number or "").lower()):
                        filtered.append(order)
                transactions = filtered
            
            # Display transactions
            self.transactions_table.setRowCount(len(transactions))
            
            for row, order in enumerate(transactions):
                # Get staff name
                staff = db.query(Staff).filter(Staff.staff_id == order.staff_id).first()
                staff_name = f"{staff.first_name} {staff.last_name}" if staff else "Unknown"
                
                self.transactions_table.setItem(row, 0, QTableWidgetItem(f"ORD-{order.order_id}"))
                self.transactions_table.setItem(row, 1, QTableWidgetItem(order.order_datetime.strftime("%Y-%m-%d %H:%M")))
                self.transactions_table.setItem(row, 2, QTableWidgetItem(staff_name))
                self.transactions_table.setItem(row, 3, QTableWidgetItem(order.table_number or "-"))
                self.transactions_table.setItem(row, 4, QTableWidgetItem(f"${order.total_amount:.2f}"))
                self.transactions_table.setItem(row, 5, QTableWidgetItem(order.payment_method or "-"))
                
                # Status with color
                status_item = QTableWidgetItem(order.order_status.capitalize())
                if order.order_status == "completed":
                    status_item.setForeground(QColor("#14B8A6"))  # Green
                elif order.order_status == "cancelled":
                    status_item.setForeground(QColor("#D92D20"))  # Red
                elif order.order_status == "refunded":
                    status_item.setForeground(QColor("#F472B6"))  # Rose
                elif order.order_status == "pending":
                    status_item.setForeground(QColor("#F59E0B"))  # Orange
                self.transactions_table.setItem(row, 6, status_item)
            
            logger.info(f"Loaded {len(transactions)} transactions")
            
        except Exception as e:
            logger.error(f"Error loading transactions: {e}")
        finally:
            db.close()
    
    def update_action_buttons(self):
        """Enable/disable action buttons based on selection"""
        has_selection = len(self.transactions_table.selectedItems()) > 0
        self.view_btn.setEnabled(has_selection)
        
        # Only enable refund, coupon, and loyalty for completed transactions
        if has_selection:
            selected_rows = self.transactions_table.selectionModel().selectedRows()
            if selected_rows:
                row = selected_rows[0].row()
                status_item = self.transactions_table.item(row, 6)
                if status_item and status_item.text().lower() == "completed":
                    self.refund_btn.setEnabled(True)
                    # Get order to check if it has a customer
                    receipt_item = self.transactions_table.item(row, 0)
                    if receipt_item:
                        try:
                            order_id = int(receipt_item.text().replace("ORD-", ""))
                            db = get_db_session()
                            try:
                                order = db.query(Order).filter(Order.order_id == order_id).first()
                                if order and order.customer_id:
                                    self.coupon_btn.setEnabled(True)
                                    self.loyalty_btn.setEnabled(True)
                                else:
                                    self.coupon_btn.setEnabled(False)
                                    self.loyalty_btn.setEnabled(False)
                            finally:
                                db.close()
                        except ValueError:
                            pass
                else:
                    self.refund_btn.setEnabled(False)
                    self.coupon_btn.setEnabled(False)
                    self.loyalty_btn.setEnabled(False)
        else:
            self.refund_btn.setEnabled(False)
            self.coupon_btn.setEnabled(False)
            self.loyalty_btn.setEnabled(False)
    
    def handle_view_details(self):
        """Handle view details button click"""
        selected_rows = self.transactions_table.selectionModel().selectedRows()
        if selected_rows:
            row = selected_rows[0].row()
            receipt_item = self.transactions_table.item(row, 0)
            if receipt_item:
                receipt_number = receipt_item.text()
                logger.info(f"View details for receipt: {receipt_number}")
                try:
                    order_id = int(receipt_number.replace("ORD-", ""))
                    from src.gui.transaction_details_dialog import TransactionDetailsDialog
                    dialog = TransactionDetailsDialog(order_id, self)
                    dialog.exec()
                except ValueError:
                    QMessageBox.warning(self, "Error", "Invalid receipt number")
    
    def handle_refund(self):
        """Handle refund button click"""
        selected_rows = self.transactions_table.selectionModel().selectedRows()
        if selected_rows:
            row = selected_rows[0].row()
            receipt_item = self.transactions_table.item(row, 0)
            if receipt_item:
                receipt_number = receipt_item.text()
                logger.info(f"Refund transaction: {receipt_number}")
                try:
                    order_id = int(receipt_number.replace("ORD-", ""))
                    from src.gui.refund_dialog import RefundDialog
                    dialog = RefundDialog(order_id, self.user_id, self)
                    if dialog.exec() == QDialog.DialogCode.Accepted:
                        self.load_transactions()  # Refresh the list
                except ValueError:
                    QMessageBox.warning(self, "Error", "Invalid receipt number")
    
    def handle_apply_coupon(self):
        """Handle apply coupon button click"""
        selected_rows = self.transactions_table.selectionModel().selectedRows()
        if not selected_rows:
            return
        
        row = selected_rows[0].row()
        receipt_item = self.transactions_table.item(row, 0)
        total_item = self.transactions_table.item(row, 4)
        
        if receipt_item and total_item:
            try:
                order_id = int(receipt_item.text().replace("ORD-", ""))
                total_text = total_item.text().replace("$", "").replace(",", "")
                order_total = float(total_text)
                
                from src.gui.coupon_redemption_dialog import CouponRedemptionDialog
                dialog = CouponRedemptionDialog(order_total, self)
                if dialog.exec() == QDialog.DialogCode.Accepted:
                    coupon_info = dialog.get_coupon_info()
                    # Apply coupon discount to order
                    self.apply_coupon_to_order(order_id, coupon_info)
                    self.load_transactions()  # Refresh
            except (ValueError, AttributeError) as e:
                logger.error(f"Error applying coupon: {e}")
                QMessageBox.warning(self, "Error", "Invalid order information")
    
    def handle_redeem_loyalty(self):
        """Handle redeem loyalty points button click"""
        selected_rows = self.transactions_table.selectionModel().selectedRows()
        if not selected_rows:
            return
        
        row = selected_rows[0].row()
        receipt_item = self.transactions_table.item(row, 0)
        total_item = self.transactions_table.item(row, 4)
        
        if receipt_item and total_item:
            try:
                receipt_text = receipt_item.text()
                order_id = int(receipt_text.replace("ORD-", ""))
                total_text = total_item.text().replace("$", "").replace(",", "")
                order_total = float(total_text)
                
                # Get customer ID from order
                db = get_db_session()
                try:
                    order = db.query(Order).filter(Order.order_id == order_id).first()
                    if not order or not order.customer_id:
                        QMessageBox.warning(self, "No Customer", 
                            "This order is not associated with a customer. Loyalty points can only be redeemed for customer orders.")
                        return
                    
                    from src.gui.loyalty_points_dialog import LoyaltyPointsDialog
                    dialog = LoyaltyPointsDialog(order.customer_id, order_total, self)
                    if dialog.exec() == QDialog.DialogCode.Accepted:
                        redemption_info = dialog.get_redemption_info()
                        # Apply loyalty discount to order
                        self.apply_loyalty_discount_to_order(order_id, redemption_info)
                        self.load_transactions()  # Refresh
                finally:
                    db.close()
            except (ValueError, AttributeError) as e:
                logger.error(f"Error redeeming loyalty points: {e}")
                QMessageBox.warning(self, "Error", "Invalid order information")
    
    def apply_coupon_to_order(self, order_id: int, coupon_info: dict):
        """Apply coupon discount to an order"""
        db = get_db_session()
        try:
            order = db.query(Order).filter(Order.order_id == order_id).first()
            if not order:
                QMessageBox.warning(self, "Error", "Order not found")
                return
            
            # Apply discount
            discount_amount = coupon_info['discount_amount']
            order.total_amount = max(0, order.total_amount - discount_amount)
            
            db.commit()
            QMessageBox.information(self, "Coupon Applied", 
                f"Coupon '{coupon_info['coupon'].coupon_code}' applied successfully!\n"
                f"Discount: ${discount_amount:.2f}")
            
        except Exception as e:
            logger.error(f"Error applying coupon to order: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to apply coupon:\n{str(e)}")
        finally:
            db.close()
    
    def apply_loyalty_discount_to_order(self, order_id: int, redemption_info: dict):
        """Apply loyalty points discount to an order"""
        db = get_db_session()
        try:
            order = db.query(Order).filter(Order.order_id == order_id).first()
            if not order:
                QMessageBox.warning(self, "Error", "Order not found")
                return
            
            # Apply discount
            discount_amount = redemption_info['discount_amount']
            order.total_amount = max(0, order.total_amount - discount_amount)
            
            db.commit()
            QMessageBox.information(self, "Points Redeemed", 
                f"Redeemed {redemption_info['points_redeemed']} loyalty points!\n"
                f"Discount: ${discount_amount:.2f}")
            
        except Exception as e:
            logger.error(f"Error applying loyalty discount: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to apply loyalty discount:\n{str(e)}")
        finally:
            db.close()

