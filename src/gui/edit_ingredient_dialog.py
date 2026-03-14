"""
Edit Ingredient Dialog
"""

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QPushButton, QLineEdit,
    QDoubleSpinBox, QComboBox, QFormLayout, QMessageBox
)
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import Ingredient, Supplier


class EditIngredientDialog(QDialog):
    """Dialog for editing an existing ingredient"""
    
    def __init__(self, ingredient_id: int, user_id: int, parent=None):
        super().__init__(parent)
        self.ingredient_id = ingredient_id
        self.user_id = user_id
        self.setWindowTitle("Edit Ingredient")
        self.setModal(True)
        self.load_ingredient()
        self.setup_ui()
    
    def load_ingredient(self):
        """Load ingredient data"""
        db = get_db_session()
        try:
            self.ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == self.ingredient_id).first()
            if not self.ingredient:
                QMessageBox.warning(self, "Error", "Ingredient not found.")
                self.reject()
        finally:
            db.close()
    
    def setup_ui(self):
        """Setup dialog UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(24, 24, 24, 24)
        
        form_layout = QFormLayout()
        form_layout.setSpacing(12)
        
        # Name
        self.name_input = QLineEdit()
        self.name_input.setText(self.ingredient.name)
        form_layout.addRow("Name *:", self.name_input)
        
        # Unit
        self.unit_combo = QComboBox()
        self.unit_combo.setEditable(True)
        self.unit_combo.addItems(["kg", "g", "L", "mL", "pcs", "units", "oz", "lb"])
        self.unit_combo.setCurrentText(self.ingredient.unit)
        form_layout.addRow("Unit *:", self.unit_combo)
        
        # Cost Per Unit
        self.cost_input = QDoubleSpinBox()
        self.cost_input.setMinimum(0.0)
        self.cost_input.setMaximum(999999.99)
        self.cost_input.setDecimals(2)
        self.cost_input.setPrefix("$")
        self.cost_input.setValue(self.ingredient.cost_per_unit or 0.0)
        form_layout.addRow("Cost Per Unit:", self.cost_input)
        
        # Supplier
        self.supplier_combo = QComboBox()
        self.supplier_combo.addItem("None", None)
        self.load_suppliers()
        if self.ingredient.supplier_id:
            index = self.supplier_combo.findData(self.ingredient.supplier_id)
            if index >= 0:
                self.supplier_combo.setCurrentIndex(index)
        form_layout.addRow("Supplier:", self.supplier_combo)
        
        layout.addLayout(form_layout)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        save_btn = QPushButton("Save Changes")
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
            ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == self.ingredient_id).first()
            if not ingredient:
                QMessageBox.warning(self, "Error", "Ingredient not found.")
                return
            
            cost_per_unit = self.cost_input.value() if self.cost_input.value() > 0 else None
            
            ingredient.name = name
            ingredient.unit = unit
            ingredient.cost_per_unit = cost_per_unit
            ingredient.supplier_id = supplier_id
            
            db.commit()
            
            logger.info(f"Ingredient updated: {name} (ID: {self.ingredient_id})")
            QMessageBox.information(self, "Success", f"Ingredient '{name}' updated successfully!")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error updating ingredient: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to update ingredient:\n{str(e)}")
        finally:
            db.close()

