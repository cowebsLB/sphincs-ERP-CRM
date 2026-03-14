"""
Advanced Operations Hub View
Combines reservations, vendor contracts, training, audits,
maintenance, delivery, menu engineering, events, and safety modules.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Sequence, Tuple

from loguru import logger
from PyQt6.QtCore import Qt, QDate, QDateTime
from PyQt6.QtWidgets import (
    QWidget,
    QVBoxLayout,
    QLabel,
    QPushButton,
    QHBoxLayout,
    QTableWidget,
    QTableWidgetItem,
    QHeaderView,
    QMessageBox,
    QDialog,
    QFormLayout,
    QLineEdit,
    QTextEdit,
    QSpinBox,
    QDoubleSpinBox,
    QDateEdit,
    QDateTimeEdit,
    QComboBox,
    QDialogButtonBox,
    QTabWidget,
    QFrame,
)

from src.database.connection import get_db_session
from src.database.models import (
    Reservation,
    VendorContract,
    TrainingModule,
    TrainingAssignment,
    Certification,
    QualityAudit,
    MaintenanceAsset,
    MaintenanceTask,
    DeliveryVehicle,
    DeliveryAssignment,
    MenuEngineeringInsight,
    EventBooking,
    EventStaffAssignment,
    SafetyIncident,
    Supplier,
    Staff,
    Product,
    Location,
    Order,
)


@dataclass
class DynamicField:
    """Definition for dynamic form fields."""
    
    name: str
    label: str
    field_type: str = "line"  # line, text, spin, double, combo, date, datetime
    required: bool = True
    options: Optional[Sequence[Any]] = None
    minimum: Optional[float] = None
    maximum: Optional[float] = None
    default: Any = None


class DynamicFormDialog(QDialog):
    """Reusable dialog that builds a form dynamically."""
    
    def __init__(self, title: str, fields: Sequence[DynamicField], parent: QWidget | None = None):
        super().__init__(parent)
        self.setWindowTitle(title)
        self.setModal(True)
        self.fields = fields
        self.widgets: Dict[str, QWidget] = {}
        
        layout = QVBoxLayout(self)
        form_layout = QFormLayout()
        
        for field in self.fields:
            widget = self._create_widget(field)
            self.widgets[field.name] = widget
            form_layout.addRow(field.label + (" *" if field.required else ""), widget)
        
        layout.addLayout(form_layout)
        
        buttons = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel
        )
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)
    
    def _create_widget(self, field: DynamicField) -> QWidget:
        if field.field_type == "text":
            widget = QTextEdit()
            if field.default:
                widget.setPlainText(str(field.default))
            return widget
        
        if field.field_type == "spin":
            widget = QSpinBox()
            widget.setMinimum(int(field.minimum) if field.minimum is not None else 0)
            widget.setMaximum(int(field.maximum) if field.maximum is not None else 1000000)
            if field.default is not None:
                widget.setValue(int(field.default))
            return widget
        
        if field.field_type == "double":
            widget = QDoubleSpinBox()
            widget.setDecimals(2)
            widget.setMinimum(field.minimum if field.minimum is not None else 0.0)
            widget.setMaximum(field.maximum if field.maximum is not None else 1000000.0)
            if field.default is not None:
                widget.setValue(float(field.default))
            return widget
        
        if field.field_type == "combo":
            widget = QComboBox()
            widget.setEditable(False)
            options = field.options or []
            for option in options:
                if isinstance(option, tuple) and len(option) == 2:
                    widget.addItem(str(option[1]), option[0])
                else:
                    widget.addItem(str(option), option)
            if field.default is not None:
                index = widget.findData(field.default)
                if index >= 0:
                    widget.setCurrentIndex(index)
            return widget
        
        if field.field_type == "date":
            widget = QDateEdit()
            widget.setCalendarPopup(True)
            if isinstance(field.default, QDate):
                widget.setDate(field.default)
            elif field.default:
                widget.setDate(field.default)
            else:
                widget.setDate(QDate.currentDate())
            return widget
        
        if field.field_type == "datetime":
            widget = QDateTimeEdit()
            widget.setCalendarPopup(True)
            if isinstance(field.default, QDateTime):
                widget.setDateTime(field.default)
            else:
                widget.setDateTime(QDateTime.currentDateTime())
            return widget
        
        # Default to QLineEdit
        widget = QLineEdit()
        if field.default is not None:
            widget.setText(str(field.default))
        return widget
    
    def get_values(self) -> Dict[str, Any]:
        """Return form values as dictionary."""
        data: Dict[str, Any] = {}
        for field in self.fields:
            widget = self.widgets[field.name]
            if isinstance(widget, QLineEdit):
                value = widget.text().strip()
            elif isinstance(widget, QTextEdit):
                value = widget.toPlainText().strip()
            elif isinstance(widget, QSpinBox):
                value = widget.value()
            elif isinstance(widget, QDoubleSpinBox):
                value = widget.value()
            elif isinstance(widget, QComboBox):
                value = widget.currentData()
            elif isinstance(widget, QDateEdit):
                value = widget.date().toPyDate()
            elif isinstance(widget, QDateTimeEdit):
                value = widget.dateTime().toPyDateTime()
            else:
                value = None
            data[field.name] = value
        return data


class AdvancedOperationsView(QWidget):
    """Main view that aggregates all advanced operational modules."""
    
    def __init__(self, user_id: int, parent: QWidget | None = None):
        super().__init__(parent)
        self.user_id = user_id
        self.tables: Dict[str, QTableWidget] = {}
        
        # Styling presets
        self.primary_button_style = """
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 10px 18px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #1D66EA;
            }
            QPushButton:pressed {
                background-color: #1E3A8A;
            }
        """
        self.secondary_button_style = """
            QPushButton {
                background-color: #EEF2FF;
                color: #1E3A8A;
                border: 1px solid #C7D2FE;
                border-radius: 8px;
                padding: 10px 16px;
                font-weight: 500;
            }
            QPushButton:hover {
                background-color: #E0E7FF;
            }
        """
        self.card_style = """
            QFrame#operationsCard {
                background-color: white;
                border: 1px solid #C8D4E8;
                border-radius: 16px;
            }
        """
        self.setObjectName("operationsRoot")
        self.setStyleSheet("""
            QWidget#operationsRoot {
                background-color: #EDF3FC;
            }
        """)
        
        self.setup_ui()
        self.load_all_data()
    
    # ------------------------------------------------------------------ UI SETUP
    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(16)
        
        header = QLabel("Advanced Operations Hub")
        header.setStyleSheet("""
            font-size: 24px;
            font-weight: 700;
            color: #162640;
        """)
        layout.addWidget(header)
        
        subtitle = QLabel(
            "Manage reservations, vendor contracts, staff training, audits, maintenance, "
            "delivery fleet, menu engineering, events, and safety—all from one place."
        )
        subtitle.setWordWrap(True)
        subtitle.setStyleSheet("color: #5D6F8B; font-size: 14px;")
        layout.addWidget(subtitle)
        
        self.tabs = QTabWidget()
        self.tabs.setStyleSheet("""
            QTabWidget::pane {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background: white;
            }
            QTabBar::tab {
                background: #EDF3FC;
                padding: 8px 16px;
                margin: 2px;
                border-top-left-radius: 6px;
                border-top-right-radius: 6px;
            }
            QTabBar::tab:selected {
                background: white;
                font-weight: 600;
            }
        """)
        
        self.tabs.addTab(self.create_reservations_tab(), "Reservations")
        self.tabs.addTab(self.create_vendor_contracts_tab(), "Vendor Contracts")
        self.tabs.addTab(self.create_training_tab(), "Training & Certifications")
        self.tabs.addTab(self.create_quality_tab(), "Quality & Compliance")
        self.tabs.addTab(self.create_maintenance_tab(), "Maintenance & Assets")
        self.tabs.addTab(self.create_delivery_tab(), "Delivery & Fleet")
        self.tabs.addTab(self.create_menu_engineering_tab(), "Menu Engineering")
        self.tabs.addTab(self.create_events_tab(), "Events & Catering")
        self.tabs.addTab(self.create_safety_tab(), "Safety & Incidents")
        
        layout.addWidget(self.tabs)
    
    def create_section_header(self, title: str, description: str) -> QWidget:
        frame = QFrame()
        frame.setFrameShape(QFrame.Shape.NoFrame)
        v_layout = QVBoxLayout(frame)
        v_layout.setContentsMargins(0, 0, 0, 0)
        title_label = QLabel(title)
        title_label.setStyleSheet("font-size: 18px; font-weight: 600; color: #162640;")
        desc_label = QLabel(description)
        desc_label.setWordWrap(True)
        desc_label.setStyleSheet("color: #5D6F8B;")
        v_layout.addWidget(title_label)
        v_layout.addWidget(desc_label)
        return frame
    
    def create_card(self) -> tuple[QFrame, QVBoxLayout]:
        card = QFrame()
        card.setObjectName("operationsCard")
        card.setStyleSheet(self.card_style)
        layout = QVBoxLayout(card)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(16)
        return card, layout
    
    def create_button_row(self, buttons: List[Tuple[Any, ...]]) -> QWidget:
        row = QWidget()
        layout = QHBoxLayout(row)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(8)
        for index, btn_def in enumerate(buttons):
            if len(btn_def) == 3:
                label, handler, is_primary = btn_def
            else:
                label, handler = btn_def
                is_primary = (index == 0)
            btn = QPushButton(label)
            btn.setCursor(Qt.CursorShape.PointingHandCursor)
            btn.setStyleSheet(self.primary_button_style if is_primary else self.secondary_button_style)
            btn.clicked.connect(handler)
            layout.addWidget(btn)
        layout.addStretch()
        return row
    
    def create_table(self, key: str, headers: Sequence[str]) -> QTableWidget:
        table = QTableWidget()
        table.setColumnCount(len(headers))
        table.setHorizontalHeaderLabels(headers)
        table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        table.horizontalHeader().setStyleSheet("""
            QHeaderView::section {
                background-color: #EEF2FF;
                color: #312E81;
                padding: 8px;
                border: none;
                font-weight: 600;
            }
        """)
        table.verticalHeader().setVisible(False)
        table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        table.setSelectionMode(QTableWidget.SelectionMode.SingleSelection)
        table.setAlternatingRowColors(True)
        table.setShowGrid(False)
        table.setStyleSheet("""
            QTableWidget {
                background: white;
                alternate-background-color: #F9FAFB;
                border: none;
            }
            QTableWidget::item {
                padding: 6px;
            }
        """)
        self.tables[key] = table
        return table
    
    # ------------------------------------------------------------------ TAB BUILDERS
    def create_reservations_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        card, card_layout = self.create_card()
        card_layout.addWidget(self.create_section_header(
            "Reservations & Waitlist",
            "Manage bookings, channels, reminders, and on-site waitlist."
        ))
        
        button_row = self.create_button_row([
            ("Add Reservation", self.handle_add_reservation),
            ("Mark Confirmed", lambda: self.update_reservation_status("confirmed")),
            ("Mark Seated", lambda: self.update_reservation_status("seated")),
            ("Cancel", lambda: self.update_reservation_status("cancelled")),
            ("Refresh", self.load_reservations),
        ])
        card_layout.addWidget(button_row)
        
        table = self.create_table(
            "reservations",
            ["Customer", "Date/Time", "Party", "Status", "Channel", "Location"]
        )
        card_layout.addWidget(table)
        layout.addWidget(card)
        layout.addStretch()
        return widget
    
    def create_vendor_contracts_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        card, card_layout = self.create_card()
        card_layout.addWidget(self.create_section_header(
            "Vendor Contracts & SLAs",
            "Track contract terms, renewal dates, and compliance."
        ))
        card_layout.addWidget(self.create_button_row([
            ("Add Contract", self.handle_add_contract),
            ("Mark Terminated", lambda: self.update_contract_status("terminated")),
            ("Refresh", self.load_vendor_contracts),
        ]))
        card_layout.addWidget(self.create_table(
            "contracts",
            ["Supplier", "Title", "Start", "End", "Status", "Value"]
        ))
        layout.addWidget(card)
        layout.addStretch()
        return widget
    
    def create_training_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        card, card_layout = self.create_card()
        card_layout.addWidget(self.create_section_header(
            "Training & Certifications",
            "Assign modules, track completion, and monitor certification renewals."
        ))
        sub_tabs = QTabWidget()
        sub_tabs.addTab(self._create_training_modules_tab(), "Modules")
        sub_tabs.addTab(self._create_training_assignments_tab(), "Assignments")
        sub_tabs.addTab(self._create_certifications_tab(), "Certifications")
        card_layout.addWidget(sub_tabs)
        layout.addWidget(card)
        layout.addStretch()
        return widget
    
    def _create_training_modules_tab(self) -> QWidget:
        tab = QWidget()
        layout = QVBoxLayout(tab)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(12)
        layout.addWidget(self.create_button_row([
            ("Add Module", self.handle_add_training_module),
            ("Refresh", self.load_training_modules),
        ]))
        layout.addWidget(self.create_table(
            "training_modules",
            ["Title", "Category", "Duration (hrs)", "Required", "Updated"]
        ))
        return tab
    
    def _create_training_assignments_tab(self) -> QWidget:
        tab = QWidget()
        layout = QVBoxLayout(tab)
        layout.addWidget(self.create_button_row([
            ("Assign Training", self.handle_add_training_assignment),
            ("Mark Completed", lambda: self.update_assignment_status("completed")),
            ("Refresh", self.load_training_assignments),
        ]))
        layout.addWidget(self.create_table(
            "training_assignments",
            ["Staff", "Module", "Assigned", "Due", "Status"]
        ))
        return tab
    
    def _create_certifications_tab(self) -> QWidget:
        tab = QWidget()
        layout = QVBoxLayout(tab)
        layout.addWidget(self.create_button_row([
            ("Add Certification", self.handle_add_certification),
            ("Refresh", self.load_certifications),
        ]))
        layout.addWidget(self.create_table(
            "certifications",
            ["Staff", "Certification", "Provider", "Issue", "Expiry", "Status"]
        ))
        return tab
    
    def create_quality_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        card, card_layout = self.create_card()
        card_layout.addWidget(self.create_section_header(
            "Quality & Compliance Audits",
            "Schedule inspections, log findings, and track corrective actions."
        ))
        card_layout.addWidget(self.create_button_row([
            ("Add Audit", self.handle_add_audit),
            ("Close Audit", lambda: self.update_audit_status("closed")),
            ("Refresh", self.load_quality_audits),
        ]))
        card_layout.addWidget(self.create_table(
            "quality_audits",
            ["Location", "Area", "Date", "Score", "Status", "Follow-up"]
        ))
        layout.addWidget(card)
        layout.addStretch()
        return widget
    
    def create_maintenance_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        card, card_layout = self.create_card()
        card_layout.addWidget(self.create_section_header(
            "Maintenance & Assets",
            "Track equipment, preventive maintenance, and work orders."
        ))
        sub_tabs = QTabWidget()
        sub_tabs.addTab(self._create_assets_tab(), "Assets")
        sub_tabs.addTab(self._create_tasks_tab(), "Tasks")
        card_layout.addWidget(sub_tabs)
        layout.addWidget(card)
        layout.addStretch()
        return widget
    
    def _create_assets_tab(self) -> QWidget:
        tab = QWidget()
        layout = QVBoxLayout(tab)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(12)
        layout.addWidget(self.create_button_row([
            ("Add Asset", self.handle_add_asset),
            ("Mark Retired", lambda: self.update_asset_status("retired")),
            ("Refresh", self.load_assets),
        ]))
        layout.addWidget(self.create_table(
            "assets",
            ["Asset", "Category", "Serial", "Location", "Warranty", "Status"]
        ))
        return tab
    
    def _create_tasks_tab(self) -> QWidget:
        tab = QWidget()
        layout = QVBoxLayout(tab)
        layout.addWidget(self.create_button_row([
            ("Add Task", self.handle_add_task),
            ("Mark Completed", lambda: self.update_task_status("completed")),
            ("Refresh", self.load_tasks),
        ]))
        layout.addWidget(self.create_table(
            "maintenance_tasks",
            ["Asset", "Description", "Priority", "Scheduled", "Assignee", "Status"]
        ))
        return tab
    
    def create_delivery_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        card, card_layout = self.create_card()
        card_layout.addWidget(self.create_section_header(
            "Delivery Fleet & Routing",
            "Manage vehicles, drivers, and delivery status updates."
        ))
        sub_tabs = QTabWidget()
        sub_tabs.addTab(self._create_vehicle_tab(), "Vehicles")
        sub_tabs.addTab(self._create_delivery_assignments_tab(), "Assignments")
        card_layout.addWidget(sub_tabs)
        layout.addWidget(card)
        layout.addStretch()
        return widget
    
    def _create_vehicle_tab(self) -> QWidget:
        tab = QWidget()
        layout = QVBoxLayout(tab)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(12)
        layout.addWidget(self.create_button_row([
            ("Add Vehicle", self.handle_add_vehicle),
            ("Mark Maintenance", lambda: self.update_vehicle_status("maintenance")),
            ("Refresh", self.load_vehicles),
        ]))
        layout.addWidget(self.create_table(
            "vehicles",
            ["Vehicle", "Plate", "Capacity", "Status", "Last Service"]
        ))
        return tab
    
    def _create_delivery_assignments_tab(self) -> QWidget:
        tab = QWidget()
        layout = QVBoxLayout(tab)
        layout.addWidget(self.create_button_row([
            ("Create Assignment", self.handle_add_delivery_assignment),
            ("Mark Delivered", lambda: self.update_delivery_status("delivered")),
            ("Refresh", self.load_delivery_assignments),
        ]))
        layout.addWidget(self.create_table(
            "delivery_assignments",
            ["Order", "Driver", "Vehicle", "Assigned", "Status", "Notes"]
        ))
        return tab
    
    def create_menu_engineering_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        card, card_layout = self.create_card()
        card_layout.addWidget(self.create_section_header(
            "Menu Engineering",
            "Blend sales and recipe data to identify stars, puzzles, and dogs."
        ))
        card_layout.addWidget(self.create_button_row([
            ("Add Insight", self.handle_add_menu_insight),
            ("Refresh", self.load_menu_insights),
        ]))
        card_layout.addWidget(self.create_table(
            "menu_insights",
            ["Product", "Popularity", "Profitability", "Class", "Recommendation"]
        ))
        layout.addWidget(card)
        layout.addStretch()
        return widget
    
    def create_events_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        card, card_layout = self.create_card()
        card_layout.addWidget(self.create_section_header(
            "Events & Catering",
            "Coordinate large orders, staffing, and profitability tracking."
        ))
        sub_tabs = QTabWidget()
        sub_tabs.addTab(self._create_events_list_tab(), "Events")
        sub_tabs.addTab(self._create_event_staff_tab(), "Staffing")
        card_layout.addWidget(sub_tabs)
        layout.addWidget(card)
        layout.addStretch()
        return widget
    
    def _create_events_list_tab(self) -> QWidget:
        tab = QWidget()
        layout = QVBoxLayout(tab)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(12)
        layout.addWidget(self.create_button_row([
            ("Add Event", self.handle_add_event),
            ("Update Status", lambda: self.update_event_status("confirmed")),
            ("Refresh", self.load_events),
        ]))
        layout.addWidget(self.create_table(
            "events",
            ["Event", "Date", "Location", "Guests", "Budget", "Status"]
        ))
        return tab
    
    def _create_event_staff_tab(self) -> QWidget:
        tab = QWidget()
        layout = QVBoxLayout(tab)
        layout.addWidget(self.create_button_row([
            ("Assign Staff", self.handle_add_event_assignment),
            ("Refresh", self.load_event_assignments),
        ]))
        layout.addWidget(self.create_table(
            "event_assignments",
            ["Event", "Staff", "Role", "Hours"]
        ))
        return tab
    
    def create_safety_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        card, card_layout = self.create_card()
        card_layout.addWidget(self.create_section_header(
            "Health & Safety Incidents",
            "Log incidents, corrective actions, and compliance status."
        ))
        card_layout.addWidget(self.create_button_row([
            ("Report Incident", self.handle_add_incident),
            ("Close Incident", lambda: self.update_incident_status("closed")),
            ("Refresh", self.load_incidents),
        ]))
        card_layout.addWidget(self.create_table(
            "incidents",
            ["Date", "Location", "Severity", "Category", "Injuries", "Status"]
        ))
        layout.addWidget(card)
        layout.addStretch()
        return widget
    
    # ------------------------------------------------------------------ LOADERS
    def load_all_data(self):
        self.load_reservations()
        self.load_vendor_contracts()
        self.load_training_modules()
        self.load_training_assignments()
        self.load_certifications()
        self.load_quality_audits()
        self.load_assets()
        self.load_tasks()
        self.load_vehicles()
        self.load_delivery_assignments()
        self.load_menu_insights()
        self.load_events()
        self.load_event_assignments()
        self.load_incidents()
    
    def load_reservations(self):
        table = self.tables["reservations"]
        session = get_db_session()
        try:
            reservations = session.query(Reservation).order_by(
                Reservation.reservation_datetime.desc()
            ).limit(200).all()
            table.setRowCount(len(reservations))
            for row, reservation in enumerate(reservations):
                table.setItem(row, 0, self._table_item(reservation.customer_name, reservation.reservation_id))
                table.setItem(row, 1, QTableWidgetItem(
                    reservation.reservation_datetime.strftime("%Y-%m-%d %H:%M")
                    if reservation.reservation_datetime else ""
                ))
                table.setItem(row, 2, QTableWidgetItem(str(reservation.party_size)))
                table.setItem(row, 3, QTableWidgetItem(reservation.status.title()))
                table.setItem(row, 4, QTableWidgetItem(reservation.channel or "-"))
                table.setItem(row, 5, QTableWidgetItem(
                    reservation.location.name if reservation.location else "-"
                ))
        except Exception as exc:
            logger.error(f"Error loading reservations: {exc}")
            self.show_error("Failed to load reservations", exc)
        finally:
            session.close()
    
    def load_vendor_contracts(self):
        table = self.tables["contracts"]
        session = get_db_session()
        try:
            contracts = session.query(VendorContract).order_by(VendorContract.start_date.desc()).all()
            table.setRowCount(len(contracts))
            for row, contract in enumerate(contracts):
                supplier_name = contract.supplier.name if contract.supplier else "Unknown"
                table.setItem(row, 0, self._table_item(supplier_name, contract.contract_id))
                table.setItem(row, 1, QTableWidgetItem(contract.contract_title))
                table.setItem(row, 2, QTableWidgetItem(contract.start_date.isoformat() if contract.start_date else ""))
                table.setItem(row, 3, QTableWidgetItem(contract.end_date.isoformat() if contract.end_date else "-"))
                table.setItem(row, 4, QTableWidgetItem(contract.status.title()))
                value_str = f"${contract.contract_value:,.2f}" if contract.contract_value else "-"
                table.setItem(row, 5, QTableWidgetItem(value_str))
        except Exception as exc:
            logger.error(f"Error loading contracts: {exc}")
            self.show_error("Failed to load vendor contracts", exc)
        finally:
            session.close()
    
    def load_training_modules(self):
        table = self.tables["training_modules"]
        session = get_db_session()
        try:
            modules = session.query(TrainingModule).order_by(TrainingModule.title).all()
            table.setRowCount(len(modules))
            for row, module in enumerate(modules):
                table.setItem(row, 0, self._table_item(module.title, module.module_id))
                table.setItem(row, 1, QTableWidgetItem(module.category or "-"))
                table.setItem(row, 2, QTableWidgetItem(f"{module.duration_hours or 0:.1f}"))
                table.setItem(row, 3, QTableWidgetItem("Yes" if module.is_required else "No"))
                table.setItem(row, 4, QTableWidgetItem(
                    module.last_modified.strftime("%Y-%m-%d") if module.last_modified else "-"
                ))
        except Exception as exc:
            logger.error(f"Error loading training modules: {exc}")
            self.show_error("Failed to load training modules", exc)
        finally:
            session.close()
    
    def load_training_assignments(self):
        table = self.tables["training_assignments"]
        session = get_db_session()
        try:
            assignments = session.query(TrainingAssignment).order_by(
                TrainingAssignment.assigned_date.desc()
            ).all()
            table.setRowCount(len(assignments))
            for row, assignment in enumerate(assignments):
                staff_name = f"{assignment.staff.first_name} {assignment.staff.last_name}" if assignment.staff else "Unknown"
                module_title = assignment.module.title if assignment.module else "Unknown"
                table.setItem(row, 0, self._table_item(staff_name, assignment.assignment_id))
                table.setItem(row, 1, QTableWidgetItem(module_title))
                table.setItem(row, 2, QTableWidgetItem(
                    assignment.assigned_date.isoformat() if assignment.assigned_date else "-"
                ))
                table.setItem(row, 3, QTableWidgetItem(
                    assignment.due_date.isoformat() if assignment.due_date else "-"
                ))
                table.setItem(row, 4, QTableWidgetItem(assignment.status.title()))
        except Exception as exc:
            logger.error(f"Error loading assignments: {exc}")
            self.show_error("Failed to load training assignments", exc)
        finally:
            session.close()
    
    def load_certifications(self):
        table = self.tables["certifications"]
        session = get_db_session()
        try:
            certifications = session.query(Certification).order_by(
                Certification.expiry_date
            ).all()
            table.setRowCount(len(certifications))
            for row, cert in enumerate(certifications):
                staff_name = f"{cert.staff.first_name} {cert.staff.last_name}" if cert.staff else "Unknown"
                table.setItem(row, 0, self._table_item(staff_name, cert.certification_id))
                table.setItem(row, 1, QTableWidgetItem(cert.certification_name))
                table.setItem(row, 2, QTableWidgetItem(cert.provider or "-"))
                table.setItem(row, 3, QTableWidgetItem(cert.issue_date.isoformat() if cert.issue_date else "-"))
                table.setItem(row, 4, QTableWidgetItem(cert.expiry_date.isoformat() if cert.expiry_date else "-"))
                table.setItem(row, 5, QTableWidgetItem(cert.status.title()))
        except Exception as exc:
            logger.error(f"Error loading certifications: {exc}")
            self.show_error("Failed to load certifications", exc)
        finally:
            session.close()
    
    def load_quality_audits(self):
        table = self.tables["quality_audits"]
        session = get_db_session()
        try:
            audits = session.query(QualityAudit).order_by(QualityAudit.audit_date.desc()).all()
            table.setRowCount(len(audits))
            for row, audit in enumerate(audits):
                location = audit.location.name if audit.location else "-"
                table.setItem(row, 0, self._table_item(location, audit.audit_id))
                table.setItem(row, 1, QTableWidgetItem(audit.area))
                table.setItem(row, 2, QTableWidgetItem(audit.audit_date.isoformat()))
                table.setItem(row, 3, QTableWidgetItem(str(audit.score or "-")))
                table.setItem(row, 4, QTableWidgetItem(audit.status.title()))
                table.setItem(row, 5, QTableWidgetItem(
                    audit.follow_up_date.isoformat() if audit.follow_up_date else "-"
                ))
        except Exception as exc:
            logger.error(f"Error loading audits: {exc}")
            self.show_error("Failed to load quality audits", exc)
        finally:
            session.close()
    
    def load_assets(self):
        table = self.tables["assets"]
        session = get_db_session()
        try:
            assets = session.query(MaintenanceAsset).order_by(MaintenanceAsset.asset_name).all()
            table.setRowCount(len(assets))
            for row, asset in enumerate(assets):
                table.setItem(row, 0, self._table_item(asset.asset_name, asset.asset_id))
                table.setItem(row, 1, QTableWidgetItem(asset.category or "-"))
                table.setItem(row, 2, QTableWidgetItem(asset.serial_number or "-"))
                table.setItem(row, 3, QTableWidgetItem(asset.location.name if asset.location else "-"))
                table.setItem(row, 4, QTableWidgetItem(asset.warranty_expiry.isoformat() if asset.warranty_expiry else "-"))
                table.setItem(row, 5, QTableWidgetItem(asset.status.title()))
        except Exception as exc:
            logger.error(f"Error loading assets: {exc}")
            self.show_error("Failed to load assets", exc)
        finally:
            session.close()
    
    def load_tasks(self):
        table = self.tables["maintenance_tasks"]
        session = get_db_session()
        try:
            tasks = session.query(MaintenanceTask).order_by(MaintenanceTask.scheduled_date).all()
            table.setRowCount(len(tasks))
            for row, task in enumerate(tasks):
                asset_name = task.asset.asset_name if task.asset else "-"
                assignee = f"{task.assignee.first_name} {task.assignee.last_name}" if task.assignee else "-"
                table.setItem(row, 0, self._table_item(asset_name, task.task_id))
                table.setItem(row, 1, QTableWidgetItem(task.description[:60] + ("..." if len(task.description) > 60 else "")))
                table.setItem(row, 2, QTableWidgetItem(task.priority.title()))
                table.setItem(row, 3, QTableWidgetItem(task.scheduled_date.isoformat() if task.scheduled_date else "-"))
                table.setItem(row, 4, QTableWidgetItem(assignee))
                table.setItem(row, 5, QTableWidgetItem(task.status.title()))
        except Exception as exc:
            logger.error(f"Error loading maintenance tasks: {exc}")
            self.show_error("Failed to load maintenance tasks", exc)
        finally:
            session.close()
    
    def load_vehicles(self):
        table = self.tables["vehicles"]
        session = get_db_session()
        try:
            vehicles = session.query(DeliveryVehicle).order_by(DeliveryVehicle.name).all()
            table.setRowCount(len(vehicles))
            for row, vehicle in enumerate(vehicles):
                table.setItem(row, 0, self._table_item(vehicle.name, vehicle.vehicle_id))
                table.setItem(row, 1, QTableWidgetItem(vehicle.license_plate or "-"))
                table.setItem(row, 2, QTableWidgetItem(vehicle.capacity or "-"))
                table.setItem(row, 3, QTableWidgetItem(vehicle.status.title()))
                table.setItem(row, 4, QTableWidgetItem(
                    vehicle.last_serviced_date.isoformat() if vehicle.last_serviced_date else "-"
                ))
        except Exception as exc:
            logger.error(f"Error loading vehicles: {exc}")
            self.show_error("Failed to load delivery vehicles", exc)
        finally:
            session.close()
    
    def load_delivery_assignments(self):
        table = self.tables["delivery_assignments"]
        session = get_db_session()
        try:
            assignments = session.query(DeliveryAssignment).order_by(
                DeliveryAssignment.assigned_time.desc()
            ).all()
            table.setRowCount(len(assignments))
            for row, assignment in enumerate(assignments):
                order_ref = f"Order #{assignment.order_id}" if assignment.order_id else "-"
                driver = f"{assignment.driver.first_name} {assignment.driver.last_name}" if assignment.driver else "-"
                vehicle = assignment.vehicle.name if assignment.vehicle else "-"
                table.setItem(row, 0, self._table_item(order_ref, assignment.assignment_id))
                table.setItem(row, 1, QTableWidgetItem(driver))
                table.setItem(row, 2, QTableWidgetItem(vehicle))
                table.setItem(row, 3, QTableWidgetItem(
                    assignment.assigned_time.strftime("%Y-%m-%d %H:%M")
                ))
                table.setItem(row, 4, QTableWidgetItem(assignment.status.title()))
                table.setItem(row, 5, QTableWidgetItem((assignment.route_notes or "")[:40]))
        except Exception as exc:
            logger.error(f"Error loading delivery assignments: {exc}")
            self.show_error("Failed to load delivery assignments", exc)
        finally:
            session.close()
    
    def load_menu_insights(self):
        table = self.tables["menu_insights"]
        session = get_db_session()
        try:
            insights = session.query(MenuEngineeringInsight).order_by(
                MenuEngineeringInsight.analysis_date.desc()
            ).all()
            table.setRowCount(len(insights))
            for row, insight in enumerate(insights):
                product_name = insight.product.name if insight.product else "Unknown"
                table.setItem(row, 0, self._table_item(product_name, insight.insight_id))
                table.setItem(row, 1, QTableWidgetItem(f"{insight.popularity_index or 0:.2f}"))
                table.setItem(row, 2, QTableWidgetItem(f"{insight.profitability_index or 0:.2f}"))
                table.setItem(row, 3, QTableWidgetItem(insight.menu_class.title() if insight.menu_class else "-"))
                table.setItem(row, 4, QTableWidgetItem((insight.recommendation or "")[:60]))
        except Exception as exc:
            logger.error(f"Error loading menu insights: {exc}")
            self.show_error("Failed to load menu engineering insights", exc)
        finally:
            session.close()
    
    def load_events(self):
        table = self.tables["events"]
        session = get_db_session()
        try:
            events = session.query(EventBooking).order_by(EventBooking.event_date.desc()).all()
            table.setRowCount(len(events))
            for row, event in enumerate(events):
                table.setItem(row, 0, self._table_item(event.customer_name, event.event_id))
                table.setItem(row, 1, QTableWidgetItem(
                    event.event_date.strftime("%Y-%m-%d %H:%M") if event.event_date else "-"
                ))
                table.setItem(row, 2, QTableWidgetItem(event.location.name if event.location else "-"))
                table.setItem(row, 3, QTableWidgetItem(str(event.guest_count or "-")))
                table.setItem(row, 4, QTableWidgetItem(f"${event.budget:,.2f}" if event.budget else "-"))
                table.setItem(row, 5, QTableWidgetItem(event.status.title()))
        except Exception as exc:
            logger.error(f"Error loading events: {exc}")
            self.show_error("Failed to load events", exc)
        finally:
            session.close()
    
    def load_event_assignments(self):
        table = self.tables["event_assignments"]
        session = get_db_session()
        try:
            assignments = session.query(EventStaffAssignment).order_by(EventStaffAssignment.event_id.desc()).all()
            table.setRowCount(len(assignments))
            for row, assignment in enumerate(assignments):
                event_name = assignment.event.customer_name if assignment.event else "-"
                staff_name = f"{assignment.staff.first_name} {assignment.staff.last_name}" if assignment.staff else "-"
                table.setItem(row, 0, self._table_item(event_name, assignment.assignment_id))
                table.setItem(row, 1, QTableWidgetItem(staff_name))
                table.setItem(row, 2, QTableWidgetItem(assignment.role or "-"))
                table.setItem(row, 3, QTableWidgetItem(f"{assignment.hours_committed or 0:.1f}"))
        except Exception as exc:
            logger.error(f"Error loading event assignments: {exc}")
            self.show_error("Failed to load event staffing", exc)
        finally:
            session.close()
    
    def load_incidents(self):
        table = self.tables["incidents"]
        session = get_db_session()
        try:
            incidents = session.query(SafetyIncident).order_by(SafetyIncident.incident_date.desc()).all()
            table.setRowCount(len(incidents))
            for row, incident in enumerate(incidents):
                table.setItem(row, 0, self._table_item(
                    incident.incident_date.strftime("%Y-%m-%d %H:%M"),
                    incident.incident_id
                ))
                table.setItem(row, 1, QTableWidgetItem(incident.location.name if incident.location else "-"))
                table.setItem(row, 2, QTableWidgetItem(incident.severity.title()))
                table.setItem(row, 3, QTableWidgetItem(incident.category or "-"))
                table.setItem(row, 4, QTableWidgetItem("Yes" if incident.injuries_reported else "No"))
                table.setItem(row, 5, QTableWidgetItem(incident.status.title()))
        except Exception as exc:
            logger.error(f"Error loading incidents: {exc}")
            self.show_error("Failed to load safety incidents", exc)
        finally:
            session.close()
    
    # ------------------------------------------------------------------ ACTIONS
    def handle_add_reservation(self):
        dialog = DynamicFormDialog("Add Reservation", [
            DynamicField("customer_name", "Customer Name"),
            DynamicField("contact_info", "Contact Info", required=False),
            DynamicField("reservation_datetime", "Reservation Date/Time", field_type="datetime"),
            DynamicField("party_size", "Party Size", field_type="spin", minimum=1, maximum=50, default=2),
            DynamicField("channel", "Channel", field_type="combo", required=False,
                         options=["Phone", "Walk-in", "Web", "Partner"]),
            DynamicField("status", "Status", field_type="combo",
                         options=[("pending", "Pending"), ("confirmed", "Confirmed"),
                                  ("seated", "Seated"), ("completed", "Completed"), ("cancelled", "Cancelled")],
                         default="pending"),
            DynamicField("special_requests", "Special Requests", field_type="text", required=False),
        ], self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            data = dialog.get_values()
            session = get_db_session()
            try:
                reservation = Reservation(
                    customer_name=data["customer_name"],
                    contact_info=data["contact_info"],
                    reservation_datetime=data["reservation_datetime"],
                    party_size=data["party_size"],
                    channel=data["channel"],
                    status=data["status"],
                    special_requests=data["special_requests"],
                    user_id=self.user_id,
                )
                session.add(reservation)
                session.commit()
                self.show_message("Reservation added successfully.")
                self.load_reservations()
            except Exception as exc:
                session.rollback()
                logger.error(f"Error adding reservation: {exc}")
                self.show_error("Failed to add reservation", exc)
            finally:
                session.close()

    def update_reservation_status(self, status: str):
        reservation_id = self._get_selected_id("reservations")
        if not reservation_id:
            return
        session = get_db_session()
        try:
            reservation = session.get(Reservation, reservation_id)
            if not reservation:
                self.show_error("Reservation not found.")
                return
            reservation.status = status
            session.commit()
            self.load_reservations()
        except Exception as exc:
            session.rollback()
            self.show_error("Failed to update reservation", exc)
        finally:
            session.close()
    
    def handle_add_contract(self):
        dialog = DynamicFormDialog("Add Vendor Contract", [
            DynamicField("supplier_id", "Supplier", field_type="combo", options=self.get_supplier_options()),
            DynamicField("contract_title", "Contract Title"),
            DynamicField("start_date", "Start Date", field_type="date"),
            DynamicField("end_date", "End Date", field_type="date", required=False),
            DynamicField("renewal_date", "Renewal Date", field_type="date", required=False),
            DynamicField("contract_value", "Contract Value", field_type="double", required=False, minimum=0),
            DynamicField("status", "Status", field_type="combo",
                         options=[("active", "Active"), ("expiring", "Expiring"),
                                  ("expired", "Expired"), ("terminated", "Terminated")],
                         default="active"),
            DynamicField("sla_terms", "SLA Terms", field_type="text", required=False),
            DynamicField("penalty_terms", "Penalty Terms", field_type="text", required=False),
        ], self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            data = dialog.get_values()
            session = get_db_session()
            try:
                contract = VendorContract(
                    supplier_id=data["supplier_id"],
                    contract_title=data["contract_title"],
                    start_date=data["start_date"],
                    end_date=data["end_date"],
                    renewal_date=data["renewal_date"],
                    contract_value=data["contract_value"],
                    status=data["status"],
                    sla_terms=data["sla_terms"],
                    penalty_terms=data["penalty_terms"],
                    auto_renew=False,
                    user_id=self.user_id,
                )
                session.add(contract)
                session.commit()
                self.show_message("Contract added.")
                self.load_vendor_contracts()
            except Exception as exc:
                session.rollback()
                self.show_error("Failed to add contract", exc)
            finally:
                session.close()
    
    def update_contract_status(self, status: str):
        contract_id = self._get_selected_id("contracts")
        if not contract_id:
            return
        session = get_db_session()
        try:
            contract = session.get(VendorContract, contract_id)
            if not contract:
                self.show_error("Contract not found.")
                return
            contract.status = status
            session.commit()
            self.load_vendor_contracts()
        except Exception as exc:
            session.rollback()
            self.show_error("Failed to update contract", exc)
        finally:
            session.close()
    
    def handle_add_training_module(self):
        dialog = DynamicFormDialog("Add Training Module", [
            DynamicField("title", "Title"),
            DynamicField("description", "Description", field_type="text", required=False),
            DynamicField("category", "Category", required=False),
            DynamicField("duration_hours", "Duration (hrs)", field_type="double", required=False, minimum=0),
            DynamicField("is_required", "Required", field_type="combo",
                         options=[(True, "Yes"), (False, "No")], default=True),
        ], self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            data = dialog.get_values()
            session = get_db_session()
            try:
                module = TrainingModule(
                    title=data["title"],
                    description=data["description"],
                    category=data["category"],
                    duration_hours=data["duration_hours"],
                    is_required=bool(data["is_required"]),
                    user_id=self.user_id,
                )
                session.add(module)
                session.commit()
                self.load_training_modules()
            except Exception as exc:
                session.rollback()
                self.show_error("Failed to add training module", exc)
            finally:
                session.close()
    
    def handle_add_training_assignment(self):
        dialog = DynamicFormDialog("Assign Training", [
            DynamicField("module_id", "Module", field_type="combo", options=self.get_training_module_options()),
            DynamicField("staff_id", "Staff", field_type="combo", options=self.get_staff_options()),
            DynamicField("due_date", "Due Date", field_type="date", required=False),
            DynamicField("status", "Status", field_type="combo",
                         options=[("assigned", "Assigned"), ("in_progress", "In Progress"), ("completed", "Completed")],
                         default="assigned"),
        ], self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            data = dialog.get_values()
            session = get_db_session()
            try:
                assignment = TrainingAssignment(
                    module_id=data["module_id"],
                    staff_id=data["staff_id"],
                    due_date=data["due_date"],
                    status=data["status"],
                    user_id=self.user_id,
                )
                session.add(assignment)
                session.commit()
                self.load_training_assignments()
            except Exception as exc:
                session.rollback()
                self.show_error("Failed to assign training", exc)
            finally:
                session.close()
    
    def update_assignment_status(self, status: str):
        assignment_id = self._get_selected_id("training_assignments")
        if not assignment_id:
            return
        session = get_db_session()
        try:
            assignment = session.get(TrainingAssignment, assignment_id)
            if not assignment:
                self.show_error("Assignment not found.")
                return
            assignment.status = status
            session.commit()
            self.load_training_assignments()
        except Exception as exc:
            session.rollback()
            self.show_error("Failed to update assignment", exc)
        finally:
            session.close()
    
    def handle_add_certification(self):
        dialog = DynamicFormDialog("Add Certification", [
            DynamicField("staff_id", "Staff", field_type="combo", options=self.get_staff_options()),
            DynamicField("certification_name", "Certification"),
            DynamicField("provider", "Provider", required=False),
            DynamicField("issue_date", "Issue Date", field_type="date"),
            DynamicField("expiry_date", "Expiry Date", field_type="date", required=False),
            DynamicField("status", "Status", field_type="combo",
                         options=[("active", "Active"), ("expired", "Expired"), ("revoked", "Revoked")],
                         default="active"),
        ], self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            data = dialog.get_values()
            session = get_db_session()
            try:
                certification = Certification(
                    staff_id=data["staff_id"],
                    certification_name=data["certification_name"],
                    provider=data["provider"],
                    issue_date=data["issue_date"],
                    expiry_date=data["expiry_date"],
                    status=data["status"],
                    user_id=self.user_id,
                )
                session.add(certification)
                session.commit()
                self.load_certifications()
            except Exception as exc:
                session.rollback()
                self.show_error("Failed to add certification", exc)
            finally:
                session.close()
    
    def handle_add_audit(self):
        dialog = DynamicFormDialog("Log Quality Audit", [
            DynamicField("location_id", "Location", field_type="combo", required=False, options=self.get_location_options()),
            DynamicField("auditor_id", "Auditor", field_type="combo", required=False, options=self.get_staff_options()),
            DynamicField("audit_date", "Audit Date", field_type="date"),
            DynamicField("area", "Area / Zone"),
            DynamicField("score", "Score", field_type="spin", required=False, minimum=0, maximum=100),
            DynamicField("status", "Status", field_type="combo",
                         options=[("open", "Open"), ("in_progress", "In Progress"), ("closed", "Closed")],
                         default="open"),
            DynamicField("findings", "Findings", field_type="text", required=False),
            DynamicField("corrective_actions", "Corrective Actions", field_type="text", required=False),
            DynamicField("follow_up_date", "Follow-up Date", field_type="date", required=False),
        ], self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            data = dialog.get_values()
            session = get_db_session()
            try:
                audit = QualityAudit(
                    location_id=data["location_id"],
                    auditor_id=data["auditor_id"],
                    audit_date=data["audit_date"],
                    area=data["area"],
                    score=data["score"],
                    status=data["status"],
                    findings=data["findings"],
                    corrective_actions=data["corrective_actions"],
                    follow_up_date=data["follow_up_date"],
                    user_id=self.user_id,
                )
                session.add(audit)
                session.commit()
                self.load_quality_audits()
            except Exception as exc:
                session.rollback()
                self.show_error("Failed to log audit", exc)
            finally:
                session.close()
    
    def update_audit_status(self, status: str):
        audit_id = self._get_selected_id("quality_audits")
        if not audit_id:
            return
        session = get_db_session()
        try:
            audit = session.get(QualityAudit, audit_id)
            if not audit:
                self.show_error("Audit not found.")
                return
            audit.status = status
            session.commit()
            self.load_quality_audits()
        except Exception as exc:
            session.rollback()
            self.show_error("Failed to update audit", exc)
        finally:
            session.close()
    
    def handle_add_asset(self):
        dialog = DynamicFormDialog("Register Asset", [
            DynamicField("asset_name", "Asset Name"),
            DynamicField("category", "Category", required=False),
            DynamicField("serial_number", "Serial Number", required=False),
            DynamicField("location_id", "Location", field_type="combo", required=False, options=self.get_location_options()),
            DynamicField("purchase_date", "Purchase Date", field_type="date", required=False),
            DynamicField("warranty_expiry", "Warranty Expiry", field_type="date", required=False),
            DynamicField("status", "Status", field_type="combo",
                         options=[("active", "Active"), ("maintenance", "Maintenance"), ("retired", "Retired")],
                         default="active"),
        ], self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            data = dialog.get_values()
            session = get_db_session()
            try:
                asset = MaintenanceAsset(
                    asset_name=data["asset_name"],
                    category=data["category"],
                    serial_number=data["serial_number"],
                    location_id=data["location_id"],
                    purchase_date=data["purchase_date"],
                    warranty_expiry=data["warranty_expiry"],
                    status=data["status"],
                    user_id=self.user_id,
                )
                session.add(asset)
                session.commit()
                self.load_assets()
            except Exception as exc:
                session.rollback()
                self.show_error("Failed to add asset", exc)
            finally:
                session.close()
    
    def update_asset_status(self, status: str):
        asset_id = self._get_selected_id("assets")
        if not asset_id:
            return
        session = get_db_session()
        try:
            asset = session.get(MaintenanceAsset, asset_id)
            if not asset:
                self.show_error("Asset not found.")
                return
            asset.status = status
            session.commit()
            self.load_assets()
        except Exception as exc:
            session.rollback()
            self.show_error("Failed to update asset", exc)
        finally:
            session.close()
    
    def handle_add_task(self):
        dialog = DynamicFormDialog("Create Maintenance Task", [
            DynamicField("asset_id", "Asset", field_type="combo", required=False, options=self.get_asset_options()),
            DynamicField("description", "Description", field_type="text"),
            DynamicField("priority", "Priority", field_type="combo",
                         options=[("low", "Low"), ("medium", "Medium"), ("high", "High")],
                         default="medium"),
            DynamicField("assigned_to", "Assign To", field_type="combo", required=False, options=self.get_staff_options()),
            DynamicField("scheduled_date", "Scheduled Date", field_type="date", required=False),
        ], self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            data = dialog.get_values()
            session = get_db_session()
            try:
                task = MaintenanceTask(
                    asset_id=data["asset_id"],
                    description=data["description"],
                    priority=data["priority"],
                    assigned_to=data["assigned_to"],
                    scheduled_date=data["scheduled_date"],
                    user_id=self.user_id,
                )
                session.add(task)
                session.commit()
                self.load_tasks()
            except Exception as exc:
                session.rollback()
                self.show_error("Failed to add maintenance task", exc)
            finally:
                session.close()
    
    def update_task_status(self, status: str):
        task_id = self._get_selected_id("maintenance_tasks")
        if not task_id:
            return
        session = get_db_session()
        try:
            task = session.get(MaintenanceTask, task_id)
            if not task:
                self.show_error("Task not found.")
                return
            task.status = status
            if status == "completed":
                task.completed_date = QDate.currentDate().toPyDate()
            session.commit()
            self.load_tasks()
        except Exception as exc:
            session.rollback()
            self.show_error("Failed to update task", exc)
        finally:
            session.close()
    
    def handle_add_vehicle(self):
        dialog = DynamicFormDialog("Add Delivery Vehicle", [
            DynamicField("name", "Vehicle Name"),
            DynamicField("license_plate", "License Plate", required=False),
            DynamicField("capacity", "Capacity", required=False),
            DynamicField("status", "Status", field_type="combo",
                         options=[("available", "Available"), ("in_use", "In Use"), ("maintenance", "Maintenance")],
                         default="available"),
            DynamicField("last_serviced_date", "Last Serviced", field_type="date", required=False),
        ], self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            data = dialog.get_values()
            session = get_db_session()
            try:
                vehicle = DeliveryVehicle(
                    name=data["name"],
                    license_plate=data["license_plate"],
                    capacity=data["capacity"],
                    status=data["status"],
                    last_serviced_date=data["last_serviced_date"],
                    user_id=self.user_id,
                )
                session.add(vehicle)
                session.commit()
                self.load_vehicles()
            except Exception as exc:
                session.rollback()
                self.show_error("Failed to add vehicle", exc)
            finally:
                session.close()
    
    def update_vehicle_status(self, status: str):
        vehicle_id = self._get_selected_id("vehicles")
        if not vehicle_id:
            return
        session = get_db_session()
        try:
            vehicle = session.get(DeliveryVehicle, vehicle_id)
            if not vehicle:
                self.show_error("Vehicle not found.")
                return
            vehicle.status = status
            session.commit()
            self.load_vehicles()
        except Exception as exc:
            session.rollback()
            self.show_error("Failed to update vehicle", exc)
        finally:
            session.close()
    
    def handle_add_delivery_assignment(self):
        dialog = DynamicFormDialog("Create Delivery Assignment", [
            DynamicField("order_id", "Order", field_type="combo", required=False, options=self.get_order_options()),
            DynamicField("driver_id", "Driver", field_type="combo", required=False, options=self.get_staff_options()),
            DynamicField("vehicle_id", "Vehicle", field_type="combo", required=False, options=self.get_vehicle_options()),
            DynamicField("status", "Status", field_type="combo",
                         options=[("assigned", "Assigned"), ("in_transit", "In Transit"),
                                  ("delivered", "Delivered"), ("failed", "Failed")],
                         default="assigned"),
            DynamicField("route_notes", "Route Notes", field_type="text", required=False),
        ], self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            data = dialog.get_values()
            session = get_db_session()
            try:
                assignment = DeliveryAssignment(
                    order_id=data["order_id"],
                    driver_id=data["driver_id"],
                    vehicle_id=data["vehicle_id"],
                    status=data["status"],
                    route_notes=data["route_notes"],
                    user_id=self.user_id,
                )
                session.add(assignment)
                session.commit()
                self.load_delivery_assignments()
            except Exception as exc:
                session.rollback()
                self.show_error("Failed to create assignment", exc)
            finally:
                session.close()
    
    def update_delivery_status(self, status: str):
        assignment_id = self._get_selected_id("delivery_assignments")
        if not assignment_id:
            return
        session = get_db_session()
        try:
            assignment = session.get(DeliveryAssignment, assignment_id)
            if not assignment:
                self.show_error("Assignment not found.")
                return
            assignment.status = status
            if status == "delivered":
                assignment.delivery_time = QDateTime.currentDateTime().toPyDateTime()
            session.commit()
            self.load_delivery_assignments()
        except Exception as exc:
            session.rollback()
            self.show_error("Failed to update delivery status", exc)
        finally:
            session.close()
    
    def handle_add_menu_insight(self):
        dialog = DynamicFormDialog("Add Menu Insight", [
            DynamicField("product_id", "Product", field_type="combo", options=self.get_product_options()),
            DynamicField("popularity_index", "Popularity Index", field_type="double", required=False, minimum=0),
            DynamicField("profitability_index", "Profitability Index", field_type="double", required=False, minimum=0),
            DynamicField("menu_class", "Menu Class", field_type="combo", required=False,
                         options=[("star", "Star"), ("plow horse", "Plow Horse"),
                                  ("puzzle", "Puzzle"), ("dog", "Dog")]),
            DynamicField("recommendation", "Recommendation", field_type="text", required=False),
        ], self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            data = dialog.get_values()
            session = get_db_session()
            try:
                insight = MenuEngineeringInsight(
                    product_id=data["product_id"],
                    popularity_index=data["popularity_index"],
                    profitability_index=data["profitability_index"],
                    menu_class=data["menu_class"],
                    recommendation=data["recommendation"],
                    user_id=self.user_id,
                )
                session.add(insight)
                session.commit()
                self.load_menu_insights()
            except Exception as exc:
                session.rollback()
                self.show_error("Failed to add menu insight", exc)
            finally:
                session.close()
    
    def handle_add_event(self):
        dialog = DynamicFormDialog("Add Event / Catering Booking", [
            DynamicField("customer_name", "Client / Event Name"),
            DynamicField("contact_info", "Contact Info", required=False),
            DynamicField("event_type", "Event Type", required=False),
            DynamicField("event_date", "Event Date", field_type="datetime"),
            DynamicField("location_id", "Location", field_type="combo", required=False, options=self.get_location_options()),
            DynamicField("guest_count", "Guest Count", field_type="spin", required=False, minimum=0, maximum=10000),
            DynamicField("budget", "Budget", field_type="double", required=False, minimum=0),
            DynamicField("status", "Status", field_type="combo",
                         options=[("inquiry", "Inquiry"), ("confirmed", "Confirmed"),
                                  ("planning", "Planning"), ("completed", "Completed"), ("cancelled", "Cancelled")],
                         default="inquiry"),
            DynamicField("requirements", "Requirements", field_type="text", required=False),
        ], self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            data = dialog.get_values()
            session = get_db_session()
            try:
                event = EventBooking(
                    customer_name=data["customer_name"],
                    contact_info=data["contact_info"],
                    event_type=data["event_type"],
                    event_date=data["event_date"],
                    location_id=data["location_id"],
                    guest_count=data["guest_count"],
                    budget=data["budget"],
                    status=data["status"],
                    requirements=data["requirements"],
                    user_id=self.user_id,
                )
                session.add(event)
                session.commit()
                self.load_events()
            except Exception as exc:
                session.rollback()
                self.show_error("Failed to add event", exc)
            finally:
                session.close()
    
    def update_event_status(self, status: str):
        event_id = self._get_selected_id("events")
        if not event_id:
            return
        session = get_db_session()
        try:
            event = session.get(EventBooking, event_id)
            if not event:
                self.show_error("Event not found.")
                return
            event.status = status
            session.commit()
            self.load_events()
        except Exception as exc:
            session.rollback()
            self.show_error("Failed to update event", exc)
        finally:
            session.close()
    
    def handle_add_event_assignment(self):
        dialog = DynamicFormDialog("Assign Event Staff", [
            DynamicField("event_id", "Event", field_type="combo", options=self.get_event_options()),
            DynamicField("staff_id", "Staff", field_type="combo", options=self.get_staff_options()),
            DynamicField("role", "Role", required=False),
            DynamicField("hours_committed", "Hours", field_type="double", required=False, minimum=0),
        ], self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            data = dialog.get_values()
            session = get_db_session()
            try:
                assignment = EventStaffAssignment(
                    event_id=data["event_id"],
                    staff_id=data["staff_id"],
                    role=data["role"],
                    hours_committed=data["hours_committed"],
                    user_id=self.user_id,
                )
                session.add(assignment)
                session.commit()
                self.load_event_assignments()
            except Exception as exc:
                session.rollback()
                self.show_error("Failed to assign staff", exc)
            finally:
                session.close()
    
    def handle_add_incident(self):
        dialog = DynamicFormDialog("Report Safety Incident", [
            DynamicField("incident_date", "Incident Date/Time", field_type="datetime"),
            DynamicField("location_id", "Location", field_type="combo", required=False, options=self.get_location_options()),
            DynamicField("reported_by", "Reported By", field_type="combo", required=False, options=self.get_staff_options()),
            DynamicField("severity", "Severity", field_type="combo",
                         options=[("minor", "Minor"), ("moderate", "Moderate"),
                                  ("major", "Major"), ("critical", "Critical")],
                         default="minor"),
            DynamicField("category", "Category", required=False),
            DynamicField("description", "Description", field_type="text"),
            DynamicField("injuries_reported", "Injuries Reported", field_type="combo",
                         options=[(False, "No"), (True, "Yes")], default=False),
            DynamicField("action_taken", "Action Taken", field_type="text", required=False),
            DynamicField("follow_up_date", "Follow-up Date", field_type="date", required=False),
            DynamicField("status", "Status", field_type="combo",
                         options=[("open", "Open"), ("investigating", "Investigating"),
                                  ("resolved", "Resolved"), ("closed", "Closed")],
                         default="open"),
        ], self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            data = dialog.get_values()
            session = get_db_session()
            try:
                incident = SafetyIncident(
                    incident_date=data["incident_date"],
                    location_id=data["location_id"],
                    reported_by=data["reported_by"],
                    severity=data["severity"],
                    category=data["category"],
                    description=data["description"],
                    injuries_reported=bool(data["injuries_reported"]),
                    action_taken=data["action_taken"],
                    follow_up_date=data["follow_up_date"],
                    status=data["status"],
                    user_id=self.user_id,
                )
                session.add(incident)
                session.commit()
                self.load_incidents()
            except Exception as exc:
                session.rollback()
                self.show_error("Failed to log incident", exc)
            finally:
                session.close()
    
    def update_incident_status(self, status: str):
        incident_id = self._get_selected_id("incidents")
        if not incident_id:
            return
        session = get_db_session()
        try:
            incident = session.get(SafetyIncident, incident_id)
            if not incident:
                self.show_error("Incident not found.")
                return
            incident.status = status
            session.commit()
            self.load_incidents()
        except Exception as exc:
            session.rollback()
            self.show_error("Failed to update incident", exc)
        finally:
            session.close()
    
    # ------------------------------------------------------------------ HELPERS
    def _table_item(self, text: str, record_id: int | None) -> QTableWidgetItem:
        item = QTableWidgetItem(text or "-")
        if record_id:
            item.setData(Qt.ItemDataRole.UserRole, record_id)
        return item
    
    def _get_selected_id(self, table_key: str) -> Optional[int]:
        table = self.tables.get(table_key)
        if not table:
            return None
        selected = table.selectedItems()
        if not selected:
            self.show_error("Please select a record first.")
            return None
        return selected[0].data(Qt.ItemDataRole.UserRole)
    
    def show_message(self, message: str):
        QMessageBox.information(self, "Success", message)
    
    def show_error(self, message: str, error: Exception | None = None):
        full_message = message
        if error:
            full_message += f"\n\nDetails: {error}"
        QMessageBox.warning(self, "Error", full_message)
    
    # ------------------------------------------------------------------ OPTION PROVIDERS
    def get_supplier_options(self) -> List[Tuple[int, str]]:
        session = get_db_session()
        try:
            suppliers = session.query(Supplier).order_by(Supplier.name).all()
            return [(s.supplier_id, s.name) for s in suppliers]
        except Exception as exc:
            logger.error(f"Error loading suppliers: {exc}")
            return []
        finally:
            session.close()
    
    def get_staff_options(self) -> List[Tuple[int, str]]:
        session = get_db_session()
        try:
            staff_members = session.query(Staff).order_by(Staff.first_name, Staff.last_name).all()
            return [(s.staff_id, f"{s.first_name} {s.last_name}") for s in staff_members]
        except Exception as exc:
            logger.error(f"Error loading staff: {exc}")
            return []
        finally:
            session.close()
    
    def get_product_options(self) -> List[Tuple[int, str]]:
        session = get_db_session()
        try:
            products = session.query(Product).order_by(Product.name).all()
            return [(p.product_id, p.name) for p in products]
        except Exception as exc:
            logger.error(f"Error loading products: {exc}")
            return []
        finally:
            session.close()
    
    def get_location_options(self) -> List[Tuple[int, str]]:
        session = get_db_session()
        try:
            locations = session.query(Location).order_by(Location.name).all()
            return [(loc.location_id, loc.name) for loc in locations]
        except Exception as exc:
            logger.error(f"Error loading locations: {exc}")
            return []
        finally:
            session.close()
    
    def get_training_module_options(self) -> List[Tuple[int, str]]:
        session = get_db_session()
        try:
            modules = session.query(TrainingModule).order_by(TrainingModule.title).all()
            return [(m.module_id, m.title) for m in modules]
        except Exception as exc:
            logger.error(f"Error loading modules: {exc}")
            return []
        finally:
            session.close()
    
    def get_asset_options(self) -> List[Tuple[int, str]]:
        session = get_db_session()
        try:
            assets = session.query(MaintenanceAsset).order_by(MaintenanceAsset.asset_name).all()
            return [(a.asset_id, a.asset_name) for a in assets]
        except Exception as exc:
            logger.error(f"Error loading assets: {exc}")
            return []
        finally:
            session.close()
    
    def get_order_options(self) -> List[Tuple[int, str]]:
        session = get_db_session()
        try:
            orders = session.query(Order).order_by(Order.order_datetime.desc()).limit(100).all()
            return [(o.order_id, f"#{o.order_id} - {o.order_datetime.strftime('%Y-%m-%d')}") for o in orders]
        except Exception as exc:
            logger.error(f"Error loading orders: {exc}")
            return []
        finally:
            session.close()
    
    def get_vehicle_options(self) -> List[Tuple[int, str]]:
        session = get_db_session()
        try:
            vehicles = session.query(DeliveryVehicle).order_by(DeliveryVehicle.name).all()
            return [(v.vehicle_id, v.name) for v in vehicles]
        except Exception as exc:
            logger.error(f"Error loading vehicles: {exc}")
            return []
        finally:
            session.close()
    
    def get_event_options(self) -> List[Tuple[int, str]]:
        session = get_db_session()
        try:
            events = session.query(EventBooking).order_by(EventBooking.event_date.desc()).all()
            return [(e.event_id, f"{e.customer_name} ({e.event_date.strftime('%Y-%m-%d')})")
                    for e in events if e.event_date]
        except Exception as exc:
            logger.error(f"Error loading events: {exc}")
            return []
        finally:
            session.close()

