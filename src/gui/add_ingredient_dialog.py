"""
Add Ingredient Dialog
"""

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QPushButton, QLineEdit,
    QDoubleSpinBox, QComboBox, QFormLayout, QMessageBox
)
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import Ingredient, Supplier


class AddIngredientDialog(QDialog):
    """Dialog for adding a new ingredient"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setWindowTitle("Add Ingredient")
        self.setModal(True)
        self.setup_ui()
    
    def setup_ui(self):
        """Setup dialog UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(24, 24, 24, 24)
        
        form_layout = QFormLayout()
        form_layout.setSpacing(12)
        
        # Name
        self.name_input = QLineEdit()
        self.name_input.setPlaceholderText("Ingredient name")
        form_layout.addRow("Name *:", self.name_input)
        
        # Unit
        self.unit_combo = QComboBox()
        self.unit_combo.setEditable(True)
        self.unit_combo.addItems(["kg", "g", "L", "mL", "pcs", "units", "oz", "lb"])
        form_layout.addRow("Unit *:", self.unit_combo)
        
        # Cost Per Unit
        self.cost_input = QDoubleSpinBox()
        self.cost_input.setMinimum(0.0)
        self.cost_input.setMaximum(999999.99)
        self.cost_input.setDecimals(2)
        self.cost_input.setPrefix("$")
        self.cost_input.setValue(0.0)
        form_layout.addRow("Cost Per Unit:", self.cost_input)
        
        # Supplier
        self.supplier_combo = QComboBox()
        self.supplier_combo.addItem("None", None)
        self.load_suppliers()
        form_layout.addRow("Supplier:", self.supplier_combo)
        
        layout.addLayout(form_layout)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        save_btn = QPushButton("Add Ingredient")
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
    
    def load_suppliers(self):
        """Load suppliers into combo box"""
        db = get_db_session()
        try:
            suppliers = db.query(Supplier).all()
            for supplier in suppliers:
                self.supplier_combo.addItem(supplier.name, supplier.supplier_id)
        except Exception as e:
            logger.error(f"Error loading suppliers: {e}")
        finally:
            db.close()
    
    def handle_save(self):
        """Handle save button click"""
        name = self.name_input.text().strip()
        if not name:
            QMessageBox.warning(self, "Validation Error", "Ingredient name is required.")
            return
        
        unit = self.unit_combo.currentText().strip()
        if not unit:
            QMessageBox.warning(self, "Validation Error", "Unit is required.")
            return
        
        supplier_id = self.supplier_combo.currentData()
        
        db = get_db_session()
        try:
            cost_per_unit = self.cost_input.value() if self.cost_input.value() > 0 else None
            
            new_ingredient = Ingredient(
                name=name,
                unit=unit,
                cost_per_unit=cost_per_unit,
                supplier_id=supplier_id,
                user_id=self.user_id
            )
            
            db.add(new_ingredient)
            db.commit()
            
            logger.info(f"New ingredient added: {name}")
            QMessageBox.information(self, "Success", f"Ingredient '{name}' added successfully!")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error adding ingredient: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to add ingredient:\n{str(e)}")
        finally:
            db.close()

