"""
Payroll Management - Calculate and manage staff payroll
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QDialog, QComboBox, QFrame,
    QDateEdit, QMessageBox, QFormLayout, QDoubleSpinBox, QTextEdit
)
from PyQt6.QtCore import Qt, QDate
from PyQt6.QtGui import QColor
from loguru import logger
from datetime import date, timedelta
from src.database.connection import get_db_session
from src.database.models import Payroll, Staff, Attendance
from src.gui.design_system import (
    DATA_TABLE_STYLE,
    FILTER_COMBO_STYLE,
    PRIMARY_BUTTON_STYLE,
    SECONDARY_BUTTON_STYLE,
    SUCCESS_BUTTON_STYLE,
    TOOLBAR_CARD_STYLE,
)
from src.gui.table_utils import enable_table_auto_resize


class PayrollManagementView(QWidget):
    """Payroll Management View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        self.load_payroll_records()
    
    def setup_ui(self):
        """Setup payroll management UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header actions
        header_layout = QHBoxLayout()
        header_layout.addStretch()
        
        # Calculate Payroll button
        calc_btn = QPushButton("Calculate Payroll")
        calc_btn.setStyleSheet(SUCCESS_BUTTON_STYLE)
        calc_btn.clicked.connect(self.handle_calculate_payroll)
        header_layout.addWidget(calc_btn)
        
        # Add Manual Entry button
        add_btn = QPushButton("Add Manual Entry")
        add_btn.setStyleSheet(PRIMARY_BUTTON_STYLE)
        add_btn.clicked.connect(self.handle_add_manual)
        header_layout.addWidget(add_btn)
        
        layout.addLayout(header_layout)
        layout.addSpacing(12)
        
        # Filters
        filter_card = QFrame()
        filter_card.setStyleSheet(TOOLBAR_CARD_STYLE)
        filter_layout = QHBoxLayout(filter_card)
        filter_layout.setContentsMargins(14, 10, 14, 10)
        filter_layout.setSpacing(12)
        
        filter_layout.addWidget(QLabel("Staff:"))
        self.staff_combo = QComboBox()
        self.staff_combo.addItem("All Staff")
        self.staff_combo.setStyleSheet(FILTER_COMBO_STYLE)
        self.load_staff_combo()
        filter_layout.addWidget(self.staff_combo)
        
        filter_layout.addWidget(QLabel("Pay Period:"))
        self.period_combo = QComboBox()
        self.period_combo.addItems([
            "This Month", "Last Month", "This Year", "Custom"
        ])
        self.period_combo.setStyleSheet(FILTER_COMBO_STYLE)
        self.period_combo.currentTextChanged.connect(self.handle_period_change)
        filter_layout.addWidget(self.period_combo)
        
        filter_layout.addWidget(QLabel("From:"))
        self.from_date = QDateEdit()
        today = QDate.currentDate()
        self.from_date.setDate(today.addDays(-today.day() + 1))  # First day of current month
        self.from_date.setCalendarPopup(True)
        self.from_date.setStyleSheet(FILTER_COMBO_STYLE)
        self.from_date.setEnabled(False)
        filter_layout.addWidget(self.from_date)
        
        filter_layout.addWidget(QLabel("To:"))
        self.to_date = QDateEdit()
        self.to_date.setDate(QDate.currentDate())
        self.to_date.setCalendarPopup(True)
        self.to_date.setStyleSheet(FILTER_COMBO_STYLE)
        self.to_date.setEnabled(False)
        filter_layout.addWidget(self.to_date)
        
        filter_btn = QPushButton("Filter")
        filter_btn.setStyleSheet(SECONDARY_BUTTON_STYLE)
        filter_btn.clicked.connect(self.load_payroll_records)
        filter_layout.addWidget(filter_btn)
        
        filter_layout.addStretch()
        layout.addWidget(filter_card)
        layout.addSpacing(12)
        
        # Payroll table
        self.payroll_table = QTableWidget()
        self.payroll_table.setColumnCount(10)
        self.payroll_table.setHorizontalHeaderLabels([
            "Staff", "Period Start", "Period End", "Hours", "Base Salary", 
            "Overtime", "Tips", "Bonuses", "Deductions", "Net Pay"
        ])
        self.payroll_table.setStyleSheet(DATA_TABLE_STYLE)
        enable_table_auto_resize(self.payroll_table)
        self.payroll_table.setAlternatingRowColors(True)
        layout.addWidget(self.payroll_table)
    
    def load_staff_combo(self):
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
            logger.error(f"Error loading staff combo: {e}")
    
    def handle_period_change(self, period: str):
        """Handle period selection change"""
        today = QDate.currentDate()
        if period == "This Month":
            self.from_date.setDate(today.addDays(-today.day() + 1))
            self.to_date.setDate(today)
            self.from_date.setEnabled(False)
            self.to_date.setEnabled(False)
        elif period == "Last Month":
            last_month = today.addMonths(-1)
            self.from_date.setDate(QDate(last_month.year(), last_month.month(), 1))
            self.to_date.setDate(QDate(last_month.year(), last_month.month(), last_month.daysInMonth()))
            self.from_date.setEnabled(False)
            self.to_date.setEnabled(False)
        elif period == "This Year":
            self.from_date.setDate(QDate(today.year(), 1, 1))
            self.to_date.setDate(today)
            self.from_date.setEnabled(False)
            self.to_date.setEnabled(False)
        else:  # Custom
            self.from_date.setEnabled(True)
            self.to_date.setEnabled(True)
    
    def load_payroll_records(self):
        """Load payroll records"""
        try:
            db = get_db_session()
            from_date = self.from_date.date().toPyDate()
            to_date = self.to_date.date().toPyDate()
            
            query = db.query(Payroll).filter(
                Payroll.pay_period_start >= from_date,
                Payroll.pay_period_end <= to_date
            )
            
            staff_filter = self.staff_combo.currentData()
            if staff_filter:
                query = query.filter(Payroll.staff_id == staff_filter)
            
            records = query.order_by(Payroll.pay_period_end.desc()).all()
            
            self.payroll_table.setRowCount(len(records))
            for row, payroll in enumerate(records):
                staff_name = f"{payroll.staff.first_name} {payroll.staff.last_name}"
                self.payroll_table.setItem(row, 0, QTableWidgetItem(staff_name))
                self.payroll_table.setItem(row, 1, QTableWidgetItem(
                    payroll.pay_period_start.strftime("%Y-%m-%d")
                ))
                self.payroll_table.setItem(row, 2, QTableWidgetItem(
                    payroll.pay_period_end.strftime("%Y-%m-%d")
                ))
                self.payroll_table.setItem(row, 3, QTableWidgetItem(f"{payroll.hours_worked:.2f}"))
                self.payroll_table.setItem(row, 4, QTableWidgetItem(f"${payroll.base_salary:.2f}"))
                self.payroll_table.setItem(row, 5, QTableWidgetItem(f"${payroll.overtime_hours * (payroll.overtime_rate or 0):.2f}"))
                self.payroll_table.setItem(row, 6, QTableWidgetItem(f"${payroll.tips:.2f}"))
                self.payroll_table.setItem(row, 7, QTableWidgetItem(f"${payroll.bonuses:.2f}"))
                self.payroll_table.setItem(row, 8, QTableWidgetItem(f"${payroll.deductions:.2f}"))
                
                net_pay_item = QTableWidgetItem(f"${payroll.net_pay:.2f}")
                net_pay_item.setForeground(QColor("#14B8A6"))
                self.payroll_table.setItem(row, 9, net_pay_item)
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading payroll records: {e}")
            QMessageBox.critical(self, "Error", f"Failed to load payroll records: {str(e)}")
    
    def handle_calculate_payroll(self):
        """Handle calculate payroll for selected period"""
        dialog = CalculatePayrollDialog(self.user_id, self)
        if dialog.exec():
            self.load_payroll_records()
    
    def handle_add_manual(self):
        """Handle add manual payroll entry"""
        dialog = ManualPayrollDialog(self.user_id, self)
        if dialog.exec():
            self.load_payroll_records()


class CalculatePayrollDialog(QDialog):
    """Dialog for calculating payroll"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setWindowTitle("Calculate Payroll")
        self.setMinimumSize(500, 400)
        self.setup_ui()
    
    def setup_ui(self):
        """Setup calculate payroll UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(20, 20, 20, 20)
        
        form = QFormLayout()
        
        # Staff selection
        self.staff_combo = QComboBox()
        self.staff_combo.addItem("All Active Staff")
        self.load_staff()
        form.addRow("Staff:", self.staff_combo)
        
        # Pay period
        self.period_start = QDateEdit()
        self.period_start.setDate(QDate.currentDate().addDays(-QDate.currentDate().day() + 1))
        self.period_start.setCalendarPopup(True)
        form.addRow("Period Start:", self.period_start)
        
        self.period_end = QDateEdit()
        self.period_end.setDate(QDate.currentDate())
        self.period_end.setCalendarPopup(True)
        form.addRow("Period End:", self.period_end)
        
        # Hourly rate (default)
        self.hourly_rate = QDoubleSpinBox()
        self.hourly_rate.setMinimum(0.0)
        self.hourly_rate.setMaximum(999.99)
        self.hourly_rate.setDecimals(2)
        self.hourly_rate.setValue(15.0)
        form.addRow("Default Hourly Rate:", self.hourly_rate)
        
        # Overtime rate multiplier
        self.overtime_multiplier = QDoubleSpinBox()
        self.overtime_multiplier.setMinimum(1.0)
        self.overtime_multiplier.setMaximum(3.0)
        self.overtime_multiplier.setDecimals(2)
        self.overtime_multiplier.setValue(1.5)
        form.addRow("Overtime Multiplier:", self.overtime_multiplier)
        
        layout.addLayout(form)
        
        info_label = QLabel("This will calculate payroll based on attendance records for the selected period.")
        info_label.setStyleSheet("color: #5D6F8B; font-size: 12px;")
        layout.addWidget(info_label)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        calculate_btn = QPushButton("Calculate")
        calculate_btn.setStyleSheet("""
            QPushButton {
                background-color: #14B8A6;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-weight: 600;
            }
        """)
        calculate_btn.clicked.connect(self.handle_calculate)
        buttons_layout.addWidget(calculate_btn)
        
        layout.addLayout(buttons_layout)
    
    def load_staff(self):
        """Load staff"""
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
    
    def handle_calculate(self):
        """Calculate payroll"""
        try:
            db = get_db_session()
            period_start = self.period_start.date().toPyDate()
            period_end = self.period_end.date().toPyDate()
            
            # Get staff to process
            staff_list = []
            if self.staff_combo.currentIndex() == 0:  # All staff
                staff_list = db.query(Staff).filter(Staff.status == 'active').all()
            else:
                staff_id = self.staff_combo.currentData()
                staff = db.query(Staff).filter(Staff.staff_id == staff_id).first()
                if staff:
                    staff_list = [staff]
            
            calculated_count = 0
            
            for staff in staff_list:
                # Get attendance records for period
                attendance_records = db.query(Attendance).filter(
                    Attendance.staff_id == staff.staff_id,
                    Attendance.attendance_date >= period_start,
                    Attendance.attendance_date <= period_end,
                    Attendance.status == 'present'
                ).all()
                
                # Calculate total hours
                total_hours = sum(att.total_hours or 0 for att in attendance_records)
                
                if total_hours == 0:
                    continue
                
                # Calculate regular and overtime hours (assuming 40 hours/week = 8 hours/day)
                regular_hours = min(total_hours, 40 * ((period_end - period_start).days / 7))
                overtime_hours = max(0, total_hours - regular_hours)
                
                hourly_rate = self.hourly_rate.value()
                overtime_rate = hourly_rate * self.overtime_multiplier.value()
                
                # Calculate pay
                base_salary = regular_hours * hourly_rate
                overtime_pay = overtime_hours * overtime_rate
                gross_pay = base_salary + overtime_pay
                
                # Simple deduction (10% for tax - should be configurable)
                deductions = gross_pay * 0.10
                net_pay = gross_pay - deductions
                
                # Check if payroll already exists
                existing = db.query(Payroll).filter(
                    Payroll.staff_id == staff.staff_id,
                    Payroll.pay_period_start == period_start,
                    Payroll.pay_period_end == period_end
                ).first()
                
                if existing:
                    # Update existing
                    existing.hours_worked = total_hours
                    existing.base_salary = base_salary
                    existing.hourly_rate = hourly_rate
                    existing.overtime_hours = overtime_hours
                    existing.overtime_rate = overtime_rate
                    existing.deductions = deductions
                    existing.gross_pay = gross_pay
                    existing.net_pay = net_pay
                else:
                    # Create new
                    payroll = Payroll(
                        staff_id=staff.staff_id,
                        pay_period_start=period_start,
                        pay_period_end=period_end,
                        base_salary=base_salary,
                        hours_worked=total_hours,
                        hourly_rate=hourly_rate,
                        overtime_hours=overtime_hours,
                        overtime_rate=overtime_rate,
                        tips=0.0,
                        bonuses=0.0,
                        deductions=deductions,
                        gross_pay=gross_pay,
                        net_pay=net_pay,
                        status='pending'
                    )
                    db.add(payroll)
                
                calculated_count += 1
            
            db.commit()
            db.close()
            
            QMessageBox.information(
                self, 
                "Success", 
                f"Payroll calculated for {calculated_count} staff member(s)"
            )
            self.accept()
            
        except Exception as e:
            logger.error(f"Error calculating payroll: {e}")
            QMessageBox.critical(self, "Error", f"Failed to calculate payroll: {str(e)}")


class ManualPayrollDialog(QDialog):
    """Dialog for manual payroll entry"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setWindowTitle("Add Manual Payroll Entry")
        self.setMinimumSize(500, 500)
        self.setup_ui()
    
    def setup_ui(self):
        """Setup manual payroll UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(20, 20, 20, 20)
        
        form = QFormLayout()
        
        # Staff selection
        self.staff_combo = QComboBox()
        self.load_staff()
        form.addRow("Staff:", self.staff_combo)
        
        # Pay period
        self.period_start = QDateEdit()
        self.period_start.setDate(QDate.currentDate().addDays(-QDate.currentDate().day() + 1))
        self.period_start.setCalendarPopup(True)
        form.addRow("Period Start:", self.period_start)
        
        self.period_end = QDateEdit()
        self.period_end.setDate(QDate.currentDate())
        self.period_end.setCalendarPopup(True)
        form.addRow("Period End:", self.period_end)
        
        # Hours worked
        self.hours_worked = QDoubleSpinBox()
        self.hours_worked.setMinimum(0.0)
        self.hours_worked.setMaximum(999.99)
        self.hours_worked.setDecimals(2)
        form.addRow("Hours Worked:", self.hours_worked)
        
        # Hourly rate
        self.hourly_rate = QDoubleSpinBox()
        self.hourly_rate.setMinimum(0.0)
        self.hourly_rate.setMaximum(999.99)
        self.hourly_rate.setDecimals(2)
        self.hourly_rate.setValue(15.0)
        form.addRow("Hourly Rate:", self.hourly_rate)
        
        # Overtime
        self.overtime_hours = QDoubleSpinBox()
        self.overtime_hours.setMinimum(0.0)
        self.overtime_hours.setMaximum(999.99)
        self.overtime_hours.setDecimals(2)
        form.addRow("Overtime Hours:", self.overtime_hours)
        
        self.overtime_rate = QDoubleSpinBox()
        self.overtime_rate.setMinimum(0.0)
        self.overtime_rate.setMaximum(999.99)
        self.overtime_rate.setDecimals(2)
        form.addRow("Overtime Rate:", self.overtime_rate)
        
        # Tips, Bonuses, Deductions
        self.tips = QDoubleSpinBox()
        self.tips.setMinimum(0.0)
        self.tips.setMaximum(99999.99)
        self.tips.setDecimals(2)
        form.addRow("Tips:", self.tips)
        
        self.bonuses = QDoubleSpinBox()
        self.bonuses.setMinimum(0.0)
        self.bonuses.setMaximum(99999.99)
        self.bonuses.setDecimals(2)
        form.addRow("Bonuses:", self.bonuses)
        
        self.deductions = QDoubleSpinBox()
        self.deductions.setMinimum(0.0)
        self.deductions.setMaximum(99999.99)
        self.deductions.setDecimals(2)
        form.addRow("Deductions:", self.deductions)
        
        # Notes
        self.notes_input = QTextEdit()
        self.notes_input.setMaximumHeight(80)
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
        """Load staff"""
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
        """Save manual payroll entry"""
        try:
            db = get_db_session()
            
            staff_id = self.staff_combo.currentData()
            if not staff_id:
                QMessageBox.warning(self, "Warning", "Please select a staff member")
                return
            
            # Calculate totals
            base_salary = self.hours_worked.value() * self.hourly_rate.value()
            overtime_pay = self.overtime_hours.value() * self.overtime_rate.value()
            gross_pay = base_salary + overtime_pay + self.tips.value() + self.bonuses.value()
            net_pay = gross_pay - self.deductions.value()
            
            payroll = Payroll(
                staff_id=staff_id,
                pay_period_start=self.period_start.date().toPyDate(),
                pay_period_end=self.period_end.date().toPyDate(),
                base_salary=base_salary,
                hours_worked=self.hours_worked.value(),
                hourly_rate=self.hourly_rate.value(),
                overtime_hours=self.overtime_hours.value(),
                overtime_rate=self.overtime_rate.value(),
                tips=self.tips.value(),
                bonuses=self.bonuses.value(),
                deductions=self.deductions.value(),
                gross_pay=gross_pay,
                net_pay=net_pay,
                status='pending',
                notes=self.notes_input.toPlainText() or None
            )
            
            db.add(payroll)
            db.commit()
            db.close()
            
            QMessageBox.information(self, "Success", "Payroll entry added successfully")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error saving payroll: {e}")
            QMessageBox.critical(self, "Error", f"Failed to save payroll: {str(e)}")

