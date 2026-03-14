"""
Inventory Expiry Tracking - Track and alert on expiring inventory
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QDialog, QDateEdit,
    QMessageBox, QComboBox, QDoubleSpinBox, QLineEdit, QFormLayout, QSpinBox
)
from PyQt6.QtCore import Qt, QDate
from PyQt6.QtGui import QColor
from loguru import logger
from datetime import date, timedelta
from src.database.connection import get_db_session
from src.database.models import InventoryExpiry, Inventory, Ingredient


class InventoryExpiryView(QWidget):
    """Inventory Expiry Tracking View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        self.load_expiry_records()
    
    def setup_ui(self):
        """Setup expiry tracking UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        
        title = QLabel("Inventory Expiry Tracking")
        title.setStyleSheet("""
            color: #162640;
            font-size: 24px;
            font-weight: 700;
        """)
        header_layout.addWidget(title)
        header_layout.addStretch()
        
        # Add Expiry Record button
        add_btn = QPushButton("Add Expiry Record")
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
        add_btn.clicked.connect(self.handle_add_expiry)
        header_layout.addWidget(add_btn)
        
        layout.addLayout(header_layout)
        layout.addSpacing(24)
        
        # Filters
        filter_layout = QHBoxLayout()
        filter_layout.setSpacing(12)
        
        filter_layout.addWidget(QLabel("Filter:"))
        self.filter_combo = QComboBox()
        self.filter_combo.addItems([
            "All",
            "Expiring Soon (7 days)",
            "Expiring Soon (14 days)",
            "Expired",
            "Not Expired"
        ])
        self.filter_combo.currentTextChanged.connect(self.load_expiry_records)
        filter_layout.addWidget(self.filter_combo)
        
        filter_layout.addStretch()
        layout.addLayout(filter_layout)
        layout.addSpacing(16)
        
        # Expiry table
        self.expiry_table = QTableWidget()
        self.expiry_table.setColumnCount(7)
        self.expiry_table.setHorizontalHeaderLabels([
            "Ingredient", "Batch #", "Quantity", "Expiry Date", "Days Until", "Status", "Alert Days"
        ])
        self.expiry_table.setStyleSheet("""
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
        self.expiry_table.horizontalHeader().setStretchLastSection(True)
        self.expiry_table.setAlternatingRowColors(True)
        layout.addWidget(self.expiry_table)
    
    def load_expiry_records(self):
        """Load expiry records"""
        try:
            db = get_db_session()
            today = date.today()
            
            query = db.query(InventoryExpiry).join(Inventory).join(Ingredient)
            
            # Apply filter
            filter_text = self.filter_combo.currentText()
            if filter_text == "Expiring Soon (7 days)":
                expiry_date = today + timedelta(days=7)
                query = query.filter(
                    InventoryExpiry.expiry_date <= expiry_date,
                    InventoryExpiry.expiry_date >= today,
                    InventoryExpiry.is_expired == False
                )
            elif filter_text == "Expiring Soon (14 days)":
                expiry_date = today + timedelta(days=14)
                query = query.filter(
                    InventoryExpiry.expiry_date <= expiry_date,
                    InventoryExpiry.expiry_date >= today,
                    InventoryExpiry.is_expired == False
                )
            elif filter_text == "Expired":
                query = query.filter(InventoryExpiry.is_expired == True)
            elif filter_text == "Not Expired":
                query = query.filter(InventoryExpiry.is_expired == False)
            
            records = query.order_by(InventoryExpiry.expiry_date.asc()).all()
            
            self.expiry_table.setRowCount(len(records))
            for row, record in enumerate(records):
                ingredient_name = record.inventory.ingredient.name
                self.expiry_table.setItem(row, 0, QTableWidgetItem(ingredient_name))
                self.expiry_table.setItem(row, 1, QTableWidgetItem(record.batch_number or "-"))
                self.expiry_table.setItem(row, 2, QTableWidgetItem(f"{record.quantity} {record.inventory.unit}"))
                self.expiry_table.setItem(row, 3, QTableWidgetItem(record.expiry_date.strftime("%Y-%m-%d")))
                
                # Calculate days until expiry
                days_until = (record.expiry_date - today).days
                if days_until < 0:
                    days_str = f"Expired ({abs(days_until)} days ago)"
                elif days_until == 0:
                    days_str = "Expires Today"
                else:
                    days_str = f"{days_until} days"
                
                days_item = QTableWidgetItem(days_str)
                if days_until < 0:
                    days_item.setForeground(QColor("#D92D20"))
                elif days_until <= 7:
                    days_item.setForeground(QColor("#F59E0B"))
                self.expiry_table.setItem(row, 4, days_item)
                
                # Status
                status_item = QTableWidgetItem("Expired" if record.is_expired else "Active")
                if record.is_expired:
                    status_item.setForeground(QColor("#D92D20"))
                self.expiry_table.setItem(row, 5, status_item)
                
                self.expiry_table.setItem(row, 6, QTableWidgetItem(str(record.alert_days_before)))
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading expiry records: {e}")
            QMessageBox.critical(self, "Error", f"Failed to load expiry records: {str(e)}")
    
    def handle_add_expiry(self):
        """Handle add expiry record"""
        dialog = AddExpiryDialog(self.user_id, self)
        if dialog.exec():
            self.load_expiry_records()


