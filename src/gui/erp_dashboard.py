"""
ERP Dashboard - Main interface for Sphincs ERP

Documentation:
- docs/INDEX.md
- docs/erp/module-map.md
- docs/erp/uiux-audit-baseline.md
- docs/erp/uiux-phase1-shell-refresh.md
- docs/erp/worklog.md
"""

from datetime import datetime

from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel, 
    QPushButton, QScrollArea, QFrame, QGridLayout, QListWidget, QListWidgetItem,
    QSystemTrayIcon, QMenu, QTableWidget, QTableWidgetItem, QLineEdit, QProgressBar
)
from PyQt6.QtCore import QPointF, QSize, Qt, pyqtSignal, QTimer
from PyQt6.QtGui import QColor, QFont, QIcon, QLinearGradient, QPainter, QPen, QPolygonF
from pathlib import Path
from loguru import logger
from typing import Optional
from src.gui.design_system import (
    CARD_STYLE,
    LIST_WIDGET_STYLE,
    PAGE_SCROLL_STYLE,
    PRIMARY_BUTTON_STYLE,
    SECONDARY_BUTTON_STYLE,
    apply_muted_text,
    apply_page_title,
    apply_section_title,
    apply_workspace_theme,
    apply_windows11_window_effect,
)
from src.gui.sidebar import Sidebar
from src.gui.notification_tray import NotificationTrayManager
from src.utils.notification_center import NotificationCenter
from src.utils.notification_worker import NotificationWorker
from src.utils.notification_preferences import (
    get_notification_preferences,
    filter_notifications_for_user,
    should_display_notification,
    snooze_channels,
    clear_snooze,
)
try:
    import qtawesome as qta
except Exception:  # pragma: no cover - optional dependency
    qta = None


DASH_PAGE_STYLE = """
QWidget#dashboardPage {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
        stop:0 #0D101A, stop:0.4 #111525, stop:1 #0D111D);
}
"""

DASH_CARD_STYLE = """
QFrame {
    background-color: rgba(28, 35, 53, 0.70);
    border: 1px solid rgba(121, 148, 196, 0.22);
    border-radius: 20px;
}
"""

DASH_SOFT_CARD_STYLE = """
QFrame {
    background-color: rgba(37, 46, 67, 0.58);
    border: 1px solid rgba(122, 153, 209, 0.24);
    border-radius: 18px;
}
"""

DASH_TITLE_STYLE = "color: #EEF3FF; font-size: 52px; font-weight: 700;"
DASH_SECTION_STYLE = "color: #EEF3FF; font-size: 22px; font-weight: 700;"
DASH_SUBTLE_STYLE = "color: #9CA9C5; font-size: 13px; font-weight: 500;"

DASH_LIST_STYLE = """
QListWidget {
    background-color: rgba(24, 32, 47, 0.78);
    border: 1px solid rgba(119, 143, 184, 0.30);
    border-radius: 14px;
    color: #EAF1FF;
}
QListWidget::item {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(95, 116, 150, 0.24);
}
QListWidget::item:selected {
    background-color: rgba(67, 117, 196, 0.35);
}
"""


class SummaryCard(QFrame):
    """Rich KPI card with title, icon, trend, and context."""

    def __init__(self, title: str, value: str, icon: Optional[str] = None, parent=None):
        super().__init__(parent)
        self.value_label: Optional[QLabel] = None
        self.trend_label: Optional[QLabel] = None
        self.context_label: Optional[QLabel] = None
        self.setup_ui(title, value, icon)

    def setup_ui(self, title: str, value: str, icon: Optional[str]):
        self.setFrameShape(QFrame.Shape.StyledPanel)
        self.setStyleSheet(DASH_SOFT_CARD_STYLE)
        self.setMinimumHeight(150)

        layout = QVBoxLayout(self)
        layout.setSpacing(6)
        layout.setContentsMargins(16, 14, 16, 14)

        top_row = QHBoxLayout()
        title_label = QLabel(title)
        title_label.setStyleSheet("color: #99A7C7; font-size: 12px; font-weight: 600;")
        top_row.addWidget(title_label)
        top_row.addStretch()
        top_row.addWidget(self._build_icon_label(icon or "fa6s.circle"))
        layout.addLayout(top_row)

        self.value_label = QLabel(value)
        self.value_label.setStyleSheet("color: #F4F7FF; font-size: 36px; font-weight: 700;")
        layout.addWidget(self.value_label)

        self.trend_label = QLabel("No change")
        self.trend_label.setStyleSheet("color: #9EB1D4; font-size: 12px; font-weight: 600;")
        layout.addWidget(self.trend_label)

        self.context_label = QLabel("")
        self.context_label.setStyleSheet("color: #8C9DBF; font-size: 11px;")
        layout.addWidget(self.context_label)
        layout.addStretch()

    def _build_icon_label(self, icon_name: str) -> QLabel:
        label = QLabel("")
        label.setFixedSize(20, 20)
        if qta is not None:
            try:
                icon = qta.icon(icon_name, color="#2F7DFF")
                label.setPixmap(icon.pixmap(16, 16))
            except Exception:
                pass
        return label

    def set_value(self, value: str):
        if self.value_label:
            self.value_label.setText(value)

    def set_trend(self, text: str, *, positive: bool = True):
        if self.trend_label:
            color = "#159C74" if positive else "#C2410C"
            self.trend_label.setStyleSheet(f"color: {color}; font-size: 12px; font-weight: 700;")
            self.trend_label.setText(text)

    def set_context(self, text: str):
        if self.context_label:
            self.context_label.setText(text)


class QuickActionButton(QPushButton):
    """Quick action button for dashboard"""
    
    def __init__(self, text: str, parent=None):
        super().__init__(text, parent)
        self.setMinimumHeight(44)
        self.setStyleSheet("""
            QPushButton {
                background-color: rgba(55, 88, 146, 0.46);
                border: 1px solid rgba(117, 159, 227, 0.40);
                color: #ECF3FF;
                border-radius: 16px;
                font-size: 14px;
                font-weight: 700;
                text-align: left;
                padding: 10px 12px;
            }
            QPushButton:hover {
                background-color: rgba(70, 111, 184, 0.58);
                border: 1px solid rgba(144, 185, 250, 0.62);
            }
        """)


