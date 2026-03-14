"""
Shared table helpers for consistent sizing and appearance.
"""

from PyQt6.QtCore import QObject, QEvent
from PyQt6.QtWidgets import QHeaderView, QTableWidget, QTableView, QApplication
from src.gui.design_system import DATA_TABLE_STYLE


def enable_table_auto_resize(
    table,
    *,
    stretch_last: bool = True,
    mode: QHeaderView.ResizeMode = QHeaderView.ResizeMode.ResizeToContents,
    minimum_section: int = 80,
) -> None:
    """
    Configure a QTableWidget/QTableView to automatically size columns to their contents.
    """
    header = table.horizontalHeader()
    header.setSectionResizeMode(mode)
    header.setMinimumSectionSize(minimum_section)
    header.setStretchLastSection(stretch_last)
    table.resizeColumnsToContents()
    setattr(table, "_auto_resize_applied", True)


def apply_modern_table_chrome(table) -> None:
    """Apply modern shared table styling and interaction defaults."""
    existing_style = table.styleSheet() or ""
    marker = "/*modern-table-style*/"
    if marker not in existing_style:
        table.setStyleSheet(f"{existing_style}\n{marker}\n{DATA_TABLE_STYLE}")

    table.setAlternatingRowColors(True)
    table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
    table.setShowGrid(False)

    horizontal_header = table.horizontalHeader()
    horizontal_header.setMinimumHeight(44)
    horizontal_header.setDefaultAlignment(horizontal_header.defaultAlignment())
    horizontal_header.setHighlightSections(False)

    vertical_header = table.verticalHeader()
    vertical_header.setVisible(False)
    vertical_header.setDefaultSectionSize(max(40, vertical_header.defaultSectionSize()))
    setattr(table, "_modern_table_applied", True)


class _TableAutoResizeFilter(QObject):
    """Event filter that ensures every table auto-resizes its columns."""
    
    def eventFilter(self, obj, event):
        if (
            isinstance(obj, (QTableWidget, QTableView))
            and event.type() in (QEvent.Type.Show, QEvent.Type.Polish, QEvent.Type.StyleChange)
        ):
            if not getattr(obj, "_modern_table_applied", False):
                apply_modern_table_chrome(obj)
            if not getattr(obj, "_auto_resize_applied", False):
                enable_table_auto_resize(obj)
        return super().eventFilter(obj, event)


_TABLE_AUTO_RESIZE_FILTER: _TableAutoResizeFilter | None = None


def install_table_auto_resize(app: QApplication) -> None:
    """Install the global event filter (idempotent)."""
    global _TABLE_AUTO_RESIZE_FILTER
    if _TABLE_AUTO_RESIZE_FILTER is None:
        _TABLE_AUTO_RESIZE_FILTER = _TableAutoResizeFilter()
        app.installEventFilter(_TABLE_AUTO_RESIZE_FILTER)

