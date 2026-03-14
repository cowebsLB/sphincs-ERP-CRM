"""
Shared ERP design tokens and reusable Qt style snippets.

Documentation:
- docs/INDEX.md
- docs/erp/uiux-roadmap.md
- docs/erp/uiux-audit-baseline.md
- docs/erp/uiux-phase1-shell-refresh.md
- docs/erp/uiux-phase2-global-refresh.md
- docs/erp/implementation-summary-2026-03-09.md
- docs/erp/worklog.md
"""

import ctypes
import sys

from PyQt6.QtCore import QEvent, QObject
from PyQt6.QtWidgets import (
    QApplication,
    QAbstractButton,
    QComboBox,
    QDateEdit,
    QDateTimeEdit,
    QDoubleSpinBox,
    QFrame,
    QGroupBox,
    QLabel,
    QLineEdit,
    QListWidget,
    QPlainTextEdit,
    QScrollArea,
    QSpinBox,
    QTableView,
    QTableWidget,
    QTabWidget,
    QTextEdit,
    QTreeView,
    QTreeWidget,
    QWidget,
)


# Color tokens (Win11-inspired acrylic palette)
BG_PAGE = "#E8EEF8"
BG_SURFACE = "rgba(255, 255, 255, 0.80)"
BG_SURFACE_ALT = "rgba(246, 250, 255, 0.88)"
TEXT_PRIMARY = "#0E1B34"
TEXT_MUTED = "#40506A"
TEXT_SUBTLE = "#5D6F8B"
BORDER_SOFT = "rgba(147, 167, 198, 0.32)"
BORDER_STRONG = "rgba(110, 136, 173, 0.55)"
ACCENT = "#2F7DFF"
ACCENT_DARK = "#1D66EA"
ACCENT_SOFT = "rgba(47, 125, 255, 0.16)"
DANGER = "#D92D20"
DANGER_SOFT = "rgba(217, 45, 32, 0.12)"