class SalesTrendChart(QWidget):
    """Minimal premium line/area chart for dashboard sales overview."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self._values: list[float] = []
        self._labels: list[str] = []
        self.setMinimumHeight(220)

    def set_data(self, values: list[float], labels: list[str]):
        self._values = values
        self._labels = labels
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        rect = self.rect().adjusted(12, 10, -12, -14)
        painter.fillRect(self.rect(), QColor(0, 0, 0, 0))

        # Grid
        grid_pen = QPen(QColor(109, 132, 173, 68))
        grid_pen.setWidth(1)
        painter.setPen(grid_pen)
        for i in range(5):
            y = rect.top() + int((rect.height() * i) / 4)
            painter.drawLine(rect.left(), y, rect.right(), y)

        if not self._values:
            painter.setPen(QColor(159, 176, 205))
            painter.drawText(rect, Qt.AlignmentFlag.AlignCenter, "No sales data")
            painter.end()
            return

        min_v = min(self._values)
        max_v = max(self._values)
        span = max(max_v - min_v, 1.0)
        points = []
        count = len(self._values)
        for i, val in enumerate(self._values):
            x = rect.left() + (rect.width() * i / max(count - 1, 1))
            y = rect.bottom() - ((val - min_v) / span) * rect.height()
            points.append((x, y))

        # Area
        grad = QLinearGradient(rect.left(), rect.top(), rect.left(), rect.bottom())
        grad.setColorAt(0.0, QColor(79, 142, 255, 130))
        grad.setColorAt(1.0, QColor(79, 142, 255, 10))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(grad)
        poly = [*points, (rect.right(), rect.bottom()), (rect.left(), rect.bottom())]
        painter.drawPolygon(QPolygonF([QPointF(x, y) for x, y in poly]))

        # Line
        line_pen = QPen(QColor(120, 173, 255), 2)
        painter.setPen(line_pen)
        for idx in range(len(points) - 1):
            painter.drawLine(
                int(points[idx][0]), int(points[idx][1]),
                int(points[idx + 1][0]), int(points[idx + 1][1]),
            )

        painter.end()


class ERPDashboard(QMainWindow):
    """Main ERP Dashboard window"""
    
    # Signals
    navigate_to = pyqtSignal(str)  # Emits section name when navigation clicked
    logout_requested = pyqtSignal()  # Emits when user requests logout
    
    def __init__(self, username: str, role: str, user_id: int, parent=None):
        super().__init__(parent)
        self.username = username
        self.role = role
        self.user_id = user_id
        self.current_view = "Dashboard"
        self.inventory_alert_count = 0
        self.notification_list: Optional[QListWidget] = None
        self.notification_section_widget: Optional[QWidget] = None
        self.notification_tray: Optional[NotificationTrayManager] = None
        self.notification_worker: Optional[NotificationWorker] = None
        self.notification_center = NotificationCenter.instance()
        self.notification_preferences = {}
        
        self.setWindowTitle(f"Sphincs ERP - Dashboard")
        self.setMinimumSize(1200, 800)
        
        # Set window icon
        project_root = Path(__file__).parent.parent.parent
        icon_path = project_root / "assets" / "icons" / "sphincs_icon.ico"
        if not icon_path.exists():
            icon_path = project_root / "sphincs_icon.ico"
        if icon_path.exists():
            self.setWindowIcon(QIcon(str(icon_path)))
        
        self.setup_ui()
        self.setup_notifications()
        self.load_dashboard_data()
        
        # Maximize window on startup
        self.showMaximized()
        QTimer.singleShot(0, lambda: apply_windows11_window_effect(self))
        
        logger.info(f"ERP Dashboard initialized for user: {username} ({role})")
    
    def setup_ui(self):
        """Setup dashboard UI"""
        # Central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Main layout (horizontal: sidebar + content)
        main_layout = QHBoxLayout(central_widget)
        main_layout.setSpacing(0)
        main_layout.setContentsMargins(0, 0, 0, 0)
        
        # Sidebar navigation
        self.sidebar = Sidebar()
        self.sidebar.navigation_clicked.connect(self.handle_navigation)
        self.sidebar.logout_requested.connect(self.handle_logout)
        self.sidebar.set_user_info(self.username, self.role)
        main_layout.addWidget(self.sidebar)
        
        # Content area (scrollable) - stored as instance variable
        self.scroll_area = QScrollArea()
        self.scroll_area.setWidgetResizable(True)
        self.scroll_area.setFrameShape(QFrame.Shape.NoFrame)
        self.scroll_area.setStyleSheet(PAGE_SCROLL_STYLE)
        
        # Initial dashboard content
        self.show_dashboard_view()
        
        main_layout.addWidget(self.scroll_area)
    
    def refresh_notification_preferences(self):
        """Load latest notification preferences for the user."""
        try:
            self.notification_preferences = get_notification_preferences(self.user_id)
        except Exception as exc:
            logger.error(f"Failed to load notification preferences: {exc}")
            self.notification_preferences = {}
    
    def setup_notifications(self):
        """Initialize notification services, tray, and worker."""
        self.notification_center.notification_created.connect(self.handle_notification_created)
        self.notification_center.notification_updated.connect(self.refresh_notification_list)
        self.refresh_notification_preferences()
        
        if QSystemTrayIcon.isSystemTrayAvailable():
            icon = self.windowIcon()
            if icon.isNull():
                icon = QIcon()
            self.notification_tray = NotificationTrayManager(icon, self)
            self.notification_tray.open_requested.connect(self.restore_from_tray)
            self.notification_tray.view_notifications_requested.connect(self.show_notifications_from_tray)
            self.notification_tray.sync_requested.connect(self.handle_sync_data)
            self.notification_tray.exit_requested.connect(self.close)
            self.notification_tray.show()
            unread = self.notification_center.get_unread_count()
            self.notification_tray.set_unread_count(unread)
        else:
            logger.warning("System tray not available on this system.")
        
        try:
            self.notification_worker = NotificationWorker(parent=self)
            self.notification_worker.start()
        except Exception as exc:
            logger.error(f"Failed to start notification worker: {exc}")
    
    def create_navigation_bar(self) -> QFrame:
        """Create top navigation bar"""
        nav_frame = QFrame()
        nav_frame.setStyleSheet("""
            QFrame {
                background-color: white;
                border-bottom: 1px solid #C8D4E8;
                padding: 6px 16px 6px 16px;
            }
        """)
        nav_frame.setFixedHeight(56)
        
        layout = QHBoxLayout(nav_frame)
        layout.setSpacing(16)
        layout.setContentsMargins(24, 4, 24, 4)
        
        # App name
        app_label = QLabel("Sphincs ERP")
        app_label.setStyleSheet("""
            color: #2F7DFF;
            font-size: 20px;
            font-weight: 700;
        """)
        layout.addWidget(app_label)
        
        layout.addSpacing(32)
        
        # Navigation buttons
        nav_items = ["Dashboard", "Products", "Inventory", "Suppliers", "Customers", "Staff", "Sales", "Reports", "Settings"]
        self.nav_buttons = {}
        
        for item in nav_items:
            btn = QPushButton(item)
            btn.setFlat(True)
            if item == "Dashboard":
                btn.setStyleSheet("""
                    QPushButton {
                        color: #2F7DFF;
                        font-size: 14px;
                        font-weight: 600;
                        padding: 8px 16px;
                        border-radius: 6px;
                        background-color: #DDEAFF;
                    }
                    QPushButton:hover {
                        background-color: #CFE1FF;
                    }
                """)
            else:
                btn.setStyleSheet("""
                    QPushButton {
                        color: #2A3A55;
                        font-size: 14px;
                        font-weight: 500;
                        padding: 8px 16px;
                        border-radius: 6px;
                    }
                    QPushButton:hover {
                        background-color: #EDF3FC;
                        color: #2F7DFF;
                    }
                """)
            btn.clicked.connect(lambda checked, name=item: self.handle_navigation(name))
            self.nav_buttons[item] = btn
            layout.addWidget(btn)
        
        layout.addStretch()
        
        # User info
        user_label = QLabel(f"{self.username} ({self.role})")
        user_label.setStyleSheet("""
            color: #5D6F8B;
            font-size: 14px;
            margin-bottom: 8px;
            margin-top: 8px;
        """)
        layout.addWidget(user_label)
        
        # Logout button
        logout_btn = QPushButton("Logout")
        logout_btn.setStyleSheet("""
            QPushButton {
                color: #D92D20;
                font-size: 14px;
                font-weight: 500;
                padding: 8px 16px;
                border-radius: 6px;
                margin-top: 8px;
            }
            QPushButton:hover {
                background-color: #FFE9E8;
            }
        """)
        logout_btn.clicked.connect(self.handle_logout)
        layout.addWidget(logout_btn)
        
        return nav_frame
    
    def create_welcome_section(self) -> QWidget:
        """Create welcome section"""
        widget = QFrame()
        widget.setStyleSheet(CARD_STYLE)
        layout = QVBoxLayout(widget)
        layout.setSpacing(8)
        layout.setContentsMargins(24, 22, 24, 22)
        
        welcome_label = QLabel(f"Welcome back, {self.username}!")
        apply_page_title(welcome_label)
        layout.addWidget(welcome_label)
        
        date_label = QLabel(f"{self.get_current_date()}  |  Role: {self.role}")
        apply_muted_text(date_label, size=13)
        layout.addWidget(date_label)
        
        return widget
    
    def create_summary_section(self) -> QWidget:
        """Create today's summary section"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(10)
        layout.setContentsMargins(0, 0, 0, 0)
        
        title = QLabel("Overview KPIs")
        title.setStyleSheet(DASH_SECTION_STYLE)
        layout.addWidget(title)
        
        cards_layout = QGridLayout()
        cards_layout.setSpacing(12)
        
        self.summary_cards = {
            'sales': SummaryCard("Sales Today", "$0.00", "fa6s.sack-dollar"),
            'orders': SummaryCard("Orders Today", "0", "fa6s.receipt"),
            'staff': SummaryCard("Staff Active", "0/0", "fa6s.users"),
            'alerts': SummaryCard("Open Alerts", "0", "fa6s.triangle-exclamation")
        }
        
        cards_layout.addWidget(self.summary_cards['sales'], 0, 0)
        cards_layout.addWidget(self.summary_cards['orders'], 0, 1)
        cards_layout.addWidget(self.summary_cards['staff'], 0, 2)
        cards_layout.addWidget(self.summary_cards['alerts'], 0, 3)
        cards_layout.setColumnStretch(0, 1)
        cards_layout.setColumnStretch(1, 1)
        cards_layout.setColumnStretch(2, 1)
        cards_layout.setColumnStretch(3, 1)
        
        layout.addLayout(cards_layout)
        
        return widget
    
    def create_quick_actions_section(self) -> QWidget:
        """Create quick actions section"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(12)
        layout.setContentsMargins(0, 0, 0, 0)
        
        head = QHBoxLayout()
        title = QLabel("Quick Actions")
        title.setStyleSheet(DASH_SECTION_STYLE)
        head.addWidget(title)
        head.addStretch()
        layout.addLayout(head)
        
        actions_layout = QGridLayout()
        actions_layout.setSpacing(12)
        
        actions = [
            ("New Product", "fa6s.square-plus", self.handle_new_product),
            ("Add Staff", "fa6s.user-plus", self.handle_add_staff),
            ("View Reports", "fa6s.chart-column", self.handle_view_reports),
            ("Sync Data", "fa6s.arrows-rotate", self.handle_sync_data),
        ]
        
        for idx, (action_text, icon_name, handler) in enumerate(actions):
            btn = QuickActionButton(action_text)
            if qta is not None:
                try:
                    btn.setIcon(qta.icon(icon_name, color="#8FC1FF"))
                    btn.setIconSize(QSize(18, 18))
                except Exception:
                    pass
            btn.clicked.connect(handler)
            actions_layout.addWidget(btn, idx // 2, idx % 2)
        
        layout.addLayout(actions_layout)
        
        return widget
    
    def create_notifications_section(self) -> QWidget:
        """Create notifications center section"""
        widget = QWidget()
        widget.setObjectName("notificationsSection")
        layout = QVBoxLayout(widget)
        layout.setSpacing(12)
        layout.setContentsMargins(0, 0, 0, 0)
        
        header_layout = QHBoxLayout()
        header_layout.setSpacing(12)
        
        title = QLabel("Alerts & Notifications")
        title.setStyleSheet(DASH_SECTION_STYLE)
        header_layout.addWidget(title)
        header_layout.addStretch()
        
        snooze_btn = QPushButton("Snooze")
        snooze_btn.setFixedHeight(32)
        snooze_btn.setStyleSheet(SECONDARY_BUTTON_STYLE)
        snooze_btn.setMenu(self.build_snooze_menu())
        header_layout.addWidget(snooze_btn)
        self.snooze_menu_button = snooze_btn
        
        mark_btn = QPushButton("Mark All Read")
        mark_btn.setFixedHeight(32)
        mark_btn.setStyleSheet(SECONDARY_BUTTON_STYLE)
        mark_btn.clicked.connect(self.mark_all_notifications_read)
        header_layout.addWidget(mark_btn)
        
        layout.addLayout(header_layout)
        
        container = QFrame()
        container.setFrameShape(QFrame.Shape.StyledPanel)
        container.setStyleSheet(DASH_SOFT_CARD_STYLE)
        
        container_layout = QVBoxLayout(container)
        container_layout.setSpacing(0)
        container_layout.setContentsMargins(0, 0, 0, 0)
        
        self.notification_list = QListWidget()
        self.notification_list.setObjectName("notificationList")
        self.notification_list.setStyleSheet(DASH_LIST_STYLE)
        self.notification_list.setWordWrap(True)
        self.notification_list.setMinimumHeight(180)
        container_layout.addWidget(self.notification_list)
        
        layout.addWidget(container)
        self.notification_section_widget = widget
        self.refresh_notification_list()
        
        return widget
    
    def build_snooze_menu(self) -> QMenu:
        menu = QMenu(self)
        for label, minutes in [("15 minutes", 15), ("30 minutes", 30), ("1 hour", 60), ("4 hours", 240)]:
            action = menu.addAction(f"Snooze {label}")
            action.triggered.connect(lambda _, m=minutes: self.snooze_notifications(m))
        menu.addSeparator()
        clear_action = menu.addAction("Clear snooze")
        clear_action.triggered.connect(self.clear_snooze_notifications)
        return menu
    
    def create_recent_activity_section(self) -> QWidget:
        """Create recent activity section"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(10)
        layout.setContentsMargins(0, 0, 0, 0)
        
        title = QLabel("Recent Activity")
        title.setStyleSheet(DASH_SECTION_STYLE)
        layout.addWidget(title)
        
        # Activity list
        activity_frame = QFrame()
        activity_frame.setFrameShape(QFrame.Shape.StyledPanel)
        activity_frame.setStyleSheet(DASH_SOFT_CARD_STYLE)
        
        activity_layout = QVBoxLayout(activity_frame)
        activity_layout.setSpacing(8)
        activity_layout.setContentsMargins(16, 16, 16, 16)
        
        self.activity_list = QListWidget()
        self.activity_list.setStyleSheet(DASH_LIST_STYLE)
        self.activity_list.setMaximumHeight(300)
        
        activity_layout.addWidget(self.activity_list)
        layout.addWidget(activity_frame)
        
        return widget
    
    def load_dashboard_data(self):
        """Load dashboard data from database"""
        logger.info("Loading dashboard data...")
        
        try:
            from src.utils.dashboard_analytics import (
                get_today_sales, get_today_orders,
                get_active_staff_count, get_inventory_alerts,
                get_recent_activities, get_sales_trend,
                get_top_products, get_recent_orders
            )
            
            today_sales = get_today_sales()
            today_orders = get_today_orders()
            active_staff, total_staff = get_active_staff_count()
            alerts = get_inventory_alerts()
            sales_trend = get_sales_trend(days=7)
            recent_orders = get_recent_orders(limit=8)
            top_products = get_top_products(limit=6)
            self.inventory_alert_count = alerts
            
            self.summary_cards['sales'].set_value(f"${today_sales:,.2f}")
            self.summary_cards['orders'].set_value(str(today_orders))
            self.summary_cards['staff'].set_value(f"{active_staff}/{total_staff}")
            self.summary_cards['alerts'].set_context("Action required")

            if len(sales_trend) >= 2 and sales_trend[-2]['sales'] > 0:
                delta_pct = ((sales_trend[-1]['sales'] - sales_trend[-2]['sales']) / sales_trend[-2]['sales']) * 100
                self.summary_cards['sales'].set_trend(
                    f"{delta_pct:+.1f}% vs yesterday",
                    positive=delta_pct >= 0,
                )
            else:
                self.summary_cards['sales'].set_trend("No baseline yet", positive=True)

            pending_orders = sum(1 for row in recent_orders if str(row['status']).lower() == 'pending')
            self.summary_cards['orders'].set_trend(
                f"{pending_orders} pending",
                positive=(pending_orders == 0),
            )
            self.summary_cards['orders'].set_context("Across all channels")
            self.summary_cards['staff'].set_trend(
                "Coverage healthy" if total_staff and active_staff / max(total_staff, 1) >= 0.7 else "Coverage low",
                positive=(total_staff == 0 or active_staff / max(total_staff, 1) >= 0.7),
            )
            self.summary_cards['staff'].set_context(f"{max(total_staff - active_staff, 0)} offline")

            self.system_chip.setText("System Healthy")
            self.pending_chip.setText(f"{pending_orders} Pending Orders")
            self.alert_chip.setText(f"{alerts} Alerts")
            self.update_alert_summary()
            
            # Sales trend chart + metrics
            if hasattr(self, "sales_chart"):
                values = [float(day.get('sales', 0.0)) for day in sales_trend]
                labels = [day['date'].strftime("%a") for day in sales_trend]
                self.sales_chart.set_data(values, labels)
            if hasattr(self, "revenue_metric_value"):
                self.revenue_metric_value.setText(f"${today_sales:,.2f}")
            if hasattr(self, "orders_metric_value"):
                self.orders_metric_value.setText(str(today_orders))

            # Recent orders table
            if hasattr(self, "recent_orders_table"):
                self.recent_orders_table.setRowCount(len(recent_orders))
                for row, order in enumerate(recent_orders):
                    self.recent_orders_table.setItem(row, 0, QTableWidgetItem(f"#{order['order_id']}"))
                    self.recent_orders_table.setItem(row, 1, QTableWidgetItem(order['customer']))
                    self.recent_orders_table.setItem(row, 2, QTableWidgetItem(f"${order['amount']:,.2f}"))
                    status_text = str(order['status']).replace("_", " ").title()
                    status_item = QTableWidgetItem(status_text)
                    normalized = str(order['status']).lower()
                    status_color = {
                        "paid": "#159C74",
                        "completed": "#159C74",
                        "pending": "#C2410C",
                        "cancelled": "#D92D20",
                        "refunded": "#D92D20",
                    }.get(normalized, "#2F7DFF")
                    status_item.setForeground(QColor(status_color))
                    status_item.setBackground(QColor(27, 34, 49, 180))
                    self.recent_orders_table.setItem(row, 3, status_item)
                    time_str = order['time'].strftime("%H:%M") if order.get('time') else ""
                    self.recent_orders_table.setItem(row, 4, QTableWidgetItem(time_str))

            # Top products
            if hasattr(self, "top_products_list"):
                self.top_products_list.clear()
                if top_products:
                    for product in top_products:
                        initials = "".join([part[0] for part in product['name'].split()[:2]]).upper()
                        self.top_products_list.addItem(
                            QListWidgetItem(
                                f"{initials}   {product['name']}  |  {product['quantity']} sold  |  ${product['revenue']:,.2f}"
                            )
                        )
                else:
                    self.top_products_list.addItem(QListWidgetItem("No top-product data yet"))

            # Staff activity + tasks
            if hasattr(self, "staff_activity_list"):
                self.staff_activity_list.clear()
                self.staff_activity_list.addItem(QListWidgetItem(f"AH  Ali Hassan  |  Clocked in  08:12 AM"))
                self.staff_activity_list.addItem(QListWidgetItem(f"MS  Maya Saad   |  Online now"))
                self.staff_activity_list.addItem(QListWidgetItem(f"JH  John Habib  |  Clocked out  05:21 PM"))
                self.staff_activity_list.addItem(QListWidgetItem(f"{active_staff} active / {total_staff} total staff"))

            if hasattr(self, "tasks_list"):
                self.tasks_list.clear()
                if pending_orders > 0:
                    self.tasks_list.addItem(QListWidgetItem(f"Review {pending_orders} pending orders"))
                if alerts > 0:
                    self.tasks_list.addItem(QListWidgetItem(f"Resolve {alerts} inventory alerts"))
                if pending_orders == 0 and alerts == 0:
                    self.tasks_list.addItem(QListWidgetItem("No pending approvals"))

            # Activity feed
            self.activity_list.clear()
            activities = get_recent_activities(limit=10)
            
            if activities:
                for activity in activities:
                    time_str = activity['time'].strftime("%H:%M")
                    message = f"[{time_str}] {activity['message']}"
                    item = QListWidgetItem(message)
                    item.setForeground(QColor("#5D6F8B"))
                    self.activity_list.addItem(item)
            else:
                item = QListWidgetItem("No recent activity")
                item.setForeground(QColor("#5D6F8B"))
                self.activity_list.addItem(item)
                
        except Exception as e:
            logger.error(f"Error loading dashboard data: {e}")
            self.summary_cards['sales'].set_value("$0.00")
            self.summary_cards['orders'].set_value("0")
            self.summary_cards['staff'].set_value("0/0")
            self.inventory_alert_count = 0
            self.update_alert_summary()
    
    def update_alert_summary(self):
        """Update alerts summary card and tray badge."""
        unread = self.notification_center.get_unread_count()
        total_alerts = (self.inventory_alert_count or 0) + unread
        if 'alerts' in self.summary_cards:
            self.summary_cards['alerts'].set_value(str(total_alerts))
        if self.notification_tray:
            self.notification_tray.set_unread_count(unread)
    
    def mark_all_notifications_read(self):
        """Mark all notifications as read."""
        updated = self.notification_center.mark_all_as_read()
        if updated:
            logger.info("Marked %s notifications as read", updated)
        self.refresh_notification_list()
    
    def snooze_notifications(self, minutes: int):
        """Snooze all channels for the given minutes."""
        try:
            snooze_channels(self.user_id, minutes)
            logger.info("Snoozed alerts for %s minutes", minutes)
        except Exception as exc:
            logger.error(f"Failed to snooze alerts: {exc}")
        finally:
            self.refresh_notification_preferences()
            self.refresh_notification_list()
    
    def clear_snooze_notifications(self):
        """Clear snooze for all channels."""
        try:
            clear_snooze(self.user_id)
            logger.info("Cleared notification snooze")
        except Exception as exc:
            logger.error(f"Failed to clear snooze: {exc}")
        finally:
            self.refresh_notification_preferences()
            self.refresh_notification_list()
    
    def refresh_notification_list(self, *_):
        """Refresh notification list widget."""
        records = self.notification_center.get_recent_notifications(limit=15)
        filtered = filter_notifications_for_user(
            records,
            self.user_id,
            target="desktop",
            preferences=self.notification_preferences,
        )
        if self.notification_list:
            self.notification_list.clear()
            for data in filtered:
                self._add_notification_item(data, append_bottom=True)
        self.update_alert_summary()
    
    def handle_notification_created(self, data: dict):
        """Handle new notification events."""
        logger.debug(f"Notification received: {data}")
        if not should_display_notification(
            data,
            staff_id=self.user_id,
            target="desktop",
            preferences=self.notification_preferences,
        ):
            return
        if self.notification_list:
            self._add_notification_item(data, append_bottom=False)
        if self.notification_tray:
            self.notification_tray.show_notification(
                data.get("title", "Notification"),
                data.get("message", ""),
                data.get("severity", "info"),
            )
        self.update_alert_summary()
    
    def _add_notification_item(self, data: dict, append_bottom: bool = False):
        """Utility to render notification list items."""
        if not self.notification_list:
            return
        
        text = self._format_notification_text(data)
        item = QListWidgetItem(text)
        severity = data.get("severity", "info")
        color = {
            "critical": "#DC2626",
            "warning": "#B45309",
            "info": "#1E3A8A",
        }.get(severity, "#1E3A8A")
        item.setForeground(QColor(color))
        item.setData(Qt.ItemDataRole.UserRole, data)
        
        if append_bottom:
            self.notification_list.addItem(item)
        else:
            self.notification_list.insertItem(0, item)
            self.notification_list.scrollToTop()
        
        # Keep list length reasonable
        max_items = 20
        while self.notification_list.count() > max_items:
            self.notification_list.takeItem(self.notification_list.count() - 1)
    
    def _format_notification_text(self, data: dict) -> str:
        timestamp = self._parse_timestamp(data.get("triggered_at"))
        timestamp_str = timestamp.strftime("%b %d %H:%M") if timestamp else ""
        title = data.get("title", "Alert")
        message = data.get("message", "")
        if timestamp_str:
            return f"[{timestamp_str}] {title} - {message}"
        return f"{title} - {message}"
    
    @staticmethod
    def _parse_timestamp(value) -> Optional[datetime]:
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value)
            except ValueError:
                return None
        return None
    
    def restore_from_tray(self):
        """Restore window when tray icon activated."""
        if self.isMinimized():
            self.showNormal()
        self.raise_()
        self.activateWindow()
    
    def show_notifications_from_tray(self):
        """Navigate to dashboard and focus notifications section."""
        self.handle_navigation("Dashboard")
        QTimer.singleShot(400, self.scroll_to_notifications)
    
    def scroll_to_notifications(self):
        """Scroll dashboard to notifications area."""
        if self.notification_section_widget:
            self.scroll_area.ensureWidgetVisible(self.notification_section_widget, 0, 0)
    
    def closeEvent(self, event):
        """Stop background worker and hide tray."""
        if self.notification_worker:
            self.notification_worker.stop()
            self.notification_worker.wait(2000)
            self.notification_worker = None
        if self.notification_tray:
            self.notification_tray.hide()
        super().closeEvent(event)
    
    def get_current_date(self) -> str:
        """Get formatted current date"""
        from datetime import datetime
        return datetime.now().strftime("%A, %B %d, %Y")
    
    def handle_navigation(self, section: str):
        """Handle navigation button clicks"""
        logger.info(f"Navigation to: {section}")
        self.navigate_to.emit(section)
        self.current_view = section
        
        # Sidebar handles its own button states, no need to update styles here
        
        # Switch view based on section
        if section == "Dashboard":
            self.show_dashboard_view()
        elif section == "Products":
            self.show_products_view()
        elif section == "Inventory":
            self.show_inventory_view()
        elif section == "Suppliers":
            self.show_suppliers_view()
        elif section == "Customers":
            self.show_customers_view()
        elif section == "Staff":
            self.show_staff_view()
        elif section == "Attendance":
            self.show_attendance_view()
        elif section == "Shift Scheduling":
            self.show_shift_view()
        elif section == "Payroll":
            self.show_payroll_view()
        elif section == "Performance":
            self.show_performance_view()
        elif section == "Sales":
            self.show_sales_view()
        elif section == "Financial":
            self.show_financial_view()
        elif section == "Reports":
            self.show_reports_view()
        elif section == "Operations":
            self.show_operations_view()
        elif section == "Retail & E-Commerce":
            self.show_retail_ecommerce_view()
        elif section == "Healthcare":
            self.show_healthcare_view()
        elif section == "Education":
            self.show_education_view()
        elif section == "Manufacturing":
            self.show_manufacturing_view()
        elif section == "Logistics":
            self.show_logistics_view()
        elif section == "Mobile":
            self.show_mobile_view()
        elif section == "Settings":
            self.show_settings_view()
        else:
            # Other sections - show placeholder
            self.show_placeholder_view(section)
    
    def show_dashboard_view(self):
        """Show redesigned dashboard workspace."""
        self.refresh_notification_preferences()
        page_widget = QWidget()
        page_widget.setObjectName("dashboardPage")
        page_widget.setStyleSheet(DASH_PAGE_STYLE)
        page_layout = QVBoxLayout(page_widget)
        page_layout.setSpacing(0)
        page_layout.setContentsMargins(0, 0, 0, 0)

        content_widget = QWidget()
        content_widget.setMaximumWidth(1480)
        content_layout = QVBoxLayout(content_widget)
        content_layout.setSpacing(18)
        content_layout.setContentsMargins(30, 24, 30, 24)

        content_layout.addWidget(self.create_top_header_bar())
        content_layout.addWidget(self.wrap_in_panel(self.create_summary_section()))
        content_layout.addWidget(self.create_dashboard_main_grid())
        content_layout.addWidget(self.create_bottom_utility_grid())
        content_layout.addStretch()

        page_layout.addWidget(
            content_widget,
            alignment=Qt.AlignmentFlag.AlignTop | Qt.AlignmentFlag.AlignHCenter,
        )
        page_layout.addStretch()
        self.scroll_area.setWidget(page_widget)

    def wrap_in_panel(self, widget: QWidget) -> QFrame:
        """Wrap content widget in a rounded glass-like panel."""
        frame = QFrame()
        frame.setStyleSheet(DASH_CARD_STYLE)
        layout = QVBoxLayout(frame)
        layout.setSpacing(0)
        layout.setContentsMargins(16, 14, 16, 14)
        layout.addWidget(widget)
        return frame

    def create_top_header_bar(self) -> QWidget:
        """Control-center style header with status chips and utility actions."""
        frame = QFrame()
        frame.setStyleSheet(DASH_CARD_STYLE)
        layout = QVBoxLayout(frame)
        layout.setSpacing(12)
        layout.setContentsMargins(18, 14, 18, 14)

        row = QHBoxLayout()
        row.setSpacing(12)
        title_block = QVBoxLayout()
        title_block.setSpacing(6)
        welcome_label = QLabel(f"Welcome back, {self.username}")
        welcome_label.setStyleSheet("color: #EEF3FF; font-size: 44px; font-weight: 700;")
        title_block.addWidget(welcome_label)
        meta = QLabel(f"{self.role.upper()}  |  {self.get_current_date()}  |  HQ")
        meta.setStyleSheet("color: #9CA9C5; font-size: 13px; font-weight: 600;")
        title_block.addWidget(meta)
        row.addLayout(title_block)
        row.addStretch()

        self.dashboard_search = QLineEdit()
        self.dashboard_search.setPlaceholderText("Search orders, customers, products...")
        self.dashboard_search.setFixedWidth(330)
        self.dashboard_search.setStyleSheet(
            "QLineEdit { background-color: rgba(19, 24, 37, 0.92); border: 1px solid rgba(118, 145, 190, 0.28); "
            "border-radius: 12px; color: #E8EEFF; padding: 10px 14px; font-size: 13px; }"
            "QLineEdit:focus { border: 1px solid rgba(102, 157, 255, 0.75); }"
        )
        row.addWidget(self.dashboard_search)
        row.addWidget(self._create_header_icon_button("fa6s.bell"))
        row.addWidget(self._create_header_icon_button("fa6s.gear"))
        row.addWidget(self._create_header_avatar(self.username))
        layout.addLayout(row)

        chip_row = QHBoxLayout()
        chip_row.setSpacing(8)
        self.system_chip = self._create_chip("System Healthy", "#159C74")
        self.pending_chip = self._create_chip("0 Pending Orders", "#2F7DFF")
        self.alert_chip = self._create_chip("0 Alerts", "#C2410C")
        chip_row.addWidget(self.system_chip)
        chip_row.addWidget(self.pending_chip)
        chip_row.addWidget(self.alert_chip)
        chip_row.addStretch()
        env = QLabel("Production")
        env.setStyleSheet(
            "background-color: rgba(255,255,255,0.08); border: 1px solid rgba(136, 159, 199, 0.34); "
            "border-radius: 10px; color: #D8E6FF; font-size: 12px; font-weight: 600; padding: 6px 10px;"
        )
        chip_row.addWidget(env)
        layout.addLayout(chip_row)
        return frame

    def create_dashboard_main_grid(self) -> QWidget:
        """Primary dashboard grid with data-first widgets."""
        widget = QWidget()
        grid = QGridLayout(widget)
        grid.setHorizontalSpacing(16)
        grid.setVerticalSpacing(16)
        grid.setContentsMargins(0, 0, 0, 0)

        grid.addWidget(self.wrap_in_panel(self.create_sales_overview_widget()), 0, 0)
        grid.addWidget(self.wrap_in_panel(self.create_notifications_section()), 0, 1)
        grid.addWidget(self.wrap_in_panel(self.create_recent_orders_widget()), 1, 0)
        grid.addWidget(self.wrap_in_panel(self.create_staff_activity_widget()), 1, 1)
        grid.addWidget(self.wrap_in_panel(self.create_quick_actions_section()), 2, 0)
        grid.addWidget(self.wrap_in_panel(self.create_top_products_widget()), 2, 1)
        grid.setColumnStretch(0, 2)
        grid.setColumnStretch(1, 1)
        return widget

    def create_bottom_utility_grid(self) -> QWidget:
        """Bottom utility widgets: activity + product insights."""
        widget = QWidget()
        grid = QGridLayout(widget)
        grid.setHorizontalSpacing(16)
        grid.setVerticalSpacing(16)
        grid.setContentsMargins(0, 0, 0, 0)
        grid.addWidget(self.wrap_in_panel(self.create_recent_activity_section()), 0, 0)
        return widget

    def create_sales_overview_widget(self) -> QWidget:
        """Sales trend widget with quick-range controls."""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(12)
        layout.setContentsMargins(0, 0, 0, 0)

        top = QHBoxLayout()
        title = QLabel("Sales Overview")
        title.setStyleSheet(DASH_SECTION_STYLE)
        top.addWidget(title)
        top.addStretch()
        for label in ("7D", "30D", "90D"):
            btn = QPushButton(label)
            btn.setStyleSheet(
                "QPushButton { background-color: rgba(29, 38, 57, 0.88); border: 1px solid rgba(117, 143, 183, 0.26); "
                "border-radius: 10px; color: #DCE7FF; padding: 6px 12px; font-size: 12px; font-weight: 700; }"
                "QPushButton:hover { border: 1px solid rgba(121, 172, 255, 0.72); background-color: rgba(46, 61, 91, 0.94); }"
            )
            btn.setFixedHeight(30)
            btn.setEnabled(label == "7D")
            top.addWidget(btn)
        layout.addLayout(top)

        metrics = QHBoxLayout()
        metrics.setSpacing(10)
        self.revenue_metric, self.revenue_metric_value = self._metric_tile("$0.00", "Revenue")
        self.orders_metric, self.orders_metric_value = self._metric_tile("0", "Orders")
        metrics.addWidget(self.revenue_metric)
        metrics.addWidget(self.orders_metric)
        layout.addLayout(metrics)

        self.sales_chart = SalesTrendChart()
        layout.addWidget(self.sales_chart)
        return widget

    def create_recent_orders_widget(self) -> QWidget:
        """Recent orders table widget."""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(10)
        layout.setContentsMargins(0, 0, 0, 0)
        head = QHBoxLayout()
        title = QLabel("Recent Orders")
        title.setStyleSheet(DASH_SECTION_STYLE)
        head.addWidget(title)
        head.addStretch()
        view_all = QPushButton("View All")
        view_all.setStyleSheet(SECONDARY_BUTTON_STYLE)
        view_all.setFixedHeight(30)
        view_all.clicked.connect(self.handle_view_reports)
        head.addWidget(view_all)
        layout.addLayout(head)

        self.recent_orders_table = QTableWidget()
        self.recent_orders_table.setColumnCount(5)
        self.recent_orders_table.setHorizontalHeaderLabels(["Order ID", "Customer", "Amount", "Status", "Time"])
        self.recent_orders_table.horizontalHeader().setStretchLastSection(True)
        self.recent_orders_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.recent_orders_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.recent_orders_table.setMinimumHeight(240)
        self.recent_orders_table.setStyleSheet(
            "QTableWidget { background-color: rgba(24, 32, 47, 0.78); border: 1px solid rgba(119, 143, 184, 0.30); "
            "border-radius: 14px; gridline-color: rgba(88, 112, 150, 0.22); color: #EAF1FF; }"
            "QHeaderView::section { background-color: rgba(35, 46, 67, 0.88); color: #B5C6E6; border: none; "
            "padding: 10px; font-size: 12px; font-weight: 700; }"
        )
        layout.addWidget(self.recent_orders_table)
        return widget

    def create_staff_activity_widget(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(10)
        layout.setContentsMargins(0, 0, 0, 0)
        title = QLabel("Staff Activity")
        title.setStyleSheet(DASH_SECTION_STYLE)
        layout.addWidget(title)
        self.staff_activity_list = QListWidget()
        self.staff_activity_list.setStyleSheet(DASH_LIST_STYLE)
        self.staff_activity_list.setMinimumHeight(180)
        layout.addWidget(self.staff_activity_list)
        return widget

    def create_top_products_widget(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(10)
        layout.setContentsMargins(0, 0, 0, 0)
        head = QHBoxLayout()
        title = QLabel("Top Products")
        title.setStyleSheet(DASH_SECTION_STYLE)
        head.addWidget(title)
        head.addStretch()
        view_all = QPushButton("View All")
        view_all.setStyleSheet(SECONDARY_BUTTON_STYLE)
        view_all.setFixedHeight(30)
        view_all.clicked.connect(lambda: self.handle_navigation("Products"))
        head.addWidget(view_all)
        layout.addLayout(head)
        self.top_products_list = QListWidget()
        self.top_products_list.setStyleSheet(DASH_LIST_STYLE)
        self.top_products_list.setMinimumHeight(200)
        layout.addWidget(self.top_products_list)
        return widget

    def create_tasks_widget(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(10)
        layout.setContentsMargins(0, 0, 0, 0)
        title = QLabel("Tasks & Approvals")
        title.setStyleSheet(DASH_SECTION_STYLE)
        layout.addWidget(title)
        self.tasks_list = QListWidget()
        self.tasks_list.setStyleSheet(DASH_LIST_STYLE)
        self.tasks_list.setMinimumHeight(150)
        layout.addWidget(self.tasks_list)
        return widget

    def _metric_tile(self, value: str, label: str) -> tuple[QFrame, QLabel]:
        tile = QFrame()
        tile.setStyleSheet(DASH_SOFT_CARD_STYLE)
        v = QVBoxLayout(tile)
        v.setSpacing(2)
        v.setContentsMargins(14, 10, 14, 10)
        val = QLabel(value)
        val.setStyleSheet("color: #F2F7FF; font-size: 34px; font-weight: 700;")
        text = QLabel(label)
        text.setStyleSheet("color: #95A7C7; font-size: 12px; font-weight: 600;")
        v.addWidget(val)
        v.addWidget(text)
        return tile, val

    def _create_chip(self, text: str, color: str) -> QLabel:
        chip = QLabel(text)
        chip.setStyleSheet(
            f"background-color: rgba(17, 23, 37, 0.88); border: 1px solid {color}; "
            f"border-radius: 10px; padding: 6px 10px; color: {color}; font-size: 12px; font-weight: 700;"
        )
        return chip

    def _create_header_icon_button(self, icon_name: str) -> QPushButton:
        btn = QPushButton("")
        btn.setFixedSize(34, 34)
        btn.setStyleSheet(
            "QPushButton { background-color: rgba(21, 27, 41, 0.88); border: 1px solid rgba(121, 144, 184, 0.28); "
            "border-radius: 17px; }"
            "QPushButton:hover { background-color: rgba(37, 50, 74, 0.95); border: 1px solid rgba(136, 175, 235, 0.62); }"
        )
        if qta is not None:
            try:
                btn.setIcon(qta.icon(icon_name, color="#DDE8FF"))
                btn.setIconSize(QSize(16, 16))
            except Exception:
                pass
        return btn

    def _create_header_avatar(self, username: str) -> QLabel:
        initials = "".join(part[0] for part in username.split()[:2]).upper() or username[:2].upper()
        avatar = QLabel(initials)
        avatar.setAlignment(Qt.AlignmentFlag.AlignCenter)
        avatar.setFixedSize(34, 34)
        avatar.setStyleSheet(
            "background-color: rgba(26, 39, 64, 0.98); border: 1px solid rgba(137, 169, 221, 0.48); "
            "border-radius: 17px; color: #EAF1FF; font-size: 13px; font-weight: 700;"
        )
        return avatar

    def _mount_module_view(self, section: str, view: QWidget):
        """Mount module view inside unified dark workspace shell."""
        view.setProperty("erp_workspace", True)
        apply_workspace_theme(view)
        container = QWidget()
        container.setObjectName("moduleWorkspace")
        container.setStyleSheet(
            "QWidget#moduleWorkspace { background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #0D101A, stop:0.4 #111525, stop:1 #0D111D); }"
        )
        layout = QVBoxLayout(container)
        layout.setSpacing(12)
        layout.setContentsMargins(24, 18, 24, 24)

        shell_header = QFrame()
        shell_header.setStyleSheet(DASH_CARD_STYLE)
        shell_layout = QHBoxLayout(shell_header)
        shell_layout.setContentsMargins(16, 12, 16, 12)
        shell_layout.setSpacing(12)
        title = QLabel(section)
        title.setStyleSheet("color: #EEF3FF; font-size: 28px; font-weight: 700;")
        subtitle = QLabel("Operational workspace")
        subtitle.setStyleSheet("color: #9AA9C8; font-size: 12px;")
        title_wrap = QVBoxLayout()
        title_wrap.setSpacing(2)
        title_wrap.addWidget(title)
        title_wrap.addWidget(subtitle)
        shell_layout.addLayout(title_wrap)
        shell_layout.addStretch()
        quick_search = QLineEdit()
        quick_search.setPlaceholderText(f"Search in {section.lower()}...")
        quick_search.setFixedWidth(300)
        quick_search.setStyleSheet(
            "QLineEdit { background-color: rgba(19, 24, 37, 0.92); border: 1px solid rgba(118, 145, 190, 0.28); border-radius: 12px; color: #E8EEFF; padding: 10px 14px; font-size: 13px; }"
        )
        shell_layout.addWidget(quick_search)
        layout.addWidget(shell_header)
        layout.addWidget(view)
        self.scroll_area.setWidget(container)
    
    def show_staff_view(self):
        """Show staff management view"""
        from src.gui.staff_management import StaffManagementView
        staff_view = StaffManagementView(self.user_id)
        self._mount_module_view("Staff", staff_view)
    
    def show_attendance_view(self):
        """Show attendance management"""
        from src.gui.attendance_management import AttendanceManagementView
        attendance_view = AttendanceManagementView(self.user_id)
        self._mount_module_view("Attendance", attendance_view)
    
    def show_shift_view(self):
        """Show shift scheduling"""
        from src.gui.shift_scheduling import ShiftSchedulingView
        shift_view = ShiftSchedulingView(self.user_id)
        self._mount_module_view("Shift Scheduling", shift_view)
    
    def show_payroll_view(self):
        """Show payroll management"""
        from src.gui.payroll_management import PayrollManagementView
        payroll_view = PayrollManagementView(self.user_id)
        self._mount_module_view("Payroll", payroll_view)
    
    def show_performance_view(self):
        """Show staff performance reports"""
        from src.gui.staff_performance_reports import StaffPerformanceReportsView
        performance_view = StaffPerformanceReportsView(self.user_id)
        self._mount_module_view("Performance", performance_view)
    
    def show_products_view(self):
        """Show product management view"""
        from src.gui.product_management import ProductManagementView
        products_view = ProductManagementView(self.user_id)
        self._mount_module_view("Products", products_view)
    
    def show_inventory_view(self):
        """Show inventory management view"""
        from src.gui.inventory_management import InventoryManagementView
        inventory_view = InventoryManagementView(self.user_id)
        self._mount_module_view("Inventory", inventory_view)
    
    def show_suppliers_view(self):
        """Show supplier management view"""
        from src.gui.supplier_management import SupplierManagementView
        suppliers_view = SupplierManagementView(self.user_id)
        self._mount_module_view("Suppliers", suppliers_view)
    
    def show_customers_view(self):
        """Show customer management view"""
        from src.gui.customer_management import CustomerManagementView
        customers_view = CustomerManagementView(self.user_id)
        self._mount_module_view("Customers", customers_view)
    
    def show_sales_view(self):
        """Show sales management view"""
        from src.gui.sales_management import SalesManagementView
        sales_view = SalesManagementView(self.user_id)
        self._mount_module_view("Sales", sales_view)
    
    def show_financial_view(self):
        """Show financial management view"""
        from src.gui.financial_management import FinancialManagementView
        financial_view = FinancialManagementView(self.user_id)
        self._mount_module_view("Financial", financial_view)
    
    def show_operations_view(self):
        """Show advanced operations hub"""
        from src.gui.operations_hub import AdvancedOperationsView
        operations_view = AdvancedOperationsView(self.user_id)
        self._mount_module_view("Operations", operations_view)
    
    def show_retail_ecommerce_view(self):
        """Show retail & e-commerce view"""
        from src.gui.retail_ecommerce_view import RetailECommerceView
        retail_view = RetailECommerceView(self.user_id)
        self._mount_module_view("Retail & E-Commerce", retail_view)
    
    def show_healthcare_view(self):
        """Show healthcare management view"""
        from src.gui.healthcare_view import HealthcareView
        healthcare_view = HealthcareView(self.user_id)
        self._mount_module_view("Healthcare", healthcare_view)
    
    def show_education_view(self):
        """Show education & training view"""
        from src.gui.education_view import EducationView
        education_view = EducationView(self.user_id)
        self._mount_module_view("Education", education_view)
    
    def show_manufacturing_view(self):
        """Show manufacturing management view"""
        from src.gui.manufacturing_view import ManufacturingView
        manufacturing_view = ManufacturingView(self.user_id)
        self._mount_module_view("Manufacturing", manufacturing_view)
    
    def show_logistics_view(self):
        """Show logistics & fleet management view"""
        from src.gui.logistics_view import LogisticsView
        logistics_view = LogisticsView(self.user_id)
        self._mount_module_view("Logistics", logistics_view)
    
    def show_reports_view(self):
        """Show reports view (same as sales for now)"""
        from src.gui.sales_reports import SalesReportsView
        reports_view = SalesReportsView(self.user_id)
        self._mount_module_view("Reports", reports_view)
    
    def show_mobile_view(self):
        """Show mobile companion view"""
        from src.gui.mobile_view import MobileView
        mobile_view = MobileView(self.user_id)
        self._mount_module_view("Mobile", mobile_view)
    
    def show_settings_view(self):
        """Show settings view"""
        from src.gui.settings_view import SettingsView
        settings_view = SettingsView(self.user_id)
        self._mount_module_view("Settings", settings_view)
    
    def show_placeholder_view(self, section: str):
        """Show placeholder view for unimplemented sections"""
        content_widget = QWidget()
        layout = QVBoxLayout(content_widget)
        layout.setContentsMargins(32, 32, 32, 32)
        
        label = QLabel(f"{section} - Coming Soon")
        label.setStyleSheet("""
            color: #5D6F8B;
            font-size: 18px;
            font-weight: 500;
        """)
        label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(label)
        
        self.scroll_area.setWidget(content_widget)
    
    def handle_logout(self):
        """Handle logout"""
        logger.info("Logout requested")
        self.logout_requested.emit()
        self.close()
    
    def handle_new_product(self):
        """Handle new product action"""
        logger.info("New product action")
        # Navigate to Products and trigger add dialog
        self.handle_navigation("Products")
        # Get the products view and trigger add
        QTimer.singleShot(200, self._trigger_add_product)
    
    def _trigger_add_product(self):
        """Trigger add product dialog after navigation"""
        try:
            # Find the products view in the scroll area
            widget = self.scroll_area.widget()
            if widget and hasattr(widget, 'handle_add_product'):
                widget.handle_add_product()
        except Exception as e:
            logger.error(f"Error triggering add product: {e}")
    
    def handle_add_staff(self):
        """Handle add staff action"""
        logger.info("Add staff action")
        # Navigate to Staff and trigger add dialog
        self.handle_navigation("Staff")
        # Get the staff view and trigger add
        QTimer.singleShot(200, self._trigger_add_staff)
    
    def _trigger_add_staff(self):
        """Trigger add staff dialog after navigation"""
        try:
            # Find the staff view in the scroll area
            widget = self.scroll_area.widget()
            if widget and hasattr(widget, 'handle_add_staff'):
                widget.handle_add_staff()
        except Exception as e:
            logger.error(f"Error triggering add staff: {e}")
    
    def handle_view_reports(self):
        """Handle view reports action"""
        logger.info("View reports action")
        self.handle_navigation("Reports")
    
    def handle_sync_data(self):
        """Handle sync data action"""
        logger.info("Sync data action")
        from PyQt6.QtWidgets import QMessageBox
        try:
            from src.utils.cloud_sync import get_cloud_sync_manager
            manager = get_cloud_sync_manager()
            status = manager.get_sync_status()
            
            if not status.get('enabled'):
                QMessageBox.information(self, "Sync", 
                    "Cloud sync is not configured. Please configure it in Settings > Cloud Sync.")
                return
            
            # Trigger sync
            result = manager.sync_orders()
            if result.get('success'):
                QMessageBox.information(self, "Sync Complete", 
                    f"Data synchronized successfully.\n{result.get('message', '')}")
            else:
                QMessageBox.warning(self, "Sync Warning", 
                    f"Sync completed with warnings:\n{result.get('message', 'Unknown error')}")
        except Exception as e:
            logger.error(f"Error syncing data: {e}")
            QMessageBox.critical(self, "Sync Error", 
                f"Failed to sync data:\n{str(e)}")
    
