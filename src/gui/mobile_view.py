"""
Mobile Companion View - Mobile-optimized web interface
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QScrollArea, QFrame, QGridLayout, QListWidget, QListWidgetItem,
    QTabWidget, QTableWidget, QTableWidgetItem, QLineEdit, QDialog,
    QFormLayout, QComboBox, QSpinBox, QMessageBox
)
from PyQt6.QtCore import Qt, QUrl, QTimer, pyqtSlot
from PyQt6.QtGui import QColor, QFont, QShowEvent
from loguru import logger
from datetime import datetime
from src.database.connection import get_db_session
from src.database.models import Order, OrderItem, Staff, Product, Customer, Inventory, Ingredient


class MobileView(QWidget):
    """Mobile-optimized view for companion app"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        # Initialize widget references
        self.sales_card = None
        self.orders_card = None
        self.staff_card = None
        self.alerts_card = None
        self.orders_list = None
        self.setup_ui()
        self._data_loaded = False  # Track if data has been loaded
    
    def setup_ui(self):
        """Setup mobile-optimized UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(16, 16, 16, 16)
        
        # Header
        header_layout = QHBoxLayout()
        header = QLabel("📱 Mobile Dashboard")
        header.setStyleSheet("""
            color: #162640;
            font-size: 28px;
            font-weight: 700;
            padding: 16px 0;
        """)
        header_layout.addWidget(header)
        header_layout.addStretch()
        
        # Refresh button
        refresh_btn = QPushButton("🔄")
        refresh_btn.setFixedSize(40, 40)
        refresh_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 20px;
                font-size: 18px;
            }
            QPushButton:hover {
                background-color: #1D66EA;
            }
        """)
        refresh_btn.clicked.connect(self.load_dashboard_data)
        header_layout.addWidget(refresh_btn)
        
        layout.addLayout(header_layout)
        
        # Tabs for different mobile views
        self.tabs = QTabWidget()
        self.tabs.setStyleSheet("""
            QTabWidget::pane {
                border: 1px solid #C8D4E8;
                border-radius: 12px;
                background-color: #EDF3FC;
            }
            QTabBar::tab {
                background-color: white;
                color: #5D6F8B;
                padding: 12px 20px;
                margin-right: 4px;
                border-top-left-radius: 12px;
                border-top-right-radius: 12px;
                font-size: 14px;
                font-weight: 600;
            }
            QTabBar::tab:selected {
                background-color: #2F7DFF;
                color: white;
            }
        """)
        
        # Dashboard tab
        dashboard_tab = self.create_dashboard_tab()
        self.tabs.addTab(dashboard_tab, "📊 Dashboard")
        
        # Connect tab change signal to load data when dashboard tab is shown
        self.tabs.currentChanged.connect(self.on_tab_changed)
        
        # Orders tab
        orders_tab = self.create_orders_tab()
        self.tabs.addTab(orders_tab, "📋 Orders")
        
        # Inventory tab
        inventory_tab = self.create_inventory_tab()
        self.tabs.addTab(inventory_tab, "📦 Inventory")
        
        # Staff tab
        staff_tab = self.create_staff_tab()
        self.tabs.addTab(staff_tab, "👤 Staff")
        
        layout.addWidget(self.tabs)
        
        # Auto-refresh timer
        self.refresh_timer = QTimer()
        self.refresh_timer.timeout.connect(self.load_dashboard_data)
        self.refresh_timer.start(30000)  # Refresh every 30 seconds
    
    def create_dashboard_tab(self):
        """Create dashboard tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(16)
        layout.setContentsMargins(16, 16, 16, 16)
        
        # Scroll area for mobile-like scrolling
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setStyleSheet("""
            QScrollArea {
                border: none;
                background-color: transparent;
            }
        """)
        
        content_widget = QWidget()
        content_layout = QVBoxLayout(content_widget)
        content_layout.setSpacing(16)
        content_layout.setContentsMargins(0, 0, 0, 0)
        
        # Summary cards (mobile-friendly)
        summary_grid = QGridLayout()
        summary_grid.setSpacing(12)
        
        self.sales_card = self.create_mobile_card("Today's Sales", "$0.00", "#14B8A6")
        summary_grid.addWidget(self.sales_card, 0, 0)
        
        self.orders_card = self.create_mobile_card("Orders", "0", "#2F7DFF")
        summary_grid.addWidget(self.orders_card, 0, 1)
        
        self.staff_card = self.create_mobile_card("Staff", "0/0", "#F59E0B")
        summary_grid.addWidget(self.staff_card, 1, 0)
        
        self.alerts_card = self.create_mobile_card("Alerts", "0", "#D92D20")
        summary_grid.addWidget(self.alerts_card, 1, 1)
        
        content_layout.addLayout(summary_grid)
        
        # Quick actions
        actions_label = QLabel("Quick Actions")
        actions_label.setStyleSheet("""
            font-size: 20px;
            font-weight: 600;
            color: #162640;
            padding-top: 16px;
        """)
        content_layout.addWidget(actions_label)
        
        actions_grid = QGridLayout()
        actions_grid.setSpacing(12)
        
        new_order_btn = self.create_action_button("New Order", "💰")
        new_order_btn.clicked.connect(self.handle_new_order)
        actions_grid.addWidget(new_order_btn, 0, 0)
        
        view_orders_btn = self.create_action_button("View Orders", "📋")
        view_orders_btn.clicked.connect(self.handle_view_orders)
        actions_grid.addWidget(view_orders_btn, 0, 1)
        
        inventory_btn = self.create_action_button("Inventory", "📦")
        inventory_btn.clicked.connect(self.handle_inventory)
        actions_grid.addWidget(inventory_btn, 1, 0)
        
        staff_btn = self.create_action_button("Staff", "👤")
        staff_btn.clicked.connect(self.handle_staff)
        actions_grid.addWidget(staff_btn, 1, 1)
        
        content_layout.addLayout(actions_grid)
        
        # Recent orders
        orders_label = QLabel("Recent Orders")
        orders_label.setStyleSheet("""
            font-size: 20px;
            font-weight: 600;
            color: #162640;
            padding-top: 16px;
        """)
        content_layout.addWidget(orders_label)
        
        self.orders_list = QListWidget()
        self.orders_list.setStyleSheet("""
            QListWidget {
                background-color: white;
                border: 1px solid #C8D4E8;
                border-radius: 12px;
                padding: 8px;
            }
            QListWidget::item {
                background-color: white;
                border: 1px solid #EDF3FC;
                border-radius: 8px;
                padding: 12px;
                margin: 4px;
            }
            QListWidget::item:selected {
                background-color: #EFF6FF;
                border: 2px solid #2F7DFF;
            }
        """)
        self.orders_list.setMaximumHeight(300)
        content_layout.addWidget(self.orders_list)
        
        # Store reference to orders_list for later use
        # (it's already stored as self.orders_list, so this is just for clarity)
        
        # API info and settings
        api_section = QFrame()
        api_section.setStyleSheet("""
            QFrame {
                background-color: #F9FAFB;
                border: 1px solid #C8D4E8;
                border-radius: 12px;
                padding: 16px;
            }
        """)
        api_layout = QVBoxLayout(api_section)
        
        api_label = QLabel("📱 Mobile API Server")
        api_label.setStyleSheet("font-size: 16px; font-weight: 600;")
        api_layout.addWidget(api_label)
        
        api_info = QLabel("API URL: http://localhost:5000/api/mobile")
        api_info.setStyleSheet("color: #5D6F8B; font-size: 12px;")
        api_info.setWordWrap(True)
        api_layout.addWidget(api_info)
        
        api_settings_btn = QPushButton("⚙️ API Settings")
        api_settings_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                margin-top: 8px;
            }
        """)
        api_settings_btn.clicked.connect(self.show_api_settings)
        api_layout.addWidget(api_settings_btn)
        
        content_layout.addWidget(api_section)
        
        content_layout.addStretch()
        
        scroll.setWidget(content_widget)
        layout.addWidget(scroll)
    
    def create_mobile_card(self, title: str, value: str, color: str) -> QFrame:
        """Create mobile-friendly summary card"""
        card = QFrame()
        card.setStyleSheet(f"""
            QFrame {{
                background-color: white;
                border: 2px solid {color};
                border-radius: 16px;
                padding: 20px;
            }}
        """)
        card.setMinimumHeight(120)
        
        layout = QVBoxLayout(card)
        layout.setSpacing(8)
        
        title_label = QLabel(title)
        title_label.setStyleSheet("""
            color: #5D6F8B;
            font-size: 14px;
            font-weight: 500;
        """)
        layout.addWidget(title_label)
        
        value_label = QLabel(value)
        value_label.setStyleSheet(f"""
            color: {color};
            font-size: 32px;
            font-weight: 700;
        """)
        layout.addWidget(value_label)
        
        layout.addStretch()
        
        return card
    
    def create_action_button(self, text: str, icon: str) -> QPushButton:
        """Create mobile-friendly action button"""
        btn = QPushButton(f"{icon}\n{text}")
        btn.setMinimumHeight(100)
        btn.setStyleSheet("""
            QPushButton {
                background-color: white;
                border: 2px solid #C8D4E8;
                border-radius: 16px;
                padding: 16px;
                font-size: 16px;
                font-weight: 600;
                color: #162640;
            }
            QPushButton:hover {
                background-color: #F9FAFB;
                border-color: #2F7DFF;
            }
            QPushButton:pressed {
                background-color: #EFF6FF;
            }
        """)
        return btn
    
    @pyqtSlot()
    def load_dashboard_data(self):
        """Load dashboard data"""
        try:
            # Check if widget still exists and is valid
            try:
                if not hasattr(self, 'sales_card') or self.sales_card is None:
                    return
                # Try to access a property to check if widget is still valid
                _ = self.sales_card.isVisible()
            except RuntimeError:
                # Widget deleted, exit early
                return
            except AttributeError:
                # Widget not created yet
                return
                
            from src.utils.dashboard_analytics import (
                get_today_sales, get_today_orders,
                get_active_staff_count, get_inventory_alerts
            )
            
            today_sales = get_today_sales()
            today_orders = get_today_orders()
            active_staff, total_staff = get_active_staff_count()
            alerts = get_inventory_alerts()
            
            # Update cards - check if cards exist and are valid before accessing
            try:
                if hasattr(self, 'sales_card') and self.sales_card:
                    try:
                        sales_labels = self.sales_card.findChildren(QLabel)
                        if len(sales_labels) > 1:
                            sales_labels[1].setText(f"${today_sales:,.2f}")
                    except RuntimeError:
                        pass
            except Exception as e:
                logger.debug(f"Could not update sales card: {e}")
            
            try:
                if hasattr(self, 'orders_card') and self.orders_card:
                    try:
                        orders_labels = self.orders_card.findChildren(QLabel)
                        if len(orders_labels) > 1:
                            orders_labels[1].setText(str(today_orders))
                    except RuntimeError:
                        pass
            except Exception as e:
                logger.debug(f"Could not update orders card: {e}")
            
            try:
                if hasattr(self, 'staff_card') and self.staff_card:
                    try:
                        staff_labels = self.staff_card.findChildren(QLabel)
                        if len(staff_labels) > 1:
                            staff_labels[1].setText(f"{active_staff}/{total_staff}")
                    except RuntimeError:
                        pass
            except Exception as e:
                logger.debug(f"Could not update staff card: {e}")
            
            try:
                if hasattr(self, 'alerts_card') and self.alerts_card:
                    try:
                        alerts_labels = self.alerts_card.findChildren(QLabel)
                        if len(alerts_labels) > 1:
                            alerts_labels[1].setText(str(alerts))
                    except RuntimeError:
                        pass
            except Exception as e:
                logger.debug(f"Could not update alerts card: {e}")
            
            # Load recent orders - only if orders_list exists
            if hasattr(self, 'orders_list') and self.orders_list:
                try:
                    # Check if widget is still valid
                    _ = self.orders_list.isVisible()
                    self.load_recent_orders()
                except RuntimeError:
                    # Widget deleted, ignore
                    pass
                except Exception as e:
                    logger.debug(f"Could not load recent orders: {e}")
            
        except RuntimeError:
            # Widget deleted, ignore completely
            pass
        except Exception as e:
            logger.error(f"Error loading dashboard data: {e}")
    
    def load_recent_orders(self):
        """Load recent orders"""
        try:
            # Check if orders_list exists and is valid
            if not hasattr(self, 'orders_list') or not self.orders_list:
                return
            
            db = get_db_session()
            orders = db.query(Order).order_by(Order.order_datetime.desc()).limit(10).all()
            
            try:
                self.orders_list.clear()
                for order in orders:
                    customer_name = f"{order.customer.first_name} {order.customer.last_name}" if order.customer else "Walk-in"
                    time_str = order.order_datetime.strftime("%H:%M")
                    item_text = f"[{time_str}] {customer_name} - ${order.total_amount:.2f} - {order.order_status}"
                    
                    item = QListWidgetItem(item_text)
                    self.orders_list.addItem(item)
            except RuntimeError:
                # Widget deleted, ignore
                logger.debug("orders_list widget was deleted, skipping")
                return
            
            db.close()
        except RuntimeError:
            # Widget deleted, ignore
            logger.debug("Error accessing orders_list widget (deleted)")
        except Exception as e:
            logger.error(f"Error loading recent orders: {e}")
    
    def showEvent(self, event: QShowEvent):
        """Handle widget show event - load data when first shown"""
        super().showEvent(event)
        # Load dashboard data when widget is first shown (only once)
        if not self._data_loaded and hasattr(self, 'tabs') and self.tabs.currentIndex() == 0:
            QTimer.singleShot(200, self.load_dashboard_data)
            self._data_loaded = True
    
    def on_tab_changed(self, index: int):
        """Handle tab change - load data when dashboard tab is shown"""
        if index == 0:  # Dashboard tab
            # Load data when dashboard tab is shown
            QTimer.singleShot(100, self.load_dashboard_data)
    
    def handle_new_order(self):
        """Handle new order action"""
        self.tabs.setCurrentIndex(1)  # Switch to Orders tab
        self.handle_create_order()
    
    def handle_view_orders(self):
        """Handle view orders action"""
        self.tabs.setCurrentIndex(1)  # Switch to Orders tab
    
    def handle_inventory(self):
        """Handle inventory action"""
        self.tabs.setCurrentIndex(2)  # Switch to Inventory tab
    
    def handle_staff(self):
        """Handle staff action"""
        self.tabs.setCurrentIndex(3)  # Switch to Staff tab
    
    def show_api_settings(self):
        """Show API settings dialog"""
        from src.gui.mobile_api_settings import MobileAPISettingsDialog
        dialog = MobileAPISettingsDialog(self)
        dialog.exec()
    
    def create_orders_tab(self):
        """Create orders management tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(16)
        layout.setContentsMargins(16, 16, 16, 16)
        
        # Header with new order button
        header_layout = QHBoxLayout()
        header_layout.addWidget(QLabel("Orders"))
        header_layout.addStretch()
        
        new_order_btn = QPushButton("➕ New Order")
        new_order_btn.setStyleSheet("""
            QPushButton {
                background-color: #14B8A6;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 10px 16px;
                font-weight: 600;
            }
        """)
        new_order_btn.clicked.connect(self.handle_create_order)
        header_layout.addWidget(new_order_btn)
        
        layout.addLayout(header_layout)
        
        # Orders table
        self.orders_table = QTableWidget()
        self.orders_table.setColumnCount(5)
        self.orders_table.setHorizontalHeaderLabels([
            "Order #", "Customer", "Amount", "Status", "Time"
        ])
        self.orders_table.setStyleSheet("""
            QTableWidget {
                background-color: white;
                border: 1px solid #C8D4E8;
                border-radius: 12px;
                gridline-color: #EDF3FC;
            }
            QHeaderView::section {
                background-color: #F9FAFB;
                padding: 12px;
                border: none;
                border-bottom: 2px solid #C8D4E8;
                font-weight: 600;
                font-size: 14px;
            }
        """)
        self.orders_table.horizontalHeader().setStretchLastSection(True)
        self.orders_table.setAlternatingRowColors(True)
        self.orders_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        layout.addWidget(self.orders_table)
        
        # Load orders
        self.load_orders_table()
        
        return widget
    
    def create_inventory_tab(self):
        """Create inventory management tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(16)
        layout.setContentsMargins(16, 16, 16, 16)
        
        # Header
        header_layout = QHBoxLayout()
        header_layout.addWidget(QLabel("Inventory Alerts"))
        header_layout.addStretch()
        
        refresh_btn = QPushButton("🔄 Refresh")
        refresh_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 8px 16px;
            }
        """)
        refresh_btn.clicked.connect(self.load_inventory_alerts)
        header_layout.addWidget(refresh_btn)
        
        layout.addLayout(header_layout)
        
        # Inventory alerts table
        self.inventory_table = QTableWidget()
        self.inventory_table.setColumnCount(4)
        self.inventory_table.setHorizontalHeaderLabels([
            "Item", "Current Stock", "Reorder Level", "Status"
        ])
        self.inventory_table.setStyleSheet("""
            QTableWidget {
                background-color: white;
                border: 1px solid #C8D4E8;
                border-radius: 12px;
                gridline-color: #EDF3FC;
            }
            QHeaderView::section {
                background-color: #F9FAFB;
                padding: 12px;
                border: none;
                border-bottom: 2px solid #C8D4E8;
                font-weight: 600;
                font-size: 14px;
            }
        """)
        self.inventory_table.horizontalHeader().setStretchLastSection(True)
        self.inventory_table.setAlternatingRowColors(True)
        layout.addWidget(self.inventory_table)
        
        # Load inventory alerts
        self.load_inventory_alerts()
        
        return widget
    
    def create_staff_tab(self):
        """Create staff management tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(16)
        layout.setContentsMargins(16, 16, 16, 16)
        
        # Clock in/out section
        clock_section = QFrame()
        clock_section.setStyleSheet("""
            QFrame {
                background-color: white;
                border: 2px solid #C8D4E8;
                border-radius: 12px;
                padding: 16px;
            }
        """)
        clock_layout = QVBoxLayout(clock_section)
        
        clock_label = QLabel("Clock In/Out")
        clock_label.setStyleSheet("font-size: 18px; font-weight: 600;")
        clock_layout.addWidget(clock_label)
        
        buttons_layout = QHBoxLayout()
        
        clock_in_btn = QPushButton("⏰ Clock In")
        clock_in_btn.setStyleSheet("""
            QPushButton {
                background-color: #14B8A6;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 12px 20px;
                font-size: 16px;
                font-weight: 600;
            }
        """)
        clock_in_btn.clicked.connect(self.handle_clock_in)
        buttons_layout.addWidget(clock_in_btn)
        
        clock_out_btn = QPushButton("⏰ Clock Out")
        clock_out_btn.setStyleSheet("""
            QPushButton {
                background-color: #D92D20;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 12px 20px;
                font-size: 16px;
                font-weight: 600;
            }
        """)
        clock_out_btn.clicked.connect(self.handle_clock_out)
        buttons_layout.addWidget(clock_out_btn)
        
        clock_layout.addLayout(buttons_layout)
        layout.addWidget(clock_section)
        
        # Today's attendance
        attendance_label = QLabel("Today's Attendance")
        attendance_label.setStyleSheet("font-size: 18px; font-weight: 600; padding-top: 16px;")
        layout.addWidget(attendance_label)
        
        self.attendance_table = QTableWidget()
        self.attendance_table.setColumnCount(4)
        self.attendance_table.setHorizontalHeaderLabels([
            "Staff", "Clock In", "Clock Out", "Hours"
        ])
        self.attendance_table.setStyleSheet("""
            QTableWidget {
                background-color: white;
                border: 1px solid #C8D4E8;
                border-radius: 12px;
                gridline-color: #EDF3FC;
            }
            QHeaderView::section {
                background-color: #F9FAFB;
                padding: 12px;
                border: none;
                border-bottom: 2px solid #C8D4E8;
                font-weight: 600;
                font-size: 14px;
            }
        """)
        self.attendance_table.horizontalHeader().setStretchLastSection(True)
        self.attendance_table.setAlternatingRowColors(True)
        layout.addWidget(self.attendance_table)
        
        # Load attendance
        self.load_today_attendance()
        
        return widget
    
    def load_orders_table(self):
        """Load orders into table"""
        try:
            db = get_db_session()
            orders = db.query(Order).order_by(Order.order_datetime.desc()).limit(50).all()
            
            self.orders_table.setRowCount(len(orders))
            for row, order in enumerate(orders):
                self.orders_table.setItem(row, 0, QTableWidgetItem(f"ORD{order.order_id:06d}"))
                
                customer_name = f"{order.customer.first_name} {order.customer.last_name}" if order.customer else "Walk-in"
                self.orders_table.setItem(row, 1, QTableWidgetItem(customer_name))
                
                self.orders_table.setItem(row, 2, QTableWidgetItem(f"${order.total_amount:.2f}"))
                
                status_item = QTableWidgetItem(order.order_status)
                if order.order_status == 'completed':
                    status_item.setForeground(QColor("#14B8A6"))
                elif order.order_status == 'pending':
                    status_item.setForeground(QColor("#F59E0B"))
                self.orders_table.setItem(row, 3, status_item)
                
                time_str = order.order_datetime.strftime("%H:%M")
                self.orders_table.setItem(row, 4, QTableWidgetItem(time_str))
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading orders: {e}")
    
    def load_inventory_alerts(self):
        """Load inventory alerts"""
        try:
            db = get_db_session()
            low_stock = db.query(Inventory).filter(
                Inventory.quantity <= Inventory.reorder_level,
                Inventory.status == 'active'
            ).all()
            
            self.inventory_table.setRowCount(len(low_stock))
            for row, inv in enumerate(low_stock):
                self.inventory_table.setItem(row, 0, QTableWidgetItem(inv.ingredient.name))
                self.inventory_table.setItem(row, 1, QTableWidgetItem(f"{inv.quantity} {inv.unit}"))
                self.inventory_table.setItem(row, 2, QTableWidgetItem(f"{inv.reorder_level} {inv.unit}"))
                
                status_item = QTableWidgetItem("Low Stock")
                status_item.setForeground(QColor("#D92D20"))
                self.inventory_table.setItem(row, 3, status_item)
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading inventory alerts: {e}")
    
    def load_today_attendance(self):
        """Load today's attendance"""
        try:
            from src.database.models import Attendance
            db = get_db_session()
            
            today = datetime.now().date()
            attendance_records = db.query(Attendance).filter(
                Attendance.attendance_date == today
            ).all()
            
            self.attendance_table.setRowCount(len(attendance_records))
            for row, att in enumerate(attendance_records):
                staff_name = f"{att.staff.first_name} {att.staff.last_name}" if att.staff else "Unknown"
                self.attendance_table.setItem(row, 0, QTableWidgetItem(staff_name))
                
                clock_in = att.clock_in.strftime("%H:%M") if att.clock_in else "-"
                self.attendance_table.setItem(row, 1, QTableWidgetItem(clock_in))
                
                clock_out = att.clock_out.strftime("%H:%M") if att.clock_out else "-"
                self.attendance_table.setItem(row, 2, QTableWidgetItem(clock_out))
                
                hours = f"{att.total_hours:.1f}h" if att.total_hours else "-"
                self.attendance_table.setItem(row, 3, QTableWidgetItem(hours))
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading attendance: {e}")
    
    def handle_create_order(self):
        """Handle create new order"""
        dialog = CreateOrderDialog(self.user_id, self)
        if dialog.exec():
            self.load_orders_table()
            self.load_dashboard_data()
    
    def handle_clock_in(self):
        """Handle clock in"""
        try:
            from src.database.models import Attendance
            db = get_db_session()
            
            now = datetime.now()
            today = now.date()
            attendance = db.query(Attendance).filter(
                Attendance.staff_id == self.user_id,
                Attendance.attendance_date == today
            ).first()
            
            if attendance and attendance.clock_in:
                QMessageBox.warning(self, "Already Clocked In", "You have already clocked in today")
                db.close()
                return
            
            if not attendance:
                attendance = Attendance(
                    staff_id=self.user_id,
                    attendance_date=today,
                    clock_in=now,
                    status='present'
                )
                db.add(attendance)
            else:
                attendance.clock_in = now
                attendance.status = 'present'
            
            db.commit()
            db.close()
            
            QMessageBox.information(self, "Success", "Clocked in successfully")
            self.load_today_attendance()
            self.load_dashboard_data()
            
        except Exception as e:
            logger.error(f"Error clocking in: {e}")
            QMessageBox.critical(self, "Error", f"Failed to clock in: {str(e)}")
    
    def handle_clock_out(self):
        """Handle clock out"""
        try:
            from src.database.models import Attendance
            db = get_db_session()
            
            now = datetime.now()
            today = now.date()
            attendance = db.query(Attendance).filter(
                Attendance.staff_id == self.user_id,
                Attendance.attendance_date == today
            ).first()
            
            if not attendance or not attendance.clock_in:
                QMessageBox.warning(self, "Not Clocked In", "You need to clock in first")
                db.close()
                return
            
            if attendance.clock_out:
                QMessageBox.warning(self, "Already Clocked Out", "You have already clocked out today")
                db.close()
                return
            
            clock_out_dt = now
            attendance.clock_out = clock_out_dt
            
            # Calculate total hours using stored datetimes
            if attendance.clock_in:
                total_hours = (clock_out_dt - attendance.clock_in).total_seconds() / 3600
                attendance.total_hours = max(total_hours, 0)
            
            db.commit()
            db.close()
            
            QMessageBox.information(self, "Success", f"Clocked out successfully. Total hours: {total_hours:.1f}")
            self.load_today_attendance()
            self.load_dashboard_data()
            
        except Exception as e:
            logger.error(f"Error clocking out: {e}")
            QMessageBox.critical(self, "Error", f"Failed to clock out: {str(e)}")


