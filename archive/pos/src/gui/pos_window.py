"""
POS Main Window - Point of Sale Interface
"""

from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel, 
    QPushButton, QFrame, QGridLayout, QListWidget, QListWidgetItem,
    QLineEdit, QComboBox, QScrollArea, QTableWidget, QTableWidgetItem,
    QHeaderView, QAbstractItemView, QDialog
)
from PyQt6.QtCore import Qt, pyqtSignal, QSize, QTimer
from PyQt6.QtGui import QFont, QColor, QKeySequence, QShortcut, QIcon
from pathlib import Path
from loguru import logger
from typing import Optional, Dict, List
from decimal import Decimal
from datetime import datetime


class ProductButton(QPushButton):
    """Product button for the product grid - Compact and efficient"""
    
    def __init__(self, product_name: str, price: float, product_id: int, parent=None):
        super().__init__(parent)
        self.product_id = product_id
        self.product_name = product_name
        self.price = price
        
        # Stack name and price vertically
        self.setText(f"{product_name}\n${price:.2f}")
        self.setMinimumSize(140, 100)  # More compact
        self.setStyleSheet("""
            QPushButton {
                background-color: white;
                color: #111827;
                border: 2px solid #E5E7EB;
                border-radius: 8px;
                padding: 12px 8px;
                font-size: 15px;
                font-weight: 600;
                text-align: center;
            }
            QPushButton:hover {
                background-color: #F3F4F6;
                border-color: #2563EB;
            }
            QPushButton:pressed {
                background-color: #10B981;
                color: white;
                border-color: #059669;
            }
        """)


