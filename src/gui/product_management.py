"""
Product Management Module - Manage products/dishes
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QDialog, QLineEdit, QComboBox, QFrame,
    QDoubleSpinBox, QCheckBox, QFormLayout, QMessageBox
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QColor
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import Product, Category
from src.gui.design_system import (
    DATA_TABLE_STYLE,
    DANGER_BUTTON_STYLE,
    FILTER_COMBO_STYLE,
    PRIMARY_BUTTON_STYLE,
    SEARCH_INPUT_STYLE,
    SUCCESS_BUTTON_STYLE,
    TOOLBAR_CARD_STYLE,
    apply_module_title,
)
from src.gui.recipe_management import RecipeManagementDialog


class ProductManagementView(QWidget):
    """Product Management View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        self.load_products()
    
    def setup_ui(self):
        """Setup product management UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        
        title = QLabel("Product Management")
        apply_module_title(title)
        header_layout.addWidget(title)
        
        header_layout.addStretch()
        
        # Add Product button
        add_btn = QPushButton("Add Product")
        add_btn.setStyleSheet(PRIMARY_BUTTON_STYLE)
        add_btn.clicked.connect(self.handle_add_product)
        header_layout.addWidget(add_btn)
        
        layout.addLayout(header_layout)
        
        toolbar_card = QFrame()
        toolbar_card.setStyleSheet(TOOLBAR_CARD_STYLE)
        toolbar_layout = QVBoxLayout(toolbar_card)
        toolbar_layout.setContentsMargins(18, 14, 18, 14)
        toolbar_layout.setSpacing(8)

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
        self.search_input.setPlaceholderText("Search by name, category, barcode...")
        self.search_input.setStyleSheet(SEARCH_INPUT_STYLE)
        self.search_input.textChanged.connect(self.filter_products)
        search_layout.addWidget(self.search_input)
        
        # Category filter
        category_label = QLabel("Category:")
        category_label.setStyleSheet("""
            color: #2A3A55;
            font-size: 14px;
            font-weight: 500;
        """)
        search_layout.addWidget(category_label)
        
        self.category_filter = QComboBox()
        self.category_filter.addItem("All")
        self.load_categories()
        self.category_filter.currentTextChanged.connect(self.filter_products)
        self.category_filter.setStyleSheet(FILTER_COMBO_STYLE)
        search_layout.addWidget(self.category_filter)
        
        search_layout.addStretch()
        toolbar_layout.addLayout(search_layout)
        layout.addWidget(toolbar_card)
        
        # Products table
        self.products_table = QTableWidget()
        self.products_table.setColumnCount(5)
        self.products_table.setHorizontalHeaderLabels([
            "ID", "Name", "Category", "Price", "Status"
        ])
        
        self.products_table.setStyleSheet(DATA_TABLE_STYLE)
        
        self.products_table.horizontalHeader().setStretchLastSection(True)
        self.products_table.setAlternatingRowColors(True)
        self.products_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.products_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.products_table.doubleClicked.connect(self.handle_edit_product)
        
        layout.addWidget(self.products_table)
        
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
        
        self.recipe_btn = QPushButton("Manage Recipe")
        self.recipe_btn.setStyleSheet(SUCCESS_BUTTON_STYLE)
        self.recipe_btn.clicked.connect(self.handle_manage_recipe)
        self.recipe_btn.setEnabled(False)
        actions_layout.addWidget(self.recipe_btn)
        
        self.products_table.itemSelectionChanged.connect(self.update_action_buttons)
        layout.addLayout(actions_layout)
    
    def load_products(self):
        """Load products from database"""
        db = get_db_session()
        try:
            self.all_products = db.query(Product).all()
            self.filter_products()
            logger.info(f"Loaded {len(self.all_products)} products")
        except Exception as e:
            logger.error(f"Error loading products: {e}")
        finally:
            db.close()
    
    def display_products(self, products_list):
        """Display products in table"""
        self.products_table.setRowCount(len(products_list))
        
        for row, product in enumerate(products_list):
            self.products_table.setItem(row, 0, QTableWidgetItem(str(product.product_id)))
            self.products_table.setItem(row, 1, QTableWidgetItem(product.name))
            # Get category name
            category_name = "N/A"
            if product.category:
                category_name = product.category.name
            self.products_table.setItem(row, 2, QTableWidgetItem(category_name))
            self.products_table.setItem(row, 3, QTableWidgetItem(f"${product.price:.2f}"))
            
            # Status
            status_item = QTableWidgetItem("Active" if product.is_active else "Inactive")
            if not product.is_active:
                status_item.setForeground(QColor("#8FA2BF"))
            self.products_table.setItem(row, 4, status_item)
    
    def load_categories(self):
        """Load categories into filter combo and form combo"""
        db = get_db_session()
        try:
            categories = db.query(Category).all()
            
            # If no categories exist, create default ones
            if not categories:
                from src.utils.create_categories import create_default_categories
                create_default_categories()
                # Reload categories
                categories = db.query(Category).all()
            
            for category in categories:
                if hasattr(self, 'category_filter'):
                    self.category_filter.addItem(category.name)
                if hasattr(self, 'category_combo'):
                    self.category_combo.addItem(category.name, category.category_id)
        except Exception as e:
            logger.error(f"Error loading categories: {e}")
        finally:
            db.close()
    
    def filter_products(self):
        """Filter products based on search and category"""
        if not hasattr(self, 'all_products'):
            return
        
        search_text = self.search_input.text().lower().strip()
        category_filter = self.category_filter.currentText()
        
        filtered = []
        for product in self.all_products:
            # Category filter
            if category_filter != "All":
                category_name = product.category.name if product.category else ""
                if category_name != category_filter:
                    continue
            
            # Search filter
            if search_text:
                category_name = product.category.name if product.category else ""
                searchable = f"{product.name} {category_name}".lower()
                if search_text not in searchable:
                    continue
            
            filtered.append(product)
        
        self.display_products(filtered)
    
    def update_action_buttons(self):
        """Enable/disable action buttons based on selection"""
        has_selection = len(self.products_table.selectedItems()) > 0
        self.edit_btn.setEnabled(has_selection)
        self.delete_btn.setEnabled(has_selection)
        self.recipe_btn.setEnabled(has_selection)
    
    def handle_add_product(self):
        """Handle add product button click"""
        dialog = AddProductDialog(self.user_id, self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            self.load_products()
    
    def handle_edit_product(self, index):
        """Handle double-click on product row"""
        row = index.row()
        product_id_item = self.products_table.item(row, 0)
        if product_id_item:
            product_id = int(product_id_item.text())
            self.open_edit_dialog(product_id)
    
    def open_edit_dialog(self, product_id: int):
        """Open edit dialog for a product"""
        dialog = EditProductDialog(product_id, self.user_id, self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            self.load_products()
    
    def handle_edit_selected(self):
        """Handle edit button click"""
        selected_rows = self.products_table.selectionModel().selectedRows()
        if selected_rows:
            row = selected_rows[0].row()
            product_id_item = self.products_table.item(row, 0)
            if product_id_item:
                product_id = int(product_id_item.text())
                self.open_edit_dialog(product_id)
    
    def handle_manage_recipe(self):
        """Handle manage recipe button click"""
        selected_rows = self.products_table.selectionModel().selectedRows()
        if not selected_rows:
            return
        
        row = selected_rows[0].row()
        product_id_item = self.products_table.item(row, 0)
        if product_id_item:
            product_id = int(product_id_item.text())
            dialog = RecipeManagementDialog(product_id, self)
            dialog.exec()
            # Reload products to show updated cost
            self.load_products()
    
    def handle_delete_selected(self):
        """Handle delete button click"""
        selected_rows = self.products_table.selectionModel().selectedRows()
        if not selected_rows:
            return
        
        row = selected_rows[0].row()
        product_id_item = self.products_table.item(row, 0)
        name_item = self.products_table.item(row, 1)
        
        if not product_id_item or not name_item:
            return
        
        product_id = int(product_id_item.text())
        product_name = name_item.text()
        
        reply = QMessageBox.question(
            self,
            "Confirm Delete",
            f"Are you sure you want to delete product '{product_name}'?\n\nThis action cannot be undone.",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
            QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            self.delete_product(product_id)
    
    def delete_product(self, product_id: int):
        """Delete a product from database"""
        db = get_db_session()
        try:
            product = db.query(Product).filter(Product.product_id == product_id).first()
            if not product:
                QMessageBox.warning(self, "Error", "Product not found.")
                return
            
            product_name = product.name
            db.delete(product)
            db.commit()
            
            logger.info(f"Product deleted: {product_name} (ID: {product_id})")
            QMessageBox.information(self, "Success", f"Product '{product_name}' deleted successfully!")
            
            self.load_products()
            
        except Exception as e:
            logger.error(f"Error deleting product: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to delete product:\n{str(e)}")
        finally:
            db.close()


class AddProductDialog(QDialog):
    """Dialog for adding a new product"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setWindowTitle("Add Product")
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
        self.name_input.setPlaceholderText("Product name")
        form_layout.addRow("Name:", self.name_input)
        
        # Category
        self.category_combo = QComboBox()
        self.load_categories()
        form_layout.addRow("Category:", self.category_combo)
        
        # Price
        self.price_input = QDoubleSpinBox()
        self.price_input.setMinimum(0.0)
        self.price_input.setMaximum(9999.99)
        self.price_input.setDecimals(2)
        self.price_input.setPrefix("$")
        form_layout.addRow("Price:", self.price_input)
        
        # Cost Price
        self.cost_price_input = QDoubleSpinBox()
        self.cost_price_input.setMinimum(0.0)
        self.cost_price_input.setMaximum(9999.99)
        self.cost_price_input.setDecimals(2)
        self.cost_price_input.setPrefix("$")
        form_layout.addRow("Cost Price:", self.cost_price_input)
        
        # Description
        from PyQt6.QtWidgets import QTextEdit
        self.description_input = QTextEdit()
        self.description_input.setPlaceholderText("Product description...")
        self.description_input.setMaximumHeight(80)
        form_layout.addRow("Description:", self.description_input)
        
        # Image URL (optional)
        self.image_url_input = QLineEdit()
        self.image_url_input.setPlaceholderText("Image URL (optional)")
        form_layout.addRow("Image URL:", self.image_url_input)
        
        # Active status
        self.active_checkbox = QCheckBox()
        self.active_checkbox.setChecked(True)
        form_layout.addRow("Active:", self.active_checkbox)
        
        layout.addLayout(form_layout)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        save_btn = QPushButton("Add Product")
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
    
    def load_categories(self):
        """Load categories from database, create defaults if none exist"""
        db = get_db_session()
        try:
            categories = db.query(Category).all()
            
            # If no categories exist, create default ones
            if not categories:
                from src.utils.create_categories import create_default_categories
                create_default_categories()
                # Reload categories
                categories = db.query(Category).all()
            
            for category in categories:
                self.category_combo.addItem(category.name, category.category_id)
        except Exception as e:
            logger.error(f"Error loading categories: {e}")
        finally:
            db.close()
    
    def handle_save(self):
        """Handle save button click"""
        name = self.name_input.text().strip()
        if not name:
            QMessageBox.warning(self, "Validation Error", "Product name is required.")
            return
        
        category_id = self.category_combo.currentData()
        if not category_id:
            QMessageBox.warning(self, "Validation Error", "Please select a category.")
            return
        
        cost_price = self.cost_price_input.value() if self.cost_price_input.value() > 0 else None
        description = self.description_input.toPlainText().strip() or None
        image_url = self.image_url_input.text().strip() or None
        
        db = get_db_session()
        try:
            new_product = Product(
                name=name,
                category_id=category_id,
                price=self.price_input.value(),
                cost_price=cost_price,
                description=description,
                image_url=image_url,
                is_active=self.active_checkbox.isChecked(),
                user_id=self.user_id
            )
            
            db.add(new_product)
            db.commit()
            
            logger.info(f"New product added: {name}")
            QMessageBox.information(self, "Success", f"Product '{name}' added successfully!")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error adding product: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to add product:\n{str(e)}")
        finally:
            db.close()


