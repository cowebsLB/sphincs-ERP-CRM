"""
Barcode Management - Manage barcodes for products and ingredients
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QDialog, QComboBox,
    QMessageBox, QFormLayout, QLineEdit
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QColor
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import Barcode, Product, Ingredient


class BarcodeManagementView(QWidget):
    """Barcode Management View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        self.load_barcodes()
    
    def setup_ui(self):
        """Setup barcode management UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        
        title = QLabel("Barcode Management")
        title.setStyleSheet("""
            color: #162640;
            font-size: 24px;
            font-weight: 700;
        """)
        header_layout.addWidget(title)
        header_layout.addStretch()
        
        # Add Barcode button
        add_btn = QPushButton("Add Barcode")
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
        add_btn.clicked.connect(self.handle_add_barcode)
        header_layout.addWidget(add_btn)
        
        layout.addLayout(header_layout)
        layout.addSpacing(24)
        
        # Filters
        filter_layout = QHBoxLayout()
        filter_layout.setSpacing(12)
        
        filter_layout.addWidget(QLabel("Type:"))
        self.type_combo = QComboBox()
        self.type_combo.addItems(["All", "Product", "Ingredient"])
        self.type_combo.currentTextChanged.connect(self.load_barcodes)
        filter_layout.addWidget(self.type_combo)
        
        filter_layout.addStretch()
        layout.addLayout(filter_layout)
        layout.addSpacing(16)
        
        # Barcodes table
        self.barcodes_table = QTableWidget()
        self.barcodes_table.setColumnCount(5)
        self.barcodes_table.setHorizontalHeaderLabels([
            "Barcode", "Type", "Barcode Type", "Item Name", "Status"
        ])
        self.barcodes_table.setStyleSheet("""
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
        self.barcodes_table.horizontalHeader().setStretchLastSection(True)
        self.barcodes_table.setAlternatingRowColors(True)
        layout.addWidget(self.barcodes_table)
    
    def load_barcodes(self):
        """Load barcodes"""
        try:
            db = get_db_session()
            
            query = db.query(Barcode)
            
            type_filter = self.type_combo.currentText()
            if type_filter == "Product":
                query = query.filter(Barcode.product_id.isnot(None))
            elif type_filter == "Ingredient":
                query = query.filter(Barcode.ingredient_id.isnot(None))
            
            barcodes = query.all()
            
            self.barcodes_table.setRowCount(len(barcodes))
            for row, barcode in enumerate(barcodes):
                self.barcodes_table.setItem(row, 0, QTableWidgetItem(barcode.barcode_value))
                
                item_type = "Product" if barcode.product_id else "Ingredient"
                self.barcodes_table.setItem(row, 1, QTableWidgetItem(item_type))
                self.barcodes_table.setItem(row, 2, QTableWidgetItem(barcode.barcode_type or "EAN-13"))
                
                item_name = "-"
                if barcode.product_id and barcode.product:
                    item_name = barcode.product.name
                elif barcode.ingredient_id and barcode.ingredient:
                    item_name = barcode.ingredient.name
                self.barcodes_table.setItem(row, 3, QTableWidgetItem(item_name))
                
                status_item = QTableWidgetItem("Active" if barcode.is_active else "Inactive")
                if not barcode.is_active:
                    status_item.setForeground(QColor("#8FA2BF"))
                self.barcodes_table.setItem(row, 4, status_item)
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading barcodes: {e}")
            QMessageBox.critical(self, "Error", f"Failed to load barcodes: {str(e)}")
    
    def handle_add_barcode(self):
        """Handle add barcode"""
        dialog = AddBarcodeDialog(self.user_id, self)
        if dialog.exec():
            self.load_barcodes()


class AddBarcodeDialog(QDialog):
    """Dialog for adding barcode"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setWindowTitle("Add Barcode")
        self.setMinimumSize(450, 300)
        self.setup_ui()
    
    def setup_ui(self):
        """Setup add barcode UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(20, 20, 20, 20)
        
        form = QFormLayout()
        
        # Item Type
        self.item_type_combo = QComboBox()
        self.item_type_combo.addItems(["Product", "Ingredient"])
        self.item_type_combo.currentTextChanged.connect(self.load_items)
        form.addRow("Item Type:", self.item_type_combo)
        
        # Item selection
        self.item_combo = QComboBox()
        self.load_items()
        form.addRow("Item:", self.item_combo)
        
        # Barcode Value
        self.barcode_input = QLineEdit()
        self.barcode_input.setPlaceholderText("Enter barcode value")
        form.addRow("Barcode Value *:", self.barcode_input)
        
        # Barcode Type
        self.barcode_type_combo = QComboBox()
        self.barcode_type_combo.addItems(["EAN-13", "EAN-8", "UPC-A", "UPC-E", "Code-128", "Code-39", "QR Code"])
        form.addRow("Barcode Type:", self.barcode_type_combo)
        
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
    
    def load_items(self):
        """Load items based on type"""
        self.item_combo.clear()
        item_type = self.item_type_combo.currentText()
        
        db = get_db_session()
        try:
            if item_type == "Product":
                products = db.query(Product).all()
                for product in products:
                    self.item_combo.addItem(product.name, product.product_id)
            else:  # Ingredient
                ingredients = db.query(Ingredient).all()
                for ingredient in ingredients:
                    self.item_combo.addItem(ingredient.name, ingredient.ingredient_id)
        finally:
            db.close()
    
    def handle_save(self):
        """Save barcode"""
        try:
            barcode_value = self.barcode_input.text().strip()
            if not barcode_value:
                QMessageBox.warning(self, "Validation Error", "Barcode value is required")
                return
            
            item_id = self.item_combo.currentData()
            if not item_id:
                QMessageBox.warning(self, "Validation Error", "Please select an item")
                return
            
            db = get_db_session()
            
            item_type = self.item_type_combo.currentText()
            barcode = Barcode(
                barcode_value=barcode_value,
                barcode_type=self.barcode_type_combo.currentText(),
                product_id=item_id if item_type == "Product" else None,
                ingredient_id=item_id if item_type == "Ingredient" else None,
                is_active=True
            )
            
            db.add(barcode)
            db.commit()
            db.close()
            
            QMessageBox.information(self, "Success", "Barcode added successfully")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error saving barcode: {e}")
            QMessageBox.critical(self, "Error", f"Failed to save barcode: {str(e)}")

