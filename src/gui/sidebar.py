"""
Collapsible Sidebar Navigation Component

Documentation:
- docs/INDEX.md
- docs/erp/uiux-roadmap.md
- docs/erp/uiux-audit-baseline.md
- docs/erp/uiux-phase1-shell-refresh.md
- docs/erp/module-map.md
- docs/erp/worklog.md
"""

from PyQt6.QtCore import QSize, Qt, pyqtSignal
from PyQt6.QtGui import QIcon
from PyQt6.QtWidgets import QFrame, QHBoxLayout, QLabel, QPushButton, QScrollArea, QStyle, QVBoxLayout, QWidget

try:
    import qtawesome as qta
except Exception:  # pragma: no cover - optional dependency
    qta = None

from src.gui.design_system import (
    SIDEBAR_DANGER_ICON_BUTTON_STYLE,
    SIDEBAR_ICON_BUTTON_STYLE,
    SIDEBAR_ROOT_STYLE,
    SIDEBAR_USER_CARD_STYLE,
)


class Sidebar(QWidget):
    """Collapsible sidebar navigation."""

    navigation_clicked = pyqtSignal(str)
    logout_requested = pyqtSignal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self.expanded_width = 276
        self.collapsed_width = 84
        self.is_collapsed = False
        self.icon_size = QSize(18, 18)
        self.group_icon_map = {
            "Overview": "fa6s.gauge-high",
            "Sales & CRM": "fa6s.cart-shopping",
            "Inventory & Supply": "fa6s.boxes-stacked",
            "Staff & HR": "fa6s.users",
            "Finance & Ops": "fa6s.chart-line",
            "Industry Solutions": "fa6s.building",
            "Platform": "fa6s.gear",
        }
        self.nav_icon_map = {
            "Dashboard": "fa6s.gauge-high",
            "Products": "fa6s.box-open",
            "Customers": "fa6s.user-group",
            "Sales": "fa6s.cash-register",
            "Reports": "fa6s.chart-column",
            "Inventory": "fa6s.warehouse",
            "Suppliers": "fa6s.truck-ramp-box",
            "Staff": "fa6s.user-tie",
            "Attendance": "fa6s.clock",
            "Shift Scheduling": "fa6s.calendar-days",
            "Payroll": "fa6s.file-invoice-dollar",
            "Performance": "fa6s.bullseye",
            "Financial": "fa6s.coins",
            "Operations": "fa6s.gears",
            "Retail & E-Commerce": "fa6s.bag-shopping",
            "Healthcare": "fa6s.briefcase-medical",
            "Education": "fa6s.graduation-cap",
            "Manufacturing": "fa6s.industry",
            "Logistics": "fa6s.route",
            "Mobile": "fa6s.mobile-screen-button",
            "Settings": "fa6s.sliders",
        }
        self.nav_structure = [
            {
                "group": "Overview",
                "icon": "Overview",
                "items": [
                    {"name": "Dashboard", "icon": "Dashboard"},
                ],
            },
            {
                "group": "Sales & CRM",
                "icon": "Sales & CRM",
                "items": [
                    {"name": "Products", "icon": "Products"},
                    {"name": "Customers", "icon": "Customers"},
                    {"name": "Sales", "icon": "Sales"},
                    {"name": "Reports", "icon": "Reports"},
                ],
            },
            {
                "group": "Inventory & Supply",
                "icon": "Inventory & Supply",
                "items": [
                    {"name": "Inventory", "icon": "Inventory"},
                    {"name": "Suppliers", "icon": "Suppliers"},
                ],
            },
            {
                "group": "Staff & HR",
                "icon": "Staff & HR",
                "items": [
                    {"name": "Staff", "icon": "Staff"},
                    {"name": "Attendance", "icon": "Attendance"},
                    {"name": "Shift Scheduling", "icon": "Shift Scheduling"},
                    {"name": "Payroll", "icon": "Payroll"},
                    {"name": "Performance", "icon": "Performance"},
                ],
            },
            {
                "group": "Finance & Ops",
                "icon": "Finance & Ops",
                "items": [
                    {"name": "Financial", "icon": "Financial"},
                    {"name": "Operations", "icon": "Operations"},
                ],
            },
            {
                "group": "Industry Solutions",
                "icon": "Industry Solutions",
                "items": [
                    {"name": "Retail & E-Commerce", "icon": "Retail & E-Commerce"},
                    {"name": "Healthcare", "icon": "Healthcare"},
                    {"name": "Education", "icon": "Education"},
                    {"name": "Manufacturing", "icon": "Manufacturing"},
                    {"name": "Logistics", "icon": "Logistics"},
                ],
            },
            {
                "group": "Platform",
                "icon": "Platform",
                "items": [
                    {"name": "Mobile", "icon": "Mobile"},
                    {"name": "Settings", "icon": "Settings"},
                ],
            },
        ]
        self.group_meta = {grp["group"]: grp for grp in self.nav_structure}

        self.group_buttons = {}
        self.group_contents = {}
        self.nav_buttons = {}
        self.setObjectName("sidebar")
        self.setup_ui()

    def setup_ui(self):
        """Setup sidebar UI."""
        self.setFixedWidth(self.expanded_width)
        self.setStyleSheet(SIDEBAR_ROOT_STYLE)

        layout = QVBoxLayout(self)
        layout.setSpacing(10)
        layout.setContentsMargins(12, 12, 12, 12)

        header_layout = QHBoxLayout()
        header_layout.setSpacing(8)

        self.toggle_btn = QPushButton("MENU")
        self.toggle_btn.setFixedSize(56, 32)
        self.toggle_btn.setToolTip("Collapse/Expand Sidebar")
        self.toggle_btn.setStyleSheet(SIDEBAR_ICON_BUTTON_STYLE)
        self.toggle_btn.setText("")
        self.toggle_btn.setIcon(self._build_icon("fa6s.bars", QStyle.StandardPixmap.SP_TitleBarUnshadeButton))
        self.toggle_btn.setIconSize(QSize(14, 14))
        self.toggle_btn.clicked.connect(self.toggle_sidebar)
        header_layout.addWidget(self.toggle_btn)

        self.logout_btn = QPushButton("OUT")
        self.logout_btn.setFixedSize(44, 32)
        self.logout_btn.setToolTip("Logout")
        self.logout_btn.setStyleSheet(SIDEBAR_DANGER_ICON_BUTTON_STYLE)
        self.logout_btn.setText("")
        self.logout_btn.setIcon(self._build_icon("fa6s.power-off", QStyle.StandardPixmap.SP_DialogCloseButton))
        self.logout_btn.setIconSize(QSize(14, 14))
        self.logout_btn.clicked.connect(self.handle_logout)
        header_layout.addWidget(self.logout_btn)

        header_layout.addStretch()
        layout.addLayout(header_layout)

        scroll_area = QScrollArea()
        scroll_area.setWidgetResizable(True)
        scroll_area.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        scroll_area.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        scroll_area.setFrameShape(QFrame.Shape.NoFrame)
        scroll_content = QWidget()

        self.nav_layout = QVBoxLayout(scroll_content)
        self.nav_layout.setSpacing(4)
        self.nav_layout.setContentsMargins(0, 0, 0, 0)

        for group in self.nav_structure:
            group_name = group["group"]
            group_icon = group["icon"]

            header_btn = QPushButton()
            header_btn.setCheckable(True)
            header_btn.setChecked(True)
            header_btn.setCursor(Qt.CursorShape.PointingHandCursor)
            header_btn.setObjectName("groupHeader")
            header_btn.setToolTip(group_name)
            header_btn.clicked.connect(lambda _, name=group_name: self.toggle_group(name))
            self.group_buttons[group_name] = header_btn
            self.nav_layout.addWidget(header_btn)

            content_widget = QWidget()
            content_layout = QVBoxLayout(content_widget)
            content_layout.setSpacing(4)
            content_layout.setContentsMargins(8, 0, 0, 8)

            for item in group["items"]:
                item_name = item["name"]
                item_icon = item["icon"]

                btn = QPushButton(f"{item_icon}  {item_name}")
                btn.setCheckable(True)
                btn.setCursor(Qt.CursorShape.PointingHandCursor)
                btn.setProperty("text_str", item_name)
                btn.setProperty("collapsed", False)
                btn.setToolTip(item_name)
                btn.setObjectName("navButton")
                btn.setIcon(self._resolve_nav_icon(item_name))
                btn.setIconSize(self.icon_size)
                if item_name == "Dashboard":
                    btn.setChecked(True)
                btn.clicked.connect(lambda _, name=item_name: self.on_nav_clicked(name))
                self.nav_buttons[item_name] = btn
                self._set_button_text(btn, collapsed=False)
                content_layout.addWidget(btn)

            self.group_contents[group_name] = content_widget
            self.nav_layout.addWidget(content_widget)
            self.nav_layout.addSpacing(4)

            # Group icon is stored in metadata and used in header rendering.
            self.group_meta[group_name]["icon"] = group_icon

        self.nav_layout.addStretch()
        scroll_area.setWidget(scroll_content)
        layout.addWidget(scroll_area, stretch=1)

        self.user_frame = QFrame()
        self.user_frame.setMinimumHeight(66)
        self.user_frame.setStyleSheet(SIDEBAR_USER_CARD_STYLE)
        user_layout = QVBoxLayout(self.user_frame)
        user_layout.setSpacing(2)
        user_layout.setContentsMargins(10, 8, 10, 8)

        self.user_name_label = QLabel("Admin")
        self.user_name_label.setStyleSheet(
            "color: #F8FAFC; font-size: 13px; font-weight: 700; background-color: transparent;"
        )
        user_layout.addWidget(self.user_name_label)

        self.user_role_label = QLabel("Administrator")
        self.user_role_label.setStyleSheet(
            "color: #8197B8; font-size: 11px; font-weight: 500; background-color: transparent;"
        )
        user_layout.addWidget(self.user_role_label)
        layout.addWidget(self.user_frame)

        self.update_group_headers()
        self._apply_collapsed_visual_state()

    def handle_logout(self):
        """Handle logout button click."""
        self.logout_requested.emit()

    def toggle_sidebar(self):
        """Toggle sidebar collapsed/expanded state."""
        self.is_collapsed = not self.is_collapsed
        self.setFixedWidth(self.collapsed_width if self.is_collapsed else self.expanded_width)

        if self.is_collapsed:
            self.toggle_btn.setFixedSize(36, 32)
            self.logout_btn.setFixedSize(36, 32)
            self.user_frame.hide()
            for btn in self.nav_buttons.values():
                self._set_button_text(btn, collapsed=True)
                btn.setToolTip(str(btn.property("text_str") or ""))
        else:
            self.toggle_btn.setFixedSize(56, 32)
            self.logout_btn.setFixedSize(44, 32)
            self.user_frame.show()
            for btn in self.nav_buttons.values():
                self._set_button_text(btn, collapsed=False)
                btn.setToolTip("")

        self.update_group_headers()
        self._apply_collapsed_visual_state()

    def on_nav_clicked(self, section: str):
        """Handle navigation button click."""
        for btn in self.nav_buttons.values():
            btn.setChecked(False)
        if section in self.nav_buttons:
            self.nav_buttons[section].setChecked(True)
        self.ensure_group_visible(section)
        self.navigation_clicked.emit(section)

    def set_active_section(self, section: str):
        """Set active navigation section."""
        for btn in self.nav_buttons.values():
            btn.setChecked(False)
        if section in self.nav_buttons:
            self.nav_buttons[section].setChecked(True)
        self.ensure_group_visible(section)

    def set_user_info(self, username: str, role: str):
        """Set user information in sidebar."""
        self.user_name_label.setText(username)
        self.user_role_label.setText(role)

    def toggle_group(self, group_name: str):
        """Toggle visibility of a navigation group."""
        header = self.group_buttons.get(group_name)
        content = self.group_contents.get(group_name)
        if not header or not content:
            return
        expanded = header.isChecked()
        content.setVisible(expanded)
        self.update_group_header_text(group_name)

    def update_group_headers(self):
        """Refresh header labels for all groups."""
        for group_name in self.group_buttons.keys():
            self.update_group_header_text(group_name)

    def update_group_header_text(self, group_name: str):
        """Update a single group header based on expansion/collapse state."""
        header = self.group_buttons.get(group_name)
        content = self.group_contents.get(group_name)
        meta = self.group_meta.get(group_name, {})
        if not header or content is None:
            return

        icon_key = str(meta.get("icon", ""))
        header.setIcon(self._resolve_group_icon(icon_key))
        header.setIconSize(QSize(14, 14))
        if self.is_collapsed:
            header.setText("")
        else:
            expanded = content.isVisible()
            arrow = "▼" if expanded else "▶"
            header.setText(f"{arrow}  {group_name}")
        header.setToolTip(group_name)

    def _apply_collapsed_visual_state(self):
        """Apply visual state updates for collapsed vs expanded sidebar."""
        for header in self.group_buttons.values():
            header.setVisible(not self.is_collapsed)
        for btn in self.nav_buttons.values():
            btn.setProperty("collapsed", self.is_collapsed)
            btn.style().unpolish(btn)
            btn.style().polish(btn)

    def ensure_group_visible(self, section: str):
        """Ensure the group for the given section is expanded."""
        for group_name, group in self.group_meta.items():
            if any(item["name"] == section for item in group["items"]):
                header = self.group_buttons.get(group_name)
                content = self.group_contents.get(group_name)
                if header and content and not content.isVisible():
                    header.setChecked(True)
                    content.setVisible(True)
                    self.update_group_header_text(group_name)
                break

    def _set_button_text(self, button: QPushButton, collapsed: bool):
        """Set sidebar button text based on collapse state."""
        if collapsed:
            button.setText("")
        else:
            button.setText(str(button.property("text_str") or ""))

    def _resolve_group_icon(self, group_name: str) -> QIcon:
        """Resolve icon for a sidebar group."""
        icon_name = self.group_icon_map.get(group_name, "fa6s.layer-group")
        return self._build_icon(icon_name, QStyle.StandardPixmap.SP_FileDialogDetailedView)

    def _resolve_nav_icon(self, item_name: str) -> QIcon:
        """Resolve icon for a navigation item."""
        icon_name = self.nav_icon_map.get(item_name, "fa6s.circle")
        fallback = {
            "Dashboard": QStyle.StandardPixmap.SP_DesktopIcon,
            "Products": QStyle.StandardPixmap.SP_DirIcon,
            "Customers": QStyle.StandardPixmap.SP_FileDialogContentsView,
            "Sales": QStyle.StandardPixmap.SP_DriveNetIcon,
            "Reports": QStyle.StandardPixmap.SP_FileIcon,
            "Inventory": QStyle.StandardPixmap.SP_DriveHDIcon,
            "Suppliers": QStyle.StandardPixmap.SP_DriveFDIcon,
            "Staff": QStyle.StandardPixmap.SP_DirHomeIcon,
            "Attendance": QStyle.StandardPixmap.SP_BrowserReload,
            "Shift Scheduling": QStyle.StandardPixmap.SP_FileDialogListView,
            "Payroll": QStyle.StandardPixmap.SP_DialogSaveButton,
            "Performance": QStyle.StandardPixmap.SP_ArrowUp,
            "Financial": QStyle.StandardPixmap.SP_DialogApplyButton,
            "Operations": QStyle.StandardPixmap.SP_ComputerIcon,
            "Retail & E-Commerce": QStyle.StandardPixmap.SP_TrashIcon,
            "Healthcare": QStyle.StandardPixmap.SP_DialogYesButton,
            "Education": QStyle.StandardPixmap.SP_FileDialogInfoView,
            "Manufacturing": QStyle.StandardPixmap.SP_DriveDVDIcon,
            "Logistics": QStyle.StandardPixmap.SP_ArrowForward,
            "Mobile": QStyle.StandardPixmap.SP_MediaPlay,
            "Settings": QStyle.StandardPixmap.SP_FileDialogDetailedView,
        }.get(item_name, QStyle.StandardPixmap.SP_FileIcon)
        return self._build_icon(icon_name, fallback)

    def _build_icon(self, icon_name: str, fallback: QStyle.StandardPixmap) -> QIcon:
        """Build icon from qtawesome, fallback to Qt standard icon."""
        if qta is not None:
            try:
                return qta.icon(icon_name, color="#EAF1FF")
            except Exception:
                pass
        return self.style().standardIcon(fallback)