class CreateOrderDialog(QDialog):
    """Dialog for creating order from mobile"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setWindowTitle("Create New Order")
        self.setMinimumSize(400, 500)
        self.setup_ui()
    
    def setup_ui(self):
        """Setup create order dialog"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(20, 20, 20, 20)
        
        form = QFormLayout()
        
        # Customer selection
        self.customer_combo = QComboBox()
        self.load_customers()
        self.customer_combo.addItem("Walk-in Customer", None)
        form.addRow("Customer:", self.customer_combo)
        
        # Order type
        self.order_type_combo = QComboBox()
        self.order_type_combo.addItems(["dine-in", "takeaway", "delivery"])
        form.addRow("Order Type:", self.order_type_combo)
        
        # Products
        self.products_combo = QComboBox()
        self.load_products()
        form.addRow("Product:", self.products_combo)
        
        # Quantity
        self.quantity_spin = QSpinBox()
        self.quantity_spin.setMinimum(1)
        self.quantity_spin.setMaximum(100)
        self.quantity_spin.setValue(1)
        form.addRow("Quantity:", self.quantity_spin)
        
        layout.addLayout(form)
        
        # Items list
        items_label = QLabel("Order Items:")
        items_label.setStyleSheet("font-weight: 600;")
        layout.addWidget(items_label)
        
        self.items_list = QListWidget()
        self.items_list.setMaximumHeight(150)
        layout.addWidget(self.items_list)
        
        # Add item button
        add_item_btn = QPushButton("➕ Add Item")
        add_item_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
            }
        """)
        add_item_btn.clicked.connect(self.add_item)
        layout.addWidget(add_item_btn)
        
        # Total
        self.total_label = QLabel("Total: $0.00")
        self.total_label.setStyleSheet("font-size: 18px; font-weight: 600; color: #14B8A6;")
        layout.addWidget(self.total_label)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        create_btn = QPushButton("Create Order")
        create_btn.setStyleSheet("""
            QPushButton {
                background-color: #14B8A6;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-weight: 600;
            }
        """)
        create_btn.clicked.connect(self.create_order)
        buttons_layout.addWidget(create_btn)
        
        layout.addLayout(buttons_layout)
        
        self.order_items = []
    
    def load_customers(self):
        """Load customers"""
        try:
            db = get_db_session()
            customers = db.query(Customer).filter(Customer.status == 'active').all()
            
            for customer in customers:
                self.customer_combo.addItem(
                    f"{customer.first_name} {customer.last_name}",
                    customer.customer_id
                )
            db.close()
        except Exception as e:
            logger.error(f"Error loading customers: {e}")
    
    def load_products(self):
        """Load products"""
        try:
            db = get_db_session()
            products = db.query(Product).filter(Product.is_active == True).all()
            
            for product in products:
                self.products_combo.addItem(
                    f"{product.name} - ${product.price:.2f}",
                    product.product_id
                )
            db.close()
        except Exception as e:
            logger.error(f"Error loading products: {e}")
    
    def add_item(self):
        """Add item to order"""
        product_id = self.products_combo.currentData()
        quantity = self.quantity_spin.value()
        
        if not product_id:
            return
        
        try:
            db = get_db_session()
            product = db.query(Product).filter(Product.product_id == product_id).first()
            db.close()
            
            if product:
                item = {
                    'product_id': product_id,
                    'product_name': product.name,
                    'quantity': quantity,
                    'price': product.price,
                    'total': product.price * quantity
                }
                self.order_items.append(item)
                
                item_text = f"{product.name} x{quantity} - ${item['total']:.2f}"
                self.items_list.addItem(item_text)
                
                self.update_total()
        except Exception as e:
            logger.error(f"Error adding item: {e}")
    
    def update_total(self):
        """Update total amount"""
        total = sum(item['total'] for item in self.order_items)
        self.total_label.setText(f"Total: ${total:.2f}")
    
    def create_order(self):
        """Create the order"""
        if not self.order_items:
            QMessageBox.warning(self, "No Items", "Please add at least one item to the order")
            return
        
        try:
            db = get_db_session()
            
            customer_id = self.customer_combo.currentData()
            total_amount = sum(item['total'] for item in self.order_items)
            
            order = Order(
                customer_id=customer_id,
                staff_id=self.user_id,
                order_type=self.order_type_combo.currentText(),
                order_status='pending',
                order_datetime=datetime.now(),
                total_amount=total_amount,
                payment_method='cash'
            )
            db.add(order)
            db.flush()
            
            # Add order items
            for item in self.order_items:
                order_item = OrderItem(
                    order_id=order.order_id,
                    product_id=item['product_id'],
                    quantity=item['quantity'],
                    unit_price=item['price'],
                    total_price=item['total']
                )
                db.add(order_item)
            
            db.commit()
            db.close()
            
            QMessageBox.information(self, "Success", f"Order created successfully! Order #: ORD{order.order_id:06d}")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error creating order: {e}")
            QMessageBox.critical(self, "Error", f"Failed to create order: {str(e)}")

