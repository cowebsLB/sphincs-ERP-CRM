"""
Staff Management Module - Staff List, Scheduling, and Attendance
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QDialog, QLineEdit, QFrame, QTabWidget
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QColor
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import Staff
from src.gui.attendance_management import AttendanceManagementView
from src.gui.design_system import (
    DATA_TABLE_STYLE,
    DANGER_BUTTON_STYLE,
    PRIMARY_BUTTON_STYLE,
    SEARCH_INPUT_STYLE,
    TAB_WIDGET_STYLE,
    TOOLBAR_CARD_STYLE,
)
from src.gui.shift_scheduling import ShiftSchedulingView
from src.gui.payroll_management import PayrollManagementView
from src.gui.staff_performance_reports import StaffPerformanceReportsView
from src.gui.table_utils import enable_table_auto_resize


class StaffManagementView(QWidget):
    """Staff Management View with tabs"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        self.load_staff_list()
    
    def setup_ui(self):
        """Setup staff management UI with tabs"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        header_layout.addStretch()

        self.add_btn = QPushButton("Add Staff")
        self.add_btn.setStyleSheet(PRIMARY_BUTTON_STYLE)
        self.add_btn.clicked.connect(self.handle_add_staff)
        header_layout.addWidget(self.add_btn)

        layout.addLayout(header_layout)
        layout.addSpacing(12)
        
        # Tabs for Staff List and Attendance
        self.tabs = QTabWidget()
        self.tabs.setStyleSheet(TAB_WIDGET_STYLE)
        
        # Staff List tab
        self.staff_list_widget = self.create_staff_list_widget()
        self.tabs.addTab(self.staff_list_widget, "Staff List")
        
        # Attendance tab
        self.attendance_view = AttendanceManagementView(self.user_id)
        self.tabs.addTab(self.attendance_view, "Attendance")
        
        # Shift Scheduling tab
        self.shift_view = ShiftSchedulingView(self.user_id)
        self.tabs.addTab(self.shift_view, "Shift Scheduling")
        
        # Payroll tab
        self.payroll_view = PayrollManagementView(self.user_id)
        self.tabs.addTab(self.payroll_view, "Payroll")
        
        # Performance Reports tab
        self.performance_view = StaffPerformanceReportsView(self.user_id)
        self.tabs.addTab(self.performance_view, "Performance Reports")
        
        layout.addWidget(self.tabs)
    
    def create_staff_list_widget(self) -> QWidget:
        """Create the staff list widget"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(0)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Search bar
        search_card = QFrame()
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
        self.search_input.setPlaceholderText("Search by name, department, position, or employee ID...")
        self.search_input.setStyleSheet(SEARCH_INPUT_STYLE)
        self.search_input.textChanged.connect(self.filter_staff_list)
        search_layout.addWidget(self.search_input)
        
        layout.addWidget(search_card)
        layout.addSpacing(12)
        
        # Staff table
        self.staff_table = QTableWidget()
        self.staff_table.setColumnCount(6)
        self.staff_table.setHorizontalHeaderLabels([
            "Staff ID", "Name", "Username", "Role", "Email", "Status"
        ])
        
        self.staff_table.setStyleSheet(DATA_TABLE_STYLE)
        enable_table_auto_resize(self.staff_table)
        self.staff_table.setAlternatingRowColors(True)
        self.staff_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.staff_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.staff_table.doubleClicked.connect(self.handle_edit_staff)
        
        layout.addWidget(self.staff_table)
        
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
        
        self.staff_table.itemSelectionChanged.connect(self.update_action_buttons)
        layout.addLayout(actions_layout)
        
        return widget
    
    
    def load_staff_list(self):
        """Load staff list from database"""
        db = get_db_session()
        try:
            self.all_staff = db.query(Staff).all()
            self.display_staff_list(self.all_staff)
            logger.info(f"Loaded {len(self.all_staff)} staff members")
        except Exception as e:
            logger.error(f"Error loading staff list: {e}")
        finally:
            db.close()
    
    def display_staff_list(self, staff_list):
        """Display staff list in table"""
        self.staff_table.setRowCount(len(staff_list))
        
        for row, staff in enumerate(staff_list):
            self.staff_table.setItem(row, 0, QTableWidgetItem(str(staff.staff_id)))
            self.staff_table.setItem(row, 1, QTableWidgetItem(f"{staff.first_name} {staff.last_name}"))
            self.staff_table.setItem(row, 2, QTableWidgetItem(staff.username))
            # Get role name
            role_name = "N/A"
            if staff.role:
                role_name = staff.role.role_name
            self.staff_table.setItem(row, 3, QTableWidgetItem(role_name))
            self.staff_table.setItem(row, 4, QTableWidgetItem(staff.email or "-"))
            status_item = QTableWidgetItem((staff.status or "unknown").capitalize())
            status = (staff.status or "").lower()
            if status == "active":
                status_item.setForeground(QColor("#34D399"))
            elif status in {"inactive", "suspended"}:
                status_item.setForeground(QColor("#F59E0B"))
            else:
                status_item.setForeground(QColor("#E5E7EB"))
            self.staff_table.setItem(row, 5, status_item)
    
    def filter_staff_list(self, search_text: str):
        """Filter staff list based on search text"""
        if not hasattr(self, 'all_staff'):
            return
        
        search_text = search_text.lower().strip()
        
        if not search_text:
            self.display_staff_list(self.all_staff)
            return
        
        filtered_staff = []
        for staff in self.all_staff:
            # Get role name for search
            role_name = ""
            if staff.role:
                role_name = staff.role.role_name
            searchable_text = (
                f"{staff.first_name} {staff.last_name} "
                f"{staff.username} {role_name} "
                f"{staff.email or ''} {staff.status}"
            ).lower()
            
            if search_text in searchable_text:
                filtered_staff.append(staff)
        
        self.display_staff_list(filtered_staff)
    
    def handle_add_staff(self):
        """Handle add staff button click"""
        from src.gui.add_staff_dialog import AddStaffDialog
        
        dialog = AddStaffDialog(self.user_id, self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            self.load_staff_list()
    
    def handle_edit_staff(self, index):
        """Handle double-click on staff row to edit"""
        row = index.row()
        staff_id_item = self.staff_table.item(row, 0)
        if staff_id_item:
            staff_id = int(staff_id_item.text())
            self.open_edit_dialog(staff_id)
    
    def open_edit_dialog(self, staff_id: int):
        """Open edit dialog for a staff member"""
        from src.gui.edit_staff_dialog import EditStaffDialog
        
        dialog = EditStaffDialog(staff_id, self.user_id, self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            self.load_staff_list()
    
    def update_action_buttons(self):
        """Enable/disable action buttons based on selection"""
        has_selection = len(self.staff_table.selectedItems()) > 0
        self.edit_btn.setEnabled(has_selection)
        self.delete_btn.setEnabled(has_selection)
    
    def handle_edit_selected(self):
        """Handle edit button click for selected row"""
        selected_rows = self.staff_table.selectionModel().selectedRows()
        if selected_rows:
            row = selected_rows[0].row()
            staff_id_item = self.staff_table.item(row, 0)
            if staff_id_item:
                staff_id = int(staff_id_item.text())
                self.open_edit_dialog(staff_id)
    
    def handle_delete_selected(self):
        """Handle delete button click for selected row"""
        from PyQt6.QtWidgets import QMessageBox
        
        selected_rows = self.staff_table.selectionModel().selectedRows()
        if not selected_rows:
            return
        
        row = selected_rows[0].row()
        staff_id_item = self.staff_table.item(row, 0)
        name_item = self.staff_table.item(row, 1)
        
        if not staff_id_item or not name_item:
            return
        
        staff_id = int(staff_id_item.text())
        staff_name = name_item.text()
        
        reply = QMessageBox.question(
            self,
            "Confirm Delete",
            f"Are you sure you want to delete staff member '{staff_name}'?\n\nThis action cannot be undone.",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
            QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            self.delete_staff(staff_id)
    
    def delete_staff(self, staff_id: int):
        """Delete a staff member from database"""
        from PyQt6.QtWidgets import QMessageBox
        
        db = get_db_session()
        try:
            staff = db.query(Staff).filter(Staff.staff_id == staff_id).first()
            if not staff:
                QMessageBox.warning(self, "Error", "Staff member not found.")
                return
            
            staff_name = f"{staff.first_name} {staff.last_name}"
            
            # Check if staff has any orders (prevent deletion if they have orders)
            from src.database.models import Order
            order_count = db.query(Order).filter(Order.staff_id == staff_id).count()
            if order_count > 0:
                QMessageBox.warning(
                    self,
                    "Cannot Delete",
                    f"Cannot delete '{staff_name}' because they have {order_count} order(s) associated with them."
                )
                return
            
            db.delete(staff)
            db.commit()
            
            logger.info(f"Staff member deleted: {staff_name} (ID: {staff_id})")
            QMessageBox.information(self, "Success", f"Staff member '{staff_name}' deleted successfully!")
            
            self.load_staff_list()
            
        except Exception as e:
            logger.error(f"Error deleting staff: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to delete staff member:\n{str(e)}")
        finally:
            db.close()