class EditProductDialog(QDialog):
    """Dialog for editing an existing product"""
    
    def __init__(self, product_id: int, user_id: int, parent=None):
        super().__init__(parent)
        self.product_id = product_id
        self.user_id = user_id
        self.setWindowTitle("Edit Product")
        self.setModal(True)
        self.load_product()
        self.setup_ui()
    
    def load_product(self):
        """Load product data"""
        db = get_db_session()
        try:
            self.product = db.query(Product).filter(Product.product_id == self.product_id).first()
            if not self.product:
                QMessageBox.warning(self, "Error", "Product not found.")
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
        self.name_input.setText(self.product.name)
        form_layout.addRow("Name:", self.name_input)
        
        # Category
        self.category_combo = QComboBox()
        self.load_categories()
        # Set current category if product has one
        if self.product.category_id:
            index = self.category_combo.findData(self.product.category_id)
            if index >= 0:
                self.category_combo.setCurrentIndex(index)
        form_layout.addRow("Category:", self.category_combo)
        
        # Price
        self.price_input = QDoubleSpinBox()
        self.price_input.setMinimum(0.0)
        self.price_input.setMaximum(9999.99)
        self.price_input.setDecimals(2)
        self.price_input.setPrefix("$")
        self.price_input.setValue(self.product.price)
        form_layout.addRow("Price:", self.price_input)
        
        # Cost Price
        self.cost_price_input = QDoubleSpinBox()
        self.cost_price_input.setMinimum(0.0)
        self.cost_price_input.setMaximum(9999.99)
        self.cost_price_input.setDecimals(2)
        self.cost_price_input.setPrefix("$")
        self.cost_price_input.setValue(self.product.cost_price or 0.0)
        form_layout.addRow("Cost Price:", self.cost_price_input)
        
        # Description
        from PyQt6.QtWidgets import QTextEdit
        self.description_input = QTextEdit()
        self.description_input.setText(self.product.description or "")
        self.description_input.setMaximumHeight(80)
        form_layout.addRow("Description:", self.description_input)
        
        # Image URL
        self.image_url_input = QLineEdit()
        self.image_url_input.setText(self.product.image_url or "")
        form_layout.addRow("Image URL:", self.image_url_input)
        
        # Active status
        self.active_checkbox = QCheckBox()
        self.active_checkbox.setChecked(self.product.is_active)
        form_layout.addRow("Active:", self.active_checkbox)
        
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
    
    def load_categories(self):
        """Load categories from database, create defaults if none exist"""
        db = get_db_session()
        try:
            categories = db.query(Category).all()
            
            # If no categories exist, create default ones
            if not categories:
                from src.utils.create_categories import create_default_categories
                create_default_categories()
                # Reload categories
                categories = db.query(Category).all()
            
            for category in categories:
                self.category_combo.addItem(category.name, category.category_id)
        except Exception as e:
            logger.error(f"Error loading categories: {e}")
        finally:
            db.close()
    
    def handle_save(self):
        """Handle save button click"""
        name = self.name_input.text().strip()
        if not name:
            QMessageBox.warning(self, "Validation Error", "Product name is required.")
            return
        
        category_id = self.category_combo.currentData()
        if not category_id:
            QMessageBox.warning(self, "Validation Error", "Please select a category.")
            return
        
        cost_price = self.cost_price_input.value() if self.cost_price_input.value() > 0 else None
        description = self.description_input.toPlainText().strip() or None
        image_url = self.image_url_input.text().strip() or None
        
        db = get_db_session()
        try:
            product = db.query(Product).filter(Product.product_id == self.product_id).first()
            if not product:
                QMessageBox.warning(self, "Error", "Product not found.")
                return
            
            product.name = name
            product.category_id = category_id
            product.price = self.price_input.value()
            product.cost_price = cost_price
            product.description = description
            product.image_url = image_url
            product.is_active = self.active_checkbox.isChecked()
            
            db.commit()
            
            logger.info(f"Product updated: {name} (ID: {self.product_id})")
            QMessageBox.information(self, "Success", f"Product '{name}' updated successfully!")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error updating product: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to update product:\n{str(e)}")
        finally:
            db.close()