# Shared shell styles
ERP_APP_BASE_STYLE = f"""
QWidget {{
    background-color: {BG_PAGE};
    color: {TEXT_PRIMARY};
    font-family: "Segoe UI Variable Text", "Segoe UI", "Noto Sans", sans-serif;
    font-size: 14px;
}}
QMainWindow {{
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
        stop:0 #F5F9FF, stop:0.45 #ECF2FC, stop:1 #DEE8F7);
}}
QFrame {{
    background-color: {BG_SURFACE};
    color: {TEXT_PRIMARY};
    border: 1px solid {BORDER_SOFT};
    border-radius: 14px;
}}
QLabel {{
    color: {TEXT_PRIMARY};
    background-color: transparent;
}}
QGroupBox {{
    color: {TEXT_PRIMARY};
    background-color: {BG_SURFACE};
    border: 1px solid {BORDER_SOFT};
    border-radius: 14px;
    margin-top: 12px;
    padding-top: 12px;
    font-weight: 600;
}}
QGroupBox::title {{
    subcontrol-origin: margin;
    left: 10px;
    padding: 0 6px;
    color: {TEXT_MUTED};
}}
QLineEdit, QTextEdit, QPlainTextEdit, QComboBox, QSpinBox, QDoubleSpinBox, QDateEdit, QDateTimeEdit, QListWidget {{
    background-color: {BG_SURFACE};
    color: {TEXT_PRIMARY};
    border: 1px solid {BORDER_SOFT};
    border-radius: 12px;
    padding: 8px 11px;
}}
QLineEdit:focus, QTextEdit:focus, QPlainTextEdit:focus, QComboBox:focus, QSpinBox:focus, QDoubleSpinBox:focus, QDateEdit:focus, QDateTimeEdit:focus {{
    border: 2px solid {ACCENT};
    background-color: rgba(255, 255, 255, 0.92);
}}
QPushButton {{
    background-color: {BG_SURFACE_ALT};
    color: {TEXT_PRIMARY};
    border: 1px solid {BORDER_SOFT};
    border-radius: 11px;
    padding: 9px 14px;
    font-weight: 600;
}}
QPushButton:hover {{
    background-color: rgba(255, 255, 255, 0.95);
    border: 1px solid {BORDER_STRONG};
}}
QPushButton:pressed {{
    background-color: rgba(230, 238, 251, 0.95);
}}
QPushButton:disabled {{
    color: #8EA0BD;
}}
QTabWidget::pane {{
    border: 1px solid {BORDER_SOFT};
    border-radius: 14px;
    background-color: {BG_SURFACE};
}}
QTabBar::tab {{
    background-color: {BG_SURFACE_ALT};
    color: {TEXT_MUTED};
    padding: 10px 16px;
    margin-right: 4px;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
}}
QTabBar::tab:selected {{
    background-color: rgba(255, 255, 255, 0.98);
    color: {TEXT_PRIMARY};
    border: 1px solid {BORDER_SOFT};
    border-bottom: none;
}}
QTableWidget, QTableView, QTreeWidget, QTreeView {{
    background-color: {BG_SURFACE};
    color: {TEXT_PRIMARY};
    alternate-background-color: {BG_SURFACE_ALT};
    gridline-color: {BORDER_SOFT};
    selection-background-color: {ACCENT_SOFT};
    selection-color: {TEXT_PRIMARY};
    border: 1px solid {BORDER_SOFT};
    border-radius: 14px;
}}
QTableWidget::item, QTreeWidget::item {{
    padding: 6px;
}}
QHeaderView::section {{
    background-color: {BG_SURFACE_ALT};
    color: {TEXT_PRIMARY};
    border: none;
    border-bottom: 1px solid {BORDER_SOFT};
    padding: 10px;
    font-weight: 700;
}}
QTableCornerButton::section {{
    background-color: {BG_SURFACE_ALT};
    border: none;
    border-bottom: 1px solid {BORDER_SOFT};
}}
QScrollArea {{
    border: none;
    background-color: transparent;
}}
QScrollBar:vertical {{
    background: transparent;
    width: 10px;
    margin: 4px;
}}
QScrollBar::handle:vertical {{
    background: #B9C9E1;
    min-height: 20px;
    border-radius: 5px;
}}
QScrollBar:horizontal {{
    background: transparent;
    height: 10px;
    margin: 4px;
}}
QScrollBar::handle:horizontal {{
    background: #B9C9E1;
    min-width: 20px;
    border-radius: 5px;
}}
QScrollBar::add-line, QScrollBar::sub-line, QScrollBar::add-page, QScrollBar::sub-page {{
    background: none;
    border: none;
}}
QMenu {{
    background-color: rgba(255, 255, 255, 0.94);
    color: {TEXT_PRIMARY};
    border: 1px solid {BORDER_SOFT};
    border-radius: 10px;
    padding: 4px;
}}
QMenu::item {{
    padding: 8px 12px;
    border-radius: 6px;
}}
QMenu::item:selected {{
    background-color: {ACCENT_SOFT};
}}
QToolTip {{
    background-color: #102345;
    color: #F8FAFC;
    border: 1px solid #284371;
    padding: 6px 8px;
}}
"""

PAGE_SCROLL_STYLE = f"""
QScrollArea {{
    background-color: {BG_PAGE};
    border: none;
}}
"""

CARD_STYLE = f"""
QFrame {{
    background-color: {BG_SURFACE};
    border: 1px solid {BORDER_SOFT};
    border-radius: 16px;
}}
"""

TAB_WIDGET_STYLE = f"""
QTabWidget::pane {{
    border: 1px solid {BORDER_SOFT};
    border-radius: 14px;
    background-color: {BG_SURFACE};
}}
QTabBar::tab {{
    background-color: {BG_SURFACE_ALT};
    color: {TEXT_MUTED};
    padding: 10px 18px;
    margin-right: 4px;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
}}
QTabBar::tab:selected {{
    background-color: rgba(255, 255, 255, 0.98);
    color: {TEXT_PRIMARY};
    font-weight: 600;
    border: 1px solid {BORDER_SOFT};
    border-bottom: none;
}}
"""

