"""
Audit Trail View - View system audit logs
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QComboBox, QDateEdit,
    QMessageBox, QLineEdit
)
from PyQt6.QtCore import Qt, QDate
from PyQt6.QtGui import QColor
from loguru import logger
from datetime import datetime
from src.database.connection import get_db_session
from src.database.models import AuditLog, Staff


class AuditTrailView(QWidget):
    """Audit Trail View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        self.load_audit_logs()
    
    def setup_ui(self):
        """Setup audit trail UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        
        title = QLabel("Audit Trail")
        title.setStyleSheet("""
            color: #162640;
            font-size: 24px;
            font-weight: 700;
        """)
        header_layout.addWidget(title)
        header_layout.addStretch()
        
        layout.addLayout(header_layout)
        layout.addSpacing(24)
        
        # Filters
        filter_layout = QHBoxLayout()
        filter_layout.setSpacing(12)
        
        filter_layout.addWidget(QLabel("Staff:"))
        self.staff_combo = QComboBox()
        self.staff_combo.addItem("All Staff")
        self.load_staff_combo()
        filter_layout.addWidget(self.staff_combo)
        
        filter_layout.addWidget(QLabel("Action:"))
        self.action_combo = QComboBox()
        self.action_combo.addItems([
            "All Actions", "create", "update", "delete", "login", "logout"
        ])
        filter_layout.addWidget(self.action_combo)
        
        filter_layout.addWidget(QLabel("Table:"))
        self.table_input = QLineEdit()
        self.table_input.setPlaceholderText("Filter by table name...")
        filter_layout.addWidget(self.table_input)
        
        filter_layout.addWidget(QLabel("From:"))
        self.from_date = QDateEdit()
        self.from_date.setDate(QDate.currentDate().addDays(-7))
        self.from_date.setCalendarPopup(True)
        filter_layout.addWidget(self.from_date)
        
        filter_layout.addWidget(QLabel("To:"))
        self.to_date = QDateEdit()
        self.to_date.setDate(QDate.currentDate())
        self.to_date.setCalendarPopup(True)
        filter_layout.addWidget(self.to_date)
        
        filter_btn = QPushButton("Filter")
        filter_btn.setStyleSheet("""
            QPushButton {
                background-color: #5D6F8B;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
            }
        """)
        filter_btn.clicked.connect(self.load_audit_logs)
        filter_layout.addWidget(filter_btn)
        
        filter_layout.addStretch()
        layout.addLayout(filter_layout)
        layout.addSpacing(16)
        
        # Audit logs table
        self.audit_table = QTableWidget()
        self.audit_table.setColumnCount(7)
        self.audit_table.setHorizontalHeaderLabels([
            "Timestamp", "Staff", "Action", "Table", "Record ID", "IP Address", "Details"
        ])
        self.audit_table.setStyleSheet("""
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
        self.audit_table.horizontalHeader().setStretchLastSection(True)
        self.audit_table.setAlternatingRowColors(True)
        layout.addWidget(self.audit_table)
    
    def load_staff_combo(self):
        """Load staff into combo"""
        try:
            db = get_db_session()
            staff_list = db.query(Staff).all()
            for staff in staff_list:
                self.staff_combo.addItem(
                    f"{staff.first_name} {staff.last_name}",
                    staff.staff_id
                )
            db.close()
        except Exception as e:
            logger.error(f"Error loading staff combo: {e}")
    
    def load_audit_logs(self):
        """Load audit logs"""
        try:
            db = get_db_session()
            from_date = self.from_date.date().toPyDate()
            to_date = self.to_date.date().toPyDate()
            
            query = db.query(AuditLog).filter(
                AuditLog.timestamp >= datetime.combine(from_date, datetime.min.time()),
                AuditLog.timestamp <= datetime.combine(to_date, datetime.max.time())
            )
            
            # Apply filters
            staff_filter = self.staff_combo.currentData()
            if staff_filter:
                query = query.filter(AuditLog.staff_id == staff_filter)
            
            action_filter = self.action_combo.currentText()
            if action_filter != "All Actions":
                query = query.filter(AuditLog.action == action_filter)
            
            table_filter = self.table_input.text().strip()
            if table_filter:
                query = query.filter(AuditLog.table_name.ilike(f"%{table_filter}%"))
            
            logs = query.order_by(AuditLog.timestamp.desc()).limit(500).all()
            
            self.audit_table.setRowCount(len(logs))
            for row, log in enumerate(logs):
                self.audit_table.setItem(row, 0, QTableWidgetItem(
                    log.timestamp.strftime("%Y-%m-%d %H:%M:%S")
                ))
                
                staff_name = "-"
                if log.staff:
                    staff_name = f"{log.staff.first_name} {log.staff.last_name}"
                self.audit_table.setItem(row, 1, QTableWidgetItem(staff_name))
                
                action_item = QTableWidgetItem(log.action)
                if log.action == "delete":
                    action_item.setForeground(QColor("#D92D20"))
                elif log.action == "create":
                    action_item.setForeground(QColor("#14B8A6"))
                elif log.action == "update":
                    action_item.setForeground(QColor("#F59E0B"))
                self.audit_table.setItem(row, 2, action_item)
                
                self.audit_table.setItem(row, 3, QTableWidgetItem(log.table_name))
                self.audit_table.setItem(row, 4, QTableWidgetItem(str(log.record_id) if log.record_id else "-"))
                self.audit_table.setItem(row, 5, QTableWidgetItem(log.ip_address or "-"))
                
                # Details (show changes summary)
                details = ""
                if log.old_values and log.new_values:
                    details = f"Updated: {len(log.new_values)} fields"
                elif log.new_values:
                    details = f"Created: {len(log.new_values)} fields"
                elif log.old_values:
                    details = "Deleted"
                self.audit_table.setItem(row, 6, QTableWidgetItem(details))
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading audit logs: {e}")
            QMessageBox.critical(self, "Error", f"Failed to load audit logs: {str(e)}")

