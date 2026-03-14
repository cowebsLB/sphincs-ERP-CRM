"""
Waste Analysis Dashboard - Track and analyze waste/spoilage
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QDialog, QComboBox,
    QDateEdit, QMessageBox, QFormLayout, QDoubleSpinBox, QTextEdit
)
from PyQt6.QtCore import Qt, QDate
from PyQt6.QtGui import QColor
from loguru import logger
from datetime import date, timedelta, datetime
from src.database.connection import get_db_session
from src.database.models import Waste, Ingredient, Staff
from sqlalchemy import func


class WasteAnalysisView(QWidget):
    """Waste Analysis Dashboard"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        self.load_waste_data()
        self.load_summary()
    
    def setup_ui(self):
        """Setup waste analysis UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        
        title = QLabel("Waste Analysis")
        title.setStyleSheet("""
            color: #162640;
            font-size: 24px;
            font-weight: 700;
        """)
        header_layout.addWidget(title)
        header_layout.addStretch()
        
        # Add Waste Record button
        add_btn = QPushButton("Record Waste")
        add_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
                font-size: 14px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #1D66EA;
            }
        """)
        add_btn.clicked.connect(self.handle_add_waste)
        header_layout.addWidget(add_btn)
        
        layout.addLayout(header_layout)
        layout.addSpacing(24)
        
        # Summary cards
        summary_layout = QHBoxLayout()
        summary_layout.setSpacing(16)
        
        self.total_waste_card = self.create_summary_card("Total Waste (This Month)", "$0.00")
        self.waste_count_card = self.create_summary_card("Waste Records", "0")
        self.top_wasted_card = self.create_summary_card("Most Wasted Item", "-")
        
        summary_layout.addWidget(self.total_waste_card)
        summary_layout.addWidget(self.waste_count_card)
        summary_layout.addWidget(self.top_wasted_card)
        
        layout.addLayout(summary_layout)
        layout.addSpacing(24)
        
        # Filters
        filter_layout = QHBoxLayout()
        filter_layout.setSpacing(12)
        
        filter_layout.addWidget(QLabel("From:"))
        self.from_date = QDateEdit()
        self.from_date.setDate(QDate.currentDate().addMonths(-1))
        self.from_date.setCalendarPopup(True)
        filter_layout.addWidget(self.from_date)
        
        filter_layout.addWidget(QLabel("To:"))
        self.to_date = QDateEdit()
        self.to_date.setDate(QDate.currentDate())
        self.to_date.setCalendarPopup(True)
        filter_layout.addWidget(self.to_date)
        
        filter_layout.addWidget(QLabel("Ingredient:"))
        self.ingredient_combo = QComboBox()
        self.ingredient_combo.addItem("All Ingredients")
        self.load_ingredients()
        filter_layout.addWidget(self.ingredient_combo)
        
        filter_btn = QPushButton("Filter")
        filter_btn.setStyleSheet("""
            QPushButton {
                background-color: #5D6F8B;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
            }
        """)
        filter_btn.clicked.connect(self.load_waste_data)
        filter_layout.addWidget(filter_btn)
        
        filter_layout.addStretch()
        layout.addLayout(filter_layout)
        layout.addSpacing(16)
        
        # Waste records table
        self.waste_table = QTableWidget()
        self.waste_table.setColumnCount(6)
        self.waste_table.setHorizontalHeaderLabels([
            "Date", "Ingredient", "Quantity", "Reason", "Recorded By", "Cost"
        ])
        self.waste_table.setStyleSheet("""
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
        self.waste_table.horizontalHeader().setStretchLastSection(True)
        self.waste_table.setAlternatingRowColors(True)
        layout.addWidget(self.waste_table)
    
    def create_summary_card(self, title: str, value: str) -> QWidget:
        """Create a summary card"""
        from PyQt6.QtWidgets import QFrame
        
        card = QFrame()
        card.setStyleSheet("""
            QFrame {
                background-color: white;
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                padding: 20px;
            }
        """)
        layout = QVBoxLayout(card)
        layout.setSpacing(8)
        
        title_label = QLabel(title)
        title_label.setStyleSheet("""
            color: #5D6F8B;
            font-size: 14px;
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
    
    def load_ingredients(self):
        """Load ingredients into combo"""
        try:
            db = get_db_session()
            ingredients = db.query(Ingredient).all()
            for ingredient in ingredients:
                self.ingredient_combo.addItem(ingredient.name, ingredient.ingredient_id)
            db.close()
        except Exception as e:
            logger.error(f"Error loading ingredients: {e}")
    
    def load_waste_data(self):
        """Load waste records"""
        try:
            db = get_db_session()
            from_date = self.from_date.date().toPyDate()
            to_date = self.to_date.date().toPyDate()
            
            query = db.query(Waste).filter(
                Waste.waste_datetime >= datetime.combine(from_date, datetime.min.time()),
                Waste.waste_datetime <= datetime.combine(to_date, datetime.max.time())
            )
            
            ingredient_filter = self.ingredient_combo.currentData()
            if ingredient_filter:
                query = query.filter(Waste.ingredient_id == ingredient_filter)
            
            waste_records = query.order_by(Waste.waste_datetime.desc()).all()
            
            self.waste_table.setRowCount(len(waste_records))
            total_cost = 0.0
            
            for row, waste in enumerate(waste_records):
                self.waste_table.setItem(row, 0, QTableWidgetItem(
                    waste.waste_datetime.strftime("%Y-%m-%d %H:%M")
                ))
                self.waste_table.setItem(row, 1, QTableWidgetItem(waste.ingredient.name))
                self.waste_table.setItem(row, 2, QTableWidgetItem(
                    f"{waste.quantity} {waste.ingredient.unit}"
                ))
                self.waste_table.setItem(row, 3, QTableWidgetItem(waste.reason or "-"))
                
                recorded_by = "-"
                if waste.recorded_by_staff:
                    recorded_by = f"{waste.recorded_by_staff.first_name} {waste.recorded_by_staff.last_name}"
                self.waste_table.setItem(row, 4, QTableWidgetItem(recorded_by))
                
                # Calculate cost
                cost = 0.0
                if waste.ingredient.cost_per_unit:
                    cost = waste.quantity * waste.ingredient.cost_per_unit
                    total_cost += cost
                
                cost_item = QTableWidgetItem(f"${cost:.2f}")
                cost_item.setForeground(QColor("#D92D20"))
                self.waste_table.setItem(row, 5, cost_item)
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading waste data: {e}")
            QMessageBox.critical(self, "Error", f"Failed to load waste data: {str(e)}")
    
    def load_summary(self):
        """Load waste summary statistics"""
        try:
            db = get_db_session()
            today = date.today()
            month_start = date(today.year, today.month, 1)
            
            # Total waste cost this month
            waste_records = db.query(Waste).filter(
                Waste.waste_datetime >= datetime.combine(month_start, datetime.min.time())
            ).all()
            
            total_cost = 0.0
            for waste in waste_records:
                if waste.ingredient.cost_per_unit:
                    total_cost += waste.quantity * waste.ingredient.cost_per_unit
            
            # Most wasted ingredient
            top_wasted = db.query(
                Ingredient.name,
                func.sum(Waste.quantity).label('total_quantity')
            ).join(
                Waste, Ingredient.ingredient_id == Waste.ingredient_id
            ).filter(
                Waste.waste_datetime >= datetime.combine(month_start, datetime.min.time())
            ).group_by(
                Ingredient.ingredient_id, Ingredient.name
            ).order_by(
                func.sum(Waste.quantity).desc()
            ).first()
            
            # Update cards
            labels = self.total_waste_card.findChildren(QLabel)
            if len(labels) >= 2:
                labels[1].setText(f"${total_cost:.2f}")
            
            labels = self.waste_count_card.findChildren(QLabel)
            if len(labels) >= 2:
                labels[1].setText(str(len(waste_records)))
            
            labels = self.top_wasted_card.findChildren(QLabel)
            if len(labels) >= 2:
                if top_wasted:
                    labels[1].setText(f"{top_wasted[0]} ({top_wasted[1]:.2f})")
                else:
                    labels[1].setText("-")
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading waste summary: {e}")
    
    def handle_add_waste(self):
        """Handle add waste record"""
        dialog = AddWasteDialog(self.user_id, self)
        if dialog.exec():
            self.load_waste_data()
            self.load_summary()


class AddWasteDialog(QDialog):
    """Dialog for adding waste record"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setWindowTitle("Record Waste")
        self.setMinimumSize(400, 300)
        self.setup_ui()
    
    def setup_ui(self):
        """Setup add waste UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(20, 20, 20, 20)
        
        form = QFormLayout()
        
        # Ingredient selection
        self.ingredient_combo = QComboBox()
        self.load_ingredients()
        form.addRow("Ingredient:", self.ingredient_combo)
        
        # Quantity
        self.quantity_input = QDoubleSpinBox()
        self.quantity_input.setMinimum(0.01)
        self.quantity_input.setMaximum(99999.99)
        self.quantity_input.setDecimals(2)
        self.quantity_input.setValue(1.0)
        form.addRow("Quantity:", self.quantity_input)
        
        # Reason
        self.reason_combo = QComboBox()
        self.reason_combo.setEditable(True)
        self.reason_combo.addItems([
            "spoilage", "overproduction", "damaged", "expired", "other"
        ])
        form.addRow("Reason:", self.reason_combo)
        
        # Notes
        self.notes_input = QTextEdit()
        self.notes_input.setMaximumHeight(80)
        form.addRow("Notes:", self.notes_input)
        
        layout.addLayout(form)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        save_btn = QPushButton("Save")
        save_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-weight: 600;
            }
        """)
        save_btn.clicked.connect(self.handle_save)
        buttons_layout.addWidget(save_btn)
        
        layout.addLayout(buttons_layout)
    
    def load_ingredients(self):
        """Load ingredients"""
        try:
            db = get_db_session()
            ingredients = db.query(Ingredient).all()
            for ingredient in ingredients:
                self.ingredient_combo.addItem(
                    f"{ingredient.name} ({ingredient.unit})",
                    ingredient.ingredient_id
                )
            db.close()
        except Exception as e:
            logger.error(f"Error loading ingredients: {e}")
    
    def handle_save(self):
        """Save waste record"""
        try:
            db = get_db_session()
            
            ingredient_id = self.ingredient_combo.currentData()
            if not ingredient_id:
                QMessageBox.warning(self, "Warning", "Please select an ingredient")
                return
            
            waste = Waste(
                ingredient_id=ingredient_id,
                quantity=self.quantity_input.value(),
                reason=self.reason_combo.currentText(),
                recorded_by=self.user_id
            )
            
            db.add(waste)
            db.commit()
            db.close()
            
            QMessageBox.information(self, "Success", "Waste record added successfully")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error saving waste record: {e}")
            QMessageBox.critical(self, "Error", f"Failed to save waste record: {str(e)}")