GROUP_BOX_STYLE = f"""
QGroupBox {{
    font-size: 16px;
    font-weight: 600;
    color: {TEXT_PRIMARY};
    border: 1px solid {BORDER_SOFT};
    border-radius: 14px;
    margin-top: 10px;
    padding-top: 12px;
    background-color: {BG_SURFACE};
}}
QGroupBox::title {{
    subcontrol-origin: margin;
    left: 10px;
    padding: 0 6px;
}}
"""

INPUT_STYLE = f"""
QLineEdit, QComboBox {{
    border: 1px solid {BORDER_SOFT};
    border-radius: 12px;
    padding: 8px 11px;
    background-color: {BG_SURFACE};
    color: {TEXT_PRIMARY};
    min-height: 34px;
}}
QLineEdit:focus, QComboBox:focus {{
    border: 2px solid {ACCENT};
}}
"""

PRIMARY_BUTTON_STYLE = f"""
QPushButton {{
    background-color: {ACCENT};
    color: #F8FBFF;
    border: none;
    border-radius: 12px;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 700;
}}
QPushButton:hover {{
    background-color: {ACCENT_DARK};
}}
QPushButton:pressed {{
    background-color: {ACCENT_DARK};
}}
"""

SECONDARY_BUTTON_STYLE = f"""
QPushButton {{
    background-color: {BG_SURFACE_ALT};
    color: {TEXT_PRIMARY};
    border: 1px solid {BORDER_SOFT};
    border-radius: 11px;
    padding: 9px 14px;
    font-size: 14px;
    font-weight: 600;
}}
QPushButton:hover {{
    background-color: rgba(255, 255, 255, 0.95);
}}
"""

SUCCESS_BUTTON_STYLE = """
QPushButton {
    background-color: #12B2A0;
    color: #F8FBFF;
    border: none;
    border-radius: 12px;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 700;
}
QPushButton:hover {
    background-color: #0F9A8B;
}
QPushButton:disabled {
    background-color: #C8D4E8;
    color: #6C83A8;
}
"""

DANGER_BUTTON_STYLE = f"""
QPushButton {{
    background-color: {DANGER_SOFT};
    color: {DANGER};
    border: 1px solid {DANGER};
    border-radius: 11px;
    padding: 8px 12px;
    font-size: 14px;
    font-weight: 600;
}}
QPushButton:hover {{
    background-color: {DANGER};
    color: {BG_SURFACE};
}}
"""

TOOLBAR_CARD_STYLE = """
QFrame {
    background-color: rgba(255, 255, 255, 0.86);
    border: 1px solid rgba(147, 167, 198, 0.32);
    border-radius: 16px;
}
"""

SEARCH_INPUT_STYLE = """
QLineEdit {
    border: 1px solid rgba(110, 136, 173, 0.45);
    border-radius: 12px;
    padding: 8px 12px;
    font-size: 14px;
    background-color: rgba(255, 255, 255, 0.92);
}
QLineEdit:focus {
    border: 2px solid #2F7DFF;
}
"""

FILTER_COMBO_STYLE = """
QComboBox {
    border: 1px solid rgba(110, 136, 173, 0.45);
    border-radius: 12px;
    padding: 8px 10px;
    background-color: rgba(255, 255, 255, 0.92);
    min-height: 36px;
}
QComboBox:focus {
    border: 2px solid #2F7DFF;
}
"""

DATA_TABLE_STYLE = """
QTableWidget, QTableView {
    background-color: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(147, 167, 198, 0.36);
    border-radius: 14px;
    gridline-color: rgba(199, 213, 234, 0.68);
}
QHeaderView::section {
    background-color: rgba(233, 240, 250, 0.95);
    color: #243754;
    font-weight: 700;
    padding: 10px;
    border: none;
    border-bottom: 1px solid rgba(147, 167, 198, 0.36);
}
"""

