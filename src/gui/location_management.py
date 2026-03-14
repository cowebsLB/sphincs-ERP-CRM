"""
Location Management - Multi-location/branch management
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QDialog, QComboBox,
    QMessageBox, QFormLayout, QLineEdit, QTextEdit, QCheckBox
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QColor
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import Location, Staff


class LocationManagementView(QWidget):
    """Location Management View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        self.load_locations()
    
    def setup_ui(self):
        """Setup location management UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        
        title = QLabel("Location Management")
        title.setStyleSheet("""
            color: #162640;
            font-size: 24px;
            font-weight: 700;
        """)
        header_layout.addWidget(title)
        header_layout.addStretch()
        
        # Add Location button
        add_btn = QPushButton("Add Location")
        add_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
                font-size: 14px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #1D66EA;
            }
        """)
        add_btn.clicked.connect(self.handle_add_location)
        header_layout.addWidget(add_btn)
        
        layout.addLayout(header_layout)
        layout.addSpacing(24)
        
        # Locations table
        self.locations_table = QTableWidget()
        self.locations_table.setColumnCount(6)
        self.locations_table.setHorizontalHeaderLabels([
            "Code", "Name", "Address", "Phone", "Manager", "Status"
        ])
        self.locations_table.setStyleSheet("""
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
        self.locations_table.horizontalHeader().setStretchLastSection(True)
        self.locations_table.setAlternatingRowColors(True)
        self.locations_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        layout.addWidget(self.locations_table)
        
        # Action buttons
        actions_layout = QHBoxLayout()
        actions_layout.addStretch()
        
        edit_btn = QPushButton("Edit Selected")
        edit_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
            }
        """)
        edit_btn.clicked.connect(self.handle_edit_location)
        actions_layout.addWidget(edit_btn)
        
        delete_btn = QPushButton("Delete Selected")
        delete_btn.setStyleSheet("""
            QPushButton {
                background-color: #D92D20;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
            }
        """)
        delete_btn.clicked.connect(self.handle_delete_location)
        actions_layout.addWidget(delete_btn)
        
        layout.addLayout(actions_layout)
    
    def load_locations(self):
        """Load locations"""
        try:
            db = get_db_session()
            locations = db.query(Location).all()
            
            self.locations_table.setRowCount(len(locations))
            for row, location in enumerate(locations):
                self.locations_table.setItem(row, 0, QTableWidgetItem(location.location_code))
                self.locations_table.setItem(row, 1, QTableWidgetItem(location.name))
                self.locations_table.setItem(row, 2, QTableWidgetItem(location.address or "-"))
                self.locations_table.setItem(row, 3, QTableWidgetItem(location.phone or "-"))
                
                manager_name = "-"
                if location.manager_id:
                    manager = db.query(Staff).filter(Staff.staff_id == location.manager_id).first()
                    if manager:
                        manager_name = f"{manager.first_name} {manager.last_name}"
                self.locations_table.setItem(row, 4, QTableWidgetItem(manager_name))
                
                status_item = QTableWidgetItem("Active" if location.is_active else "Inactive")
                if not location.is_active:
                    status_item.setForeground(QColor("#8FA2BF"))
                self.locations_table.setItem(row, 5, status_item)
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading locations: {e}")
            QMessageBox.critical(self, "Error", f"Failed to load locations: {str(e)}")
    
    def handle_add_location(self):
        """Handle add location"""
        dialog = LocationDialog(self.user_id, self)
        if dialog.exec():
            self.load_locations()
    
    def handle_edit_location(self):
        """Handle edit location"""
        current_row = self.locations_table.currentRow()
        if current_row < 0:
            QMessageBox.warning(self, "Warning", "Please select a location to edit")
            return
        
        code_item = self.locations_table.item(current_row, 0)
        if not code_item:
            return
        
        location_code = code_item.text()
        
        db = get_db_session()
        try:
            location = db.query(Location).filter(Location.location_code == location_code).first()
            if location:
                dialog = LocationDialog(self.user_id, self, location_id=location.location_id)
                if dialog.exec():
                    self.load_locations()
        finally:
            db.close()
    
    def handle_delete_location(self):
        """Handle delete location"""
        current_row = self.locations_table.currentRow()
        if current_row < 0:
            QMessageBox.warning(self, "Warning", "Please select a location to delete")
            return
        
        code_item = self.locations_table.item(current_row, 0)
        if not code_item:
            return
        
        location_code = code_item.text()
        
        reply = QMessageBox.question(
            self,
            "Confirm Delete",
            f"Are you sure you want to delete location '{location_code}'?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            db = get_db_session()
            try:
                location = db.query(Location).filter(Location.location_code == location_code).first()
                if location:
                    db.delete(location)
                    db.commit()
                    QMessageBox.information(self, "Success", "Location deleted successfully")
                    self.load_locations()
            except Exception as e:
                logger.error(f"Error deleting location: {e}")
                db.rollback()
                QMessageBox.critical(self, "Error", f"Failed to delete location: {str(e)}")
            finally:
                db.close()


class LocationDialog(QDialog):
    """Dialog for adding/editing location"""
    
    def __init__(self, user_id: int, parent=None, location_id: int = None):
        super().__init__(parent)
        self.user_id = user_id
        self.location_id = location_id
        self.setWindowTitle("Add Location" if not location_id else "Edit Location")
        self.setMinimumSize(500, 400)
        self.location = None
        if location_id:
            db = get_db_session()
            try:
                self.location = db.query(Location).filter(Location.location_id == location_id).first()
            finally:
                db.close()
        self.setup_ui()
    
    def setup_ui(self):
        """Setup location dialog UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(20, 20, 20, 20)
        
        form = QFormLayout()
        
        # Location Code
        self.code_input = QLineEdit()
        if self.location:
            self.code_input.setText(self.location.location_code)
        form.addRow("Location Code *:", self.code_input)
        
        # Name
        self.name_input = QLineEdit()
        if self.location:
            self.name_input.setText(self.location.name)
        form.addRow("Name *:", self.name_input)
        
        # Address
        self.address_input = QTextEdit()
        self.address_input.setMaximumHeight(80)
        if self.location:
            self.address_input.setPlainText(self.location.address or "")
        form.addRow("Address:", self.address_input)
        
        # Phone
        self.phone_input = QLineEdit()
        if self.location:
            self.phone_input.setText(self.location.phone or "")
        form.addRow("Phone:", self.phone_input)
        
        # Email
        self.email_input = QLineEdit()
        if self.location:
            self.email_input.setText(self.location.email or "")
        form.addRow("Email:", self.email_input)
        
        # Manager
        self.manager_combo = QComboBox()
        self.load_managers()
        if self.location and self.location.manager_id:
            index = self.manager_combo.findData(self.location.manager_id)
            if index >= 0:
                self.manager_combo.setCurrentIndex(index)
        form.addRow("Manager:", self.manager_combo)
        
        # Active status
        self.active_check = QCheckBox()
        if self.location:
            self.active_check.setChecked(self.location.is_active)
        else:
            self.active_check.setChecked(True)
        form.addRow("Active:", self.active_check)
        
        layout.addLayout(form)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        save_btn = QPushButton("Save")
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
    
    def load_managers(self):
        """Load managers"""
        from src.database.models import Role
        db = get_db_session()
        try:
            # Filter by role name instead of position
            managers = db.query(Staff).join(Role).filter(
                Staff.status == 'active',
                Role.role_name.in_(['admin', 'manager', 'supervisor'])
            ).all()
            
            self.manager_combo.addItem("None", None)
            for manager in managers:
                self.manager_combo.addItem(
                    f"{manager.first_name} {manager.last_name}",
                    manager.staff_id
                )
        finally:
            db.close()
    
    def handle_save(self):
        """Save location"""
        try:
            code = self.code_input.text().strip()
            name = self.name_input.text().strip()
            
            if not code or not name:
                QMessageBox.warning(self, "Validation Error", "Location code and name are required")
                return
            
            db = get_db_session()
            
            manager_id = self.manager_combo.currentData()
            
            if self.location_id:
                # Update existing
                location = db.query(Location).filter(Location.location_id == self.location_id).first()
                if not location:
                    QMessageBox.warning(self, "Error", "Location not found")
                    return
                
                location.location_code = code
                location.name = name
                location.address = self.address_input.toPlainText().strip() or None
                location.phone = self.phone_input.text().strip() or None
                location.email = self.email_input.text().strip() or None
                location.manager_id = manager_id
                location.is_active = self.active_check.isChecked()
                
                QMessageBox.information(self, "Success", "Location updated successfully")
            else:
                # Create new
                location = Location(
                    location_code=code,
                    name=name,
                    address=self.address_input.toPlainText().strip() or None,
                    phone=self.phone_input.text().strip() or None,
                    email=self.email_input.text().strip() or None,
                    manager_id=manager_id,
                    is_active=self.active_check.isChecked()
                )
                db.add(location)
                QMessageBox.information(self, "Success", "Location added successfully")
            
            db.commit()
            db.close()
            self.accept()
            
        except Exception as e:
            logger.error(f"Error saving location: {e}")
            QMessageBox.critical(self, "Error", f"Failed to save location: {str(e)}")

