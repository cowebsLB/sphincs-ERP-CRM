"""
Add Schedule Dialog - Add new staff schedule
"""

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QComboBox, QDateEdit, QTimeEdit, QFormLayout, QMessageBox
)
from PyQt6.QtCore import Qt, QDate, QTime
from loguru import logger
from datetime import datetime, date, time
from src.database.connection import get_db_session
from src.database.models import ShiftSchedule, Staff


class AddScheduleDialog(QDialog):
    """Dialog for adding a new staff schedule"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setWindowTitle("Add Schedule")
        self.setModal(True)
        self.setup_ui()
    
    def setup_ui(self):
        """Setup dialog UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(24, 24, 24, 24)
        
        form_layout = QFormLayout()
        form_layout.setSpacing(12)
        
        # Staff selection
        self.staff_combo = QComboBox()
        self.load_staff()
        form_layout.addRow("Staff:", self.staff_combo)
        
        # Date
        self.date_input = QDateEdit()
        self.date_input.setDate(QDate.currentDate())
        self.date_input.setCalendarPopup(True)
        form_layout.addRow("Date:", self.date_input)
        
        # Start time
        self.start_time = QTimeEdit()
        self.start_time.setTime(QTime(9, 0))
        self.start_time.setDisplayFormat("HH:mm")
        form_layout.addRow("Start Time:", self.start_time)
        
        # End time
        self.end_time = QTimeEdit()
        self.end_time.setTime(QTime(17, 0))
        self.end_time.setDisplayFormat("HH:mm")
        form_layout.addRow("End Time:", self.end_time)
        
        # Shift type
        self.shift_type_combo = QComboBox()
        self.shift_type_combo.addItems([
            "Morning",
            "Afternoon",
            "Evening",
            "Night",
            "Full Day"
        ])
        form_layout.addRow("Shift Type:", self.shift_type_combo)
        
        layout.addLayout(form_layout)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        save_btn = QPushButton("Add Schedule")
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
    
    def load_staff(self):
        """Load staff members"""
        db = get_db_session()
        try:
            staff_list = db.query(Staff).filter(Staff.status == "active").all()
            for staff in staff_list:
                self.staff_combo.addItem(
                    f"{staff.first_name} {staff.last_name} ({staff.employee_id})",
                    staff.staff_id
                )
        except Exception as e:
            logger.error(f"Error loading staff: {e}")
        finally:
            db.close()
    
    def handle_save(self):
        """Handle save button click"""
        staff_id = self.staff_combo.currentData()
        if not staff_id:
            QMessageBox.warning(self, "Validation Error", "Please select a staff member.")
            return
        
        schedule_date = self.date_input.date().toPyDate()
        start_time = self.start_time.time().toPyTime()
        end_time = self.end_time.time().toPyTime()
        
        if end_time <= start_time:
            QMessageBox.warning(self, "Validation Error", "End time must be after start time.")
            return
        
        shift_type = self.shift_type_combo.currentText()
        
        db = get_db_session()
        try:
            # Check for existing schedule
            existing = db.query(ShiftSchedule).filter(
                ShiftSchedule.staff_id == staff_id,
                ShiftSchedule.shift_date == schedule_date
            ).first()
            
            if existing:
                QMessageBox.warning(self, "Schedule Exists", 
                    "A schedule already exists for this staff member on this date. Please edit the existing schedule.")
                return
            
            # Create new schedule
            new_schedule = ShiftSchedule(
                staff_id=staff_id,
                shift_date=schedule_date,
                start_time=start_time,
                end_time=end_time,
                shift_type=shift_type,
                status="scheduled"
            )
            
            db.add(new_schedule)
            db.commit()
            
            logger.info(f"New schedule added for staff {staff_id} on {schedule_date}")
            QMessageBox.information(self, "Success", "Schedule added successfully!")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error adding schedule: {e}")
            db.rollback()
            QMessageBox.critical(self, "Error", f"Failed to add schedule:\n{str(e)}")
        finally:
            db.close()

