"""
Customer Loyalty Management - Loyalty programs, coupons, and customer segmentation
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QTabWidget, QDialog,
    QComboBox, QDateEdit, QMessageBox, QFormLayout, QDoubleSpinBox,
    QLineEdit, QSpinBox, QTextEdit, QCheckBox
)
from PyQt6.QtCore import Qt, QDate
from PyQt6.QtGui import QColor
from loguru import logger
from datetime import date
from src.database.connection import get_db_session
from src.database.models import (
    LoyaltyProgram, Coupon, Customer, CustomerFeedback, Order
)
from src.utils.email_marketing import get_email_marketing
from src.utils.sms_marketing import get_sms_marketing
from src.gui.table_utils import enable_table_auto_resize


class CustomerLoyaltyView(QWidget):
    """Customer Loyalty Management View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        self.load_data()
    
    def setup_ui(self):
        """Setup customer loyalty UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        
        title = QLabel("Customer Loyalty & Marketing")
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
        
        # Loyalty Programs tab
        self.loyalty_tab = self.create_loyalty_programs_tab()
        self.tabs.addTab(self.loyalty_tab, "Loyalty Programs")
        
        # Coupons tab
        self.coupons_tab = self.create_coupons_tab()
        self.tabs.addTab(self.coupons_tab, "Coupons")
        
        # Customer Segmentation tab
        self.segmentation_tab = self.create_segmentation_tab()
        self.tabs.addTab(self.segmentation_tab, "Customer Segmentation")
        
        # Feedback tab
        self.feedback_tab = self.create_feedback_tab()
        self.tabs.addTab(self.feedback_tab, "Customer Feedback")
        
        # Marketing tab
        self.marketing_tab = self.create_marketing_tab()
        self.tabs.addTab(self.marketing_tab, "Email & SMS Marketing")
        
        layout.addWidget(self.tabs)
    
    def create_loyalty_programs_tab(self):
        """Create loyalty programs tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(16)
        layout.setContentsMargins(16, 16, 16, 16)
        
        # Header
        header = QHBoxLayout()
        header.addWidget(QLabel("Loyalty Programs"))
        header.addStretch()
        
        add_btn = QPushButton("Add Program")
        add_btn.setStyleSheet(self.get_button_style())
        add_btn.clicked.connect(self.handle_add_loyalty_program)
        header.addWidget(add_btn)
        
        layout.addLayout(header)
        
        # Programs table
        self.loyalty_table = QTableWidget()
        self.loyalty_table.setColumnCount(5)
        self.loyalty_table.setHorizontalHeaderLabels([
            "Program Name", "Points per $", "Start Date", "End Date", "Status"
        ])
        self.loyalty_table.setStyleSheet(self.get_table_style())
        enable_table_auto_resize(self.loyalty_table)
        layout.addWidget(self.loyalty_table)
        
        return widget
    
    def create_coupons_tab(self):
        """Create coupons tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(16)
        layout.setContentsMargins(16, 16, 16, 16)
        
        # Header
        header = QHBoxLayout()
        header.addWidget(QLabel("Coupons"))
        header.addStretch()
        
        add_btn = QPushButton("Add Coupon")
        add_btn.setStyleSheet(self.get_button_style())
        add_btn.clicked.connect(self.handle_add_coupon)
        header.addWidget(add_btn)
        
        layout.addLayout(header)
        
        # Coupons table
        self.coupons_table = QTableWidget()
        self.coupons_table.setColumnCount(7)
        self.coupons_table.setHorizontalHeaderLabels([
            "Code", "Name", "Discount", "Min Purchase", "Usage", "Valid Until", "Status"
        ])
        self.coupons_table.setStyleSheet(self.get_table_style())
        enable_table_auto_resize(self.coupons_table)
        layout.addWidget(self.coupons_table)
        
        return widget
    
    def create_segmentation_tab(self):
        """Create customer segmentation tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(16)
        layout.setContentsMargins(16, 16, 16, 16)
        
        # Segmentation info
        info_label = QLabel("Customer Segmentation")
        info_label.setStyleSheet("font-weight: 600; font-size: 16px;")
        layout.addWidget(info_label)
        
        desc_label = QLabel(
            "Customers are automatically segmented based on:\n"
            "- Purchase frequency\n"
            "- Total spending\n"
            "- Loyalty points\n"
            "- Last visit date"
        )
        desc_label.setStyleSheet("color: #5D6F8B; font-size: 14px;")
        layout.addWidget(desc_label)
        layout.addSpacing(16)
        
        # Segmentation table
        self.segmentation_table = QTableWidget()
        self.segmentation_table.setColumnCount(5)
        self.segmentation_table.setHorizontalHeaderLabels([
            "Segment", "Customer Count", "Avg Spending", "Avg Visits", "Total Revenue"
        ])
        self.segmentation_table.setStyleSheet(self.get_table_style())
        enable_table_auto_resize(self.segmentation_table)
        layout.addWidget(self.segmentation_table)
        
        return widget
    
    def create_feedback_tab(self):
        """Create customer feedback tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(16)
        layout.setContentsMargins(16, 16, 16, 16)
        
        # Header
        header = QHBoxLayout()
        header.addWidget(QLabel("Customer Feedback"))
        header.addStretch()
        
        layout.addLayout(header)
        
        # Feedback table
        self.feedback_table = QTableWidget()
        self.feedback_table.setColumnCount(6)
        self.feedback_table.setHorizontalHeaderLabels([
            "Date", "Customer", "Order #", "Rating", "Sentiment", "Feedback"
        ])
        self.feedback_table.setStyleSheet(self.get_table_style())
        enable_table_auto_resize(self.feedback_table)
        layout.addWidget(self.feedback_table)
        
        return widget
    
    def create_marketing_tab(self):
        """Create email & SMS marketing tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(16)
        layout.setContentsMargins(16, 16, 16, 16)
        
        # Email Marketing section
        email_group = QLabel("Email Marketing")
        email_group.setStyleSheet("font-weight: 600; font-size: 16px;")
        layout.addWidget(email_group)
        
        email_layout = QHBoxLayout()
        send_email_btn = QPushButton("Send Promotional Email")
        send_email_btn.setStyleSheet(self.get_button_style())
        send_email_btn.clicked.connect(self.handle_send_email_campaign)
        email_layout.addWidget(send_email_btn)
        email_layout.addStretch()
        layout.addLayout(email_layout)
        
        layout.addSpacing(16)
        
        # SMS Marketing section
        sms_group = QLabel("SMS Marketing")
        sms_group.setStyleSheet("font-weight: 600; font-size: 16px;")
        layout.addWidget(sms_group)
        
        sms_layout = QHBoxLayout()
        send_sms_btn = QPushButton("Send Promotional SMS")
        send_sms_btn.setStyleSheet(self.get_button_style())
        send_sms_btn.clicked.connect(self.handle_send_sms_campaign)
        sms_layout.addWidget(send_sms_btn)
        sms_layout.addStretch()
        layout.addLayout(sms_layout)
        
        layout.addStretch()
        
        return widget
    
    def handle_send_email_campaign(self):
        """Handle send email campaign"""
        from src.gui.marketing_campaign_dialog import MarketingCampaignDialog
        dialog = MarketingCampaignDialog(self.user_id, "email", self)
        dialog.exec()
    
    def handle_send_sms_campaign(self):
        """Handle send SMS campaign"""
        from src.gui.marketing_campaign_dialog import MarketingCampaignDialog
        dialog = MarketingCampaignDialog(self.user_id, "sms", self)
        dialog.exec()
    
    def load_data(self):
        """Load all loyalty data"""
        self.load_loyalty_programs()
        self.load_coupons()
        self.load_segmentation()
        self.load_feedback()
    
    def load_loyalty_programs(self):
        """Load loyalty programs"""
        try:
            db = get_db_session()
            programs = db.query(LoyaltyProgram).all()
            
            self.loyalty_table.setRowCount(len(programs))
            for row, program in enumerate(programs):
                self.loyalty_table.setItem(row, 0, QTableWidgetItem(program.program_name))
                self.loyalty_table.setItem(row, 1, QTableWidgetItem(f"{program.points_per_currency:.2f}"))
                self.loyalty_table.setItem(row, 2, QTableWidgetItem(program.start_date.strftime("%Y-%m-%d")))
                end_date = program.end_date.strftime("%Y-%m-%d") if program.end_date else "No end date"
                self.loyalty_table.setItem(row, 3, QTableWidgetItem(end_date))
                status_item = QTableWidgetItem("Active" if program.is_active else "Inactive")
                self.loyalty_table.setItem(row, 4, status_item)
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading loyalty programs: {e}")
    
    def load_coupons(self):
        """Load coupons"""
        try:
            db = get_db_session()
            coupons = db.query(Coupon).all()
            
            self.coupons_table.setRowCount(len(coupons))
            for row, coupon in enumerate(coupons):
                self.coupons_table.setItem(row, 0, QTableWidgetItem(coupon.coupon_code))
                self.coupons_table.setItem(row, 1, QTableWidgetItem(coupon.coupon_name))
                
                discount_str = f"{coupon.discount_value}%"
                if coupon.discount_type == "fixed":
                    discount_str = f"${coupon.discount_value:.2f}"
                self.coupons_table.setItem(row, 2, QTableWidgetItem(discount_str))
                
                min_purchase = f"${coupon.min_purchase_amount:.2f}" if coupon.min_purchase_amount else "None"
                self.coupons_table.setItem(row, 3, QTableWidgetItem(min_purchase))
                self.coupons_table.setItem(row, 4, QTableWidgetItem(f"{coupon.usage_count}/{coupon.usage_limit or '∞'}"))
                end_date = coupon.end_date.strftime("%Y-%m-%d") if coupon.end_date else "No end date"
                self.coupons_table.setItem(row, 5, QTableWidgetItem(end_date))
                status_item = QTableWidgetItem("Active" if coupon.is_active else "Inactive")
                self.coupons_table.setItem(row, 6, status_item)
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading coupons: {e}")
    
    def load_segmentation(self):
        """Load customer segmentation"""
        try:
            db = get_db_session()
            
            # Get all customers with their order data
            customers = db.query(Customer).all()
            
            segments = {
                "VIP (High Spenders)": {"count": 0, "total_spending": 0.0, "total_visits": 0},
                "Regular (Frequent)": {"count": 0, "total_spending": 0.0, "total_visits": 0},
                "Occasional": {"count": 0, "total_spending": 0.0, "total_visits": 0},
                "New/Inactive": {"count": 0, "total_spending": 0.0, "total_visits": 0}
            }
            
            for customer in customers:
                orders = db.query(Order).filter(Order.customer_id == customer.customer_id).all()
                total_spending = sum(o.total_amount for o in orders)
                visit_count = len(orders)
                
                # Simple segmentation logic
                if total_spending > 1000 or customer.loyalty_points > 500:
                    segment = "VIP (High Spenders)"
                elif visit_count > 10:
                    segment = "Regular (Frequent)"
                elif visit_count > 0:
                    segment = "Occasional"
                else:
                    segment = "New/Inactive"
                
                segments[segment]["count"] += 1
                segments[segment]["total_spending"] += total_spending
                segments[segment]["total_visits"] += visit_count
            
            # Display in table
            self.segmentation_table.setRowCount(len(segments))
            for row, (segment_name, data) in enumerate(segments.items()):
                self.segmentation_table.setItem(row, 0, QTableWidgetItem(segment_name))
                self.segmentation_table.setItem(row, 1, QTableWidgetItem(str(data["count"])))
                
                avg_spending = data["total_spending"] / data["count"] if data["count"] > 0 else 0
                self.segmentation_table.setItem(row, 2, QTableWidgetItem(f"${avg_spending:.2f}"))
                
                avg_visits = data["total_visits"] / data["count"] if data["count"] > 0 else 0
                self.segmentation_table.setItem(row, 3, QTableWidgetItem(f"{avg_visits:.1f}"))
                
                self.segmentation_table.setItem(row, 4, QTableWidgetItem(f"${data['total_spending']:.2f}"))
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading segmentation: {e}")
    
    def load_feedback(self):
        """Load customer feedback"""
        try:
            db = get_db_session()
            feedback_list = db.query(CustomerFeedback).order_by(
                CustomerFeedback.feedback_date.desc()
            ).limit(100).all()
            
            self.feedback_table.setRowCount(len(feedback_list))
            for row, feedback in enumerate(feedback_list):
                self.feedback_table.setItem(row, 0, QTableWidgetItem(
                    feedback.feedback_date.strftime("%Y-%m-%d %H:%M")
                ))
                
                customer_name = "Anonymous"
                if feedback.customer:
                    customer_name = f"{feedback.customer.first_name} {feedback.customer.last_name}"
                self.feedback_table.setItem(row, 1, QTableWidgetItem(customer_name))
                
                order_num = f"#{feedback.order_id}" if feedback.order_id else "-"
                self.feedback_table.setItem(row, 2, QTableWidgetItem(order_num))
                
                rating = "⭐" * (feedback.rating or 0) if feedback.rating else "-"
                self.feedback_table.setItem(row, 3, QTableWidgetItem(rating))
                
                sentiment_item = QTableWidgetItem(feedback.sentiment or "-")
                if feedback.sentiment == "positive":
                    sentiment_item.setForeground(QColor("#14B8A6"))
                elif feedback.sentiment == "negative":
                    sentiment_item.setForeground(QColor("#D92D20"))
                self.feedback_table.setItem(row, 4, sentiment_item)
                
                feedback_text = (feedback.feedback_text or "")[:50] + "..." if feedback.feedback_text and len(feedback.feedback_text) > 50 else (feedback.feedback_text or "-")
                self.feedback_table.setItem(row, 5, QTableWidgetItem(feedback_text))
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading feedback: {e}")
    
    def handle_add_loyalty_program(self):
        """Handle add loyalty program"""
        from src.gui.add_loyalty_program_dialog import AddLoyaltyProgramDialog
        dialog = AddLoyaltyProgramDialog(self.user_id, self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            self.load_loyalty_programs()  # Refresh the list
    
    def handle_add_coupon(self):
        """Handle add coupon"""
        from src.gui.add_coupon_dialog import AddCouponDialog
        dialog = AddCouponDialog(self.user_id, self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            self.load_coupons()  # Refresh the list
    
    def get_button_style(self):
        """Get standard button style"""
        return """
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-size: 14px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #1D66EA;
            }
        """
    
    def get_table_style(self):
        """Get standard table style"""
        return """
            QTableWidget {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                background-color: white;
                gridline-color: #EDF3FC;
            }
            QTableWidget::item {
                padding: 8px;
            }
            QHeaderView::section {
                background-color: #F9FAFB;
                padding: 10px;
                border: none;
                border-bottom: 2px solid #C8D4E8;
                font-weight: 600;
            }
        """

