"""
Healthcare / Clinics / Pharmacies Module
Patient management, prescriptions, appointments, billing
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QTabWidget, QFrame, QMessageBox
)
from PyQt6.QtCore import Qt
from loguru import logger
from src.database.connection import get_db_session


class HealthcareView(QWidget):
    """Healthcare Management View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
    
    def setup_ui(self):
        """Setup healthcare UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        title = QLabel("Healthcare Management")
        title.setStyleSheet("""
            color: #162640;
            font-size: 24px;
            font-weight: 700;
        """)
        header_layout.addWidget(title)
        header_layout.addStretch()
        layout.addLayout(header_layout)
        layout.addSpacing(24)
        
        # Tabs
        self.tabs = QTabWidget()
        self.tabs.setStyleSheet("""
            QTabWidget::pane {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background-color: white;
            }
            QTabBar::tab {
                background-color: #EDF3FC;
                color: #2A3A55;
                padding: 10px 20px;
                margin-right: 2px;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
            }
            QTabBar::tab:selected {
                background-color: white;
                color: #2F7DFF;
                font-weight: 600;
            }
        """)
        
        # Patients tab
        patients_tab = self.create_patients_tab()
        self.tabs.addTab(patients_tab, "👥 Patients")
        
        # Appointments tab
        appointments_tab = self.create_appointments_tab()
        self.tabs.addTab(appointments_tab, "📅 Appointments")
        
        # Prescriptions tab
        prescriptions_tab = self.create_prescriptions_tab()
        self.tabs.addTab(prescriptions_tab, "💊 Prescriptions")
        
        # Medical Inventory tab
        inventory_tab = self.create_medical_inventory_tab()
        self.tabs.addTab(inventory_tab, "🏥 Medical Inventory")
        
        # Billing & Insurance tab
        billing_tab = self.create_billing_tab()
        self.tabs.addTab(billing_tab, "💰 Billing & Insurance")
        
        layout.addWidget(self.tabs)
    
    def create_patients_tab(self):
        """Create patients management tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 24, 24, 24)
        
        # Summary cards
        cards_layout = QHBoxLayout()
        cards_layout.setSpacing(16)
        
        cards = [
            ("Total Patients", "0", "#2F7DFF"),
            ("Active Appointments", "0", "#14B8A6"),
            ("Pending Prescriptions", "0", "#F59E0B"),
            ("Today's Visits", "0", "#D92D20")
        ]
        
        for title, value, color in cards:
            card = self.create_summary_card(title, value, color)
            cards_layout.addWidget(card)
        
        layout.addLayout(cards_layout)
        layout.addSpacing(24)
        
        # Patients table
        table_label = QLabel("Patient Records")
        table_label.setStyleSheet("""
            color: #162640;
            font-size: 18px;
            font-weight: 600;
        """)
        layout.addWidget(table_label)
        
        self.patients_table = QTableWidget()
        self.patients_table.setColumnCount(6)
        self.patients_table.setHorizontalHeaderLabels([
            "Patient ID", "Name", "DOB", "Phone", "Last Visit", "Status"
        ])
        self.patients_table.horizontalHeader().setStretchLastSection(True)
        self.patients_table.setStyleSheet("""
            QTableWidget {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background-color: white;
            }
        """)
        layout.addWidget(self.patients_table)
        
        layout.addStretch()
        return widget
    
    def create_appointments_tab(self):
        """Create appointments scheduling tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 24, 24, 24)
        
        self.appointments_table = QTableWidget()
        self.appointments_table.setColumnCount(6)
        self.appointments_table.setHorizontalHeaderLabels([
            "Date/Time", "Patient", "Doctor", "Type", "Status", "Notes"
        ])
        self.appointments_table.horizontalHeader().setStretchLastSection(True)
        self.appointments_table.setStyleSheet("""
            QTableWidget {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background-color: white;
            }
        """)
        layout.addWidget(self.appointments_table)
        
        layout.addStretch()
        return widget
    
    def create_prescriptions_tab(self):
        """Create prescriptions management tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 24, 24, 24)
        
        self.prescriptions_table = QTableWidget()
        self.prescriptions_table.setColumnCount(7)
        self.prescriptions_table.setHorizontalHeaderLabels([
            "Prescription ID", "Patient", "Medication", "Dosage", "Quantity", "Date", "Status"
        ])
        self.prescriptions_table.horizontalHeader().setStretchLastSection(True)
        self.prescriptions_table.setStyleSheet("""
            QTableWidget {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background-color: white;
            }
        """)
        layout.addWidget(self.prescriptions_table)
        
        layout.addStretch()
        return widget
    
    def create_medical_inventory_tab(self):
        """Create medical inventory tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 24, 24, 24)
        
        self.medical_inventory_table = QTableWidget()
        self.medical_inventory_table.setColumnCount(6)
        self.medical_inventory_table.setHorizontalHeaderLabels([
            "Item", "Category", "Quantity", "Expiry Date", "Supplier", "Status"
        ])
        self.medical_inventory_table.horizontalHeader().setStretchLastSection(True)
        self.medical_inventory_table.setStyleSheet("""
            QTableWidget {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background-color: white;
            }
        """)
        layout.addWidget(self.medical_inventory_table)
        
        layout.addStretch()
        return widget
    
    def create_billing_tab(self):
        """Create billing & insurance tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 24, 24, 24)
        
        self.billing_table = QTableWidget()
        self.billing_table.setColumnCount(7)
        self.billing_table.setHorizontalHeaderLabels([
            "Invoice ID", "Patient", "Service", "Amount", "Insurance", "Status", "Date"
        ])
        self.billing_table.horizontalHeader().setStretchLastSection(True)
        self.billing_table.setStyleSheet("""
            QTableWidget {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background-color: white;
            }
        """)
        layout.addWidget(self.billing_table)
        
        layout.addStretch()
        return widget
    
    def create_summary_card(self, title: str, value: str, color: str):
        """Create a summary card"""
        card = QFrame()
        card.setStyleSheet("""
            QFrame {
                background-color: white;
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                padding: 20px;
            }
        """)
        card.setFixedHeight(120)
        
        layout = QVBoxLayout(card)
        title_label = QLabel(title)
        title_label.setStyleSheet("""
            color: #5D6F8B;
            font-size: 14px;
            font-weight: 500;
        """)
        value_label = QLabel(value)
        value_label.setStyleSheet(f"""
            color: {color};
            font-size: 28px;
            font-weight: 700;
        """)
        layout.addWidget(title_label)
        layout.addWidget(value_label)
        layout.addStretch()
        
        return card