LIST_WIDGET_STYLE = f"""
QListWidget {{
    border: none;
    background-color: transparent;
}}
QListWidget::item {{
    padding: 10px 12px;
    border-bottom: 1px solid {BORDER_SOFT};
    border-radius: 8px;
}}
QListWidget::item:selected {{
    background-color: {ACCENT_SOFT};
    color: {TEXT_PRIMARY};
}}
"""


# Sidebar styles
SIDEBAR_ROOT_STYLE = f"""
#sidebar {{
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 rgba(17, 28, 48, 0.93),
        stop:1 rgba(13, 22, 39, 0.90));
    border-right: 1px solid rgba(170, 196, 236, 0.20);
}}
#sidebar QWidget {{
    background-color: transparent;
    color: #EAF1FF;
}}
#sidebar QScrollArea {{
    border: none;
    background-color: transparent;
}}
#sidebar QScrollBar:vertical {{
    width: 0px;
}}
#sidebar QPushButton#groupHeader {{
    background-color: transparent;
    color: #D6E4FF;
    font-size: 12px;
    font-weight: 700;
    text-align: left;
    padding: 7px 10px;
    border-radius: 10px;
}}
#sidebar QPushButton#groupHeader:hover {{
    background-color: rgba(143, 186, 255, 0.16);
    color: #F8FAFC;
}}
#sidebar QPushButton#navButton {{
    text-align: left;
    padding: 10px 12px;
    border: none;
    border-radius: 12px;
    color: #EAF1FF;
    font-size: 13px;
    font-weight: 600;
    background-color: transparent;
}}
#sidebar QPushButton#navButton:hover {{
    background-color: rgba(143, 186, 255, 0.16);
}}
#sidebar QPushButton#navButton:checked {{
    background-color: rgba(47, 125, 255, 0.34);
    border: 1px solid rgba(179, 211, 255, 0.42);
    color: #F4F8FF;
}}
#sidebar QPushButton#navButton[collapsed="true"] {{
    text-align: center;
    padding: 10px 0px;
    font-size: 18px;
    font-weight: 700;
    color: #DDEAFE;
}}
#sidebar QPushButton#navButton:checked[collapsed="true"] {{
    background-color: rgba(47, 125, 255, 0.40);
    color: #E0F2FE;
}}
"""

SIDEBAR_ICON_BUTTON_STYLE = """
QPushButton {
    background-color: rgba(28, 46, 78, 0.78);
    border: 1px solid rgba(169, 198, 242, 0.34);
    border-radius: 11px;
    color: #F2F7FF;
    font-size: 11px;
    font-weight: 700;
    padding: 0px;
}
QPushButton:hover {
    background-color: rgba(58, 94, 152, 0.85);
}
"""

SIDEBAR_DANGER_ICON_BUTTON_STYLE = """
QPushButton {
    background-color: rgba(47, 21, 28, 0.86);
    border: 1px solid rgba(243, 101, 111, 0.80);
    border-radius: 11px;
    color: #FFC7CC;
    font-size: 11px;
    font-weight: 700;
    padding: 0px;
}
QPushButton:hover {
    background-color: #D92D20;
    color: #FFFFFF;
}
"""

SIDEBAR_USER_CARD_STYLE = """
QFrame {
    background-color: rgba(20, 34, 58, 0.85);
    border: 1px solid rgba(151, 184, 236, 0.28);
    border-radius: 14px;
}
"""


def apply_page_title(label: QLabel):
    """Apply standard top-level page title styling."""
    label.setStyleSheet(f"color: {TEXT_PRIMARY}; font-size: 40px; font-weight: 700;")


def apply_section_title(label: QLabel):
    """Apply standard section title styling."""
    label.setStyleSheet(f"color: {TEXT_PRIMARY}; font-size: 24px; font-weight: 700;")


