"""
Staff Scheduling Module - View and manage staff schedules
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QComboBox, QDateEdit, QDialog
)
from PyQt6.QtCore import Qt, QDate
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import ShiftSchedule, Staff
from datetime import date
from src.gui.table_utils import enable_table_auto_resize


class StaffSchedulingView(QWidget):
    """Staff Scheduling View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        self.load_schedules()
    
    def setup_ui(self):
        """Setup scheduling UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        
        title = QLabel("Staff Scheduling")
        title.setStyleSheet("""
            color: #162640;
            font-size: 24px;
            font-weight: 700;
        """)
        header_layout.addWidget(title)
        
        header_layout.addStretch()
        
        # Add Schedule button
        add_btn = QPushButton("Add Schedule")
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
        add_btn.clicked.connect(self.handle_add_schedule)
        header_layout.addWidget(add_btn)
        
        layout.addLayout(header_layout)
        layout.addSpacing(24)
        
        # Date filter
        filter_layout = QHBoxLayout()
        filter_layout.setSpacing(12)
        
        filter_label = QLabel("View Date:")
        filter_label.setStyleSheet("""
            color: #2A3A55;
            font-size: 14px;
            font-weight: 500;
        """)
        filter_layout.addWidget(filter_label)
        
        self.date_filter = QDateEdit()
        self.date_filter.setDate(QDate.currentDate())
        self.date_filter.setCalendarPopup(True)
        self.date_filter.dateChanged.connect(self.load_schedules)
        filter_layout.addWidget(self.date_filter)
        
        filter_layout.addStretch()
        layout.addLayout(filter_layout)
        layout.addSpacing(16)
        
        # Schedules table
        self.schedules_table = QTableWidget()
        self.schedules_table.setColumnCount(6)
        self.schedules_table.setHorizontalHeaderLabels([
            "Staff", "Date", "Start Time", "End Time", "Department", "Status"
        ])
        
        self.schedules_table.setStyleSheet("""
            QTableWidget {
                background-color: white;
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                gridline-color: #EDF3FC;
            }
            QHeaderView::section {
                background-color: #F9FAFB;
                color: #2A3A55;
                font-weight: 600;
                padding: 12px;
                border: none;
                border-bottom: 2px solid #C8D4E8;
            }
        """)
        
        enable_table_auto_resize(self.schedules_table)
        self.schedules_table.setAlternatingRowColors(True)
        self.schedules_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.schedules_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        
        layout.addWidget(self.schedules_table)
    
    def load_schedules(self):
        """Load schedules for selected date"""
        db = get_db_session()
        try:
            selected_date = self.date_filter.date().toPyDate()
            
            schedules = db.query(ShiftSchedule).filter(
                ShiftSchedule.shift_date == selected_date
            ).all()
            
            self.schedules_table.setRowCount(len(schedules))
            
            for row, schedule in enumerate(schedules):
                # Get staff name
                staff = db.query(Staff).filter(Staff.staff_id == schedule.staff_id).first()
                staff_name = f"{staff.first_name} {staff.last_name}" if staff else "Unknown"
                
                self.schedules_table.setItem(row, 0, QTableWidgetItem(staff_name))
                self.schedules_table.setItem(row, 1, QTableWidgetItem(schedule.shift_date.strftime("%Y-%m-%d")))
                self.schedules_table.setItem(row, 2, QTableWidgetItem(str(schedule.start_time)))
                self.schedules_table.setItem(row, 3, QTableWidgetItem(str(schedule.end_time)))
                self.schedules_table.setItem(row, 4, QTableWidgetItem(schedule.shift_type or "-"))
                self.schedules_table.setItem(row, 5, QTableWidgetItem(schedule.status))
            
            logger.info(f"Loaded {len(schedules)} schedules for {selected_date}")
            
        except Exception as e:
            logger.error(f"Error loading schedules: {e}")
        finally:
            db.close()
    
    def handle_add_schedule(self):
        """Handle add schedule button click"""
        logger.info("Add schedule clicked")
        from src.gui.add_schedule_dialog import AddScheduleDialog
        dialog = AddScheduleDialog(self.user_id, self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            self.load_schedules()  # Refresh the schedule list

