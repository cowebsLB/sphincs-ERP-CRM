"""
Integrations Management View - Online ordering and accounting software
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTabWidget, QLineEdit, QFormLayout, QGroupBox, QMessageBox,
    QComboBox, QTextEdit
)
from loguru import logger
from src.utils.online_ordering import get_ordering_integration, OrderingPlatform
from src.utils.accounting_sync import get_accounting_sync, AccountingSoftware


class IntegrationsView(QWidget):
    """Integrations Management View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
    
    def setup_ui(self):
        """Setup integrations UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        
        title = QLabel("Integrations")
        title.setStyleSheet("""
            color: #162640;
            font-size: 24px;
            font-weight: 700;
        """)
        header_layout.addWidget(title)
        header_layout.addStretch()
        
        layout.addLayout(header_layout)
        layout.addSpacing(24)
        
        # Tabs
        self.tabs = QTabWidget()
        self.tabs.setStyleSheet("""
            QTabWidget::pane {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background-color: white;
            }
            QTabBar::tab {
                background-color: #EDF3FC;
                color: #2A3A55;
                padding: 10px 20px;
                margin-right: 2px;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
            }
            QTabBar::tab:selected {
                background-color: white;
                color: #2F7DFF;
                font-weight: 600;
            }
        """)
        
        # Online Ordering tab
        ordering_tab = self.create_online_ordering_tab()
        self.tabs.addTab(ordering_tab, "Online Ordering")
        
        # Accounting Software tab
        accounting_tab = self.create_accounting_tab()
        self.tabs.addTab(accounting_tab, "Accounting Software")
        
        layout.addWidget(self.tabs)
    
    def create_online_ordering_tab(self):
        """Create online ordering integrations tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(16)
        layout.setContentsMargins(16, 16, 16, 16)
        
        # Platform selection
        platform_group = QGroupBox("Platform Configuration")
        platform_group.setStyleSheet("""
            QGroupBox {
                font-size: 16px;
                font-weight: 600;
                border: 2px solid #C8D4E8;
                border-radius: 8px;
                margin-top: 12px;
                padding-top: 12px;
            }
        """)
        platform_layout = QFormLayout(platform_group)
        
        self.ordering_platform_combo = QComboBox()
        self.ordering_platform_combo.addItems([
            "UberEats", "DoorDash", "Grubhub", "Postmates", "Custom"
        ])
        platform_layout.addRow("Platform:", self.ordering_platform_combo)
        
        self.ordering_api_key = QLineEdit()
        self.ordering_api_key.setPlaceholderText("API Key")
        platform_layout.addRow("API Key:", self.ordering_api_key)
        
        self.ordering_api_secret = QLineEdit()
        self.ordering_api_secret.setEchoMode(QLineEdit.EchoMode.Password)
        self.ordering_api_secret.setPlaceholderText("API Secret")
        platform_layout.addRow("API Secret:", self.ordering_api_secret)
        
        self.ordering_restaurant_id = QLineEdit()
        self.ordering_restaurant_id.setPlaceholderText("Restaurant ID")
        platform_layout.addRow("Restaurant ID:", self.ordering_restaurant_id)
        
        layout.addWidget(platform_group)
        
        # Actions
        actions_layout = QHBoxLayout()
        
        fetch_orders_btn = QPushButton("Fetch Orders")
        fetch_orders_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
            }
        """)
        fetch_orders_btn.clicked.connect(self.handle_fetch_orders)
        actions_layout.addWidget(fetch_orders_btn)
        
        sync_menu_btn = QPushButton("Sync Menu")
        sync_menu_btn.setStyleSheet("""
            QPushButton {
                background-color: #14B8A6;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
            }
        """)
        sync_menu_btn.clicked.connect(self.handle_sync_menu)
        actions_layout.addWidget(sync_menu_btn)
        
        actions_layout.addStretch()
        
        save_btn = QPushButton("Save Configuration")
        save_btn.setStyleSheet("""
            QPushButton {
                background-color: #14B8A6;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
                font-weight: 600;
            }
        """)
        save_btn.clicked.connect(self.handle_save_ordering_config)
        actions_layout.addWidget(save_btn)
        
        layout.addLayout(actions_layout)
        layout.addStretch()
        
        return widget
    
    def create_accounting_tab(self):
        """Create accounting software integrations tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(16)
        layout.setContentsMargins(16, 16, 16, 16)
        
        # Software selection
        software_group = QGroupBox("Accounting Software Configuration")
        software_group.setStyleSheet("""
            QGroupBox {
                font-size: 16px;
                font-weight: 600;
                border: 2px solid #C8D4E8;
                border-radius: 8px;
                margin-top: 12px;
                padding-top: 12px;
            }
        """)
        software_layout = QFormLayout(software_group)
        
        self.accounting_software_combo = QComboBox()
        self.accounting_software_combo.addItems([
            "QuickBooks", "Xero", "Sage", "Wave"
        ])
        software_layout.addRow("Software:", self.accounting_software_combo)
        
        self.accounting_client_id = QLineEdit()
        self.accounting_client_id.setPlaceholderText("Client ID")
        software_layout.addRow("Client ID:", self.accounting_client_id)
        
        self.accounting_client_secret = QLineEdit()
        self.accounting_client_secret.setEchoMode(QLineEdit.EchoMode.Password)
        self.accounting_client_secret.setPlaceholderText("Client Secret")
        software_layout.addRow("Client Secret:", self.accounting_client_secret)
        
        self.accounting_access_token = QLineEdit()
        self.accounting_access_token.setPlaceholderText("Access Token")
        software_layout.addRow("Access Token:", self.accounting_access_token)
        
        self.accounting_refresh_token = QLineEdit()
        self.accounting_refresh_token.setPlaceholderText("Refresh Token")
        software_layout.addRow("Refresh Token:", self.accounting_refresh_token)
        
        self.accounting_company_id = QLineEdit()
        self.accounting_company_id.setPlaceholderText("Company ID")
        software_layout.addRow("Company ID:", self.accounting_company_id)
        
        layout.addWidget(software_group)
        
        # Actions
        actions_layout = QHBoxLayout()
        
        sync_invoices_btn = QPushButton("Sync Invoices")
        sync_invoices_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
            }
        """)
        sync_invoices_btn.clicked.connect(self.handle_sync_invoices)
        actions_layout.addWidget(sync_invoices_btn)
        
        sync_expenses_btn = QPushButton("Sync Expenses")
        sync_expenses_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
            }
        """)
        sync_expenses_btn.clicked.connect(self.handle_sync_expenses)
        actions_layout.addWidget(sync_expenses_btn)
        
        actions_layout.addStretch()
        
        save_btn = QPushButton("Save Configuration")
        save_btn.setStyleSheet("""
            QPushButton {
                background-color: #14B8A6;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
                font-weight: 600;
            }
        """)
        save_btn.clicked.connect(self.handle_save_accounting_config)
        actions_layout.addWidget(save_btn)
        
        layout.addLayout(actions_layout)
        layout.addStretch()
        
        return widget
    
    def handle_save_ordering_config(self):
        """Save online ordering configuration"""
        try:
            platform_name = self.ordering_platform_combo.currentText().lower().replace(" ", "")
            platform_map = {
                'ubereats': OrderingPlatform.UBER_EATS,
                'doordash': OrderingPlatform.DOORDASH,
                'grubhub': OrderingPlatform.GRUBHUB,
                'postmates': OrderingPlatform.POSTMATES,
                'custom': OrderingPlatform.CUSTOM
            }
            platform = platform_map.get(platform_name, OrderingPlatform.CUSTOM)
            
            integration = get_ordering_integration(platform)
            integration.configure(
                self.ordering_api_key.text().strip(),
                self.ordering_api_secret.text().strip(),
                self.ordering_restaurant_id.text().strip()
            )
            
            QMessageBox.information(self, "Success", "Configuration saved successfully")
            
        except Exception as e:
            logger.error(f"Error saving ordering config: {e}")
            QMessageBox.critical(self, "Error", f"Failed to save configuration: {str(e)}")
    
    def handle_fetch_orders(self):
        """Fetch orders from platform"""
        try:
            platform_name = self.ordering_platform_combo.currentText().lower().replace(" ", "")
            platform_map = {
                'ubereats': OrderingPlatform.UBER_EATS,
                'doordash': OrderingPlatform.DOORDASH,
                'grubhub': OrderingPlatform.GRUBHUB,
                'postmates': OrderingPlatform.POSTMATES,
                'custom': OrderingPlatform.CUSTOM
            }
            platform = platform_map.get(platform_name, OrderingPlatform.CUSTOM)
            
            integration = get_ordering_integration(platform)
            orders = integration.fetch_orders()
            
            if orders:
                QMessageBox.information(self, "Success", f"Fetched {len(orders)} orders")
            else:
                QMessageBox.information(self, "Info", "No new orders found")
                
        except Exception as e:
            logger.error(f"Error fetching orders: {e}")
            QMessageBox.critical(self, "Error", f"Failed to fetch orders: {str(e)}")
    
    def handle_sync_menu(self):
        """Sync menu to platform"""
        try:
            from src.database.connection import get_db_session
            from src.database.models import Product
            
            db = get_db_session()
            products = db.query(Product).filter(Product.is_active == True).all()
            db.close()
            
            products_data = [{
                'name': p.name,
                'price': p.price,
                'description': p.description
            } for p in products]
            
            platform_name = self.ordering_platform_combo.currentText().lower().replace(" ", "")
            platform_map = {
                'ubereats': OrderingPlatform.UBER_EATS,
                'doordash': OrderingPlatform.DOORDASH,
                'grubhub': OrderingPlatform.GRUBHUB,
                'postmates': OrderingPlatform.POSTMATES,
                'custom': OrderingPlatform.CUSTOM
            }
            platform = platform_map.get(platform_name, OrderingPlatform.CUSTOM)
            
            integration = get_ordering_integration(platform)
            if integration.sync_menu(products_data):
                QMessageBox.information(self, "Success", "Menu synced successfully")
            else:
                QMessageBox.warning(self, "Warning", "Menu sync failed or not configured")
                
        except Exception as e:
            logger.error(f"Error syncing menu: {e}")
            QMessageBox.critical(self, "Error", f"Failed to sync menu: {str(e)}")
    
    def handle_save_accounting_config(self):
        """Save accounting software configuration"""
        try:
            software_name = self.accounting_software_combo.currentText().lower()
            software_map = {
                'quickbooks': AccountingSoftware.QUICKBOOKS,
                'xero': AccountingSoftware.XERO,
                'sage': AccountingSoftware.SAGE,
                'wave': AccountingSoftware.WAVE
            }
            software = software_map.get(software_name, AccountingSoftware.QUICKBOOKS)
            
            sync = get_accounting_sync(software)
            sync.configure(
                self.accounting_client_id.text().strip(),
                self.accounting_client_secret.text().strip(),
                self.accounting_access_token.text().strip(),
                self.accounting_refresh_token.text().strip(),
                self.accounting_company_id.text().strip()
            )
            
            QMessageBox.information(self, "Success", "Configuration saved successfully")
            
        except Exception as e:
            logger.error(f"Error saving accounting config: {e}")
            QMessageBox.critical(self, "Error", f"Failed to save configuration: {str(e)}")
    
    def handle_sync_invoices(self):
        """Sync invoices to accounting software"""
        try:
            from src.database.connection import get_db_session
            from src.database.models import Invoice
            
            db = get_db_session()
            invoices = db.query(Invoice).all()
            db.close()
            
            invoices_data = [{
                'invoice_number': inv.invoice_number,
                'total_amount': inv.total_amount,
                'date': inv.issue_date
            } for inv in invoices]
            
            software_name = self.accounting_software_combo.currentText().lower()
            software_map = {
                'quickbooks': AccountingSoftware.QUICKBOOKS,
                'xero': AccountingSoftware.XERO,
                'sage': AccountingSoftware.SAGE,
                'wave': AccountingSoftware.WAVE
            }
            software = software_map.get(software_name, AccountingSoftware.QUICKBOOKS)
            
            sync = get_accounting_sync(software)
            result = sync.sync_invoices(invoices_data)
            
            QMessageBox.information(self, "Sync Complete", result['message'])
            
        except Exception as e:
            logger.error(f"Error syncing invoices: {e}")
            QMessageBox.critical(self, "Error", f"Failed to sync invoices: {str(e)}")
    
    def handle_sync_expenses(self):
        """Sync expenses to accounting software"""
        try:
            from src.database.connection import get_db_session
            from src.database.models import Expense
            
            db = get_db_session()
            expenses = db.query(Expense).all()
            db.close()
            
            expenses_data = [{
                'expense_id': exp.expense_id,
                'amount': exp.amount,
                'date': exp.expense_date
            } for exp in expenses]
            
            software_name = self.accounting_software_combo.currentText().lower()
            software_map = {
                'quickbooks': AccountingSoftware.QUICKBOOKS,
                'xero': AccountingSoftware.XERO,
                'sage': AccountingSoftware.SAGE,
                'wave': AccountingSoftware.WAVE
            }
            software = software_map.get(software_name, AccountingSoftware.QUICKBOOKS)
            
            sync = get_accounting_sync(software)
            result = sync.sync_expenses(expenses_data)
            
            QMessageBox.information(self, "Sync Complete", result['message'])
            
        except Exception as e:
            logger.error(f"Error syncing expenses: {e}")
            QMessageBox.critical(self, "Error", f"Failed to sync expenses: {str(e)}")