def apply_muted_text(label: QLabel, size: int = 13):
    """Apply standard muted text style."""
    label.setStyleSheet(f"color: {TEXT_SUBTLE}; font-size: {size}px;")


def apply_module_title(label: QLabel):
    """Apply standard module-level title styling."""
    label.setStyleSheet(f"color: {TEXT_PRIMARY}; font-size: 30px; font-weight: 700;")


def apply_windows11_window_effect(window) -> None:
    """Apply native Win11 rounded corners and Mica backdrop when available."""
    if sys.platform != "win32":
        return

    try:
        hwnd = int(window.winId())
    except Exception:
        return

    try:
        dwmapi = ctypes.windll.dwmapi
        DWMWA_WINDOW_CORNER_PREFERENCE = 33
        DWMWCP_ROUND = 2
        DWMWA_SYSTEMBACKDROP_TYPE = 38
        DWMSBT_MAINWINDOW = 2

        corner = ctypes.c_int(DWMWCP_ROUND)
        dwmapi.DwmSetWindowAttribute(
            hwnd,
            DWMWA_WINDOW_CORNER_PREFERENCE,
            ctypes.byref(corner),
            ctypes.sizeof(corner),
        )

        backdrop = ctypes.c_int(DWMSBT_MAINWINDOW)
        dwmapi.DwmSetWindowAttribute(
            hwnd,
            DWMWA_SYSTEMBACKDROP_TYPE,
            ctypes.byref(backdrop),
            ctypes.sizeof(backdrop),
        )
    except Exception:
        # Best effort only: older Windows builds may not expose these attributes.
        return


