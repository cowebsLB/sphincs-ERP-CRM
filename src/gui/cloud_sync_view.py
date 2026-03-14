"""
Cloud Sync Management View
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QLineEdit, QFormLayout, QGroupBox, QMessageBox, QTextEdit
)
from loguru import logger
from src.utils.cloud_sync import get_cloud_sync_manager
from src.database.connection import get_db_session
from src.database.models import Location


class CloudSyncView(QWidget):
    """Cloud Sync Management View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.sync_manager = get_cloud_sync_manager()
        self.setup_ui()
        self.load_config()
    
    def setup_ui(self):
        """Setup cloud sync UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        
        title = QLabel("Cloud Sync Configuration")
        title.setStyleSheet("""
            color: #162640;
            font-size: 24px;
            font-weight: 700;
        """)
        header_layout.addWidget(title)
        header_layout.addStretch()
        
        layout.addLayout(header_layout)
        layout.addSpacing(24)
        
        # Configuration group
        config_group = QGroupBox("Sync Server Configuration")
        config_group.setStyleSheet("""
            QGroupBox {
                font-size: 16px;
                font-weight: 600;
                border: 2px solid #C8D4E8;
                border-radius: 8px;
                margin-top: 12px;
                padding-top: 12px;
            }
        """)
        config_layout = QFormLayout(config_group)
        
        self.server_url_input = QLineEdit()
        self.server_url_input.setPlaceholderText("https://sync.example.com")
        config_layout.addRow("Sync Server URL:", self.server_url_input)
        
        self.api_key_input = QLineEdit()
        self.api_key_input.setEchoMode(QLineEdit.EchoMode.Password)
        self.api_key_input.setPlaceholderText("Enter API key")
        config_layout.addRow("API Key:", self.api_key_input)
        
        self.location_combo = QLineEdit()
        self.location_combo.setPlaceholderText("Location ID")
        config_layout.addRow("Location ID:", self.location_combo)
        
        layout.addWidget(config_group)
        layout.addSpacing(16)
        
        # Sync actions
        actions_group = QGroupBox("Sync Actions")
        actions_group.setStyleSheet("""
            QGroupBox {
                font-size: 16px;
                font-weight: 600;
                border: 2px solid #C8D4E8;
                border-radius: 8px;
                margin-top: 12px;
                padding-top: 12px;
            }
        """)
        actions_layout = QVBoxLayout(actions_group)
        
        sync_buttons_layout = QHBoxLayout()
        
        sync_orders_btn = QPushButton("Sync Orders")
        sync_orders_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
            }
        """)
        sync_orders_btn.clicked.connect(self.handle_sync_orders)
        sync_buttons_layout.addWidget(sync_orders_btn)
        
        sync_inventory_btn = QPushButton("Sync Inventory")
        sync_inventory_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
            }
        """)
        sync_inventory_btn.clicked.connect(self.handle_sync_inventory)
        sync_buttons_layout.addWidget(sync_inventory_btn)
        
        sync_products_btn = QPushButton("Sync Products")
        sync_products_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
            }
        """)
        sync_products_btn.clicked.connect(self.handle_sync_products)
        sync_buttons_layout.addWidget(sync_products_btn)
        
        full_sync_btn = QPushButton("Full Sync")
        full_sync_btn.setStyleSheet("""
            QPushButton {
                background-color: #14B8A6;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
                font-weight: 600;
            }
        """)
        full_sync_btn.clicked.connect(self.handle_full_sync)
        sync_buttons_layout.addWidget(full_sync_btn)
        
        actions_layout.addLayout(sync_buttons_layout)
        
        # Status display
        self.status_text = QTextEdit()
        self.status_text.setReadOnly(True)
        self.status_text.setMaximumHeight(150)
        self.status_text.setStyleSheet("""
            background-color: #F9FAFB;
            border: 1px solid #C8D4E8;
            border-radius: 6px;
            font-family: monospace;
            font-size: 12px;
        """)
        actions_layout.addWidget(self.status_text)
        
        layout.addWidget(actions_group)
        layout.addSpacing(16)
        
        # Save configuration button
        save_layout = QHBoxLayout()
        save_layout.addStretch()
        
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
        save_btn.clicked.connect(self.handle_save_config)
        save_layout.addWidget(save_btn)
        
        layout.addLayout(save_layout)
        layout.addStretch()
    
    def load_config(self):
        """Load current configuration"""
        status = self.sync_manager.get_sync_status()
        if status['enabled']:
            self.server_url_input.setText(status.get('server_url', ''))
            self.location_combo.setText(str(status.get('location_id', '')))
    
    def handle_save_config(self):
        """Save configuration"""
        try:
            server_url = self.server_url_input.text().strip()
            api_key = self.api_key_input.text().strip()
            location_id = self.location_combo.text().strip()
            
            if not server_url or not api_key or not location_id:
                QMessageBox.warning(self, "Validation Error", "All fields are required")
                return
            
            try:
                location_id_int = int(location_id)
            except ValueError:
                QMessageBox.warning(self, "Validation Error", "Location ID must be a number")
                return
            
            self.sync_manager.configure(server_url, api_key, location_id_int)
            QMessageBox.information(self, "Success", "Configuration saved successfully")
            self.log_status("Configuration saved")
            
        except Exception as e:
            logger.error(f"Error saving config: {e}")
            QMessageBox.critical(self, "Error", f"Failed to save configuration: {str(e)}")
    
    def handle_sync_orders(self):
        """Handle sync orders"""
        self.log_status("Syncing orders...")
        result = self.sync_manager.sync_orders()
        if result['success']:
            self.log_status(f"✓ {result['message']}")
            QMessageBox.information(self, "Success", result['message'])
        else:
            self.log_status(f"✗ {result['message']}")
            QMessageBox.warning(self, "Error", result['message'])
    
    def handle_sync_inventory(self):
        """Handle sync inventory"""
        self.log_status("Syncing inventory...")
        result = self.sync_manager.sync_inventory()
        if result['success']:
            self.log_status(f"✓ {result['message']}")
            QMessageBox.information(self, "Success", result['message'])
        else:
            self.log_status(f"✗ {result['message']}")
            QMessageBox.warning(self, "Error", result['message'])
    
    def handle_sync_products(self):
        """Handle sync products"""
        self.log_status("Syncing products...")
        result = self.sync_manager.sync_products()
        if result['success']:
            self.log_status(f"✓ {result['message']}")
            QMessageBox.information(self, "Success", result['message'])
        else:
            self.log_status(f"✗ {result['message']}")
            QMessageBox.warning(self, "Error", result['message'])
    
    def handle_full_sync(self):
        """Handle full sync"""
        self.log_status("Starting full sync...")
        result = self.sync_manager.full_sync()
        if result['success']:
            self.log_status(f"✓ {result['message']}")
            QMessageBox.information(self, "Success", result['message'])
        else:
            self.log_status(f"✗ {result['message']}")
            QMessageBox.warning(self, "Error", result['message'])
    
    def log_status(self, message: str):
        """Log status message"""
        from datetime import datetime
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.status_text.append(f"[{timestamp}] {message}")

