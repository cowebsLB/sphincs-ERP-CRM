"""
Cross-Branch Reporting - Multi-location reporting and analytics
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QComboBox, QDateEdit, QMessageBox
)
from PyQt6.QtCore import Qt, QDate
from PyQt6.QtGui import QColor
from loguru import logger
from datetime import datetime
from src.database.connection import get_db_session
from src.database.models import Location, Order, OrderItem, Product


class CrossBranchReportingView(QWidget):
    """Cross-Branch Reporting View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        self.load_locations()
        self.generate_report()
    
    def setup_ui(self):
        """Setup cross-branch reporting UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        
        title = QLabel("Cross-Branch Reporting")
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
        filters_layout = QHBoxLayout()
        filters_layout.setSpacing(12)
        
        filters_layout.addWidget(QLabel("Location:"))
        self.location_combo = QComboBox()
        self.location_combo.addItem("All Locations")
        self.location_combo.currentTextChanged.connect(self.generate_report)
        filters_layout.addWidget(self.location_combo)
        
        filters_layout.addWidget(QLabel("From:"))
        self.from_date = QDateEdit()
        today = QDate.currentDate()
        self.from_date.setDate(today.addDays(-30))
        self.from_date.setCalendarPopup(True)
        self.from_date.dateChanged.connect(self.generate_report)
        filters_layout.addWidget(self.from_date)
        
        filters_layout.addWidget(QLabel("To:"))
        self.to_date = QDateEdit()
        self.to_date.setDate(today)
        self.to_date.setCalendarPopup(True)
        self.to_date.dateChanged.connect(self.generate_report)
        filters_layout.addWidget(self.to_date)
        
        filters_layout.addStretch()
        
        refresh_btn = QPushButton("Refresh")
        refresh_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
            }
        """)
        refresh_btn.clicked.connect(self.generate_report)
        filters_layout.addWidget(refresh_btn)
        
        layout.addLayout(filters_layout)
        layout.addSpacing(16)
        
        # Summary cards
        summary_layout = QHBoxLayout()
        summary_layout.setSpacing(16)
        
        self.total_sales_card = self.create_summary_card("Total Sales", "$0.00")
        summary_layout.addWidget(self.total_sales_card)
        
        self.total_orders_card = self.create_summary_card("Total Orders", "0")
        summary_layout.addWidget(self.total_orders_card)
        
        self.avg_order_card = self.create_summary_card("Avg Order Value", "$0.00")
        summary_layout.addWidget(self.avg_order_card)
        
        self.top_location_card = self.create_summary_card("Top Location", "-")
        summary_layout.addWidget(self.top_location_card)
        
        layout.addLayout(summary_layout)
        layout.addSpacing(24)
        
        # Report table
        self.report_table = QTableWidget()
        self.report_table.setColumnCount(6)
        self.report_table.setHorizontalHeaderLabels([
            "Location", "Total Sales", "Orders", "Avg Order Value", "Top Product", "Growth %"
        ])
        self.report_table.setStyleSheet("""
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
        self.report_table.horizontalHeader().setStretchLastSection(True)
        self.report_table.setAlternatingRowColors(True)
        layout.addWidget(self.report_table)
    
    def create_summary_card(self, title: str, value: str) -> QWidget:
        """Create summary card widget"""
        from PyQt6.QtWidgets import QFrame
        
        card = QFrame()
        card.setStyleSheet("""
            QFrame {
                background-color: white;
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                padding: 16px;
            }
        """)
        layout = QVBoxLayout(card)
        layout.setSpacing(8)
        
        title_label = QLabel(title)
        title_label.setStyleSheet("""
            color: #5D6F8B;
            font-size: 12px;
            font-weight: 500;
        """)
        layout.addWidget(title_label)
        
        value_label = QLabel(value)
        value_label.setStyleSheet("""
            color: #162640;
            font-size: 24px;
            font-weight: 700;
        """)
        layout.addWidget(value_label)
        
        return card
    
    def load_locations(self):
        """Load locations into combo box"""
        try:
            db = get_db_session()
            locations = db.query(Location).filter(Location.is_active == True).all()
            
            for location in locations:
                self.location_combo.addItem(location.name, location.location_id)
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading locations: {e}")
    
    def generate_report(self):
        """Generate cross-branch report"""
        try:
            from_date = self.from_date.date().toPyDate()
            to_date = self.to_date.date().toPyDate()
            from_datetime = datetime.combine(from_date, datetime.min.time())
            to_datetime = datetime.combine(to_date, datetime.max.time())
            
            db = get_db_session()
            
            # Get selected location
            location_id = self.location_combo.currentData()
            
            # Get all locations or selected one
            if location_id:
                locations = db.query(Location).filter(Location.location_id == location_id).all()
            else:
                locations = db.query(Location).filter(Location.is_active == True).all()
            
            report_data = []
            total_sales_all = 0.0
            total_orders_all = 0
            
            for location in locations:
                # Get orders for this location (simplified - would need location_id in Order model)
                # For now, we'll use a placeholder approach
                orders = db.query(Order).filter(
                    Order.order_datetime >= from_datetime,
                    Order.order_datetime <= to_datetime
                ).all()
                
                location_orders = orders  # In real implementation, filter by location_id
                location_sales = sum(order.total_amount for order in location_orders)
                order_count = len(location_orders)
                avg_order = location_sales / order_count if order_count > 0 else 0
                
                # Get top product for this location
                top_product = "-"
                if location_orders:
                    product_sales = {}
                    for order in location_orders:
                        for item in order.order_items:
                            if item.product:
                                product_sales[item.product.name] = product_sales.get(item.product.name, 0) + item.total_price
                    
                    if product_sales:
                        top_product = max(product_sales, key=product_sales.get)
                
                # Calculate growth (simplified - compare with previous period)
                growth = 0.0  # Would calculate based on previous period
                
                report_data.append({
                    'location': location.name,
                    'sales': location_sales,
                    'orders': order_count,
                    'avg_order': avg_order,
                    'top_product': top_product,
                    'growth': growth
                })
                
                total_sales_all += location_sales
                total_orders_all += order_count
            
            # Update summary cards
            self.total_sales_card.findChild(QLabel, None).setText(f"${total_sales_all:,.2f}")
            self.total_orders_card.findChild(QLabel, None).setText(str(total_orders_all))
            avg_order_all = total_sales_all / total_orders_all if total_orders_all > 0 else 0
            self.avg_order_card.findChild(QLabel, None).setText(f"${avg_order_all:,.2f}")
            
            if report_data:
                top_location = max(report_data, key=lambda x: x['sales'])
                self.top_location_card.findChild(QLabel, None).setText(top_location['location'])
            
            # Populate table
            self.report_table.setRowCount(len(report_data))
            for row, data in enumerate(report_data):
                self.report_table.setItem(row, 0, QTableWidgetItem(data['location']))
                self.report_table.setItem(row, 1, QTableWidgetItem(f"${data['sales']:,.2f}"))
                self.report_table.setItem(row, 2, QTableWidgetItem(str(data['orders'])))
                self.report_table.setItem(row, 3, QTableWidgetItem(f"${data['avg_order']:,.2f}"))
                self.report_table.setItem(row, 4, QTableWidgetItem(data['top_product']))
                
                growth_item = QTableWidgetItem(f"{data['growth']:+.1f}%")
                if data['growth'] > 0:
                    growth_item.setForeground(QColor("#14B8A6"))
                elif data['growth'] < 0:
                    growth_item.setForeground(QColor("#D92D20"))
                self.report_table.setItem(row, 5, growth_item)
            
            db.close()
            
        except Exception as e:
            logger.error(f"Error generating cross-branch report: {e}")
            QMessageBox.critical(self, "Error", f"Failed to generate report: {str(e)}")

