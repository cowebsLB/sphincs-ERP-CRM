"""
Sales Reports Module - Basic Sales Reports View
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QComboBox, QDateEdit, QFrame, QTabWidget
)
from PyQt6.QtCore import Qt, QDate, QTimer
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import Order, OrderItem, Product
from datetime import datetime, timedelta
from src.gui.design_system import (
    CARD_STYLE,
    DATA_TABLE_STYLE,
    FILTER_COMBO_STYLE,
    PRIMARY_BUTTON_STYLE,
    TAB_WIDGET_STYLE,
    TOOLBAR_CARD_STYLE,
)
from src.gui.sales_analytics import SalesAnalyticsView
from src.gui.custom_reports_builder import CustomReportsBuilderView
from src.gui.table_utils import enable_table_auto_resize


class SalesReportsView(QWidget):
    """Sales Reports View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        # Delay data loading to ensure widgets are fully initialized
        QTimer.singleShot(100, self.load_sales_data)
    
    def setup_ui(self):
        """Setup sales reports UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header spacing row
        header_layout = QHBoxLayout()
        header_layout.addStretch()
        
        layout.addLayout(header_layout)
        layout.addSpacing(12)
        
        # Tabs
        self.tabs = QTabWidget()
        self.tabs.setStyleSheet(TAB_WIDGET_STYLE)
        
        # Basic Reports tab
        reports_widget = self.create_reports_widget()
        self.tabs.addTab(reports_widget, "Basic Reports")
        
        # Analytics tab
        analytics_view = SalesAnalyticsView(self.user_id)
        self.tabs.addTab(analytics_view, "Analytics & Heatmaps")
        
        # Custom Reports Builder tab
        custom_reports_view = CustomReportsBuilderView(self.user_id)
        self.tabs.addTab(custom_reports_view, "Custom Reports Builder")
        
        # Cross-Branch Reporting tab
        from src.gui.cross_branch_reporting import CrossBranchReportingView
        cross_branch_view = CrossBranchReportingView(self.user_id)
        self.tabs.addTab(cross_branch_view, "Cross-Branch Reports")
        
        layout.addWidget(self.tabs)
    
    def create_reports_widget(self) -> QWidget:
        """Create basic reports widget"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(0)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Date range filter
        filter_card = QFrame()
        filter_card.setStyleSheet(TOOLBAR_CARD_STYLE)
        filter_layout = QHBoxLayout(filter_card)
        filter_layout.setContentsMargins(14, 10, 14, 10)
        filter_layout.setSpacing(12)
        
        filter_label = QLabel("Date Range:")
        filter_label.setStyleSheet("""
            color: #2A3A55;
            font-size: 14px;
            font-weight: 500;
        """)
        filter_layout.addWidget(filter_label)
        
        # From date
        self.from_date = QDateEdit()
        self.from_date.setDate(QDate.currentDate().addDays(-7))  # Last 7 days
        self.from_date.setCalendarPopup(True)
        self.from_date.setStyleSheet(FILTER_COMBO_STYLE)
        filter_layout.addWidget(self.from_date)
        
        to_label = QLabel("to")
        filter_layout.addWidget(to_label)
        
        # To date
        self.to_date = QDateEdit()
        self.to_date.setDate(QDate.currentDate())
        self.to_date.setCalendarPopup(True)
        self.to_date.setStyleSheet(FILTER_COMBO_STYLE)
        filter_layout.addWidget(self.to_date)
        
        # Refresh button
        refresh_btn = QPushButton("Refresh")
        refresh_btn.setStyleSheet(PRIMARY_BUTTON_STYLE)
        refresh_btn.clicked.connect(self.load_sales_data)
        filter_layout.addWidget(refresh_btn)
        
        filter_layout.addStretch()
        layout.addWidget(filter_card)
        layout.addSpacing(16)
        
        # Summary cards
        summary_layout = QHBoxLayout()
        summary_layout.setSpacing(16)
        
        self.total_sales_card = self.create_summary_card("Total Sales", "$0.00")
        self.total_transactions_card = self.create_summary_card("Transactions", "0")
        self.avg_transaction_card = self.create_summary_card("Avg Transaction", "$0.00")
        
        summary_layout.addWidget(self.total_sales_card)
        summary_layout.addWidget(self.total_transactions_card)
        summary_layout.addWidget(self.avg_transaction_card)
        summary_layout.addStretch()
        
        layout.addLayout(summary_layout)
        layout.addSpacing(16)
        
        # Sales table
        table_label = QLabel("Recent Transactions")
        table_label.setStyleSheet("font-size: 18px; font-weight: 700;")
        layout.addWidget(table_label)
        
        self.sales_table = QTableWidget()
        self.sales_table.setColumnCount(5)
        self.sales_table.setHorizontalHeaderLabels([
            "Transaction ID", "Date", "Total", "Payment Method", "Items"
        ])
        
        self.sales_table.setStyleSheet(DATA_TABLE_STYLE)
        enable_table_auto_resize(self.sales_table)
        self.sales_table.setAlternatingRowColors(True)
        self.sales_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.sales_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        
        layout.addWidget(self.sales_table)
    
    def create_summary_card(self, title: str, value: str) -> QFrame:
        """Create a summary card"""
        card = QFrame()
        card.setStyleSheet(CARD_STYLE)
        card.setFixedWidth(200)
        
        layout = QVBoxLayout(card)
        layout.setSpacing(8)
        
        title_label = QLabel(title)
        title_label.setStyleSheet("color: #9AAFD3; font-size: 13px; font-weight: 600;")
        layout.addWidget(title_label)
        
        value_label = QLabel(value)
        value_label.setStyleSheet("font-size: 26px; font-weight: 700;")
        layout.addWidget(value_label)
        
        layout.addStretch()
        return card
    
    def load_sales_data(self):
        """Load sales data from database"""
        # Check if widgets exist and are valid
        try:
            if not hasattr(self, 'from_date') or not hasattr(self, 'to_date'):
                return
            # Try to access widgets to check if they're still valid
            _ = self.from_date.isVisible()
            _ = self.to_date.isVisible()
        except (RuntimeError, AttributeError):
            # Widgets deleted or not yet created
            logger.debug("Date widgets not available, skipping data load")
            return
        
        db = get_db_session()
        try:
            # Safely get dates from widgets
            try:
                from_date = self.from_date.date().toPyDate()
                to_date = self.to_date.date().toPyDate()
            except RuntimeError:
                logger.debug("Date widgets deleted, skipping data load")
                return
            
            # Get orders in date range
            # Convert dates to datetime for comparison with order_datetime
            from_datetime = datetime.combine(from_date, datetime.min.time())
            to_datetime = datetime.combine(to_date, datetime.max.time())
            
            orders = db.query(Order).filter(
                Order.order_datetime >= from_datetime,
                Order.order_datetime <= to_datetime
            ).all()
            
            # Calculate summary
            total_sales = sum(o.total_amount for o in orders)
            total_transactions = len(orders)
            avg_transaction = total_sales / total_transactions if total_transactions > 0 else 0
            
            # Update summary cards (find value labels - they're the second QLabel in each card)
            try:
                cards = [self.total_sales_card, self.total_transactions_card, self.avg_transaction_card]
                values = [f"${total_sales:.2f}", str(total_transactions), f"${avg_transaction:.2f}"]
                for card, value in zip(cards, values):
                    if card is None:
                        continue
                    try:
                        labels = card.findChildren(QLabel)
                        if len(labels) >= 2:
                            labels[1].setText(value)
                    except RuntimeError:
                        # Card widget deleted
                        continue
            except (AttributeError, RuntimeError):
                # Cards not available
                pass
            
            # Display orders
            try:
                if hasattr(self, 'sales_table') and self.sales_table:
                    self.sales_table.setRowCount(len(orders))
                    for row, order in enumerate(orders):
                        # Get item count
                        item_count = db.query(OrderItem).filter(
                            OrderItem.order_id == order.order_id
                        ).count()
                        
                        self.sales_table.setItem(row, 0, QTableWidgetItem(str(order.order_id)))
                        self.sales_table.setItem(row, 1, QTableWidgetItem(order.order_datetime.strftime("%Y-%m-%d %H:%M")))
                        self.sales_table.setItem(row, 2, QTableWidgetItem(f"${order.total_amount:.2f}"))
                        self.sales_table.setItem(row, 3, QTableWidgetItem(order.payment_method or "-"))
                        self.sales_table.setItem(row, 4, QTableWidgetItem(str(item_count)))
            except (AttributeError, RuntimeError):
                # Table widget not available
                pass
            
            logger.info(f"Loaded {len(orders)} orders")
            
        except RuntimeError:
            # Widget deleted, ignore
            logger.debug("Widgets deleted during data load")
        except Exception as e:
            logger.error(f"Error loading sales data: {e}")
        finally:
            db.close()

