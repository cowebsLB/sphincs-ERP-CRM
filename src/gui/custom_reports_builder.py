"""
Custom Reports Builder - Build custom reports with flexible filters and columns
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QDialog, QComboBox,
    QDateEdit, QMessageBox, QFormLayout, QCheckBox,
    QListWidget, QListWidgetItem, QGroupBox, QTextEdit
)
from PyQt6.QtCore import Qt, QDate
from PyQt6.QtGui import QColor
from loguru import logger
from datetime import date
from src.database.connection import get_db_session
from src.database.models import Order, OrderItem, Product, Customer, Staff


class CustomReportsBuilderView(QWidget):
    """Custom Reports Builder View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
    
    def setup_ui(self):
        """Setup custom reports builder UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        
        title = QLabel("Custom Reports Builder")
        title.setStyleSheet("""
            color: #162640;
            font-size: 24px;
            font-weight: 700;
        """)
        header_layout.addWidget(title)
        header_layout.addStretch()
        
        layout.addLayout(header_layout)
        layout.addSpacing(24)
        
        # Report configuration
        config_group = QGroupBox("Report Configuration")
        config_group.setStyleSheet("""
            QGroupBox {
                font-size: 16px;
                font-weight: 600;
                border: 2px solid #C8D4E8;
                border-radius: 8px;
                margin-top: 12px;
                padding-top: 12px;
            }
        """)
        config_layout = QVBoxLayout(config_group)
        
        # Report type
        type_layout = QHBoxLayout()
        type_layout.addWidget(QLabel("Report Type:"))
        self.report_type_combo = QComboBox()
        self.report_type_combo.addItems([
            "Sales Report", "Product Report", "Customer Report", 
            "Staff Report", "Inventory Report"
        ])
        type_layout.addWidget(self.report_type_combo)
        type_layout.addStretch()
        config_layout.addLayout(type_layout)
        
        # Date range
        date_layout = QHBoxLayout()
        date_layout.addWidget(QLabel("From:"))
        self.from_date = QDateEdit()
        today = QDate.currentDate()
        self.from_date.setDate(today.addDays(-30))
        self.from_date.setCalendarPopup(True)
        date_layout.addWidget(self.from_date)
        
        date_layout.addWidget(QLabel("To:"))
        self.to_date = QDateEdit()
        self.to_date.setDate(today)
        self.to_date.setCalendarPopup(True)
        date_layout.addWidget(self.to_date)
        date_layout.addStretch()
        config_layout.addLayout(date_layout)
        
        # Columns selection
        columns_layout = QHBoxLayout()
        columns_layout.addWidget(QLabel("Select Columns:"))
        columns_layout.addStretch()
        config_layout.addLayout(columns_layout)
        
        columns_widget = QWidget()
        columns_widget_layout = QHBoxLayout(columns_widget)
        columns_widget_layout.setContentsMargins(0, 0, 0, 0)
        
        self.available_columns = QListWidget()
        self.available_columns.setMaximumHeight(150)
        self.available_columns.setSelectionMode(QListWidget.SelectionMode.MultiSelection)
        columns_widget_layout.addWidget(self.available_columns)
        
        # Buttons to move columns
        move_buttons = QVBoxLayout()
        add_col_btn = QPushButton(">>")
        add_col_btn.clicked.connect(self.add_selected_columns)
        move_buttons.addWidget(add_col_btn)
        
        remove_col_btn = QPushButton("<<")
        remove_col_btn.clicked.connect(self.remove_selected_columns)
        move_buttons.addWidget(remove_col_btn)
        columns_widget_layout.addLayout(move_buttons)
        
        self.selected_columns = QListWidget()
        self.selected_columns.setMaximumHeight(150)
        self.selected_columns.setSelectionMode(QListWidget.SelectionMode.MultiSelection)
        columns_widget_layout.addWidget(self.selected_columns)
        
        config_layout.addWidget(columns_widget)
        
        # Generate button
        generate_btn = QPushButton("Generate Report")
        generate_btn.setStyleSheet("""
            QPushButton {
                background-color: #14B8A6;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
                font-size: 14px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #059669;
            }
        """)
        generate_btn.clicked.connect(self.generate_report)
        config_layout.addWidget(generate_btn)
        
        layout.addWidget(config_group)
        layout.addSpacing(16)
        
        # Results table
        self.results_table = QTableWidget()
        self.results_table.setStyleSheet("""
            QTableWidget {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                gridline-color: #EDF3FC;
            }
            QHeaderView::section {
                background-color: #F9FAFB;
                padding: 10px;
                border: none;
                border-bottom: 2px solid #C8D4E8;
                font-weight: 600;
            }
        """)
        self.results_table.horizontalHeader().setStretchLastSection(True)
        layout.addWidget(self.results_table)
        
        # Load default columns
        self.report_type_combo.currentTextChanged.connect(self.load_available_columns)
        self.load_available_columns()
    
    def load_available_columns(self):
        """Load available columns based on report type"""
        self.available_columns.clear()
        self.selected_columns.clear()
        
        report_type = self.report_type_combo.currentText()
        
        if report_type == "Sales Report":
            columns = ["Order ID", "Date", "Customer", "Staff", "Total Amount", "Payment Method", "Status"]
        elif report_type == "Product Report":
            columns = ["Product Name", "Category", "Price", "Cost", "Quantity Sold", "Revenue", "Profit"]
        elif report_type == "Customer Report":
            columns = ["Customer Name", "Email", "Phone", "Total Orders", "Total Spent", "Loyalty Points", "Last Order"]
        elif report_type == "Staff Report":
            columns = ["Staff Name", "Role", "Total Sales", "Order Count", "Avg Order Value", "Performance Score"]
        else:  # Inventory Report
            columns = ["Item Name", "Category", "Current Stock", "Reorder Level", "Unit Cost", "Total Value"]
        
        for col in columns:
            self.available_columns.addItem(col)
    
    def add_selected_columns(self):
        """Add selected columns to selected list"""
        selected = self.available_columns.selectedItems()
        for item in selected:
            # Check if already in selected
            existing = self.selected_columns.findItems(item.text(), Qt.MatchFlag.MatchExactly)
            if not existing:
                self.selected_columns.addItem(item.text())
    
    def remove_selected_columns(self):
        """Remove selected columns from selected list"""
        selected = self.selected_columns.selectedItems()
        for item in selected:
            row = self.selected_columns.row(item)
            self.selected_columns.takeItem(row)
    
    def generate_report(self):
        """Generate custom report"""
        try:
            selected_cols = []
            for i in range(self.selected_columns.count()):
                selected_cols.append(self.selected_columns.item(i).text())
            
            if not selected_cols:
                QMessageBox.warning(self, "Warning", "Please select at least one column")
                return
            
            report_type = self.report_type_combo.currentText()
            from_date = self.from_date.date().toPyDate()
            to_date = self.to_date.date().toPyDate()
            
            db = get_db_session()
            
            # Generate report based on type
            if report_type == "Sales Report":
                self.generate_sales_report(db, selected_cols, from_date, to_date)
            elif report_type == "Product Report":
                self.generate_product_report(db, selected_cols, from_date, to_date)
            elif report_type == "Customer Report":
                self.generate_customer_report(db, selected_cols, from_date, to_date)
            elif report_type == "Staff Report":
                self.generate_staff_report(db, selected_cols, from_date, to_date)
            else:  # Inventory Report
                self.generate_inventory_report(db, selected_cols)
            
            db.close()
            
        except Exception as e:
            logger.error(f"Error generating report: {e}")
            QMessageBox.critical(self, "Error", f"Failed to generate report: {str(e)}")
    
    def generate_sales_report(self, db, columns, from_date, to_date):
        """Generate sales report"""
        from datetime import datetime
        from_datetime = datetime.combine(from_date, datetime.min.time())
        to_datetime = datetime.combine(to_date, datetime.max.time())
        
        orders = db.query(Order).filter(
            Order.order_datetime >= from_datetime,
            Order.order_datetime <= to_datetime
        ).all()
        
        self.results_table.setColumnCount(len(columns))
        self.results_table.setHorizontalHeaderLabels(columns)
        self.results_table.setRowCount(len(orders))
        
        for row, order in enumerate(orders):
            for col_idx, col_name in enumerate(columns):
                value = ""
                if col_name == "Order ID":
                    value = str(order.order_id)
                elif col_name == "Date":
                    value = order.order_datetime.strftime("%Y-%m-%d %H:%M")
                elif col_name == "Customer":
                    if order.customer:
                        value = f"{order.customer.first_name} {order.customer.last_name}"
                    else:
                        value = "Walk-in"
                elif col_name == "Staff":
                    if order.staff:
                        value = f"{order.staff.first_name} {order.staff.last_name}"
                elif col_name == "Total Amount":
                    value = f"${order.total_amount:.2f}"
                elif col_name == "Payment Method":
                    value = order.payment_method or "-"
                elif col_name == "Status":
                    value = order.order_status
                
                self.results_table.setItem(row, col_idx, QTableWidgetItem(value))
    
    def generate_product_report(self, db, columns, from_date, to_date):
        """Generate product report"""
        from datetime import datetime
        from sqlalchemy import func
        from_datetime = datetime.combine(from_date, datetime.min.time())
        to_datetime = datetime.combine(to_date, datetime.max.time())
        
        products = db.query(Product).all()
        
        self.results_table.setColumnCount(len(columns))
        self.results_table.setHorizontalHeaderLabels(columns)
        self.results_table.setRowCount(len(products))
        
        for row, product in enumerate(products):
            # Get sales data for this product
            order_items = db.query(OrderItem).join(Order).filter(
                OrderItem.product_id == product.product_id,
                Order.order_datetime >= from_datetime,
                Order.order_datetime <= to_datetime
            ).all()
            
            qty_sold = sum(item.quantity for item in order_items)
            revenue = sum(item.total_price for item in order_items)
            profit = revenue - (product.cost_price * qty_sold if product.cost_price else 0)
            
            for col_idx, col_name in enumerate(columns):
                value = ""
                if col_name == "Product Name":
                    value = product.name
                elif col_name == "Category":
                    value = product.category.name if product.category else "-"
                elif col_name == "Price":
                    value = f"${product.price:.2f}"
                elif col_name == "Cost":
                    value = f"${product.cost_price:.2f}" if product.cost_price else "-"
                elif col_name == "Quantity Sold":
                    value = str(int(qty_sold))
                elif col_name == "Revenue":
                    value = f"${revenue:.2f}"
                elif col_name == "Profit":
                    value = f"${profit:.2f}"
                
                self.results_table.setItem(row, col_idx, QTableWidgetItem(value))
    
    def generate_customer_report(self, db, columns, from_date, to_date):
        """Generate customer report"""
        from datetime import datetime
        from_datetime = datetime.combine(from_date, datetime.min.time())
        to_datetime = datetime.combine(to_date, datetime.max.time())
        
        customers = db.query(Customer).all()
        
        self.results_table.setColumnCount(len(columns))
        self.results_table.setHorizontalHeaderLabels(columns)
        self.results_table.setRowCount(len(customers))
        
        for row, customer in enumerate(customers):
            orders = db.query(Order).filter(
                Order.customer_id == customer.customer_id,
                Order.order_datetime >= from_datetime,
                Order.order_datetime <= to_datetime
            ).all()
            
            total_spent = sum(order.total_amount for order in orders)
            last_order = max((o.order_datetime for o in orders), default=None)
            
            for col_idx, col_name in enumerate(columns):
                value = ""
                if col_name == "Customer Name":
                    value = f"{customer.first_name} {customer.last_name}"
                elif col_name == "Email":
                    value = customer.email or "-"
                elif col_name == "Phone":
                    value = customer.phone or "-"
                elif col_name == "Total Orders":
                    value = str(len(orders))
                elif col_name == "Total Spent":
                    value = f"${total_spent:.2f}"
                elif col_name == "Loyalty Points":
                    value = str(customer.loyalty_points)
                elif col_name == "Last Order":
                    value = last_order.strftime("%Y-%m-%d") if last_order else "-"
                
                self.results_table.setItem(row, col_idx, QTableWidgetItem(value))
    
    def generate_staff_report(self, db, columns, from_date, to_date):
        """Generate staff report"""
        from datetime import datetime
        from_datetime = datetime.combine(from_date, datetime.min.time())
        to_datetime = datetime.combine(to_date, datetime.max.time())
        
        staff_list = db.query(Staff).filter(Staff.status == 'active').all()
        
        self.results_table.setColumnCount(len(columns))
        self.results_table.setHorizontalHeaderLabels(columns)
        self.results_table.setRowCount(len(staff_list))
        
        for row, staff in enumerate(staff_list):
            orders = db.query(Order).filter(
                Order.staff_id == staff.staff_id,
                Order.order_datetime >= from_datetime,
                Order.order_datetime <= to_datetime
            ).all()
            
            total_sales = sum(order.total_amount for order in orders)
            order_count = len(orders)
            avg_order = total_sales / order_count if order_count > 0 else 0
            
            for col_idx, col_name in enumerate(columns):
                value = ""
                if col_name == "Staff Name":
                    value = f"{staff.first_name} {staff.last_name}"
                elif col_name == "Role":
                    value = staff.role.role_name if staff.role else "-"
                elif col_name == "Total Sales":
                    value = f"${total_sales:.2f}"
                elif col_name == "Order Count":
                    value = str(order_count)
                elif col_name == "Avg Order Value":
                    value = f"${avg_order:.2f}"
                elif col_name == "Performance Score":
                    # Simple performance calculation
                    max_sales = max((sum(o.total_amount for o in db.query(Order).filter(
                        Order.staff_id == s.staff_id,
                        Order.order_datetime >= from_datetime,
                        Order.order_datetime <= to_datetime
                    ).all()) for s in staff_list), default=1)
                    score = (total_sales / max_sales * 100) if max_sales > 0 else 0
                    value = f"{score:.1f}"
                
                self.results_table.setItem(row, col_idx, QTableWidgetItem(value))
    
    def generate_inventory_report(self, db, columns):
        """Generate inventory report"""
        from src.database.models import Inventory
        
        inventory_items = db.query(Inventory).filter(Inventory.status == 'active').all()
        
        self.results_table.setColumnCount(len(columns))
        self.results_table.setHorizontalHeaderLabels(columns)
        self.results_table.setRowCount(len(inventory_items))
        
        for row, item in enumerate(inventory_items):
            total_value = item.quantity * (item.ingredient.cost_per_unit or 0)
            
            for col_idx, col_name in enumerate(columns):
                value = ""
                if col_name == "Item Name":
                    value = item.ingredient.name
                elif col_name == "Category":
                    value = item.ingredient.category or "-"
                elif col_name == "Current Stock":
                    value = f"{item.quantity} {item.unit}"
                elif col_name == "Reorder Level":
                    value = f"{item.reorder_level} {item.unit}"
                elif col_name == "Unit Cost":
                    value = f"${item.ingredient.cost_per_unit:.2f}" if item.ingredient.cost_per_unit else "-"
                elif col_name == "Total Value":
                    value = f"${total_value:.2f}"
                
                self.results_table.setItem(row, col_idx, QTableWidgetItem(value))