class AddExpiryDialog(QDialog):
    """Dialog for adding expiry record"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setWindowTitle("Add Expiry Record")
        self.setMinimumSize(400, 300)
        self.setup_ui()
    
    def setup_ui(self):
        """Setup add expiry UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(20, 20, 20, 20)
        
        form = QFormLayout()
        
        # Inventory selection
        self.inventory_combo = QComboBox()
        self.load_inventory()
        form.addRow("Inventory Item:", self.inventory_combo)
        
        # Batch number
        self.batch_input = QLineEdit()
        self.batch_input.setPlaceholderText("Optional batch number")
        form.addRow("Batch Number:", self.batch_input)
        
        # Quantity
        self.quantity_input = QDoubleSpinBox()
        self.quantity_input.setMinimum(0.01)
        self.quantity_input.setMaximum(99999.99)
        self.quantity_input.setDecimals(2)
        self.quantity_input.setValue(1.0)
        form.addRow("Quantity:", self.quantity_input)
        
        # Expiry date
        self.expiry_date = QDateEdit()
        self.expiry_date.setDate(QDate.currentDate().addDays(30))
        self.expiry_date.setCalendarPopup(True)
        form.addRow("Expiry Date:", self.expiry_date)
        
        # Alert days before
        self.alert_days = QSpinBox()
        self.alert_days.setMinimum(1)
        self.alert_days.setMaximum(30)
        self.alert_days.setValue(7)
        form.addRow("Alert Days Before:", self.alert_days)
        
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
    
    def load_inventory(self):
        """Load inventory items"""
        db = get_db_session()
        try:
            # Load inventory with ingredient relationship using joinedload to ensure relationship is loaded
            from sqlalchemy.orm import joinedload
            inventory_items = db.query(Inventory).options(
                joinedload(Inventory.ingredient)
            ).filter(
                Inventory.status == 'active'
            ).all()
            
            if not inventory_items:
                # If no inventory items, try loading ingredients directly
                ingredients = db.query(Ingredient).all()
                for ing in ingredients:
                    self.inventory_combo.addItem(
                        f"{ing.name}",
                        ing.ingredient_id
                    )
                if ingredients:
                    logger.warning("No inventory items found, showing ingredients instead")
                else:
                    logger.warning("No inventory items or ingredients found")
                    QMessageBox.information(self, "No Items", 
                        "No inventory items or ingredients found. Please add ingredients first.")
            else:
                for inv in inventory_items:
                    ingredient_name = inv.ingredient.name if inv.ingredient else "Unknown"
                    unit = inv.unit or ""
                    quantity = inv.quantity or 0
                    self.inventory_combo.addItem(
                        f"{ingredient_name} ({quantity} {unit})",
                        inv.inventory_id
                    )
        except Exception as e:
            logger.error(f"Error loading inventory: {e}")
            # Fallback: try loading ingredients directly
            try:
                ingredients = db.query(Ingredient).all()
                for ing in ingredients:
                    self.inventory_combo.addItem(
                        f"{ing.name}",
                        ing.ingredient_id
                    )
                if not ingredients:
                    QMessageBox.warning(self, "No Ingredients", 
                        "No ingredients found. Please add ingredients first.")
            except Exception as e2:
                logger.error(f"Error loading ingredients as fallback: {e2}")
                QMessageBox.critical(self, "Error", 
                    f"Failed to load inventory items:\n{str(e2)}")
        finally:
            db.close()
    
    def handle_save(self):
        """Save expiry record"""
        db = get_db_session()
        try:
            selected_id = self.inventory_combo.currentData()
            if not selected_id:
                QMessageBox.warning(self, "Warning", "Please select an inventory item")
                return
            
            # Check if we have an inventory_id or ingredient_id
            # If it's an ingredient_id, we need to find or create an inventory record
            inventory_id = selected_id
            
            # Check if this is an ingredient_id (when no inventory items exist)
            # We'll check by seeing if an inventory with this ID exists
            inventory = db.query(Inventory).filter(Inventory.inventory_id == selected_id).first()
            
            if not inventory:
                # This might be an ingredient_id, try to find or create inventory
                ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == selected_id).first()
                if ingredient:
                    # Find existing inventory for this ingredient
                    inventory = db.query(Inventory).filter(
                        Inventory.ingredient_id == ingredient.ingredient_id,
                        Inventory.status == 'active'
                    ).first()
                    
                    if not inventory:
                        # Create a new inventory record
                        inventory = Inventory(
                            ingredient_id=ingredient.ingredient_id,
                            quantity=0.0,
                            unit=ingredient.unit,
                            status='active'
                        )
                        db.add(inventory)
                        db.flush()  # Get the inventory_id
                    
                    inventory_id = inventory.inventory_id
                else:
                    QMessageBox.warning(self, "Error", "Selected item not found")
                    return
            
            expiry_record = InventoryExpiry(
                inventory_id=inventory_id,
                batch_number=self.batch_input.text().strip() or None,
                quantity=self.quantity_input.value(),
                expiry_date=self.expiry_date.date().toPyDate(),
                alert_days_before=self.alert_days.value(),
                is_expired=False
            )
            
            db.add(expiry_record)
            db.commit()
            
            QMessageBox.information(self, "Success", "Expiry record added successfully")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error saving expiry record: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to save expiry record: {str(e)}")
        finally:
            db.close()

