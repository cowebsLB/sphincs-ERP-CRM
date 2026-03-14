"""
Shift Scheduling - Staff shift scheduling and management
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QDialog, QComboBox, QFrame,
    QDateEdit, QTimeEdit, QMessageBox, QFormLayout, QSpinBox, QTextEdit
)
from PyQt6.QtCore import Qt, QDate, QTime
from PyQt6.QtGui import QColor
from loguru import logger
from datetime import date, time, datetime, timedelta
from src.database.connection import get_db_session
from src.database.models import ShiftSchedule, Staff
from src.gui.design_system import (
    DATA_TABLE_STYLE,
    DANGER_BUTTON_STYLE,
    PRIMARY_BUTTON_STYLE,
    SECONDARY_BUTTON_STYLE,
    TOOLBAR_CARD_STYLE,
)
from src.gui.table_utils import enable_table_auto_resize


class ShiftSchedulingView(QWidget):
    """Shift Scheduling View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        self.load_schedules()
    
    def setup_ui(self):
        """Setup shift scheduling UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header actions
        header_layout = QHBoxLayout()
        header_layout.addStretch()
        
        # Add Shift button
        add_btn = QPushButton("Add Shift")
        add_btn.setStyleSheet(PRIMARY_BUTTON_STYLE)
        add_btn.clicked.connect(self.handle_add_shift)
        header_layout.addWidget(add_btn)
        
        layout.addLayout(header_layout)
        layout.addSpacing(12)
        
        # Week navigation
        week_nav_card = QFrame()
        week_nav_card.setStyleSheet(TOOLBAR_CARD_STYLE)
        week_nav_layout = QHBoxLayout(week_nav_card)
        week_nav_layout.setContentsMargins(14, 10, 14, 10)
        week_nav_layout.setSpacing(12)
        
        # Previous week button
        prev_week_btn = QPushButton("< Previous Week")
        prev_week_btn.setStyleSheet(SECONDARY_BUTTON_STYLE)
        prev_week_btn.clicked.connect(self.previous_week)
        week_nav_layout.addWidget(prev_week_btn)
        
        # Week display
        self.week_label = QLabel()
        self.week_label.setStyleSheet("font-size: 18px; font-weight: 700;")
        self.week_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        week_nav_layout.addWidget(self.week_label)
        
        # Today button
        today_btn = QPushButton("Today")
        today_btn.setStyleSheet(SECONDARY_BUTTON_STYLE)
        today_btn.clicked.connect(self.go_to_today)
        week_nav_layout.addWidget(today_btn)
        
        # Next week button
        next_week_btn = QPushButton("Next Week >")
        next_week_btn.setStyleSheet(SECONDARY_BUTTON_STYLE)
        next_week_btn.clicked.connect(self.next_week)
        week_nav_layout.addWidget(next_week_btn)
        
        week_nav_layout.addStretch()
        layout.addWidget(week_nav_card)
        layout.addSpacing(12)
        
        # Weekly schedule table
        self.schedules_table = QTableWidget()
        # Columns: Staff Name, Mon, Tue, Wed, Thu, Fri, Sat, Sun
        self.schedules_table.setColumnCount(8)
        self.schedules_table.setHorizontalHeaderLabels([
            "Staff", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
        ])
        self.schedules_table.setStyleSheet(DATA_TABLE_STYLE)
        enable_table_auto_resize(self.schedules_table)
        self.schedules_table.setAlternatingRowColors(True)
        self.schedules_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectItems)
        self.schedules_table.cellDoubleClicked.connect(self.handle_cell_double_click)
        layout.addWidget(self.schedules_table)
        
        # Action buttons
        actions_layout = QHBoxLayout()
        actions_layout.addStretch()
        
        edit_btn = QPushButton("Edit Selected")
        edit_btn.setStyleSheet(PRIMARY_BUTTON_STYLE)
        edit_btn.clicked.connect(self.handle_edit_shift)
        actions_layout.addWidget(edit_btn)
        
        delete_btn = QPushButton("Delete Selected")
        delete_btn.setStyleSheet(DANGER_BUTTON_STYLE)
        delete_btn.clicked.connect(self.handle_delete_shift)
        actions_layout.addWidget(delete_btn)
        
        layout.addLayout(actions_layout)
        
        # Store current week start date
        today = date.today()
        # Get Monday of current week
        days_since_monday = today.weekday()
        self.current_week_start = today - timedelta(days=days_since_monday)
        
        # Update week label
        self.update_week_label()
    
    def load_staff_combo(self):
        """Load staff into combo box"""
        try:
            db = get_db_session()
            staff_list = db.query(Staff).filter(Staff.status == 'active').all()
            for staff in staff_list:
                self.staff_combo.addItem(
                    f"{staff.first_name} {staff.last_name}",
                    staff.staff_id
                )
            db.close()
        except Exception as e:
            logger.error(f"Error loading staff combo: {e}")
    
    def update_week_label(self):
        """Update the week label"""
        week_end = self.current_week_start + timedelta(days=6)
        self.week_label.setText(
            f"Week of {self.current_week_start.strftime('%B %d, %Y')} - {week_end.strftime('%B %d, %Y')}"
        )
    
    def previous_week(self):
        """Navigate to previous week"""
        self.current_week_start -= timedelta(days=7)
        self.update_week_label()
        self.load_schedules()
    
    def next_week(self):
        """Navigate to next week"""
        self.current_week_start += timedelta(days=7)
        self.update_week_label()
        self.load_schedules()
    
    def go_to_today(self):
        """Navigate to current week"""
        today = date.today()
        days_since_monday = today.weekday()
        self.current_week_start = today - timedelta(days=days_since_monday)
        self.update_week_label()
        self.load_schedules()
    
    def load_schedules(self):
        """Load shift schedules for the current week"""
        try:
            db = get_db_session()
            
            # Calculate week date range
            week_end = self.current_week_start + timedelta(days=6)
            
            # Get all active staff
            staff_list = db.query(Staff).filter(Staff.status == 'active').all()
            
            # Get all shifts for this week
            shifts = db.query(ShiftSchedule).filter(
                ShiftSchedule.shift_date >= self.current_week_start,
                ShiftSchedule.shift_date <= week_end
            ).all()
            
            # Create a dictionary to map (staff_id, day_of_week) to shifts
            shifts_dict = {}
            for shift in shifts:
                day_of_week = shift.shift_date.weekday()  # 0 = Monday, 6 = Sunday
                key = (shift.staff_id, day_of_week)
                if key not in shifts_dict:
                    shifts_dict[key] = []
                shifts_dict[key].append(shift)
            
            # Set up table with staff as rows
            self.schedules_table.setRowCount(len(staff_list))
            
            for row, staff in enumerate(staff_list):
                # Staff name column
                staff_name = f"{staff.first_name} {staff.last_name}"
                name_item = QTableWidgetItem(staff_name)
                name_item.setFlags(name_item.flags() & ~Qt.ItemFlag.ItemIsEditable)
                self.schedules_table.setItem(row, 0, name_item)
                
                # Day columns (Monday = 0, Sunday = 6)
                for day in range(7):
                    col = day + 1  # Column 0 is staff name
                    day_date = self.current_week_start + timedelta(days=day)
                    key = (staff.staff_id, day)
                    
                    if key in shifts_dict:
                        # Display all shifts for this staff on this day
                        shift_texts = []
                        shift_ids = []
                        for shift in shifts_dict[key]:
                            start_str = shift.start_time.strftime("%H:%M")
                            end_str = shift.end_time.strftime("%H:%M")
                            shift_type = shift.shift_type or ""
                            status = shift.status
                            
                            shift_text = f"{start_str}-{end_str}"
                            if shift_type:
                                shift_text += f" ({shift_type})"
                            
                            shift_texts.append(shift_text)
                            shift_ids.append(shift.schedule_id)
                        
                        cell_text = "\n".join(shift_texts)
                        cell_item = QTableWidgetItem(cell_text)
                        
                        # Color code based on status
                        if any(s.status == "cancelled" for s in shifts_dict[key]):
                            cell_item.setForeground(QColor("#D92D20"))
                        elif any(s.status == "completed" for s in shifts_dict[key]):
                            cell_item.setForeground(QColor("#14B8A6"))
                        else:
                            cell_item.setForeground(QColor("#2F7DFF"))
                        
                        # Store all schedule IDs as a list (for multiple shifts per day)
                        cell_item.setData(Qt.ItemDataRole.UserRole, shift_ids)
                    else:
                        # No shift scheduled
                        cell_item = QTableWidgetItem("")
                        cell_item.setData(Qt.ItemDataRole.UserRole, None)
                    
                    cell_item.setFlags(cell_item.flags() & ~Qt.ItemFlag.ItemIsEditable)
                    self.schedules_table.setItem(row, col, cell_item)
            
            # Set column widths
            self.schedules_table.setColumnWidth(0, 150)  # Staff name column
            for col in range(1, 8):
                self.schedules_table.setColumnWidth(col, 120)
            
            # Set row heights to accommodate multiple shifts
            for row in range(len(staff_list)):
                self.schedules_table.setRowHeight(row, 80)
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading schedules: {e}")
            QMessageBox.critical(self, "Error", f"Failed to load schedules: {str(e)}")
    
    def handle_add_shift(self):
        """Handle add shift"""
        dialog = ShiftDialog(self.user_id, self)
        if dialog.exec():
            self.load_schedules()
    
    def handle_cell_double_click(self, row: int, col: int):
        """Handle double click on a cell to add/edit shift"""
        if col == 0:  # Staff name column
            return
        
        # Get staff from row
        staff_item = self.schedules_table.item(row, 0)
        if not staff_item:
            return
        
        # Calculate the date for this cell
        day_of_week = col - 1  # Column 1 = Monday (0), Column 7 = Sunday (6)
        shift_date = self.current_week_start + timedelta(days=day_of_week)
        
        # Get existing shift if any
        cell_item = self.schedules_table.item(row, col)
        schedule_id = None
        if cell_item:
            schedule_ids = cell_item.data(Qt.ItemDataRole.UserRole)
            if schedule_ids:
                # If multiple shifts, use the first one for editing
                if isinstance(schedule_ids, list):
                    schedule_id = schedule_ids[0] if schedule_ids else None
                else:
                    schedule_id = schedule_ids
        
        # Open dialog to add/edit shift
        dialog = ShiftDialog(self.user_id, self, schedule_id=schedule_id, 
                           default_date=shift_date, default_staff_row=row)
        if dialog.exec():
            self.load_schedules()
    
    def handle_edit_shift(self):
        """Handle edit shift"""
        current_row = self.schedules_table.currentRow()
        current_col = self.schedules_table.currentColumn()
        
        if current_row < 0 or current_col < 1:  # Column 0 is staff name
            QMessageBox.warning(self, "Warning", "Please select a shift cell to edit")
            return
        
        self.handle_cell_double_click(current_row, current_col)
    
    def handle_delete_shift(self):
        """Handle delete shift"""
        current_row = self.schedules_table.currentRow()
        current_col = self.schedules_table.currentColumn()
        
        if current_row < 0 or current_col < 1:
            QMessageBox.warning(self, "Warning", "Please select a shift cell to delete")
            return
        
        cell_item = self.schedules_table.item(current_row, current_col)
        if not cell_item:
            QMessageBox.warning(self, "Warning", "No shift found in this cell")
            return
        
        schedule_ids_data = cell_item.data(Qt.ItemDataRole.UserRole)
        
        if not schedule_ids_data:
            QMessageBox.warning(self, "Warning", "No shift found in this cell")
            return
        
        # Handle both single ID and list of IDs
        if isinstance(schedule_ids_data, list):
            schedule_ids_to_delete = schedule_ids_data
        else:
            schedule_ids_to_delete = [schedule_ids_data]
        
        # Confirm deletion
        if len(schedule_ids_to_delete) == 1:
            confirm_msg = "Are you sure you want to delete this shift?"
        else:
            confirm_msg = f"This cell contains {len(schedule_ids_to_delete)} shift(s).\n\nDelete all shifts for this day?"
        
        reply = QMessageBox.question(
            self,
            "Confirm Delete",
            confirm_msg,
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
            QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            try:
                db = get_db_session()
                deleted_count = 0
                
                for schedule_id in schedule_ids_to_delete:
                    schedule = db.query(ShiftSchedule).filter(
                        ShiftSchedule.schedule_id == schedule_id
                    ).first()
                    
                    if schedule:
                        db.delete(schedule)
                        deleted_count += 1
                
                db.commit()
                db.close()
                
                if deleted_count > 0:
                    QMessageBox.information(
                        self, 
                        "Success", 
                        f"Successfully deleted {deleted_count} shift(s)"
                    )
                    self.load_schedules()
                else:
                    QMessageBox.warning(self, "Warning", "No shifts were deleted")
                    
            except Exception as e:
                logger.error(f"Error deleting shift: {e}")
                QMessageBox.critical(self, "Error", f"Failed to delete shift: {str(e)}")


class ShiftDialog(QDialog):
    """Dialog for adding/editing shift"""
    
    def __init__(self, user_id: int, parent=None, schedule_id: int = None, 
                 default_date: date = None, default_staff_row: int = None):
        super().__init__(parent)
        self.user_id = user_id
        self.schedule_id = schedule_id
        self.default_date = default_date
        self.default_staff_row = default_staff_row
        self.setWindowTitle("Add Shift" if not schedule_id else "Edit Shift")
        self.setMinimumSize(400, 350)
        self.schedule = None
        if schedule_id:
            # Load existing shift data
            db = get_db_session()
            try:
                self.schedule = db.query(ShiftSchedule).filter(
                    ShiftSchedule.schedule_id == schedule_id
                ).first()
            finally:
                db.close()
        self.setup_ui()
    
    def setup_ui(self):
        """Setup shift dialog UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(20, 20, 20, 20)
        
        form = QFormLayout()
        
        # Staff selection
        self.staff_combo = QComboBox()
        self.load_staff()
        # Set default staff if provided
        if self.default_staff_row is not None and hasattr(self.parent(), 'schedules_table'):
            staff_item = self.parent().schedules_table.item(self.default_staff_row, 0)
            if staff_item:
                staff_name = staff_item.text()
                index = self.staff_combo.findText(staff_name)
                if index >= 0:
                    self.staff_combo.setCurrentIndex(index)
        # Set staff if editing existing shift
        if self.schedule:
            index = self.staff_combo.findData(self.schedule.staff_id)
            if index >= 0:
                self.staff_combo.setCurrentIndex(index)
        form.addRow("Staff:", self.staff_combo)
        
        # Date
        self.shift_date = QDateEdit()
        if self.schedule:
            self.shift_date.setDate(QDate(
                self.schedule.shift_date.year,
                self.schedule.shift_date.month,
                self.schedule.shift_date.day
            ))
        elif self.default_date:
            self.shift_date.setDate(QDate(self.default_date.year, self.default_date.month, self.default_date.day))
        else:
            self.shift_date.setDate(QDate.currentDate())
        self.shift_date.setCalendarPopup(True)
        form.addRow("Date:", self.shift_date)
        
        # Start time
        self.start_time = QTimeEdit()
        if self.schedule:
            self.start_time.setTime(QTime(
                self.schedule.start_time.hour,
                self.schedule.start_time.minute
            ))
        else:
            self.start_time.setTime(QTime(9, 0))
        form.addRow("Start Time:", self.start_time)
        
        # End time
        self.end_time = QTimeEdit()
        if self.schedule:
            self.end_time.setTime(QTime(
                self.schedule.end_time.hour,
                self.schedule.end_time.minute
            ))
        else:
            self.end_time.setTime(QTime(17, 0))
        form.addRow("End Time:", self.end_time)
        
        # Break duration
        self.break_duration = QSpinBox()
        self.break_duration.setMinimum(0)
        self.break_duration.setMaximum(480)
        if self.schedule:
            self.break_duration.setValue(self.schedule.break_duration)
        else:
            self.break_duration.setValue(60)
        form.addRow("Break (minutes):", self.break_duration)
        
        # Shift type
        self.shift_type = QComboBox()
        self.shift_type.addItems(["", "morning", "afternoon", "evening", "night"])
        if self.schedule and self.schedule.shift_type:
            index = self.shift_type.findText(self.schedule.shift_type)
            if index >= 0:
                self.shift_type.setCurrentIndex(index)
        form.addRow("Shift Type:", self.shift_type)
        
        # Status
        self.status_combo = QComboBox()
        self.status_combo.addItems(["scheduled", "confirmed", "cancelled", "completed"])
        if self.schedule:
            index = self.status_combo.findText(self.schedule.status)
            if index >= 0:
                self.status_combo.setCurrentIndex(index)
        form.addRow("Status:", self.status_combo)
        
        # Notes
        self.notes_input = QTextEdit()
        self.notes_input.setMaximumHeight(80)
        if self.schedule and self.schedule.notes:
            self.notes_input.setPlainText(self.schedule.notes)
        form.addRow("Notes:", self.notes_input)
        
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
    
    def load_staff(self):
        """Load staff into combo"""
        try:
            db = get_db_session()
            staff_list = db.query(Staff).filter(Staff.status == 'active').all()
            for staff in staff_list:
                self.staff_combo.addItem(
                    f"{staff.first_name} {staff.last_name}",
                    staff.staff_id
                )
            db.close()
        except Exception as e:
            logger.error(f"Error loading staff: {e}")
    
    def handle_save(self):
        """Save shift"""
        try:
            db = get_db_session()
            
            staff_id = self.staff_combo.currentData()
            if not staff_id:
                QMessageBox.warning(self, "Warning", "Please select a staff member")
                return
            
            shift = ShiftSchedule(
                staff_id=staff_id,
                shift_date=self.shift_date.date().toPyDate(),
                start_time=self.start_time.time().toPyTime(),
                end_time=self.end_time.time().toPyTime(),
                break_duration=self.break_duration.value(),
                shift_type=self.shift_type.currentText() or None,
                status=self.status_combo.currentText(),
                notes=self.notes_input.toPlainText() or None
            )
            
            db.add(shift)
            db.commit()
            db.close()
            
            QMessageBox.information(self, "Success", "Shift scheduled successfully")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error saving shift: {e}")
            QMessageBox.critical(self, "Error", f"Failed to save shift: {str(e)}")



