"""
Staff Performance Reports - Sales per waiter, productivity metrics
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QComboBox, QDateEdit, QFrame,
    QMessageBox
)
from PyQt6.QtCore import Qt, QDate
from PyQt6.QtGui import QColor
from loguru import logger
from datetime import date, datetime
from src.database.connection import get_db_session
from src.database.models import Staff, Order, OrderItem
from src.gui.design_system import (
    DATA_TABLE_STYLE,
    FILTER_COMBO_STYLE,
    PRIMARY_BUTTON_STYLE,
    TOOLBAR_CARD_STYLE,
)
from src.gui.table_utils import enable_table_auto_resize
from sqlalchemy import func


class StaffPerformanceReportsView(QWidget):
    """Staff Performance Reports View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        self.load_performance_data()
    
    def setup_ui(self):
        """Setup performance reports UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header row
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
        
        filter_layout.addWidget(QLabel("Report Type:"))
        self.report_type_combo = QComboBox()
        self.report_type_combo.addItems([
            "Sales Performance", "Order Count", "Average Order Value", "Top Performers"
        ])
        self.report_type_combo.setStyleSheet(FILTER_COMBO_STYLE)
        self.report_type_combo.currentTextChanged.connect(self.load_performance_data)
        filter_layout.addWidget(self.report_type_combo)
        
        filter_layout.addWidget(QLabel("From:"))
        self.from_date = QDateEdit()
        today = QDate.currentDate()
        self.from_date.setDate(today.addDays(-today.day() + 1))  # First day of month
        self.from_date.setCalendarPopup(True)
        self.from_date.setStyleSheet(FILTER_COMBO_STYLE)
        filter_layout.addWidget(self.from_date)
        
        filter_layout.addWidget(QLabel("To:"))
        self.to_date = QDateEdit()
        self.to_date.setDate(QDate.currentDate())
        self.to_date.setCalendarPopup(True)
        self.to_date.setStyleSheet(FILTER_COMBO_STYLE)
        filter_layout.addWidget(self.to_date)
        
        filter_btn = QPushButton("Generate Report")
        filter_btn.setStyleSheet(PRIMARY_BUTTON_STYLE)
        filter_btn.clicked.connect(self.load_performance_data)
        filter_layout.addWidget(filter_btn)
        
        filter_layout.addStretch()
        layout.addWidget(filter_card)
        layout.addSpacing(12)
        
        # Performance table
        self.performance_table = QTableWidget()
        self.performance_table.setColumnCount(5)
        self.performance_table.setHorizontalHeaderLabels([
            "Staff Member", "Total Sales", "Order Count", "Avg Order Value", "Performance Score"
        ])
        self.performance_table.setStyleSheet(DATA_TABLE_STYLE)
        enable_table_auto_resize(self.performance_table)
        self.performance_table.setAlternatingRowColors(True)
        layout.addWidget(self.performance_table)
    
    def load_performance_data(self):
        """Load staff performance data"""
        try:
            db = get_db_session()
            from_date = self.from_date.date().toPyDate()
            to_date = self.to_date.date().toPyDate()
            report_type = self.report_type_combo.currentText()
            
            # Get all active staff
            staff_list = db.query(Staff).filter(Staff.status == 'active').all()
            
            performance_data = []
            
            # First pass: collect all performance data
            for staff in staff_list:
                # Get orders for this staff member in date range
                # Convert dates to datetime for comparison
                from_datetime = datetime.combine(from_date, datetime.min.time())
                to_datetime = datetime.combine(to_date, datetime.max.time())
                
                orders = db.query(Order).filter(
                    Order.staff_id == staff.staff_id,
                    Order.order_datetime >= from_datetime,
                    Order.order_datetime <= to_datetime
                ).all()
                
                total_sales = sum(order.total_amount for order in orders)
                order_count = len(orders)
                avg_order_value = total_sales / order_count if order_count > 0 else 0.0
                
                performance_data.append({
                    'staff': staff,
                    'total_sales': total_sales,
                    'order_count': order_count,
                    'avg_order_value': avg_order_value,
                    'performance_score': 0.0  # Will calculate after we have all data
                })
            
            # Second pass: calculate performance scores
            if performance_data:
                max_sales = max(item['total_sales'] for item in performance_data) or 1
                max_orders = max(item['order_count'] for item in performance_data) or 1
                
                for item in performance_data:
                    # Calculate performance score (0-100)
                    # Based on sales volume (70%) and order count (30%)
                    sales_score = (item['total_sales'] / max_sales * 70) if max_sales > 0 else 0
                    order_score = (item['order_count'] / max_orders * 30) if max_orders > 0 and item['order_count'] > 0 else 0
                    item['performance_score'] = sales_score + order_score
            
            # Sort based on report type
            if report_type == "Sales Performance" or report_type == "Top Performers":
                performance_data.sort(key=lambda x: x['total_sales'], reverse=True)
            elif report_type == "Order Count":
                performance_data.sort(key=lambda x: x['order_count'], reverse=True)
            elif report_type == "Average Order Value":
                performance_data.sort(key=lambda x: x['avg_order_value'], reverse=True)
            
            # Display in table
            self.performance_table.setRowCount(len(performance_data))
            for row, data in enumerate(performance_data):
                staff_name = f"{data['staff'].first_name} {data['staff'].last_name}"
                self.performance_table.setItem(row, 0, QTableWidgetItem(staff_name))
                
                sales_item = QTableWidgetItem(f"${data['total_sales']:,.2f}")
                sales_item.setForeground(QColor("#14B8A6"))
                self.performance_table.setItem(row, 1, sales_item)
                
                self.performance_table.setItem(row, 2, QTableWidgetItem(str(data['order_count'])))
                self.performance_table.setItem(row, 3, QTableWidgetItem(f"${data['avg_order_value']:,.2f}"))
                
                # Performance score with color coding
                score_item = QTableWidgetItem(f"{data['performance_score']:.1f}")
                if data['performance_score'] >= 80:
                    score_item.setForeground(QColor("#14B8A6"))  # Green
                elif data['performance_score'] >= 60:
                    score_item.setForeground(QColor("#F59E0B"))  # Yellow
                else:
                    score_item.setForeground(QColor("#D92D20"))  # Red
                self.performance_table.setItem(row, 4, score_item)
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading performance data: {e}")
            QMessageBox.critical(self, "Error", f"Failed to load performance data: {str(e)}")

