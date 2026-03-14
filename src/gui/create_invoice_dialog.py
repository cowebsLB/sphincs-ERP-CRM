"""
Create Invoice Dialog - Create new invoices (sales or purchase)
"""

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QLineEdit, QComboBox, QDoubleSpinBox, QFormLayout, QMessageBox,
    QDateEdit, QTextEdit, QTableWidget, QTableWidgetItem, QHeaderView
)
from PyQt6.QtCore import Qt, QDate
from loguru import logger
from datetime import date
from src.database.connection import get_db_session
from src.database.models import Invoice, Customer, Supplier, Product
from src.gui.table_utils import enable_table_auto_resize


class CreateInvoiceDialog(QDialog):
    """Dialog for creating a new invoice"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.invoice_items = []  # List of {product_id, quantity, unit_price, total}
        self.setWindowTitle("Create Invoice")
        self.setModal(True)
        self.setMinimumSize(700, 600)
        self.setup_ui()
    
    def setup_ui(self):
        """Setup dialog UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(24, 24, 24, 24)
        
        form_layout = QFormLayout()
        form_layout.setSpacing(12)
        
        # Invoice type
        self.type_combo = QComboBox()
        self.type_combo.addItems(["sales", "purchase"])
        self.type_combo.currentTextChanged.connect(self.update_type_dependent_fields)
        form_layout.addRow("Invoice Type *:", self.type_combo)
        
        # Customer/Supplier selection
        self.entity_combo = QComboBox()
        self.entity_combo.addItem("Select...", None)
        self.load_entities()
        form_layout.addRow("Customer/Supplier:", self.entity_combo)
        
        # Invoice number (auto-generated or manual)
        self.invoice_number_input = QLineEdit()
        self.invoice_number_input.setPlaceholderText("Auto-generated if left empty")
        form_layout.addRow("Invoice Number:", self.invoice_number_input)
        
        # Issue date
        self.issue_date = QDateEdit()
        self.issue_date.setDate(QDate.currentDate())
        self.issue_date.setCalendarPopup(True)
        form_layout.addRow("Issue Date *:", self.issue_date)
        
        # Due date
        self.due_date = QDateEdit()
        self.due_date.setDate(QDate.currentDate().addDays(30))
        self.due_date.setCalendarPopup(True)
        form_layout.addRow("Due Date:", self.due_date)
        
        layout.addLayout(form_layout)
        
        # Invoice items section
        items_label = QLabel("Invoice Items")
        items_label.setStyleSheet("""
            color: #162640;
            font-size: 16px;
            font-weight: 600;
        """)
        layout.addWidget(items_label)
        
        # Items table
        self.items_table = QTableWidget()
        self.items_table.setColumnCount(5)
        self.items_table.setHorizontalHeaderLabels([
            "Product", "Quantity", "Unit Price", "Total", "Actions"
        ])
        enable_table_auto_resize(self.items_table)
        self.items_table.setStyleSheet("""
            QTableWidget {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
            }
        """)
        layout.addWidget(self.items_table)
        
        # Add item button
        add_item_btn = QPushButton("Add Item")
        add_item_btn.setStyleSheet("""
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
        add_item_btn.clicked.connect(self.add_item)
        layout.addWidget(add_item_btn)
        
        # Totals section
        totals_frame = QHBoxLayout()
        totals_frame.addStretch()
        
        subtotal_label = QLabel("Subtotal:")
        self.subtotal_value = QLabel("$0.00")
        totals_frame.addWidget(subtotal_label)
        totals_frame.addWidget(self.subtotal_value)
        
        tax_label = QLabel("Tax:")
        self.tax_value = QLabel("$0.00")
        totals_frame.addWidget(tax_label)
        totals_frame.addWidget(self.tax_value)
        
        total_label = QLabel("Total:")
        total_label.setStyleSheet("font-weight: 600; font-size: 16px;")
        self.total_value = QLabel("$0.00")
        self.total_value.setStyleSheet("font-weight: 700; font-size: 16px; color: #2F7DFF;")
        totals_frame.addWidget(total_label)
        totals_frame.addWidget(self.total_value)
        
        layout.addLayout(totals_frame)
        
        # Notes
        notes_label = QLabel("Notes:")
        layout.addWidget(notes_label)
        self.notes_input = QTextEdit()
        self.notes_input.setMaximumHeight(80)
        self.notes_input.setPlaceholderText("Additional notes (optional)...")
        layout.addWidget(self.notes_input)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        save_btn = QPushButton("Create Invoice")
        save_btn.setStyleSheet("""
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
        save_btn.clicked.connect(self.handle_save)
        buttons_layout.addWidget(save_btn)
        
        layout.addLayout(buttons_layout)
    
    def load_entities(self):
        """Load customers or suppliers based on invoice type"""
        self.entity_combo.clear()
        self.entity_combo.addItem("Select...", None)
        
        db = get_db_session()
        try:
            invoice_type = self.type_combo.currentText()
            if invoice_type == "sales":
                customers = db.query(Customer).filter(Customer.status == "active").all()
                for customer in customers:
                    self.entity_combo.addItem(
                        f"{customer.first_name} {customer.last_name}",
                        customer.customer_id
                    )
            else:  # purchase
                suppliers = db.query(Supplier).filter(Supplier.status == "active").all()
                for supplier in suppliers:
                    self.entity_combo.addItem(
                        supplier.name,
                        supplier.supplier_id
                    )
        except Exception as e:
            logger.error(f"Error loading entities: {e}")
        finally:
            db.close()
    
    def update_type_dependent_fields(self):
        """Update fields when invoice type changes"""
        self.load_entities()
    
    def add_item(self):
        """Add item to invoice"""
        from src.gui.add_invoice_item_dialog import AddInvoiceItemDialog
        dialog = AddInvoiceItemDialog(self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            item = dialog.get_item()
            self.invoice_items.append(item)
            self.update_items_table()
            self.update_totals()
    
    def update_items_table(self):
        """Update the items table display"""
        self.items_table.setRowCount(len(self.invoice_items))
        
        for row, item in enumerate(self.invoice_items):
            product_name = item.get('product_name', 'Unknown')
            self.items_table.setItem(row, 0, QTableWidgetItem(product_name))
            self.items_table.setItem(row, 1, QTableWidgetItem(str(item['quantity'])))
            self.items_table.setItem(row, 2, QTableWidgetItem(f"${item['unit_price']:.2f}"))
            self.items_table.setItem(row, 3, QTableWidgetItem(f"${item['total']:.2f}"))
            
            # Remove button
            remove_btn = QPushButton("Remove")
            remove_btn.setStyleSheet("""
                QPushButton {
                    background-color: #D92D20;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 4px 8px;
                }
            """)
            remove_btn.clicked.connect(lambda checked, r=row: self.remove_item(r))
            self.items_table.setCellWidget(row, 4, remove_btn)
    
    def remove_item(self, row: int):
        """Remove item from invoice"""
        if 0 <= row < len(self.invoice_items):
            self.invoice_items.pop(row)
            self.update_items_table()
            self.update_totals()
    
    def update_totals(self):
        """Update invoice totals"""
        subtotal = sum(item['total'] for item in self.invoice_items)
        tax = subtotal * 0.10  # 10% tax (can be made configurable)
        total = subtotal + tax
        
        self.subtotal_value.setText(f"${subtotal:.2f}")
        self.tax_value.setText(f"${tax:.2f}")
        self.total_value.setText(f"${total:.2f}")
    
    def handle_save(self):
        """Handle save button click"""
        if not self.invoice_items:
            QMessageBox.warning(self, "Validation Error", "Please add at least one item to the invoice.")
            return
        
        invoice_type = self.type_combo.currentText()
        issue_date = self.issue_date.date().toPyDate()
        due_date = self.due_date.date().toPyDate()
        
        # Calculate totals
        subtotal = sum(item['total'] for item in self.invoice_items)
        tax = subtotal * 0.10  # 10% tax
        total = subtotal + tax
        
        # Generate invoice number if not provided
        invoice_number = self.invoice_number_input.text().strip()
        if not invoice_number:
            from datetime import datetime
            prefix = "INV" if invoice_type == "sales" else "PO"
            invoice_number = f"{prefix}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        db = get_db_session()
        try:
            # Check if invoice number already exists
            existing = db.query(Invoice).filter(Invoice.invoice_number == invoice_number).first()
            if existing:
                QMessageBox.warning(self, "Validation Error", 
                    f"Invoice number '{invoice_number}' already exists.")
                return
            
            # Get entity IDs
            entity_id = self.entity_combo.currentData()
            customer_id = entity_id if invoice_type == "sales" else None
            supplier_id = entity_id if invoice_type == "purchase" else None
            
            new_invoice = Invoice(
                invoice_number=invoice_number,
                customer_id=customer_id,
                supplier_id=supplier_id,
                invoice_type=invoice_type,
                subtotal=subtotal,
                tax_amount=tax,
                discount_amount=0.0,
                total_amount=total,
                currency="USD",
                issue_date=issue_date,
                due_date=due_date,
                status="draft",
                notes=self.notes_input.toPlainText().strip() or None
            )
            
            db.add(new_invoice)
            db.commit()
            
            logger.info(f"New invoice created: {invoice_number}")
            QMessageBox.information(self, "Success", 
                f"Invoice '{invoice_number}' created successfully!")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error creating invoice: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to create invoice:\n{str(e)}")
        finally:
            db.close()

