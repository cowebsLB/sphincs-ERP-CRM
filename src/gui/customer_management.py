"""
Customer Management Module - Manage customers
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QDialog, QLineEdit, QFormLayout,
    QMessageBox, QSpinBox, QTabWidget, QComboBox
)
from PyQt6.QtCore import Qt
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import Customer
from src.gui.customer_loyalty import CustomerLoyaltyView
from src.gui.design_system import (
    DATA_TABLE_STYLE,
    DANGER_BUTTON_STYLE,
    INPUT_STYLE,
    PRIMARY_BUTTON_STYLE,
    SEARCH_INPUT_STYLE,
    TAB_WIDGET_STYLE,
    TOOLBAR_CARD_STYLE,
)
from src.gui.table_utils import enable_table_auto_resize


class CustomerManagementView(QWidget):
    """Customer Management View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        self.load_customers()
    
    def setup_ui(self):
        """Setup customer management UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        header_layout.addStretch()
        
        # Add Customer button
        add_btn = QPushButton("Add Customer")
        add_btn.setStyleSheet(PRIMARY_BUTTON_STYLE)
        add_btn.clicked.connect(self.handle_add_customer)
        header_layout.addWidget(add_btn)
        
        layout.addLayout(header_layout)
        layout.addSpacing(12)
        
        # Tabs
        self.tabs = QTabWidget()
        self.tabs.setStyleSheet(TAB_WIDGET_STYLE)
        
        # Customers List tab
        customers_widget = self.create_customers_widget()
        self.tabs.addTab(customers_widget, "Customers")
        
        # Loyalty & Marketing tab
        loyalty_view = CustomerLoyaltyView(self.user_id)
        self.tabs.addTab(loyalty_view, "Loyalty & Marketing")
        
        layout.addWidget(self.tabs)
    
    def create_customers_widget(self) -> QWidget:
        """Create customers list widget"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(0)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Search bar
        search_card = QWidget()
        search_card.setStyleSheet(TOOLBAR_CARD_STYLE)
        search_layout = QHBoxLayout(search_card)
        search_layout.setContentsMargins(14, 10, 14, 10)
        search_layout.setSpacing(12)
        
        search_label = QLabel("Search:")
        search_label.setStyleSheet("""
            color: #2A3A55;
            font-size: 14px;
            font-weight: 500;
        """)
        search_layout.addWidget(search_label)
        
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search by name, phone, email...")
        self.search_input.setStyleSheet(SEARCH_INPUT_STYLE)
        self.search_input.textChanged.connect(self.filter_customers)
        search_layout.addWidget(self.search_input)
        
        search_layout.addStretch()
        layout.addWidget(search_card)
        layout.addSpacing(12)
        
        # Customers table
        self.customers_table = QTableWidget()
        self.customers_table.setColumnCount(6)
        self.customers_table.setHorizontalHeaderLabels([
            "ID", "First Name", "Last Name", "Phone", "Email", "Loyalty Points"
        ])
        
        self.customers_table.setStyleSheet(DATA_TABLE_STYLE)
        
        enable_table_auto_resize(self.customers_table)
        self.customers_table.setAlternatingRowColors(True)
        self.customers_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.customers_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.customers_table.doubleClicked.connect(self.handle_edit_customer)
        
        layout.addWidget(self.customers_table)
        
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
        
        self.customers_table.itemSelectionChanged.connect(self.update_action_buttons)
        layout.addLayout(actions_layout)
        
        return widget
    
    def load_customers(self):
        """Load customers from database"""
        db = get_db_session()
        try:
            self.all_customers = db.query(Customer).all()
            self.filter_customers()
            logger.info(f"Loaded {len(self.all_customers)} customers")
        except Exception as e:
            logger.error(f"Error loading customers: {e}")
        finally:
            db.close()
    
    def display_customers(self, customers_list):
        """Display customers in table"""
        self.customers_table.setRowCount(len(customers_list))
        
        for row, customer in enumerate(customers_list):
            self.customers_table.setItem(row, 0, QTableWidgetItem(str(customer.customer_id)))
            self.customers_table.setItem(row, 1, QTableWidgetItem(customer.first_name))
            self.customers_table.setItem(row, 2, QTableWidgetItem(customer.last_name))
            self.customers_table.setItem(row, 3, QTableWidgetItem(customer.phone or "-"))
            self.customers_table.setItem(row, 4, QTableWidgetItem(customer.email or "-"))
            self.customers_table.setItem(row, 5, QTableWidgetItem(str(customer.loyalty_points)))
    
    def filter_customers(self):
        """Filter customers based on search"""
        if not hasattr(self, 'all_customers'):
            return
        
        search_text = self.search_input.text().lower().strip()
        
        if not search_text:
            self.display_customers(self.all_customers)
            return
        
        filtered = []
        for customer in self.all_customers:
            searchable = f"{customer.first_name} {customer.last_name} {customer.phone or ''} {customer.email or ''}".lower()
            if search_text in searchable:
                filtered.append(customer)
        
        self.display_customers(filtered)
    
    def update_action_buttons(self):
        """Enable/disable action buttons based on selection"""
        has_selection = len(self.customers_table.selectedItems()) > 0
        self.edit_btn.setEnabled(has_selection)
        self.delete_btn.setEnabled(has_selection)
    
    def handle_add_customer(self):
        """Handle add customer button click"""
        dialog = AddCustomerDialog(self.user_id, self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            self.load_customers()
    
    def handle_edit_customer(self, index):
        """Handle double-click on customer row"""
        row = index.row()
        customer_id_item = self.customers_table.item(row, 0)
        if customer_id_item:
            customer_id = int(customer_id_item.text())
            self.open_edit_dialog(customer_id)
    
    def open_edit_dialog(self, customer_id: int):
        """Open edit dialog for a customer"""
        dialog = EditCustomerDialog(customer_id, self.user_id, self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            self.load_customers()
    
    def handle_edit_selected(self):
        """Handle edit button click"""
        selected_rows = self.customers_table.selectionModel().selectedRows()
        if selected_rows:
            row = selected_rows[0].row()
            customer_id_item = self.customers_table.item(row, 0)
            if customer_id_item:
                customer_id = int(customer_id_item.text())
                self.open_edit_dialog(customer_id)
    
    def handle_delete_selected(self):
        """Handle delete button click"""
        selected_rows = self.customers_table.selectionModel().selectedRows()
        if not selected_rows:
            return
        
        row = selected_rows[0].row()
        customer_id_item = self.customers_table.item(row, 0)
        name_item = self.customers_table.item(row, 1)
        
        if not customer_id_item or not name_item:
            return
        
        customer_id = int(customer_id_item.text())
        customer_name = name_item.text()
        
        reply = QMessageBox.question(
            self,
            "Confirm Delete",
            f"Are you sure you want to delete customer '{customer_name}'?\n\nThis action cannot be undone.",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
            QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            self.delete_customer(customer_id)
    
    def delete_customer(self, customer_id: int):
        """Delete a customer from database"""
        db = get_db_session()
        try:
            customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
            if not customer:
                QMessageBox.warning(self, "Error", "Customer not found.")
                return
            
            customer_name = f"{customer.first_name} {customer.last_name}"
            db.delete(customer)
            db.commit()
            
            logger.info(f"Customer deleted: {customer_name} (ID: {customer_id})")
            QMessageBox.information(self, "Success", f"Customer '{customer_name}' deleted successfully!")
            
            self.load_customers()
            
        except Exception as e:
            logger.error(f"Error deleting customer: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to delete customer:\n{str(e)}")
        finally:
            db.close()


class AddCustomerDialog(QDialog):
    """Dialog for adding a new customer"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setWindowTitle("Add Customer")
        self.setModal(True)
        self.setup_ui()
    
    def setup_ui(self):
        """Setup dialog UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(24, 24, 24, 24)
        self.setStyleSheet(INPUT_STYLE)
        
        form_layout = QFormLayout()
        form_layout.setSpacing(12)
        
        # First Name
        self.first_name_input = QLineEdit()
        self.first_name_input.setPlaceholderText("First name")
        form_layout.addRow("First Name *:", self.first_name_input)
        
        # Last Name
        self.last_name_input = QLineEdit()
        self.last_name_input.setPlaceholderText("Last name")
        form_layout.addRow("Last Name *:", self.last_name_input)
        
        # Phone
        self.phone_input = QLineEdit()
        self.phone_input.setPlaceholderText("Phone number")
        form_layout.addRow("Phone:", self.phone_input)
        
        # Email
        self.email_input = QLineEdit()
        self.email_input.setPlaceholderText("email@example.com")
        form_layout.addRow("Email:", self.email_input)
        
        # Loyalty Points
        self.points_input = QSpinBox()
        self.points_input.setMinimum(0)
        self.points_input.setMaximum(999999)
        self.points_input.setValue(0)
        form_layout.addRow("Loyalty Points:", self.points_input)
        
        layout.addLayout(form_layout)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        save_btn = QPushButton("Add Customer")
        save_btn.setStyleSheet(PRIMARY_BUTTON_STYLE)
        save_btn.clicked.connect(self.handle_save)
        buttons_layout.addWidget(save_btn)
        
        layout.addLayout(buttons_layout)
    
    def handle_save(self):
        """Handle save button click"""
        first_name = self.first_name_input.text().strip()
        last_name = self.last_name_input.text().strip()
        
        if not first_name:
            QMessageBox.warning(self, "Validation Error", "First name is required.")
            return
        
        if not last_name:
            QMessageBox.warning(self, "Validation Error", "Last name is required.")
            return
        
        phone = self.phone_input.text().strip() or None
        email = self.email_input.text().strip() or None
        
        db = get_db_session()
        try:
            new_customer = Customer(
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                email=email,
                loyalty_points=self.points_input.value(),
                status="active",
                user_id=self.user_id
            )
            
            db.add(new_customer)
            db.commit()
            
            customer_name = f"{first_name} {last_name}"
            logger.info(f"New customer added: {customer_name}")
            QMessageBox.information(self, "Success", f"Customer '{customer_name}' added successfully!")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error adding customer: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to add customer:\n{str(e)}")
        finally:
            db.close()


class EditCustomerDialog(QDialog):
    """Dialog for editing an existing customer"""
    
    def __init__(self, customer_id: int, user_id: int, parent=None):
        super().__init__(parent)
        self.customer_id = customer_id
        self.user_id = user_id
        self.setWindowTitle("Edit Customer")
        self.setModal(True)
        self.load_customer()
        self.setup_ui()
    
    def load_customer(self):
        """Load customer data"""
        db = get_db_session()
        try:
            self.customer = db.query(Customer).filter(Customer.customer_id == self.customer_id).first()
            if not self.customer:
                QMessageBox.warning(self, "Error", "Customer not found.")
                self.reject()
        finally:
            db.close()
    
    def setup_ui(self):
        """Setup dialog UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(24, 24, 24, 24)
        self.setStyleSheet(INPUT_STYLE)
        
        form_layout = QFormLayout()
        form_layout.setSpacing(12)
        
        # First Name
        self.first_name_input = QLineEdit()
        self.first_name_input.setText(self.customer.first_name)
        form_layout.addRow("First Name *:", self.first_name_input)
        
        # Last Name
        self.last_name_input = QLineEdit()
        self.last_name_input.setText(self.customer.last_name)
        form_layout.addRow("Last Name *:", self.last_name_input)
        
        # Phone
        self.phone_input = QLineEdit()
        self.phone_input.setText(self.customer.phone or "")
        form_layout.addRow("Phone:", self.phone_input)
        
        # Email
        self.email_input = QLineEdit()
        self.email_input.setText(self.customer.email or "")
        form_layout.addRow("Email:", self.email_input)
        
        # Loyalty Points
        self.points_input = QSpinBox()
        self.points_input.setMinimum(0)
        self.points_input.setMaximum(999999)
        self.points_input.setValue(self.customer.loyalty_points)
        form_layout.addRow("Loyalty Points:", self.points_input)
        
        # Status
        self.status_combo = QComboBox()
        self.status_combo.addItems(["active", "inactive"])
        self.status_combo.setCurrentText(self.customer.status)
        form_layout.addRow("Status:", self.status_combo)
        
        layout.addLayout(form_layout)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        save_btn = QPushButton("Save Changes")
        save_btn.setStyleSheet(PRIMARY_BUTTON_STYLE)
        save_btn.clicked.connect(self.handle_save)
        buttons_layout.addWidget(save_btn)
        
        layout.addLayout(buttons_layout)
    
    def handle_save(self):
        """Handle save button click"""
        first_name = self.first_name_input.text().strip()
        last_name = self.last_name_input.text().strip()
        
        if not first_name:
            QMessageBox.warning(self, "Validation Error", "First name is required.")
            return
        
        if not last_name:
            QMessageBox.warning(self, "Validation Error", "Last name is required.")
            return
        
        phone = self.phone_input.text().strip() or None
        email = self.email_input.text().strip() or None
        
        db = get_db_session()
        try:
            customer = db.query(Customer).filter(Customer.customer_id == self.customer_id).first()
            if not customer:
                QMessageBox.warning(self, "Error", "Customer not found.")
                return
            
            customer.first_name = first_name
            customer.last_name = last_name
            customer.phone = phone
            customer.email = email
            customer.loyalty_points = self.points_input.value()
            customer.status = self.status_combo.currentText()
            
            db.commit()
            
            customer_name = f"{first_name} {last_name}"
            logger.info(f"Customer updated: {customer_name} (ID: {self.customer_id})")
            QMessageBox.information(self, "Success", f"Customer '{customer_name}' updated successfully!")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error updating customer: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to update customer:\n{str(e)}")
        finally:
            db.close()