def apply_workspace_theme(root: QWidget) -> None:
    """Apply dark SaaS module theming recursively to a module root widget."""
    if not root:
        return
    if root.objectName() in {"dashboardPage", "sidebar"}:
        return

    root.setStyleSheet(
        "QWidget { background-color: transparent; color: #EAF1FF; font-family: 'Segoe UI Variable Text', 'Segoe UI'; }"
    )

    for frame in root.findChildren(QFrame):
        if frame.objectName() in {"sidebar"}:
            continue
        frame.setStyleSheet(
            "QFrame { background-color: rgba(26, 34, 52, 0.68); border: 1px solid rgba(124, 152, 198, 0.24); border-radius: 16px; }"
        )

    for label in root.findChildren(QLabel):
        existing = label.styleSheet() or ""
        if "font-size: 24px" in existing or "font-size: 30px" in existing:
            label.setStyleSheet("color: #F2F7FF; font-size: 30px; font-weight: 700;")
        elif "font-size: 18px" in existing:
            label.setStyleSheet("color: #ECF3FF; font-size: 20px; font-weight: 700;")
        else:
            label.setStyleSheet("color: #B8C8E8;")

    for btn in root.findChildren(QAbstractButton):
        obj = btn.objectName() or ""
        if obj in {"groupHeader", "navButton"}:
            continue
        text = (btn.text() or "").lower()
        if "delete" in text or "remove" in text or "logout" in text:
            btn.setStyleSheet(
                "QPushButton { background-color: rgba(96, 33, 45, 0.72); border: 1px solid rgba(236, 98, 112, 0.72); color: #FFD6DB; border-radius: 12px; padding: 9px 14px; font-weight: 700; }"
                "QPushButton:hover { background-color: rgba(141, 37, 56, 0.90); }"
            )
        elif "add" in text or "new" in text or "save" in text or "sync" in text or "view" in text:
            btn.setStyleSheet(
                "QPushButton { background-color: rgba(68, 116, 200, 0.72); border: 1px solid rgba(145, 184, 246, 0.68); color: #F3F8FF; border-radius: 12px; padding: 9px 14px; font-weight: 700; }"
                "QPushButton:hover { background-color: rgba(87, 136, 224, 0.92); }"
            )
        else:
            btn.setStyleSheet(
                "QPushButton { background-color: rgba(38, 48, 71, 0.78); border: 1px solid rgba(112, 136, 176, 0.42); color: #E7EFFF; border-radius: 12px; padding: 8px 12px; font-weight: 600; }"
                "QPushButton:hover { background-color: rgba(52, 68, 99, 0.92); }"
            )

    inputs = (
        QLineEdit,
        QTextEdit,
        QPlainTextEdit,
        QComboBox,
        QSpinBox,
        QDoubleSpinBox,
        QDateEdit,
        QDateTimeEdit,
    )
    for cls in inputs:
        for w in root.findChildren(cls):
            w.setStyleSheet(
                "background-color: rgba(20, 28, 42, 0.92); color: #EAF1FF; border: 1px solid rgba(112, 136, 176, 0.40); border-radius: 12px; padding: 8px 10px;"
            )

    for tab in root.findChildren(QTabWidget):
        tab.setStyleSheet(
            "QTabWidget::pane { border: 1px solid rgba(112, 136, 176, 0.40); border-radius: 14px; background-color: rgba(21, 29, 43, 0.76); }"
            "QTabBar::tab { background-color: rgba(38, 48, 71, 0.78); color: #BDCCE8; padding: 9px 14px; border-top-left-radius: 10px; border-top-right-radius: 10px; margin-right: 2px; }"
            "QTabBar::tab:selected { background-color: rgba(64, 99, 163, 0.78); color: #F2F7FF; }"
        )

    for lst in root.findChildren(QListWidget):
        lst.setStyleSheet(
            "QListWidget { background-color: rgba(21, 29, 43, 0.78); border: 1px solid rgba(112, 136, 176, 0.40); border-radius: 14px; color: #EAF1FF; }"
            "QListWidget::item { padding: 9px 11px; border-bottom: 1px solid rgba(93, 116, 151, 0.26); }"
            "QListWidget::item:selected { background-color: rgba(71, 112, 184, 0.40); }"
        )

    for table_cls in (QTableWidget, QTableView, QTreeWidget, QTreeView):
        for table in root.findChildren(table_cls):
            table.setStyleSheet(
                "background-color: rgba(21, 29, 43, 0.78); color: #EAF1FF; border: 1px solid rgba(112, 136, 176, 0.40); border-radius: 14px;"
                "gridline-color: rgba(87, 107, 141, 0.30); selection-background-color: rgba(74, 118, 196, 0.44);"
            )

    for group in root.findChildren(QGroupBox):
        group.setStyleSheet(
            "QGroupBox { color: #F1F6FF; border: 1px solid rgba(112, 136, 176, 0.36); border-radius: 14px; margin-top: 12px; padding-top: 12px; background-color: rgba(26, 34, 52, 0.72); }"
            "QGroupBox::title { left: 10px; padding: 0 6px; color: #C5D4F0; }"
        )

    for scroll in root.findChildren(QScrollArea):
        scroll.setStyleSheet("QScrollArea { border: none; background-color: transparent; }")


class _WorkspaceThemeFilter(QObject):
    """Event filter that reapplies workspace theming to late-created widgets."""

    def eventFilter(self, obj, event):
        if event.type() in (QEvent.Type.Show, QEvent.Type.Polish):
            if isinstance(obj, QWidget):
                if obj.property("erp_workspace") is True or obj.property("erp_theme_dialog") is True:
                    apply_workspace_theme(obj)
        return super().eventFilter(obj, event)


_WORKSPACE_THEME_FILTER: _WorkspaceThemeFilter | None = None


def install_workspace_theme(app: QApplication) -> None:
    """Install global workspace theme filter (idempotent)."""
    global _WORKSPACE_THEME_FILTER
    if _WORKSPACE_THEME_FILTER is None:
        _WORKSPACE_THEME_FILTER = _WorkspaceThemeFilter()
        app.installEventFilter(_WORKSPACE_THEME_FILTER)
