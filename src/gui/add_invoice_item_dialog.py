"""
Add Invoice Item Dialog - Add items to invoices
"""

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QComboBox, QDoubleSpinBox, QFormLayout, QMessageBox
)
from PyQt6.QtCore import Qt
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import Product


class AddInvoiceItemDialog(QDialog):
    """Dialog for adding items to an invoice"""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Add Invoice Item")
        self.setModal(True)
        self.setMinimumWidth(400)
        self.item_data = {}
        self.setup_ui()
    
    def setup_ui(self):
        """Setup dialog UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(24, 24, 24, 24)
        
        form_layout = QFormLayout()
        form_layout.setSpacing(12)
        
        # Product selection
        self.product_combo = QComboBox()
        self.product_combo.addItem("Select product...", None)
        self.load_products()
        self.product_combo.currentIndexChanged.connect(self.update_price)
        form_layout.addRow("Product *:", self.product_combo)
        
        # Quantity
        self.quantity_input = QDoubleSpinBox()
        self.quantity_input.setMinimum(0.01)
        self.quantity_input.setMaximum(99999.99)
        self.quantity_input.setDecimals(2)
        self.quantity_input.setValue(1.0)
        self.quantity_input.valueChanged.connect(self.calculate_total)
        form_layout.addRow("Quantity *:", self.quantity_input)
        
        # Unit price
        self.unit_price_input = QDoubleSpinBox()
        self.unit_price_input.setMinimum(0.01)
        self.unit_price_input.setMaximum(99999.99)
        self.unit_price_input.setDecimals(2)
        self.unit_price_input.setPrefix("$")
        self.unit_price_input.valueChanged.connect(self.calculate_total)
        form_layout.addRow("Unit Price *:", self.unit_price_input)
        
        # Total
        self.total_label = QLabel("$0.00")
        self.total_label.setStyleSheet("""
            color: #2F7DFF;
            font-size: 16px;
            font-weight: 600;
        """)
        form_layout.addRow("Total:", self.total_label)
        
        layout.addLayout(form_layout)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        add_btn = QPushButton("Add Item")
        add_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #1D66EA;
            }
        """)
        add_btn.clicked.connect(self.handle_add)
        buttons_layout.addWidget(add_btn)
        
        layout.addLayout(buttons_layout)
    
    def load_products(self):
        """Load products"""
        db = get_db_session()
        try:
            products = db.query(Product).filter(Product.is_active == True).all()
            for product in products:
                self.product_combo.addItem(
                    f"{product.name} - ${product.price:.2f}",
                    product.product_id
                )
        except Exception as e:
            logger.error(f"Error loading products: {e}")
        finally:
            db.close()
    
    def update_price(self):
        """Update unit price when product is selected"""
        product_id = self.product_combo.currentData()
        if product_id:
            db = get_db_session()
            try:
                product = db.query(Product).filter(Product.product_id == product_id).first()
                if product:
                    self.unit_price_input.setValue(float(product.price))
                    self.calculate_total()
            except Exception as e:
                logger.error(f"Error loading product price: {e}")
            finally:
                db.close()
    
    def calculate_total(self):
        """Calculate total price"""
        quantity = self.quantity_input.value()
        unit_price = self.unit_price_input.value()
        total = quantity * unit_price
        self.total_label.setText(f"${total:.2f}")
    
    def handle_add(self):
        """Handle add button click"""
        product_id = self.product_combo.currentData()
        if not product_id:
            QMessageBox.warning(self, "Validation Error", "Please select a product.")
            return
        
        quantity = self.quantity_input.value()
        unit_price = self.unit_price_input.value()
        total = quantity * unit_price
        
        product_name = self.product_combo.currentText().split(" - ")[0]
        
        self.item_data = {
            'product_id': product_id,
            'product_name': product_name,
            'quantity': quantity,
            'unit_price': unit_price,
            'total': total
        }
        
        self.accept()
    
    def get_item(self):
        """Get the item data"""
        return self.item_data

