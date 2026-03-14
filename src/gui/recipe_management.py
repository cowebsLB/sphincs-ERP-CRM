"""
Recipe Management - Manage product recipes and calculate costs
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QDialog, QComboBox,
    QDoubleSpinBox, QLineEdit, QMessageBox, QFormLayout
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QColor
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import Recipe, Product, Ingredient
from src.utils.recipe_calculator import calculate_product_cost, update_product_cost, get_recipe_cost_breakdown


class RecipeManagementDialog(QDialog):
    """Dialog for managing product recipes"""
    
    def __init__(self, product_id: int, parent=None):
        super().__init__(parent)
        self.product_id = product_id
        self.setWindowTitle("Recipe Management")
        self.setMinimumSize(700, 500)
        self.setup_ui()
        self.load_product_info()
        self.load_recipes()
        self.load_cost_breakdown()
    
    def setup_ui(self):
        """Setup recipe management UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(20, 20, 20, 20)
        
        # Product info
        product_info = QLabel()
        product_info.setStyleSheet("""
            QLabel {
                font-size: 16px;
                font-weight: 600;
                padding: 10px;
                background-color: #EDF3FC;
                border-radius: 6px;
            }
        """)
        self.product_info_label = product_info
        layout.addWidget(product_info)
        
        # Cost summary
        cost_layout = QHBoxLayout()
        cost_layout.addWidget(QLabel("Total Recipe Cost:"))
        self.total_cost_label = QLabel("$0.00")
        self.total_cost_label.setStyleSheet("""
            QLabel {
                font-size: 18px;
                font-weight: 700;
                color: #2F7DFF;
            }
        """)
        cost_layout.addWidget(self.total_cost_label)
        cost_layout.addStretch()
        
        update_cost_btn = QPushButton("Update Product Cost")
        update_cost_btn.setStyleSheet("""
            QPushButton {
                background-color: #14B8A6;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #059669;
            }
        """)
        update_cost_btn.clicked.connect(self.handle_update_cost)
        cost_layout.addWidget(update_cost_btn)
        layout.addLayout(cost_layout)
        
        # Recipe items table
        table_label = QLabel("Recipe Ingredients:")
        table_label.setStyleSheet("font-weight: 600; font-size: 14px;")
        layout.addWidget(table_label)
        
        self.recipes_table = QTableWidget()
        self.recipes_table.setColumnCount(5)
        self.recipes_table.setHorizontalHeaderLabels([
            "Ingredient", "Quantity", "Unit", "Cost/Unit", "Total Cost"
        ])
        self.recipes_table.setStyleSheet("""
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
        self.recipes_table.horizontalHeader().setStretchLastSection(True)
        layout.addWidget(self.recipes_table)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        add_btn = QPushButton("Add Ingredient")
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
        add_btn.clicked.connect(self.handle_add_ingredient)
        buttons_layout.addWidget(add_btn)
        
        remove_btn = QPushButton("Remove Selected")
        remove_btn.setStyleSheet("""
            QPushButton {
                background-color: #D92D20;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #DC2626;
            }
        """)
        remove_btn.clicked.connect(self.handle_remove_ingredient)
        buttons_layout.addWidget(remove_btn)
        
        close_btn = QPushButton("Close")
        close_btn.setStyleSheet("""
            QPushButton {
                background-color: #5D6F8B;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #4B5563;
            }
        """)
        close_btn.clicked.connect(self.accept)
        buttons_layout.addWidget(close_btn)
        
        layout.addLayout(buttons_layout)
    
    def load_product_info(self):
        """Load product information"""
        try:
            db = get_db_session()
            product = db.query(Product).filter(Product.product_id == self.product_id).first()
            if product:
                self.product_info_label.setText(f"Product: {product.name} (ID: {product.product_id})")
            db.close()
        except Exception as e:
            logger.error(f"Error loading product info: {e}")
    
    def load_recipes(self):
        """Load recipe items"""
        try:
            db = get_db_session()
            recipes = db.query(Recipe).filter(Recipe.product_id == self.product_id).all()
            
            self.recipes_table.setRowCount(len(recipes))
            total_cost = 0.0
            
            for row, recipe in enumerate(recipes):
                ingredient = db.query(Ingredient).filter(
                    Ingredient.ingredient_id == recipe.ingredient_id
                ).first()
                
                if ingredient:
                    self.recipes_table.setItem(row, 0, QTableWidgetItem(ingredient.name))
                    self.recipes_table.setItem(row, 1, QTableWidgetItem(str(recipe.quantity_needed)))
                    self.recipes_table.setItem(row, 2, QTableWidgetItem(recipe.unit))
                    
                    cost_per_unit = ingredient.cost_per_unit or 0.0
                    total_ingredient_cost = recipe.quantity_needed * cost_per_unit
                    total_cost += total_ingredient_cost
                    
                    self.recipes_table.setItem(row, 3, QTableWidgetItem(f"${cost_per_unit:.2f}"))
                    self.recipes_table.setItem(row, 4, QTableWidgetItem(f"${total_ingredient_cost:.2f}"))
            
            self.total_cost_label.setText(f"${total_cost:.2f}")
            db.close()
        except Exception as e:
            logger.error(f"Error loading recipes: {e}")
            QMessageBox.critical(self, "Error", f"Failed to load recipes: {str(e)}")
    
    def load_cost_breakdown(self):
        """Load detailed cost breakdown"""
        breakdown = get_recipe_cost_breakdown(self.product_id)
        total = sum(item['total_cost'] for item in breakdown)
        self.total_cost_label.setText(f"${total:.2f}")
    
    def handle_add_ingredient(self):
        """Handle add ingredient to recipe"""
        dialog = AddRecipeItemDialog(self.product_id, self)
        if dialog.exec():
            self.load_recipes()
            self.load_cost_breakdown()
    
    def handle_remove_ingredient(self):
        """Handle remove ingredient from recipe"""
        current_row = self.recipes_table.currentRow()
        if current_row < 0:
            QMessageBox.warning(self, "Warning", "Please select an ingredient to remove")
            return
        
        try:
            db = get_db_session()
            recipes = db.query(Recipe).filter(Recipe.product_id == self.product_id).all()
            if current_row < len(recipes):
                recipe = recipes[current_row]
                db.delete(recipe)
                db.commit()
                logger.info(f"Removed ingredient {recipe.ingredient_id} from product {self.product_id}")
                self.load_recipes()
                self.load_cost_breakdown()
            db.close()
        except Exception as e:
            logger.error(f"Error removing recipe item: {e}")
            QMessageBox.critical(self, "Error", f"Failed to remove ingredient: {str(e)}")
    
    def handle_update_cost(self):
        """Update product cost based on recipe"""
        if update_product_cost(self.product_id):
            QMessageBox.information(self, "Success", "Product cost updated successfully")
            self.load_cost_breakdown()
        else:
            QMessageBox.warning(self, "Warning", "Failed to update product cost")


class AddRecipeItemDialog(QDialog):
    """Dialog for adding ingredient to recipe"""
    
    def __init__(self, product_id: int, parent=None):
        super().__init__(parent)
        self.product_id = product_id
        self.setWindowTitle("Add Ingredient to Recipe")
        self.setMinimumSize(400, 200)
        self.setup_ui()
    
    def setup_ui(self):
        """Setup add recipe item UI"""
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
        self.quantity_input.setMaximum(9999.99)
        self.quantity_input.setDecimals(2)
        self.quantity_input.setValue(1.0)
        form.addRow("Quantity:", self.quantity_input)
        
        # Unit
        self.unit_input = QLineEdit()
        self.unit_input.setPlaceholderText("e.g., kg, liters, pcs")
        form.addRow("Unit:", self.unit_input)
        
        layout.addLayout(form)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        save_btn = QPushButton("Add")
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
        """Load ingredients into combo box"""
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
        """Save recipe item"""
        ingredient_id = self.ingredient_combo.currentData()
        quantity = self.quantity_input.value()
        unit = self.unit_input.text().strip()
        
        if not ingredient_id:
            QMessageBox.warning(self, "Warning", "Please select an ingredient")
            return
        
        if not unit:
            QMessageBox.warning(self, "Warning", "Please enter a unit")
            return
        
        try:
            db = get_db_session()
            
            # Check if recipe already exists
            existing = db.query(Recipe).filter(
                Recipe.product_id == self.product_id,
                Recipe.ingredient_id == ingredient_id
            ).first()
            
            if existing:
                QMessageBox.warning(self, "Warning", "This ingredient is already in the recipe")
                db.close()
                return
            
            # Create new recipe item
            recipe = Recipe(
                product_id=self.product_id,
                ingredient_id=ingredient_id,
                quantity_needed=quantity,
                unit=unit
            )
            db.add(recipe)
            db.commit()
            db.close()
            
            logger.info(f"Added ingredient {ingredient_id} to product {self.product_id}")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error adding recipe item: {e}")
            QMessageBox.critical(self, "Error", f"Failed to add ingredient: {str(e)}")

