"""
Predictive Analytics View - Inventory forecasting and demand prediction
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QComboBox, QMessageBox
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QColor
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import Ingredient
from src.utils.predictive_analytics import PredictiveAnalytics


class PredictiveAnalyticsView(QWidget):
    """Predictive Analytics View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.analytics = PredictiveAnalytics()
        self.setup_ui()
        self.load_predictions()
    
    def setup_ui(self):
        """Setup predictive analytics UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        
        title = QLabel("Predictive Analytics - Inventory Forecasting")
        title.setStyleSheet("""
            color: #162640;
            font-size: 24px;
            font-weight: 700;
        """)
        header_layout.addWidget(title)
        header_layout.addStretch()
        
        # Forecast period
        header_layout.addWidget(QLabel("Forecast Period:"))
        self.period_combo = QComboBox()
        self.period_combo.addItems(["7 days", "14 days", "30 days", "60 days", "90 days"])
        self.period_combo.setCurrentText("30 days")
        self.period_combo.currentTextChanged.connect(self.load_predictions)
        header_layout.addWidget(self.period_combo)
        
        # Refresh button
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
        refresh_btn.clicked.connect(self.load_predictions)
        header_layout.addWidget(refresh_btn)
        
        layout.addLayout(header_layout)
        layout.addSpacing(24)
        
        # Info label
        info_label = QLabel("Predictions based on historical usage patterns. Low confidence indicates insufficient data.")
        info_label.setStyleSheet("""
            color: #5D6F8B;
            font-size: 12px;
            padding: 12px;
            background-color: #EDF3FC;
            border-radius: 6px;
        """)
        layout.addWidget(info_label)
        layout.addSpacing(16)
        
        # Predictions table
        self.predictions_table = QTableWidget()
        self.predictions_table.setColumnCount(7)
        self.predictions_table.setHorizontalHeaderLabels([
            "Ingredient", "Current Stock", "Avg Daily Usage", "Predicted Usage",
            "Days Until Out", "Recommended Order", "Confidence"
        ])
        self.predictions_table.setStyleSheet("""
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
        self.predictions_table.horizontalHeader().setStretchLastSection(True)
        self.predictions_table.setAlternatingRowColors(True)
        layout.addWidget(self.predictions_table)
    
    def load_predictions(self):
        """Load predictions for all ingredients"""
        try:
            period_text = self.period_combo.currentText()
            days_ahead = int(period_text.split()[0])
            
            db = get_db_session()
            ingredients = db.query(Ingredient).all()
            
            predictions_data = []
            for ingredient in ingredients:
                prediction = self.analytics.predict_inventory_demand(
                    ingredient.ingredient_id, days_ahead
                )
                predictions_data.append({
                    'ingredient': ingredient,
                    'prediction': prediction
                })
            
            # Sort by days until out of stock
            predictions_data.sort(key=lambda x: x['prediction']['days_until_out_of_stock'])
            
            self.predictions_table.setRowCount(len(predictions_data))
            for row, data in enumerate(predictions_data):
                ingredient = data['ingredient']
                pred = data['prediction']
                
                self.predictions_table.setItem(row, 0, QTableWidgetItem(ingredient.name))
                self.predictions_table.setItem(row, 1, QTableWidgetItem(f"{pred['current_stock']:.2f} {ingredient.unit}"))
                self.predictions_table.setItem(row, 2, QTableWidgetItem(f"{pred['avg_daily_usage']:.2f} {ingredient.unit}"))
                self.predictions_table.setItem(row, 3, QTableWidgetItem(f"{pred['predicted_usage']:.2f} {ingredient.unit}"))
                
                days_item = QTableWidgetItem(str(pred['days_until_out_of_stock']))
                if pred['days_until_out_of_stock'] < days_ahead:
                    days_item.setForeground(QColor("#D92D20"))  # Red for urgent
                elif pred['days_until_out_of_stock'] < days_ahead * 1.5:
                    days_item.setForeground(QColor("#F59E0B"))  # Orange for warning
                self.predictions_table.setItem(row, 4, days_item)
                
                self.predictions_table.setItem(row, 5, QTableWidgetItem(f"{pred['recommended_order_quantity']:.2f} {ingredient.unit}"))
                
                confidence_item = QTableWidgetItem(pred['confidence_level'])
                if pred['confidence_level'] == "High":
                    confidence_item.setForeground(QColor("#14B8A6"))  # Green
                elif pred['confidence_level'] == "Medium":
                    confidence_item.setForeground(QColor("#F59E0B"))  # Orange
                else:
                    confidence_item.setForeground(QColor("#5D6F8B"))  # Gray
                self.predictions_table.setItem(row, 6, confidence_item)
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading predictions: {e}")
            QMessageBox.critical(self, "Error", f"Failed to load predictions: {str(e)}")

