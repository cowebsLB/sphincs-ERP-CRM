"""
Staff Attendance Module - View and manage staff attendance
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QDateEdit, QComboBox
)
from PyQt6.QtCore import Qt, QDate
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import StaffAttendance, Staff
from datetime import date, datetime, timedelta


class StaffAttendanceView(QWidget):
    """Staff Attendance View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        self.load_attendance()
    
    def setup_ui(self):
        """Setup attendance UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        
        title = QLabel("Staff Attendance")
        title.setStyleSheet("""
            color: #162640;
            font-size: 24px;
            font-weight: 700;
        """)
        header_layout.addWidget(title)
        
        header_layout.addStretch()
        
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
        self.date_filter.dateChanged.connect(self.load_attendance)
        filter_layout.addWidget(self.date_filter)
        
        filter_layout.addStretch()
        layout.addLayout(filter_layout)
        layout.addSpacing(16)
        
        # Attendance table
        self.attendance_table = QTableWidget()
        self.attendance_table.setColumnCount(6)
        self.attendance_table.setHorizontalHeaderLabels([
            "Staff", "Date", "Clock In", "Clock Out", "Hours Worked", "Status"
        ])
        
        self.attendance_table.setStyleSheet("""
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
        
        self.attendance_table.horizontalHeader().setStretchLastSection(True)
        self.attendance_table.setAlternatingRowColors(True)
        self.attendance_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.attendance_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        
        layout.addWidget(self.attendance_table)
    
    def load_attendance(self):
        """Load attendance records"""
        db = get_db_session()
        try:
            selected_date = self.date_filter.date().toPyDate()
            
            # Get attendance for the selected date
            attendance_records = db.query(StaffAttendance).filter(
                StaffAttendance.clock_in >= datetime.combine(selected_date, datetime.min.time()),
                StaffAttendance.clock_in < datetime.combine(selected_date, datetime.min.time()) + timedelta(days=1)
            ).all()
            
            self.attendance_table.setRowCount(len(attendance_records))
            
            for row, record in enumerate(attendance_records):
                # Get staff name
                staff = db.query(Staff).filter(Staff.staff_id == record.staff_id).first()
                staff_name = f"{staff.first_name} {staff.last_name}" if staff else "Unknown"
                
                clock_in_str = record.clock_in.strftime("%H:%M") if record.clock_in else "-"
                clock_out_str = record.clock_out.strftime("%H:%M") if record.clock_out else "-"
                hours_str = f"{record.hours_worked:.2f}" if record.hours_worked else "-"
                
                self.attendance_table.setItem(row, 0, QTableWidgetItem(staff_name))
                self.attendance_table.setItem(row, 1, QTableWidgetItem(selected_date.strftime("%Y-%m-%d")))
                self.attendance_table.setItem(row, 2, QTableWidgetItem(clock_in_str))
                self.attendance_table.setItem(row, 3, QTableWidgetItem(clock_out_str))
                self.attendance_table.setItem(row, 4, QTableWidgetItem(hours_str))
                self.attendance_table.setItem(row, 5, QTableWidgetItem(record.status))
            
            logger.info(f"Loaded {len(attendance_records)} attendance records for {selected_date}")
            
        except Exception as e:
            logger.error(f"Error loading attendance: {e}")
        finally:
            db.close()

