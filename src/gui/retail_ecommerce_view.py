"""
Retail & E-Commerce Module
E-commerce platform integration, online sales, warehouse tracking

Documentation:
- docs/INDEX.md
- docs/erp/module-map.md
- docs/erp/uiux-audit-baseline.md
- docs/erp/worklog.md
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QTabWidget, QFrame, QMessageBox
)
from PyQt6.QtCore import Qt
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import Order, Product, Inventory, Customer


class RetailECommerceView(QWidget):
    """Retail & E-Commerce Management View"""

    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()

    def setup_ui(self):
        """Setup retail & e-commerce UI"""
        self.setObjectName("retailRoot")
        self.setStyleSheet("""
            QWidget#retailRoot {
                background-color: #F8FAFC;
                color: #12203A;
            }
            QLabel {
                color: #12203A;
            }
        """)

        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)

        # Header
        header_layout = QHBoxLayout()
        title = QLabel("Retail & E-Commerce")
        title.setStyleSheet("""
            color: #162640;
            font-size: 24px;
            font-weight: 700;
        """)
        header_layout.addWidget(title)
        header_layout.addStretch()
        layout.addLayout(header_layout)
        layout.addSpacing(24)

        # Tabs
        self.tabs = QTabWidget()
        self.tabs.setStyleSheet("""
            QTabWidget::pane {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background-color: white;
            }
            QTabBar::tab {
                background-color: #EDF3FC;
                color: #243754;
                padding: 10px 20px;
                margin-right: 2px;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
            }
            QTabBar::tab:selected {
                background-color: white;
                color: #2F7DFF;
                font-weight: 600;
            }
        """)

        # Online Sales tab
        online_sales_tab = self.create_online_sales_tab()
        self.tabs.addTab(online_sales_tab, "OS Online Sales")

        # E-Commerce Platforms tab
        platforms_tab = self.create_platforms_tab()
        self.tabs.addTab(platforms_tab, "EP E-Commerce Platforms")

        # Warehouse Tracking tab
        warehouse_tab = self.create_warehouse_tab()
        self.tabs.addTab(warehouse_tab, "WH Warehouse Tracking")

        # Predictive Restocking tab
        restocking_tab = self.create_restocking_tab()
        self.tabs.addTab(restocking_tab, "PR Predictive Restocking")

        layout.addWidget(self.tabs)

    def create_online_sales_tab(self):
        """Create online sales tracking tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 24, 24, 24)

        # Summary cards
        cards_layout = QHBoxLayout()
        cards_layout.setSpacing(16)

        cards = [
            ("Total Online Sales", "$0.00", "#2F7DFF"),
            ("Orders Today", "0", "#14B8A6"),
            ("Avg Order Value", "$0.00", "#F59E0B"),
            ("Conversion Rate", "0%", "#D92D20")
        ]

        for title, value, color in cards:
            card = self.create_summary_card(title, value, color)
            cards_layout.addWidget(card)

        layout.addLayout(cards_layout)
        layout.addSpacing(24)

        # Online orders table
        table_label = QLabel("Recent Online Orders")
        table_label.setStyleSheet("""
            color: #162640;
            font-size: 18px;
            font-weight: 600;
        """)
        layout.addWidget(table_label)

        self.online_orders_table = QTableWidget()
        self.online_orders_table.setColumnCount(6)
        self.online_orders_table.setHorizontalHeaderLabels([
            "Order ID", "Date", "Customer", "Platform", "Amount", "Status"
        ])
        self.online_orders_table.horizontalHeader().setStretchLastSection(True)
        self.online_orders_table.setStyleSheet(self._table_style())
        layout.addWidget(self.online_orders_table)

        layout.addStretch()
        return widget

    def create_platforms_tab(self):
        """Create e-commerce platforms integration tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 24, 24, 24)

        info_label = QLabel("E-Commerce Platform Integrations")
        info_label.setStyleSheet("""
            color: #162640;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
        """)
        layout.addWidget(info_label)

        platforms = [
            ("Shopify", "Connect your Shopify store", "#95BF47"),
            ("WooCommerce", "Integrate WooCommerce", "#96588A"),
            ("Magento", "Sync with Magento", "#EC6737"),
            ("Amazon", "Amazon marketplace sync", "#FF9900")
        ]

        for platform_name, description, color in platforms:
            platform_card = QFrame()
            platform_card.setStyleSheet(f"""
                QFrame {{
                    background-color: white;
                    border: 2px solid #C8D4E8;
                    border-radius: 8px;
                    padding: 16px;
                }}
            """)
            card_layout = QHBoxLayout(platform_card)

            info_layout = QVBoxLayout()
            name_label = QLabel(platform_name)
            name_label.setStyleSheet("""
                color: #162640;
                font-size: 16px;
                font-weight: 600;
            """)
            desc_label = QLabel(description)
            desc_label.setStyleSheet("""
                color: #5D6F8B;
                font-size: 14px;
            """)
            info_layout.addWidget(name_label)
            info_layout.addWidget(desc_label)

            card_layout.addLayout(info_layout)
            card_layout.addStretch()

            connect_btn = QPushButton("Connect")
            connect_btn.setStyleSheet(f"""
                QPushButton {{
                    background-color: {color};
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 8px 16px;
                    font-weight: 600;
                }}
                QPushButton:hover {{
                    opacity: 0.9;
                }}
            """)
            card_layout.addWidget(connect_btn)

            layout.addWidget(platform_card)
            layout.addSpacing(12)

        layout.addStretch()
        return widget

    def create_warehouse_tab(self):
        """Create warehouse tracking tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 24, 24, 24)

        table_label = QLabel("Warehouse Inventory")
        table_label.setStyleSheet("""
            color: #162640;
            font-size: 18px;
            font-weight: 600;
        """)
        layout.addWidget(table_label)

        self.warehouse_table = QTableWidget()
        self.warehouse_table.setColumnCount(5)
        self.warehouse_table.setHorizontalHeaderLabels([
            "Product", "Warehouse", "Quantity", "Reserved", "Available"
        ])
        self.warehouse_table.horizontalHeader().setStretchLastSection(True)
        self.warehouse_table.setStyleSheet(self._table_style())
        layout.addWidget(self.warehouse_table)

        layout.addStretch()
        return widget

    def create_restocking_tab(self):
        """Create predictive restocking tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 24, 24, 24)

        table_label = QLabel("Predictive Restocking Recommendations")
        table_label.setStyleSheet("""
            color: #162640;
            font-size: 18px;
            font-weight: 600;
        """)
        layout.addWidget(table_label)

        self.restocking_table = QTableWidget()
        self.restocking_table.setColumnCount(6)
        self.restocking_table.setHorizontalHeaderLabels([
            "Product", "Current Stock", "Predicted Demand", "Recommended Qty", "Priority", "Action"
        ])
        self.restocking_table.horizontalHeader().setStretchLastSection(True)
        self.restocking_table.setStyleSheet(self._table_style())
        layout.addWidget(self.restocking_table)

        layout.addStretch()
        return widget

    def create_summary_card(self, title: str, value: str, color: str):
        """Create a summary card"""
        card = QFrame()
        card.setStyleSheet(f"""
            QFrame {{
                background-color: white;
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                padding: 20px;
            }}
        """)
        card.setFixedHeight(120)

        layout = QVBoxLayout(card)
        title_label = QLabel(title)
        title_label.setStyleSheet("""
            color: #5D6F8B;
            font-size: 14px;
            font-weight: 500;
        """)
        value_label = QLabel(value)
        value_label.setStyleSheet(f"""
            color: {color};
            font-size: 28px;
            font-weight: 700;
        """)
        layout.addWidget(title_label)
        layout.addWidget(value_label)
        layout.addStretch()

        return card

    @staticmethod
    def _table_style() -> str:
        """Shared high-contrast table style for light cards."""
        return """
            QTableWidget {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background-color: white;
                color: #162640;
                gridline-color: #C8D4E8;
                selection-background-color: #DDEAFF;
                selection-color: #12203A;
                alternate-background-color: #F8FAFC;
            }
            QHeaderView::section {
                background-color: #EDF3FC;
                color: #162640;
                padding: 10px;
                border: none;
                border-bottom: 1px solid #C8D4E8;
                font-weight: 600;
            }
            QTableCornerButton::section {
                background-color: #EDF3FC;
                border: none;
                border-bottom: 1px solid #C8D4E8;
            }
        """
