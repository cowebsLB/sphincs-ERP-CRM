"""
Manufacturing Module
Production scheduling, raw materials, finished goods, quality control
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QTabWidget, QFrame
)
from PyQt6.QtCore import Qt
from loguru import logger
from src.database.connection import get_db_session


class ManufacturingView(QWidget):
    """Manufacturing Management View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
    
    def setup_ui(self):
        """Setup manufacturing UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        title = QLabel("Manufacturing Management")
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
        
        # Production Schedule tab
        production_tab = self.create_production_tab()
        self.tabs.addTab(production_tab, "🏭 Production Schedule")
        
        # Raw Materials tab
        materials_tab = self.create_materials_tab()
        self.tabs.addTab(materials_tab, "📦 Raw Materials")
        
        # Finished Goods tab
        finished_tab = self.create_finished_goods_tab()
        self.tabs.addTab(finished_tab, "✅ Finished Goods")
        
        # Quality Control tab
        quality_tab = self.create_quality_tab()
        self.tabs.addTab(quality_tab, "🔍 Quality Control")
        
        # Demand Forecasting tab
        forecasting_tab = self.create_forecasting_tab()
        self.tabs.addTab(forecasting_tab, "📊 Demand Forecasting")
        
        layout.addWidget(self.tabs)
    
    def create_production_tab(self):
        """Create production schedule tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 24, 24, 24)
        
        # Summary cards
        cards_layout = QHBoxLayout()
        cards_layout.setSpacing(16)
        
        cards = [
            ("Active Orders", "0", "#2F7DFF"),
            ("In Production", "0", "#14B8A6"),
            ("Completed Today", "0", "#F59E0B"),
            ("On-Time Rate", "0%", "#D92D20")
        ]
        
        for title, value, color in cards:
            card = self.create_summary_card(title, value, color)
            cards_layout.addWidget(card)
        
        layout.addLayout(cards_layout)
        layout.addSpacing(24)
        
        # Production schedule table
        self.production_table = QTableWidget()
        self.production_table.setColumnCount(7)
        self.production_table.setHorizontalHeaderLabels([
            "Order ID", "Product", "Quantity", "Start Date", "End Date", "Status", "Line"
        ])
        self.production_table.horizontalHeader().setStretchLastSection(True)
        self.production_table.setStyleSheet("""
            QTableWidget {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background-color: white;
            }
        """)
        layout.addWidget(self.production_table)
        
        layout.addStretch()
        return widget
    
    def create_materials_tab(self):
        """Create raw materials inventory tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 24, 24, 24)
        
        self.materials_table = QTableWidget()
        self.materials_table.setColumnCount(6)
        self.materials_table.setHorizontalHeaderLabels([
            "Material", "Category", "Quantity", "Unit", "Supplier", "Status"
        ])
        self.materials_table.horizontalHeader().setStretchLastSection(True)
        self.materials_table.setStyleSheet("""
            QTableWidget {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background-color: white;
            }
        """)
        layout.addWidget(self.materials_table)
        
        layout.addStretch()
        return widget
    
    def create_finished_goods_tab(self):
        """Create finished goods inventory tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 24, 24, 24)
        
        self.finished_goods_table = QTableWidget()
        self.finished_goods_table.setColumnCount(6)
        self.finished_goods_table.setHorizontalHeaderLabels([
            "Product", "SKU", "Quantity", "Location", "Last Produced", "Status"
        ])
        self.finished_goods_table.horizontalHeader().setStretchLastSection(True)
        self.finished_goods_table.setStyleSheet("""
            QTableWidget {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background-color: white;
            }
        """)
        layout.addWidget(self.finished_goods_table)
        
        layout.addStretch()
        return widget
    
    def create_quality_tab(self):
        """Create quality control tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 24, 24, 24)
        
        self.quality_table = QTableWidget()
        self.quality_table.setColumnCount(7)
        self.quality_table.setHorizontalHeaderLabels([
            "Batch ID", "Product", "Test Date", "Inspector", "Result", "Defects", "Status"
        ])
        self.quality_table.horizontalHeader().setStretchLastSection(True)
        self.quality_table.setStyleSheet("""
            QTableWidget {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background-color: white;
            }
        """)
        layout.addWidget(self.quality_table)
        
        layout.addStretch()
        return widget
    
    def create_forecasting_tab(self):
        """Create demand forecasting tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 24, 24, 24)
        
        self.forecasting_table = QTableWidget()
        self.forecasting_table.setColumnCount(6)
        self.forecasting_table.setHorizontalHeaderLabels([
            "Product", "Current Stock", "Predicted Demand", "Recommended Production", "Priority", "Action"
        ])
        self.forecasting_table.horizontalHeader().setStretchLastSection(True)
        self.forecasting_table.setStyleSheet("""
            QTableWidget {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background-color: white;
            }
        """)
        layout.addWidget(self.forecasting_table)
        
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

