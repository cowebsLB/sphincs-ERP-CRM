"""
Permissions Management - Granular role-based permissions
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QDialog, QComboBox,
    QMessageBox, QFormLayout, QCheckBox, QGroupBox, QScrollArea
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QColor
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import Role, Permission


class PermissionsManagementView(QWidget):
    """Permissions Management View"""
    
    # Define all available permissions
    PERMISSIONS = {
        'Products': [
            'view_products', 'add_products', 'edit_products', 'delete_products'
        ],
        'Inventory': [
            'view_inventory', 'add_inventory', 'edit_inventory', 'delete_inventory',
            'manage_expiry', 'manage_waste'
        ],
        'Sales': [
            'view_sales', 'create_orders', 'edit_orders', 'cancel_orders', 'process_refunds'
        ],
        'Customers': [
            'view_customers', 'add_customers', 'edit_customers', 'delete_customers',
            'manage_loyalty'
        ],
        'Suppliers': [
            'view_suppliers', 'add_suppliers', 'edit_suppliers', 'delete_suppliers',
            'manage_ratings'
        ],
        'Staff': [
            'view_staff', 'add_staff', 'edit_staff', 'delete_staff',
            'manage_attendance', 'manage_schedules', 'manage_payroll'
        ],
        'Financial': [
            'view_financial', 'manage_accounts', 'manage_transactions',
            'manage_invoices', 'manage_expenses', 'view_reports'
        ],
        'Reports': [
            'view_reports', 'export_reports', 'view_analytics'
        ],
        'Settings': [
            'view_settings', 'edit_settings', 'manage_users', 'manage_roles',
            'view_audit_trail'
        ],
    }
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        self.load_roles()
    
    def setup_ui(self):
        """Setup permissions management UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        
        title = QLabel("Role Permissions Management")
        title.setStyleSheet("""
            color: #162640;
            font-size: 24px;
            font-weight: 700;
        """)
        header_layout.addWidget(title)
        header_layout.addStretch()
        
        layout.addLayout(header_layout)
        layout.addSpacing(24)
        
        # Role selection
        role_layout = QHBoxLayout()
        role_layout.addWidget(QLabel("Select Role:"))
        self.role_combo = QComboBox()
        self.role_combo.currentIndexChanged.connect(self.load_role_permissions)
        role_layout.addWidget(self.role_combo)
        role_layout.addStretch()
        layout.addLayout(role_layout)
        layout.addSpacing(16)
        
        # Permissions grid
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setStyleSheet("""
            QScrollArea {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background-color: white;
            }
        """)
        
        permissions_widget = QWidget()
        permissions_layout = QVBoxLayout(permissions_widget)
        permissions_layout.setSpacing(16)
        permissions_layout.setContentsMargins(20, 20, 20, 20)
        
        self.permission_checkboxes = {}
        
        for category, perms in self.PERMISSIONS.items():
            group = QGroupBox(category)
            group.setStyleSheet("""
                QGroupBox {
                    font-size: 14px;
                    font-weight: 600;
                    border: 2px solid #C8D4E8;
                    border-radius: 8px;
                    margin-top: 12px;
                    padding-top: 12px;
                }
            """)
            group_layout = QVBoxLayout(group)
            group_layout.setSpacing(8)
            
            for perm in perms:
                checkbox = QCheckBox(perm.replace('_', ' ').title())
                checkbox.setObjectName(perm)
                self.permission_checkboxes[perm] = checkbox
                group_layout.addWidget(checkbox)
            
            permissions_layout.addWidget(group)
        
        permissions_layout.addStretch()
        scroll.setWidget(permissions_widget)
        layout.addWidget(scroll)
        
        # Save button
        save_layout = QHBoxLayout()
        save_layout.addStretch()
        
        save_btn = QPushButton("Save Permissions")
        save_btn.setStyleSheet("""
            QPushButton {
                background-color: #14B8A6;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
                font-size: 14px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #059669;
            }
        """)
        save_btn.clicked.connect(self.save_permissions)
        save_layout.addWidget(save_btn)
        
        layout.addLayout(save_layout)
    
    def load_roles(self):
        """Load roles into combo box"""
        try:
            db = get_db_session()
            roles = db.query(Role).all()
            
            self.role_combo.clear()
            for role in roles:
                self.role_combo.addItem(role.role_name, role.role_id)
            
            db.close()
            
            if self.role_combo.count() > 0:
                self.load_role_permissions()
        except Exception as e:
            logger.error(f"Error loading roles: {e}")
            QMessageBox.critical(self, "Error", f"Failed to load roles: {str(e)}")
    
    def load_role_permissions(self):
        """Load permissions for selected role"""
        try:
            role_id = self.role_combo.currentData()
            if not role_id:
                # Clear all checkboxes
                for checkbox in self.permission_checkboxes.values():
                    checkbox.setChecked(False)
                return
            
            db = get_db_session()
            
            # Get existing permissions for this role
            permissions = db.query(Permission).filter(Permission.role_id == role_id).all()
            permission_names = {p.permission_name for p in permissions}
            
            # Update checkboxes
            for perm_name, checkbox in self.permission_checkboxes.items():
                checkbox.setChecked(perm_name in permission_names)
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading role permissions: {e}")
            QMessageBox.critical(self, "Error", f"Failed to load permissions: {str(e)}")
    
    def save_permissions(self):
        """Save permissions for selected role"""
        try:
            role_id = self.role_combo.currentData()
            if not role_id:
                QMessageBox.warning(self, "Warning", "Please select a role")
                return
            
            db = get_db_session()
            
            # Get current permissions
            existing_perms = db.query(Permission).filter(Permission.role_id == role_id).all()
            existing_perm_names = {p.permission_name for p in existing_perms}
            
            # Get selected permissions
            selected_perms = {
                perm_name for perm_name, checkbox in self.permission_checkboxes.items()
                if checkbox.isChecked()
            }
            
            # Remove unselected permissions
            for perm in existing_perms:
                if perm.permission_name not in selected_perms:
                    db.delete(perm)
            
            # Add new permissions
            for perm_name in selected_perms:
                if perm_name not in existing_perm_names:
                    permission = Permission(
                        role_id=role_id,
                        permission_name=perm_name
                    )
                    db.add(permission)
            
            db.commit()
            db.close()
            
            QMessageBox.information(self, "Success", "Permissions saved successfully")
            
        except Exception as e:
            logger.error(f"Error saving permissions: {e}")
            QMessageBox.critical(self, "Error", f"Failed to save permissions: {str(e)}")