class POSWindow(QMainWindow):
    """Main POS Window with integrated login"""
    
    # Signals
    logout_requested = pyqtSignal()
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.staff_data = None
        self.username = None
        self.role = None
        self.user_id = None
        self.staff_id = None
        
        # Cart data: {product_id: {'name': str, 'price': float, 'quantity': int}}
        self.cart: Dict[int, Dict] = {}
        self.discount_amount = 0.0
        self.held_orders = []  # Store held orders
        
        self.setWindowTitle("Sphincs POS")
        
        # Set window icon
        icon_path = Path(__file__).parent.parent.parent / "sphincs_icon_pos.ico"
        if not icon_path.exists():
            icon_path = Path(__file__).parent.parent.parent / "sphincs_icon.ico"
        if icon_path.exists():
            self.setWindowIcon(QIcon(str(icon_path)))
        self.setMinimumSize(1400, 900)
        
        # Show login screen first
        self.show_login_screen()
        
        # Maximize window on startup
        self.showMaximized()
        
        logger.info("POS Window initialized - showing login screen")
    
    def show_login_screen(self):
        """Show the POS login screen"""
        from src.gui.pos_login import POSLoginScreen
        
        login_screen = POSLoginScreen()
        
        def on_login_success(staff_data):
            """Handle successful login"""
            self.staff_data = staff_data
            self.username = staff_data.username
            self.role = staff_data.role
            self.user_id = staff_data.user_id
            self.staff_id = staff_data.staff_id
            
            logger.info(f"POS login successful: {staff_data.first_name} {staff_data.last_name} (Staff ID: {self.staff_id})")
            
            # Switch to main POS interface
            self.show_pos_interface()
        
        login_screen.login_successful.connect(on_login_success)
        
        # Set login screen as central widget
        self.setCentralWidget(login_screen)
        self.setWindowTitle("Sphincs POS - Login")
    
    def show_pos_interface(self):
        """Show the main POS interface after login"""
        self.setWindowTitle(f"Sphincs POS - {self.staff_data.first_name} {self.staff_data.last_name}")
        
        # Setup main UI
        self.setup_ui()
        self.setup_keyboard_shortcuts()
        self.load_products()
        
        logger.info(f"POS interface displayed for: {self.staff_data.first_name} {self.staff_data.last_name}")
    
    def setup_ui(self):
        """Setup POS window UI"""
        # Central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Main layout
        main_layout = QVBoxLayout(central_widget)
        main_layout.setSpacing(0)
        main_layout.setContentsMargins(0, 0, 0, 0)
        
        # Top navigation bar
        nav_bar = self.create_navigation_bar()
        main_layout.addWidget(nav_bar)
        
        # Main content area (products + order)
        content_layout = QHBoxLayout()
        content_layout.setSpacing(16)
        content_layout.setContentsMargins(16, 16, 16, 16)
        
        # Left side: Products
        products_panel = self.create_products_panel()
        content_layout.addWidget(products_panel, 2)  # Takes 2/3 of space
        
        # Right side: Current Order
        order_panel = self.create_order_panel()
        content_layout.addWidget(order_panel, 1)  # Takes 1/3 of space
        
        main_layout.addLayout(content_layout)
    
    def create_navigation_bar(self) -> QFrame:
        """Create simplified top navigation bar"""
        nav_frame = QFrame()
        nav_frame.setStyleSheet("""
            QFrame {
                background-color: white;
                border-bottom: 2px solid #E5E7EB;
                padding: 8px 20px;
            }
        """)
        nav_frame.setFixedHeight(64)
        
        layout = QHBoxLayout(nav_frame)
        layout.setSpacing(20)
        layout.setContentsMargins(20, 8, 20, 8)
        
        # App name - larger and more prominent
        app_label = QLabel("Sphincs POS")
        app_label.setStyleSheet("""
            color: #2563EB;
            font-size: 24px;
            font-weight: 700;
        """)
        layout.addWidget(app_label)
        
        layout.addStretch()
        
        # User info - simplified
        if self.staff_data:
            user_label = QLabel(f"{self.staff_data.first_name} {self.staff_data.last_name}")
        else:
            user_label = QLabel("Not logged in")
        user_label.setStyleSheet("""
            color: #6B7280;
            font-size: 16px;
            font-weight: 500;
            padding: 8px 16px;
        """)
        layout.addWidget(user_label)
        
        # Logout button - larger and more visible
        logout_btn = QPushButton("Logout")
        logout_btn.setMinimumSize(100, 40)
        logout_btn.setStyleSheet("""
            QPushButton {
                background-color: #EF4444;
                color: white;
                font-size: 16px;
                font-weight: 600;
                padding: 10px 20px;
                border-radius: 8px;
                border: none;
            }
            QPushButton:hover {
                background-color: #DC2626;
            }
        """)
        logout_btn.clicked.connect(self.handle_logout)
        layout.addWidget(logout_btn)
        
        return nav_frame
    
    def create_products_panel(self) -> QWidget:
        """Create simplified products panel - large buttons, easy access"""
        panel = QWidget()
        layout = QVBoxLayout(panel)
        layout.setSpacing(16)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Simple category filter bar - larger and more accessible
        filter_frame = QFrame()
        filter_frame.setStyleSheet("""
            QFrame {
                background-color: white;
                border: 2px solid #E5E7EB;
                border-radius: 10px;
                padding: 12px;
            }
        """)
        filter_layout = QHBoxLayout(filter_frame)
        filter_layout.setSpacing(12)
        filter_layout.setContentsMargins(16, 12, 16, 12)
        
        # Category buttons - large, touch-friendly
        self.category_buttons = {}
        categories = ["All", "Main", "Side", "Drink", "Dessert"]
        for cat in categories:
            btn = QPushButton(cat)
            btn.setMinimumSize(100, 50)
            if cat == "All":
                btn.setStyleSheet("""
                    QPushButton {
                        background-color: #2563EB;
                        color: white;
                        font-size: 16px;
                        font-weight: 700;
                        border: none;
                        border-radius: 8px;
                        padding: 12px 20px;
                    }
                """)
            else:
                btn.setStyleSheet("""
                    QPushButton {
                        background-color: #F3F4F6;
                        color: #374151;
                        font-size: 16px;
                        font-weight: 600;
                        border: 2px solid #E5E7EB;
                        border-radius: 8px;
                        padding: 12px 20px;
                    }
                    QPushButton:hover {
                        background-color: #E5E7EB;
                        border-color: #2563EB;
                    }
                """)
            btn.clicked.connect(lambda checked, c=cat: self.filter_by_category(c))
            self.category_buttons[cat] = btn
            filter_layout.addWidget(btn)
        
        filter_layout.addStretch()
        layout.addWidget(filter_frame)
        
        # Products grid (scrollable) - larger spacing
        scroll_area = QScrollArea()
        scroll_area.setWidgetResizable(True)
        scroll_area.setFrameShape(QFrame.Shape.NoFrame)
        scroll_area.setStyleSheet("""
            QScrollArea {
                background-color: #F9FAFB;
                border: none;
            }
        """)
        
        products_widget = QWidget()
        self.products_layout = QGridLayout(products_widget)
        self.products_layout.setSpacing(10)  # Reduced spacing for higher density
        self.products_layout.setContentsMargins(12, 12, 12, 12)
        
        scroll_area.setWidget(products_widget)
        layout.addWidget(scroll_area)
        
        return panel
    
    def create_order_panel(self) -> QWidget:
        """Create simplified current order panel - clear and easy to read"""
        panel = QFrame()
        panel.setFrameShape(QFrame.Shape.StyledPanel)
        panel.setStyleSheet("""
            QFrame {
                background-color: white;
                border: 3px solid #E5E7EB;
                border-radius: 12px;
                padding: 20px;
            }
        """)
        
        layout = QVBoxLayout(panel)
        layout.setSpacing(12)
        layout.setContentsMargins(16, 16, 16, 16)
        
        # Title - compact
        title = QLabel("ORDER")
        title.setStyleSheet("""
            color: #111827;
            font-size: 18px;
            font-weight: 700;
            padding-bottom: 4px;
        """)
        layout.addWidget(title)
        
        # Order items list - MAXIMIZED for visibility
        self.order_list = QListWidget()
        self.order_list.setStyleSheet("""
            QListWidget {
                border: 2px solid #E5E7EB;
                border-radius: 8px;
                background-color: #F9FAFB;
                padding: 4px;
            }
            QListWidget::item {
                background-color: white;
                border: 1px solid #E5E7EB;
                border-radius: 6px;
                margin: 2px 0;
                min-height: 50px;
            }
            QListWidget::item:selected {
                background-color: #DBEAFE;
                border-color: #2563EB;
            }
        """)
        # Give order list maximum space
        layout.addWidget(self.order_list, 3)  # Takes 3x more space than other elements
        
        # Totals section - Compact footer for order list
        totals_frame = QFrame()
        totals_frame.setStyleSheet("""
            QFrame {
                background-color: #F9FAFB;
                border: 2px solid #E5E7EB;
                border-radius: 8px;
                padding: 12px;
            }
        """)
        totals_layout = QVBoxLayout(totals_frame)
        totals_layout.setSpacing(6)
        totals_layout.setContentsMargins(12, 8, 12, 8)
        
        # Subtotal
        self.subtotal_label = QLabel("Subtotal: $0.00")
        self.subtotal_label.setStyleSheet("""
            color: #374151;
            font-size: 16px;
            font-weight: 500;
            padding: 4px 0;
        """)
        totals_layout.addWidget(self.subtotal_label)
        
        # Tax
        self.tax_label = QLabel("Tax: $0.00")
        self.tax_label.setStyleSheet("""
            color: #374151;
            font-size: 16px;
            font-weight: 500;
            padding: 4px 0;
        """)
        totals_layout.addWidget(self.tax_label)
        
        # Divider
        divider = QFrame()
        divider.setFrameShape(QFrame.Shape.HLine)
        divider.setStyleSheet("background-color: #E5E7EB; max-height: 1px;")
        divider.setFixedHeight(1)
        totals_layout.addWidget(divider)
        
        # Total - Clear but not overwhelming
        self.total_label = QLabel("TOTAL: $0.00")
        self.total_label.setStyleSheet("""
            color: #111827;
            font-size: 24px;
            font-weight: 700;
            padding: 6px 0;
        """)
        totals_layout.addWidget(self.total_label)
        
        layout.addWidget(totals_frame, 0)  # Minimal space
        
        # Action buttons - Reorganized: Primary action first, secondary below
        buttons_layout = QVBoxLayout()
        buttons_layout.setSpacing(8)
        
        # Payment/Checkout button - MOST PROMINENT (primary action)
        payment_btn = QPushButton("CHECKOUT")
        payment_btn.setMinimumHeight(60)
        payment_btn.setStyleSheet("""
            QPushButton {
                background-color: #10B981;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 16px;
                font-size: 22px;
                font-weight: 700;
                min-height: 60px;
            }
            QPushButton:hover {
                background-color: #059669;
            }
            QPushButton:pressed {
                background-color: #047857;
            }
        """)
        payment_btn.clicked.connect(self.process_payment)
        buttons_layout.addWidget(payment_btn)
        
        # Secondary actions - smaller, less prominent
        secondary_layout = QHBoxLayout()
        secondary_layout.setSpacing(8)
        
        # Clear button - smaller
        clear_btn = QPushButton("Clear")
        clear_btn.setMinimumHeight(44)
        clear_btn.setStyleSheet("""
            QPushButton {
                background-color: #EF4444;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px;
                font-size: 14px;
                font-weight: 600;
                min-height: 44px;
            }
            QPushButton:hover {
                background-color: #DC2626;
            }
        """)
        clear_btn.clicked.connect(self.clear_order)
        secondary_layout.addWidget(clear_btn)
        
        # Hold Order button - smaller
        hold_btn = QPushButton("Hold")
        hold_btn.setMinimumHeight(44)
        hold_btn.setStyleSheet("""
            QPushButton {
                background-color: #6B7280;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px;
                font-size: 14px;
                font-weight: 600;
                min-height: 44px;
            }
            QPushButton:hover {
                background-color: #4B5563;
            }
        """)
        hold_btn.clicked.connect(self.hold_order)
        secondary_layout.addWidget(hold_btn)
        
        buttons_layout.addLayout(secondary_layout)
        layout.addLayout(buttons_layout, 0)  # Minimal space
        
        return panel
    
    def setup_keyboard_shortcuts(self):
        """Setup keyboard shortcuts"""
        # Ctrl+C: Cash payment
        cash_shortcut = QShortcut(QKeySequence("Ctrl+C"), self)
        cash_shortcut.activated.connect(lambda: self.process_payment("cash"))
        
        # Ctrl+D: Card payment
        card_shortcut = QShortcut(QKeySequence("Ctrl+D"), self)
        card_shortcut.activated.connect(lambda: self.process_payment("card"))
        
        # Ctrl+X: Clear order
        clear_shortcut = QShortcut(QKeySequence("Ctrl+X"), self)
        clear_shortcut.activated.connect(self.clear_order)
        
        # Ctrl+H: Hold order
        hold_shortcut = QShortcut(QKeySequence("Ctrl+H"), self)
        hold_shortcut.activated.connect(self.hold_order)
    
    def load_products(self):
        """Load products from database"""
        logger.info("Loading products from database...")
        
        from src.database.connection import get_db_session
        from src.database.models import Product, Category
        
        db = get_db_session()
        try:
            # Load active products
            products = db.query(Product).filter(Product.is_active == True).all()
            
            self.all_products = []
            row, col = 0, 0
            max_cols = 4  # More columns for better density
            
            # Clear existing buttons
            for i in reversed(range(self.products_layout.count())):
                self.products_layout.itemAt(i).widget().setParent(None)
            
            for product in products:
                category_name = product.category.name if product.category else "Uncategorized"
                product_btn = ProductButton(product.name, float(product.price), product.product_id)
                product_btn.clicked.connect(lambda checked, pid=product.product_id: self.add_to_cart(pid))
                self.products_layout.addWidget(product_btn, row, col)
                
                self.all_products.append({
                    'id': product.product_id,
                    'name': product.name,
                    'price': float(product.price),
                    'category': category_name
                })
                
                col += 1
                if col >= max_cols:
                    col = 0
                    row += 1
            
            logger.info(f"Loaded {len(products)} products from database")
            
        except Exception as e:
            logger.error(f"Error loading products: {e}")
            # Fallback to placeholder if database fails
            placeholder_products = [
                ("Burger", 10.00, 1, "Main Dish"),
                ("Fries", 5.00, 2, "Side"),
                ("Salad", 8.00, 3, "Side"),
                ("Pizza", 12.00, 4, "Main Dish"),
            ]
            
            self.all_products = []
            row, col = 0, 0
            max_cols = 4
            
            for name, price, product_id, category in placeholder_products:
                product_btn = ProductButton(name, price, product_id)
                product_btn.clicked.connect(lambda checked, pid=product_id: self.add_to_cart(pid))
                self.products_layout.addWidget(product_btn, row, col)
                
                self.all_products.append({
                    'id': product_id,
                    'name': name,
                    'price': price,
                    'category': category
                })
                
                col += 1
                if col >= max_cols:
                    col = 0
                    row += 1
        finally:
            db.close()
    
    def filter_by_category(self, category: str):
        """Filter products by category"""
        # Update button styles
        for cat, btn in self.category_buttons.items():
            if cat == category:
                btn.setStyleSheet("""
                    QPushButton {
                        background-color: #2563EB;
                        color: white;
                        font-size: 16px;
                        font-weight: 700;
                        border: none;
                        border-radius: 8px;
                        padding: 12px 20px;
                    }
                """)
            else:
                btn.setStyleSheet("""
                    QPushButton {
                        background-color: #F3F4F6;
                        color: #374151;
                        font-size: 16px;
                        font-weight: 600;
                        border: 2px solid #E5E7EB;
                        border-radius: 8px;
                        padding: 12px 20px;
                    }
                    QPushButton:hover {
                        background-color: #E5E7EB;
                        border-color: #2563EB;
                    }
                """)
        
        # TODO: Actually filter products
        logger.info(f"Filtering by category: {category}")
    
    def add_to_cart(self, product_id: int):
        """Add product to cart with visual feedback"""
        # Find product button for visual feedback
        product_btn = None
        for i in range(self.products_layout.count()):
            widget = self.products_layout.itemAt(i).widget()
            if isinstance(widget, ProductButton) and widget.product_id == product_id:
                product_btn = widget
                break
        
        # Visual feedback - flash green
        if product_btn:
            original_style = product_btn.styleSheet()
            product_btn.setStyleSheet("""
                QPushButton {
                    background-color: #10B981;
                    color: white;
                    border: 2px solid #059669;
                    border-radius: 8px;
                    padding: 12px 8px;
                    font-size: 15px;
                    font-weight: 600;
                    text-align: center;
                }
            """)
            # Reset after 200ms
            QTimer.singleShot(200, lambda: product_btn.setStyleSheet(original_style))
        
        # Find product
        product = next((p for p in self.all_products if p['id'] == product_id), None)
        if not product:
            logger.warning(f"Product {product_id} not found")
            return
        
        # Add or update cart
        if product_id in self.cart:
            self.cart[product_id]['quantity'] += 1
        else:
            self.cart[product_id] = {
                'name': product['name'],
                'price': product['price'],
                'quantity': 1
            }
        
        self.update_order_display()
        logger.info(f"Added {product['name']} to cart")
    
    def update_order_display(self):
        """Update the order list - compact, clear line items with all info"""
        self.order_list.clear()
        
        subtotal = Decimal('0.00')
        
        for product_id, item in self.cart.items():
            item_total = Decimal(str(item['price'])) * Decimal(str(item['quantity']))
            subtotal += item_total
            
            # Create compact item widget: Qty | Name | Unit Price | Total | Remove
            item_widget = QWidget()
            item_layout = QHBoxLayout(item_widget)
            item_layout.setContentsMargins(8, 4, 8, 4)
            item_layout.setSpacing(8)
            
            # Quantity - compact
            qty_label = QLabel(f"{item['quantity']}×")
            qty_label.setStyleSheet("""
                color: #6B7280;
                font-size: 14px;
                font-weight: 600;
                min-width: 35px;
            """)
            item_layout.addWidget(qty_label)
            
            # Item name
            name_label = QLabel(item['name'])
            name_label.setStyleSheet("""
                color: #111827;
                font-size: 15px;
                font-weight: 600;
            """)
            item_layout.addWidget(name_label)
            
            item_layout.addStretch()
            
            # Unit price (smaller, gray)
            unit_price_label = QLabel(f"@ ${item['price']:.2f}")
            unit_price_label.setStyleSheet("""
                color: #6B7280;
                font-size: 12px;
                font-weight: 400;
            """)
            item_layout.addWidget(unit_price_label)
            
            # Total price - prominent
            total_price_label = QLabel(f"${item_total:.2f}")
            total_price_label.setStyleSheet("""
                color: #111827;
                font-size: 15px;
                font-weight: 700;
                min-width: 60px;
            """)
            total_price_label.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
            item_layout.addWidget(total_price_label)
            
            # Remove button - compact but accessible
            remove_btn = QPushButton("×")
            remove_btn.setMinimumSize(32, 32)
            remove_btn.setMaximumSize(32, 32)
            remove_btn.setStyleSheet("""
                QPushButton {
                    background-color: #EF4444;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 18px;
                    font-weight: 700;
                }
                QPushButton:hover {
                    background-color: #DC2626;
                }
            """)
            remove_btn.clicked.connect(lambda checked, pid=product_id: self.remove_from_cart(pid))
            item_layout.addWidget(remove_btn)
            
            # Create list item
            list_item = QListWidgetItem()
            list_item.setSizeHint(QSize(0, 45))  # Fixed compact height
            self.order_list.addItem(list_item)
            self.order_list.setItemWidget(list_item, item_widget)
        
        # Calculate tax (10% for now)
        tax_rate = Decimal('0.10')
        tax = subtotal * tax_rate
        total = subtotal + tax - Decimal(str(self.discount_amount))
        
        # Update labels
        self.subtotal_label.setText(f"Subtotal: ${subtotal:.2f}")
        self.tax_label.setText(f"Tax: ${tax:.2f}")
        
        # Discount label (create if needed)
        if not hasattr(self, 'discount_label'):
            from PyQt6.QtWidgets import QLabel
            self.discount_label = QLabel()
            self.discount_label.setStyleSheet("""
                color: #EF4444;
                font-size: 14px;
                font-weight: 600;
            """)
            # Insert before total label in totals_layout
            totals_layout = self.tax_label.parent().layout()
            if totals_layout:
                # Find index of total_label
                total_index = totals_layout.indexOf(self.total_label)
                if total_index >= 0:
                    totals_layout.insertWidget(total_index, self.discount_label)
        
        if self.discount_amount > 0:
            self.discount_label.setText(f"Discount: -${self.discount_amount:.2f}")
            self.discount_label.setVisible(True)
        else:
            self.discount_label.setVisible(False)
        
        self.total_label.setText(f"TOTAL: ${total:.2f}")
    
    def remove_from_cart(self, product_id: int):
        """Remove product from cart"""
        if product_id in self.cart:
            del self.cart[product_id]
            self.update_order_display()
            logger.info(f"Removed product {product_id} from cart")
    
    def clear_order(self):
        """Clear the entire order"""
        self.cart.clear()
        self.update_order_display()
        logger.info("Order cleared")
    
    def apply_discount(self):
        """Apply discount to order"""
        if not self.cart:
            logger.warning("Cannot apply discount: cart is empty")
            return
        
        total = sum(item['price'] * item['quantity'] for item in self.cart)
        from src.gui.discount_dialog import DiscountDialog
        dialog = DiscountDialog(total, self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            discount_info = dialog.get_discount_info()
            self.discount_amount = discount_info['amount']
            self.update_order_display()
            logger.info(f"Discount applied: ${self.discount_amount:.2f}")
    
    def hold_order(self):
        """Hold current order"""
        if not self.cart:
            logger.warning("Cannot hold order: cart is empty")
            return
        
        # Store current order
        held_order = {
            'cart': self.cart.copy(),
            'discount_amount': self.discount_amount,
            'timestamp': datetime.now()
        }
        self.held_orders.append(held_order)
        
        # Clear current cart
        self.cart.clear()
        self.discount_amount = 0.0
        self.update_order_display()
        
        logger.info(f"Order held. Total held orders: {len(self.held_orders)}")
        from PyQt6.QtWidgets import QMessageBox
        QMessageBox.information(self, "Order Held", 
            f"Order has been held.\nTotal held orders: {len(self.held_orders)}")
    
    def process_payment(self, method: Optional[str] = None):
        """Process payment"""
        if not self.cart:
            logger.warning("Cannot process payment: cart is empty")
            return
        
        # Calculate total
        subtotal = sum(Decimal(str(item['price'])) * Decimal(str(item['quantity'])) 
                      for item in self.cart.values())
        tax_rate = Decimal('0.10')
        tax = subtotal * tax_rate
        total = float(subtotal + tax - Decimal(str(self.discount_amount)))
        
        # Create order first
        from src.database.connection import get_db_session
        from src.database.models import Order, OrderItem, Payment
        from datetime import datetime
        
        db = get_db_session()
        try:
            # Create order
            order = Order(
                order_datetime=datetime.now(),
                order_type="dine_in",
                order_status="pending",
                total_amount=total,
                staff_id=self.staff_id,
                table_number=None,
                customer_id=None
            )
            db.add(order)
            db.flush()  # Get order_id
            
            # Add order items
            for product_id, item in self.cart.items():
                order_item = OrderItem(
                    order_id=order.order_id,
                    product_id=product_id,
                    quantity=item['quantity'],
                    unit_price=item['price'],
                    total_price=item['price'] * item['quantity']
                )
                db.add(order_item)
            
            db.flush()
            
            # Open payment dialog
            from src.gui.payment_dialog import PaymentDialog
            dialog = PaymentDialog(order.order_id, total, self.user_id, self)
            if dialog.exec() == QDialog.DialogCode.Accepted:
                # Payment processed successfully
                payment_info = dialog.get_payment_info()
                
                # Clear cart
                self.cart.clear()
                self.discount_amount = 0.0
                self.update_order_display()
                
                # Print receipt
                from src.utils.receipt_printer import print_receipt
                print_receipt(order.order_id)
                
                logger.info(f"Payment processed for order {order.order_id}")
                from PyQt6.QtWidgets import QMessageBox
                QMessageBox.information(self, "Payment Complete", 
                    f"Payment processed successfully!\nOrder #{order.order_id}")
            else:
                # Payment cancelled, delete order
                db.rollback()
                logger.info(f"Payment cancelled, order {order.order_id} deleted")
                
        except Exception as e:
            logger.error(f"Error processing payment: {e}")
            db.rollback()
            from PyQt6.QtWidgets import QMessageBox
            QMessageBox.critical(self, "Error", f"Failed to process payment:\n{str(e)}")
        finally:
            db.close()
    
    def handle_logout(self):
        """Handle logout"""
        logger.info("Logout requested")
        self.logout_requested.emit()
        self.close()

