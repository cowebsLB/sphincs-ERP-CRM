"""
Sales Analytics - Heatmaps, trends, and advanced sales reporting
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QComboBox, QDateEdit,
    QMessageBox, QGroupBox, QGridLayout
)
from PyQt6.QtCore import Qt, QDate
from PyQt6.QtGui import QColor
from loguru import logger
from datetime import date, timedelta, datetime
from src.database.connection import get_db_session
from src.database.models import Order, OrderItem, Product
from sqlalchemy import func, extract


class SalesAnalyticsView(QWidget):
    """Sales Analytics View with heatmaps and trends"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        self.load_analytics()
    
    def setup_ui(self):
        """Setup sales analytics UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        
        title = QLabel("Sales Analytics")
        title.setStyleSheet("""
            color: #162640;
            font-size: 24px;
            font-weight: 700;
        """)
        header_layout.addWidget(title)
        header_layout.addStretch()
        
        layout.addLayout(header_layout)
        layout.addSpacing(24)
        
        # Filters
        filter_layout = QHBoxLayout()
        filter_layout.setSpacing(12)
        
        filter_layout.addWidget(QLabel("Period:"))
        self.period_combo = QComboBox()
        self.period_combo.addItems([
            "Last 7 Days", "Last 30 Days", "This Month", "Last Month", "This Year", "Custom"
        ])
        self.period_combo.currentTextChanged.connect(self.handle_period_change)
        filter_layout.addWidget(self.period_combo)
        
        filter_layout.addWidget(QLabel("From:"))
        self.from_date = QDateEdit()
        today = QDate.currentDate()
        self.from_date.setDate(today.addDays(-7))
        self.from_date.setCalendarPopup(True)
        self.from_date.setEnabled(False)
        filter_layout.addWidget(self.from_date)
        
        filter_layout.addWidget(QLabel("To:"))
        self.to_date = QDateEdit()
        self.to_date.setDate(today)
        self.to_date.setCalendarPopup(True)
        self.to_date.setEnabled(False)
        filter_layout.addWidget(self.to_date)
        
        refresh_btn = QPushButton("Refresh")
        refresh_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-weight: 600;
            }
        """)
        refresh_btn.clicked.connect(self.load_analytics)
        filter_layout.addWidget(refresh_btn)
        
        filter_layout.addStretch()
        layout.addLayout(filter_layout)
        layout.addSpacing(24)
        
        # Sales by Hour Heatmap
        hour_group = QGroupBox("Sales by Hour of Day")
        hour_group.setStyleSheet("""
            QGroupBox {
                font-size: 16px;
                font-weight: 600;
                border: 2px solid #C8D4E8;
                border-radius: 8px;
                margin-top: 12px;
                padding-top: 12px;
            }
        """)
        hour_layout = QGridLayout(hour_group)
        hour_layout.setSpacing(4)
        
        self.hour_labels = {}
        hours = list(range(24))
        for i, hour in enumerate(hours):
            label = QLabel(f"{hour:02d}:00")
            label.setAlignment(Qt.AlignmentFlag.AlignCenter)
            label.setMinimumSize(80, 40)
            label.setStyleSheet("""
                QLabel {
                    border: 1px solid #C8D4E8;
                    border-radius: 4px;
                    background-color: #F9FAFB;
                    padding: 4px;
                }
            """)
            hour_layout.addWidget(label, i // 6, i % 6)
            self.hour_labels[hour] = label
        
        layout.addWidget(hour_group)
        layout.addSpacing(16)
        
        # Sales by Day of Week
        day_group = QGroupBox("Sales by Day of Week")
        day_group.setStyleSheet("""
            QGroupBox {
                font-size: 16px;
                font-weight: 600;
                border: 2px solid #C8D4E8;
                border-radius: 8px;
                margin-top: 12px;
                padding-top: 12px;
            }
        """)
        day_layout = QHBoxLayout(day_group)
        day_layout.setSpacing(8)
        
        self.day_labels = {}
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        for day in days:
            label = QLabel(day)
            label.setAlignment(Qt.AlignmentFlag.AlignCenter)
            label.setMinimumSize(100, 60)
            label.setStyleSheet("""
                QLabel {
                    border: 1px solid #C8D4E8;
                    border-radius: 4px;
                    background-color: #F9FAFB;
                    padding: 8px;
                }
            """)
            day_layout.addWidget(label)
            self.day_labels[day] = label
        
        layout.addWidget(day_group)
        layout.addSpacing(16)
        
        # Top Products Table
        top_products_label = QLabel("Top Selling Products")
        top_products_label.setStyleSheet("font-weight: 600; font-size: 16px;")
        layout.addWidget(top_products_label)
        
        self.top_products_table = QTableWidget()
        self.top_products_table.setColumnCount(4)
        self.top_products_table.setHorizontalHeaderLabels([
            "Product", "Quantity Sold", "Revenue", "Avg Price"
        ])
        self.top_products_table.setStyleSheet("""
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
        self.top_products_table.horizontalHeader().setStretchLastSection(True)
        layout.addWidget(self.top_products_table)
        layout.addStretch()
    
    def handle_period_change(self, period: str):
        """Handle period selection change"""
        today = QDate.currentDate()
        if period == "Last 7 Days":
            self.from_date.setDate(today.addDays(-7))
            self.to_date.setDate(today)
            self.from_date.setEnabled(False)
            self.to_date.setEnabled(False)
        elif period == "Last 30 Days":
            self.from_date.setDate(today.addDays(-30))
            self.to_date.setDate(today)
            self.from_date.setEnabled(False)
            self.to_date.setEnabled(False)
        elif period == "This Month":
            self.from_date.setDate(today.addDays(-today.day() + 1))
            self.to_date.setDate(today)
            self.from_date.setEnabled(False)
            self.to_date.setEnabled(False)
        elif period == "Last Month":
            last_month = today.addMonths(-1)
            self.from_date.setDate(QDate(last_month.year(), last_month.month(), 1))
            self.to_date.setDate(QDate(last_month.year(), last_month.month(), last_month.daysInMonth()))
            self.from_date.setEnabled(False)
            self.to_date.setEnabled(False)
        elif period == "This Year":
            self.from_date.setDate(QDate(today.year(), 1, 1))
            self.to_date.setDate(today)
            self.from_date.setEnabled(False)
            self.to_date.setEnabled(False)
        else:  # Custom
            self.from_date.setEnabled(True)
            self.to_date.setEnabled(True)
    
    def load_analytics(self):
        """Load sales analytics data"""
        try:
            db = get_db_session()
            from_date = self.from_date.date().toPyDate()
            to_date = self.to_date.date().toPyDate()
            
            # Get orders in date range
            # Convert dates to datetime for comparison
            from_datetime = datetime.combine(from_date, datetime.min.time())
            to_datetime = datetime.combine(to_date, datetime.max.time())
            
            orders = db.query(Order).filter(
                Order.order_datetime >= from_datetime,
                Order.order_datetime <= to_datetime
            ).all()
            
            if not orders:
                QMessageBox.information(self, "No Data", "No sales data found for the selected period.")
                return
            
            # Sales by hour
            hour_sales = {hour: 0.0 for hour in range(24)}
            for order in orders:
                if order.order_datetime:
                    hour = order.order_datetime.hour
                    hour_sales[hour] += order.total_amount
            
            max_hour_sales = max(hour_sales.values()) if hour_sales.values() else 1
            
            for hour, sales in hour_sales.items():
                label = self.hour_labels[hour]
                intensity = int((sales / max_hour_sales) * 255) if max_hour_sales > 0 else 0
                # Green gradient based on sales
                color = f"rgb({255 - intensity}, 255, {255 - intensity})"
                label.setText(f"{hour:02d}:00\n${sales:.0f}")
                label.setStyleSheet(f"""
                    QLabel {{
                        border: 1px solid #C8D4E8;
                        border-radius: 4px;
                        background-color: {color};
                        padding: 4px;
                        font-weight: 600;
                    }}
                """)
            
            # Sales by day of week
            day_sales = {day: 0.0 for day in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
            day_map = {0: 'Mon', 1: 'Tue', 2: 'Wed', 3: 'Thu', 4: 'Fri', 5: 'Sat', 6: 'Sun'}
            
            for order in orders:
                if order.order_datetime:
                    day_of_week = order.order_datetime.weekday()
                    day_name = day_map[day_of_week]
                    day_sales[day_name] += order.total_amount
            
            max_day_sales = max(day_sales.values()) if day_sales.values() else 1
            
            for day, sales in day_sales.items():
                label = self.day_labels[day]
                intensity = int((sales / max_day_sales) * 255) if max_day_sales > 0 else 0
                color = f"rgb({255 - intensity}, 255, {255 - intensity})"
                label.setText(f"{day}\n${sales:.0f}")
                label.setStyleSheet(f"""
                    QLabel {{
                        border: 1px solid #C8D4E8;
                        border-radius: 4px;
                        background-color: {color};
                        padding: 8px;
                        font-weight: 600;
                    }}
                """)
            
            # Top products
            product_sales = db.query(
                Product.name,
                func.sum(OrderItem.quantity).label('total_quantity'),
                func.sum(OrderItem.total_price).label('total_revenue')
            ).join(
                OrderItem, Product.product_id == OrderItem.product_id
            ).join(
                Order, OrderItem.order_id == Order.order_id
            ).filter(
                Order.order_datetime >= from_datetime,
                Order.order_datetime <= to_datetime
            ).group_by(
                Product.product_id, Product.name
            ).order_by(
                func.sum(OrderItem.quantity).desc()
            ).limit(10).all()
            
            self.top_products_table.setRowCount(len(product_sales))
            for row, (name, quantity, revenue) in enumerate(product_sales):
                self.top_products_table.setItem(row, 0, QTableWidgetItem(name))
                self.top_products_table.setItem(row, 1, QTableWidgetItem(str(int(quantity))))
                self.top_products_table.setItem(row, 2, QTableWidgetItem(f"${revenue:,.2f}"))
                avg_price = revenue / quantity if quantity > 0 else 0
                self.top_products_table.setItem(row, 3, QTableWidgetItem(f"${avg_price:.2f}"))
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading analytics: {e}")
            QMessageBox.critical(self, "Error", f"Failed to load analytics: {str(e)}")

