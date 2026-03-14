"""
Inventory Management Module - Ingredients List View
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QDialog, QLineEdit, QTabWidget, QFrame
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QColor
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import Ingredient
from src.gui.inventory_expiry_tracking import InventoryExpiryView
from src.gui.waste_analysis import WasteAnalysisView
from src.gui.barcode_management import BarcodeManagementView
from src.gui.predictive_analytics_view import PredictiveAnalyticsView
from src.gui.design_system import (
    DATA_TABLE_STYLE,
    DANGER_BUTTON_STYLE,
    PRIMARY_BUTTON_STYLE,
    SEARCH_INPUT_STYLE,
    SUCCESS_BUTTON_STYLE,
    TAB_WIDGET_STYLE,
    TOOLBAR_CARD_STYLE,
    apply_module_title,
)
from src.utils.procurement_automation import check_and_generate_pos, get_low_stock_items


class InventoryManagementView(QWidget):
    """Inventory Management View - Ingredients List"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        self.load_ingredients_list()
    
    def setup_ui(self):
        """Setup inventory list UI with tabs"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        
        title = QLabel("Inventory Management")
        apply_module_title(title)
        header_layout.addWidget(title)
        header_layout.addStretch()
        
        # Auto-generate POs button
        auto_po_btn = QPushButton("Auto-Generate POs")
        auto_po_btn.setStyleSheet(SUCCESS_BUTTON_STYLE)
        auto_po_btn.clicked.connect(self.handle_auto_generate_pos)
        header_layout.addWidget(auto_po_btn)
        
        layout.addLayout(header_layout)
        
        # Tabs
        self.tabs = QTabWidget()
        self.tabs.setStyleSheet(TAB_WIDGET_STYLE)
        
        # Ingredients tab
        ingredients_widget = self.create_ingredients_widget()
        self.tabs.addTab(ingredients_widget, "Ingredients")
        
        # Expiry Tracking tab
        expiry_view = InventoryExpiryView(self.user_id)
        self.tabs.addTab(expiry_view, "Expiry Tracking")
        
        # Waste Analysis tab
        waste_view = WasteAnalysisView(self.user_id)
        self.tabs.addTab(waste_view, "Waste Analysis")
        
        # Barcode Management tab
        barcode_view = BarcodeManagementView(self.user_id)
        self.tabs.addTab(barcode_view, "Barcode Management")
        
        # Predictive Analytics tab
        predictive_view = PredictiveAnalyticsView(self.user_id)
        self.tabs.addTab(predictive_view, "Predictive Analytics")
        
        layout.addWidget(self.tabs)
    
    def create_ingredients_widget(self) -> QWidget:
        """Create ingredients list widget"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(12)
        layout.setContentsMargins(0, 0, 0, 0)
        
        toolbar_card = QFrame()
        toolbar_card.setStyleSheet(TOOLBAR_CARD_STYLE)
        toolbar_card_layout = QVBoxLayout(toolbar_card)
        toolbar_card_layout.setContentsMargins(18, 14, 18, 14)
        toolbar_card_layout.setSpacing(10)

        header_layout = QHBoxLayout()
        header_layout.addStretch()
        add_btn = QPushButton("Add Ingredient")
        add_btn.setStyleSheet(PRIMARY_BUTTON_STYLE)
        add_btn.clicked.connect(self.handle_add_ingredient)
        header_layout.addWidget(add_btn)
        toolbar_card_layout.addLayout(header_layout)
        
        # Search bar
        search_layout = QHBoxLayout()
        search_layout.setSpacing(12)
        
        search_label = QLabel("Search:")
        search_label.setStyleSheet("""
            color: #2A3A55;
            font-size: 14px;
            font-weight: 500;
        """)
        search_layout.addWidget(search_label)
        
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search by name, unit...")
        self.search_input.setStyleSheet(SEARCH_INPUT_STYLE)
        self.search_input.textChanged.connect(self.filter_ingredients_list)
        search_layout.addWidget(self.search_input)
        
        toolbar_card_layout.addLayout(search_layout)
        layout.addWidget(toolbar_card)
        
        # Ingredients table
        self.ingredients_table = QTableWidget()
        self.ingredients_table.setColumnCount(4)
        self.ingredients_table.setHorizontalHeaderLabels([
            "ID", "Name", "Unit", "Cost Per Unit"
        ])
        
        # Style table
        self.ingredients_table.setStyleSheet(DATA_TABLE_STYLE)
        
        # Configure table
        self.ingredients_table.horizontalHeader().setStretchLastSection(True)
        self.ingredients_table.setAlternatingRowColors(True)
        self.ingredients_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.ingredients_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.ingredients_table.doubleClicked.connect(self.handle_edit_ingredient)
        
        layout.addWidget(self.ingredients_table)
        
        # Action buttons
        actions_layout = QHBoxLayout()
        actions_layout.addStretch()
        
        self.edit_btn = QPushButton("Edit Selected")
        self.edit_btn.setStyleSheet(PRIMARY_BUTTON_STYLE)
        self.edit_btn.clicked.connect(self.handle_edit_selected)
        self.edit_btn.setEnabled(False)
        actions_layout.addWidget(self.edit_btn)
        
        self.delete_btn = QPushButton("Delete Selected")
        self.delete_btn.setStyleSheet(DANGER_BUTTON_STYLE)
        self.delete_btn.clicked.connect(self.handle_delete_selected)
        self.delete_btn.setEnabled(False)
        actions_layout.addWidget(self.delete_btn)
        
        self.ingredients_table.itemSelectionChanged.connect(self.update_action_buttons)
        layout.addLayout(actions_layout)
        
        return widget
    
    def load_ingredients_list(self):
        """Load ingredients list from database"""
        db = get_db_session()
        try:
            self.all_ingredients = db.query(Ingredient).all()
            self.display_ingredients_list(self.all_ingredients)
            logger.info(f"Loaded {len(self.all_ingredients)} ingredients")
        except Exception as e:
            logger.error(f"Error loading ingredients list: {e}")
        finally:
            db.close()
    
    def display_ingredients_list(self, ingredients_list):
        """Display ingredients list in table"""
        self.ingredients_table.setRowCount(len(ingredients_list))
        
        for row, ingredient in enumerate(ingredients_list):
            self.ingredients_table.setItem(row, 0, QTableWidgetItem(str(ingredient.ingredient_id)))
            self.ingredients_table.setItem(row, 1, QTableWidgetItem(ingredient.name))
            self.ingredients_table.setItem(row, 2, QTableWidgetItem(ingredient.unit))
            cost = f"${ingredient.cost_per_unit:.2f}" if ingredient.cost_per_unit else "-"
            self.ingredients_table.setItem(row, 3, QTableWidgetItem(cost))
    
    def filter_ingredients_list(self, search_text: str):
        """Filter ingredients list based on search text"""
        if not hasattr(self, 'all_ingredients'):
            return
        
        search_text = search_text.lower().strip()
        
        if not search_text:
            self.display_ingredients_list(self.all_ingredients)
            return
        
        filtered = []
        for ingredient in self.all_ingredients:
            searchable = f"{ingredient.name} {ingredient.unit}".lower()
            if search_text in searchable:
                filtered.append(ingredient)
        
        self.display_ingredients_list(filtered)
    
    def update_action_buttons(self):
        """Enable/disable action buttons based on selection"""
        has_selection = len(self.ingredients_table.selectedItems()) > 0
        self.edit_btn.setEnabled(has_selection)
        self.delete_btn.setEnabled(has_selection)
    
    def handle_add_ingredient(self):
        """Handle add ingredient button click"""
        from src.gui.add_ingredient_dialog import AddIngredientDialog
        dialog = AddIngredientDialog(self.user_id, self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            self.load_ingredients_list()
    
    def handle_edit_ingredient(self, index):
        """Handle double-click on ingredient row"""
        row = index.row()
        ingredient_id_item = self.ingredients_table.item(row, 0)
        if ingredient_id_item:
            ingredient_id = int(ingredient_id_item.text())
            self.open_edit_dialog(ingredient_id)
    
    def open_edit_dialog(self, ingredient_id: int):
        """Open edit dialog for an ingredient"""
        from src.gui.edit_ingredient_dialog import EditIngredientDialog
        dialog = EditIngredientDialog(ingredient_id, self.user_id, self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            self.load_ingredients_list()
    
    def handle_edit_selected(self):
        """Handle edit button click"""
        selected_rows = self.ingredients_table.selectionModel().selectedRows()
        if selected_rows:
            row = selected_rows[0].row()
            ingredient_id_item = self.ingredients_table.item(row, 0)
            if ingredient_id_item:
                ingredient_id = int(ingredient_id_item.text())
                self.open_edit_dialog(ingredient_id)
    
    def handle_delete_selected(self):
        """Handle delete button click"""
        from PyQt6.QtWidgets import QMessageBox
        
        selected_rows = self.ingredients_table.selectionModel().selectedRows()
        if not selected_rows:
            return
        
        row = selected_rows[0].row()
        ingredient_id_item = self.ingredients_table.item(row, 0)
        name_item = self.ingredients_table.item(row, 1)
        
        if not ingredient_id_item or not name_item:
            return
        
        ingredient_id = int(ingredient_id_item.text())
        ingredient_name = name_item.text()
        
        reply = QMessageBox.question(
            self,
            "Confirm Delete",
            f"Are you sure you want to delete ingredient '{ingredient_name}'?\n\nThis action cannot be undone.",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
            QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            self.delete_ingredient(ingredient_id)
    
    def delete_ingredient(self, ingredient_id: int):
        """Delete an ingredient from database"""
        from PyQt6.QtWidgets import QMessageBox
        
        db = get_db_session()
        try:
            ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == ingredient_id).first()
            if not ingredient:
                QMessageBox.warning(self, "Error", "Ingredient not found.")
                return
            
            ingredient_name = ingredient.name
            db.delete(ingredient)
            db.commit()
            
            logger.info(f"Ingredient deleted: {ingredient_name} (ID: {ingredient_id})")
            QMessageBox.information(self, "Success", f"Ingredient '{ingredient_name}' deleted successfully!")
            
            self.load_ingredients_list()
            
        except Exception as e:
            logger.error(f"Error deleting ingredient: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to delete ingredient:\n{str(e)}")
        finally:
            db.close()
    
    def handle_auto_generate_pos(self):
        """Handle auto-generate purchase orders"""
        from PyQt6.QtWidgets import QMessageBox
        
        try:
            # Check for low stock items
            low_stock = get_low_stock_items()
            
            if not low_stock:
                QMessageBox.information(
                    self,
                    "No Action Needed",
                    "All inventory items are above reorder level."
                )
                return
            
            # Show confirmation
            reply = QMessageBox.question(
                self,
                "Auto-Generate Purchase Orders",
                f"Found {len(low_stock)} item(s) below reorder level.\n\n"
                f"Generate purchase orders for these items?",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
                QMessageBox.StandardButton.Yes
            )
            
            if reply == QMessageBox.StandardButton.Yes:
                created_pos = check_and_generate_pos(self.user_id)
                
                if created_pos:
                    QMessageBox.information(
                        self,
                        "Success",
                        f"Successfully generated {len(created_pos)} purchase order(s)!\n\n"
                        f"PO IDs: {', '.join(map(str, created_pos))}"
                    )
                else:
                    QMessageBox.warning(
                        self,
                        "No POs Generated",
                        "No purchase orders were generated. This may be because:\n"
                        "- Items don't have suppliers assigned\n"
                        "- Suppliers are inactive"
                    )
        except Exception as e:
            logger.error(f"Error auto-generating POs: {e}")
            QMessageBox.critical(
                self,
                "Error",
                f"Failed to generate purchase orders:\n{str(e)}"
            )

