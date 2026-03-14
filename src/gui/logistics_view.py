"""
Logistics / Delivery / Fleet Management Module
Vehicle tracking, routing, warehouse inventory, driver management
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QTabWidget, QFrame
)
from PyQt6.QtCore import Qt
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import DeliveryVehicle, DeliveryAssignment


class LogisticsView(QWidget):
    """Logistics & Fleet Management View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
    
    def setup_ui(self):
        """Setup logistics UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        title = QLabel("Logistics & Fleet Management")
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
                color: #2A3A55;
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
        
        # Fleet Management tab
        fleet_tab = self.create_fleet_tab()
        self.tabs.addTab(fleet_tab, "🚚 Fleet Management")
        
        # Delivery Tracking tab
        tracking_tab = self.create_tracking_tab()
        self.tabs.addTab(tracking_tab, "📍 Delivery Tracking")
        
        # Routing tab
        routing_tab = self.create_routing_tab()
        self.tabs.addTab(routing_tab, "🗺️ Routing & Optimization")
        
        # Warehouse Inventory tab
        warehouse_tab = self.create_warehouse_tab()
        self.tabs.addTab(warehouse_tab, "📦 Warehouse Inventory")
        
        # Drivers tab
        drivers_tab = self.create_drivers_tab()
        self.tabs.addTab(drivers_tab, "👤 Drivers & Shifts")
        
        layout.addWidget(self.tabs)
    
    def create_fleet_tab(self):
        """Create fleet management tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 24, 24, 24)
        
        # Summary cards
        cards_layout = QHBoxLayout()
        cards_layout.setSpacing(16)
        
        cards = [
            ("Total Vehicles", "0", "#2F7DFF"),
            ("In Use", "0", "#14B8A6"),
            ("Available", "0", "#F59E0B"),
            ("Maintenance", "0", "#D92D20")
        ]
        
        for title, value, color in cards:
            card = self.create_summary_card(title, value, color)
            cards_layout.addWidget(card)
        
        layout.addLayout(cards_layout)
        layout.addSpacing(24)
        
        # Vehicles table
        self.vehicles_table = QTableWidget()
        self.vehicles_table.setColumnCount(6)
        self.vehicles_table.setHorizontalHeaderLabels([
            "Vehicle ID", "Name", "License Plate", "Capacity", "Status", "Last Service"
        ])
        self.vehicles_table.horizontalHeader().setStretchLastSection(True)
        self.vehicles_table.setStyleSheet("""
            QTableWidget {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background-color: white;
            }
        """)
        layout.addWidget(self.vehicles_table)
        
        layout.addStretch()
        return widget
    
    def create_tracking_tab(self):
        """Create delivery tracking tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 24, 24, 24)
        
        self.deliveries_table = QTableWidget()
        self.deliveries_table.setColumnCount(7)
        self.deliveries_table.setHorizontalHeaderLabels([
            "Order ID", "Customer", "Driver", "Vehicle", "Status", "ETA", "Location"
        ])
        self.deliveries_table.horizontalHeader().setStretchLastSection(True)
        self.deliveries_table.setStyleSheet("""
            QTableWidget {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background-color: white;
            }
        """)
        layout.addWidget(self.deliveries_table)
        
        layout.addStretch()
        return widget
    
    def create_routing_tab(self):
        """Create routing & optimization tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 24, 24, 24)
        
        self.routes_table = QTableWidget()
        self.routes_table.setColumnCount(6)
        self.routes_table.setHorizontalHeaderLabels([
            "Route ID", "Driver", "Stops", "Distance", "Estimated Time", "Status"
        ])
        self.routes_table.horizontalHeader().setStretchLastSection(True)
        self.routes_table.setStyleSheet("""
            QTableWidget {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background-color: white;
            }
        """)
        layout.addWidget(self.routes_table)
        
        layout.addStretch()
        return widget
    
    def create_warehouse_tab(self):
        """Create warehouse inventory tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 24, 24, 24)
        
        self.warehouse_table = QTableWidget()
        self.warehouse_table.setColumnCount(6)
        self.warehouse_table.setHorizontalHeaderLabels([
            "Product", "Warehouse", "Quantity", "Reserved", "Available", "Location"
        ])
        self.warehouse_table.horizontalHeader().setStretchLastSection(True)
        self.warehouse_table.setStyleSheet("""
            QTableWidget {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background-color: white;
            }
        """)
        layout.addWidget(self.warehouse_table)
        
        layout.addStretch()
        return widget
    
    def create_drivers_tab(self):
        """Create drivers & shifts tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 24, 24, 24)
        
        self.drivers_table = QTableWidget()
        self.drivers_table.setColumnCount(6)
        self.drivers_table.setHorizontalHeaderLabels([
            "Driver", "Vehicle", "Shift", "Deliveries Today", "Status", "Location"
        ])
        self.drivers_table.horizontalHeader().setStretchLastSection(True)
        self.drivers_table.setStyleSheet("""
            QTableWidget {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background-color: white;
            }
        """)
        layout.addWidget(self.drivers_table)
        
        layout.addStretch()
        return widget
    
    def create_summary_card(self, title: str, value: str, color: str):
        """Create a summary card"""
        card = QFrame()
        card.setStyleSheet("""
            QFrame {
                background-color: white;
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                padding: 20px;
            }
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

