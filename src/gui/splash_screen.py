"""
Splash screen with update checking
"""
from PyQt6.QtWidgets import (
    QSplashScreen, QWidget, QVBoxLayout, QLabel, 
    QProgressBar, QPushButton, QHBoxLayout, QFrame
)
from PyQt6.QtCore import Qt, QTimer, pyqtSignal, QThread
from PyQt6.QtGui import QPixmap, QFont, QPainter, QColor
from typing import Optional, Dict, Any
from loguru import logger
from src.utils.update_checker import UpdateChecker
from src.config.settings import get_settings


class UpdateCheckThread(QThread):
    """Background thread for checking updates"""
    update_available = pyqtSignal(dict)
    check_complete = pyqtSignal()
    
    def __init__(self, repo_owner: str, repo_name: str, current_version: str):
        super().__init__()
        self.repo_owner = repo_owner
        self.repo_name = repo_name
        self.current_version = current_version
        self.update_checker: Optional[UpdateChecker] = None
    
    def run(self):
        """Run update check"""
        try:
            self.update_checker = UpdateChecker(
                self.repo_owner,
                self.repo_name,
                self.current_version
            )
            update_info = self.update_checker.check_for_updates()
            if update_info:
                self.update_available.emit(update_info)
        except Exception as e:
            logger.error(f"Error in update check thread: {e}")
        finally:
            self.check_complete.emit()


class UpdateNotificationModule(QFrame):
    """Update notification module overlay for splash screen"""
    install_now_clicked = pyqtSignal()
    install_later_clicked = pyqtSignal()
    
    def __init__(self, update_info: Dict[str, Any], parent=None):
        super().__init__(parent)
        self.update_info = update_info
        self.setup_ui()
    
    def setup_ui(self):
        """Setup update notification UI"""
        self.setFixedSize(400, 300)
        self.setStyleSheet("""
            QFrame {
                background-color: white;
                border: 1px solid #E5E7EB;
                border-radius: 8px;
            }
        """)
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(16)
        
        # Header
        header_label = QLabel("🔄 New Update Available")
        header_font = QFont()
        header_font.setPointSize(18)
        header_font.setBold(True)
        header_label.setFont(header_font)
        header_label.setStyleSheet("color: #374151;")
        layout.addWidget(header_label)
        
        # Version info
        version_layout = QVBoxLayout()
        version_layout.setSpacing(8)
        
        current_label = QLabel(f"Current version: v{self.update_info.get('current_version', 'N/A')}")
        current_label.setStyleSheet("color: #6B7280; font-size: 14px;")
        version_layout.addWidget(current_label)
        
        new_label = QLabel(f"New version: v{self.update_info.get('latest_version', 'N/A')}")
        new_font = QFont()
        new_font.setBold(True)
        new_label.setFont(new_font)
        new_label.setStyleSheet("color: #2563EB; font-size: 14px;")
        version_layout.addWidget(new_label)
        
        layout.addLayout(version_layout)
        
        # Description
        description = self.update_info.get('body', 'Bug fixes and improvements')
        # Get first paragraph or truncate
        description_lines = description.split('\n')
        brief_description = description_lines[0][:100] if description_lines else "Bug fixes and improvements"
        
        desc_label = QLabel(brief_description)
        desc_label.setWordWrap(True)
        desc_label.setStyleSheet("color: #374151; font-size: 12px;")
        desc_label.setMaximumHeight(80)
        layout.addWidget(desc_label)
        
        layout.addStretch()
        
        # Buttons
        button_layout = QHBoxLayout()
        button_layout.setSpacing(8)
        
        install_later_btn = QPushButton("Install Later")
        install_later_btn.setStyleSheet("""
            QPushButton {
                background-color: transparent;
                border: 1px solid #E5E7EB;
                color: #374151;
                padding: 12px 24px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #F3F4F6;
            }
        """)
        install_later_btn.clicked.connect(self.install_later_clicked.emit)
        button_layout.addWidget(install_later_btn)
        
        install_now_btn = QPushButton("Install Now")
        install_now_btn.setStyleSheet("""
            QPushButton {
                background-color: #2563EB;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #3B82F6;
            }
            QPushButton:pressed {
                background-color: #1D4ED8;
            }
        """)
        install_now_btn.clicked.connect(self.install_now_clicked.emit)
        button_layout.addWidget(install_now_btn)
        
        layout.addLayout(button_layout)


class SplashScreen(QSplashScreen):
    """Splash screen with update checking"""
    
    def __init__(self, app_name: str, app_version: str, app_icon: Optional[QPixmap] = None):
        """
        Initialize splash screen
        
        Args:
            app_name: Application name (e.g., "Sphincs ERP")
            app_version: Application version (e.g., "1.2.3")
            app_icon: Application icon pixmap
        """
        # Create pixmap for splash screen
        pixmap = QPixmap(600, 400)
        pixmap.fill(QColor(255, 255, 255))
        
        super().__init__(pixmap)
        
        self.app_name = app_name
        self.app_version = app_version
        self.app_icon = app_icon
        self.update_module: Optional[UpdateNotificationModule] = None
        self.update_check_thread: Optional[UpdateCheckThread] = None
        self.update_available = False
        
        self.setup_ui()
        self.setup_update_check()
    
    def setup_ui(self):
        """Setup splash screen UI"""
        # Create a new pixmap to avoid painting on active device
        pixmap = QPixmap(600, 400)
        pixmap.fill(QColor(255, 255, 255))
        
        painter = QPainter(pixmap)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        # Draw background (white)
        painter.fillRect(pixmap.rect(), QColor(255, 255, 255))
        
        # Draw logo area (if icon provided)
        if self.app_icon:
            icon_rect = self.app_icon.rect()
            icon_x = (pixmap.width() - icon_rect.width()) // 2
            icon_y = 32
            painter.drawPixmap(icon_x, icon_y, self.app_icon)
            text_y = icon_y + icon_rect.height() + 16
        else:
            # Draw text logo if no icon
            painter.setPen(QColor(37, 99, 235))  # Primary blue
            font = QFont("Segoe UI", 32, QFont.Weight.Bold)
            painter.setFont(font)
            text_rect = painter.fontMetrics().boundingRect(self.app_name)
            text_x = (pixmap.width() - text_rect.width()) // 2
            text_y = 80
            painter.drawText(text_x, text_y, self.app_name)
            text_y += 40
        
        # Draw app name
        painter.setPen(QColor(37, 99, 235))  # Primary blue
        font = QFont("Segoe UI", 24, QFont.Weight.DemiBold)
        painter.setFont(font)
        name_rect = painter.fontMetrics().boundingRect(self.app_name)
        name_x = (pixmap.width() - name_rect.width()) // 2
        painter.drawText(name_x, text_y, self.app_name)
        
        # Draw version
        painter.setPen(QColor(107, 114, 128))  # Medium gray
        font = QFont("Segoe UI", 14)
        painter.setFont(font)
        version_text = f"Version {self.app_version}"
        version_rect = painter.fontMetrics().boundingRect(version_text)
        version_x = (pixmap.width() - version_rect.width()) // 2
        painter.drawText(version_x, text_y + 30, version_text)
        
        # Draw loading indicator area (will be animated)
        if not hasattr(self, 'status_text'):
            self.status_text = "Initializing..."
        painter.setPen(QColor(107, 114, 128))
        font = QFont("Segoe UI", 12)
        painter.setFont(font)
        status_rect = painter.fontMetrics().boundingRect(self.status_text)
        status_x = (pixmap.width() - status_rect.width()) // 2
        painter.drawText(status_x, pixmap.height() - 50, self.status_text)
        
        painter.end()
        
        # Set the new pixmap
        self.setPixmap(pixmap)
    
    def setup_update_check(self):
        """Setup update checking"""
        settings = get_settings()
        
        if not settings.get_bool('Updates', 'enabled', True):
            logger.info("Update checking is disabled")
            return
        
        if not settings.get_bool('Updates', 'check_on_startup', True):
            logger.info("Update check on startup is disabled")
            return
        
        # GitHub repository is hardcoded in the application
        repo_owner = 'cowebsLB'
        repo_name = 'sphincs-ERP-POS'
        
        # Start update check in background thread
        self.update_check_thread = UpdateCheckThread(
            repo_owner,
            repo_name,
            self.app_version
        )
        self.update_check_thread.update_available.connect(self.on_update_available)
        self.update_check_thread.check_complete.connect(self.on_update_check_complete)
        self.update_check_thread.start()
        
        self.update_status("Checking for updates...")
    
    def update_status(self, text: str):
        """Update status text"""
        self.status_text = text
        # Redraw splash screen with new status
        self._redraw_splash()
    
    def _redraw_splash(self):
        """Redraw splash screen with current status"""
        # Get current pixmap
        pixmap = self.pixmap()
        if pixmap.isNull():
            return
        
        # Create a copy to modify
        new_pixmap = pixmap.copy()
        painter = QPainter(new_pixmap)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        # Clear status area (bottom section)
        painter.fillRect(0, new_pixmap.height() - 80, new_pixmap.width(), 80, QColor(255, 255, 255))
        
        # Draw new status text
        painter.setPen(QColor(107, 114, 128))
        font = QFont("Segoe UI", 12)
        painter.setFont(font)
        status_rect = painter.fontMetrics().boundingRect(self.status_text)
        status_x = (new_pixmap.width() - status_rect.width()) // 2
        painter.drawText(status_x, new_pixmap.height() - 50, self.status_text)
        
        painter.end()
        
        # Update pixmap
        self.setPixmap(new_pixmap)
    
    def on_update_available(self, update_info: Dict[str, Any]):
        """Handle update available signal"""
        logger.info(f"Update available: {update_info.get('latest_version')}")
        self.update_available = True
        self.show_update_module(update_info)
    
    def on_update_check_complete(self):
        """Handle update check complete"""
        if not self.update_available:
            self.update_status("Ready!")
    
    def show_update_module(self, update_info: Dict[str, Any]):
        """Show update notification module"""
        self.update_module = UpdateNotificationModule(update_info, self)
        self.update_module.install_now_clicked.connect(self.on_install_now)
        self.update_module.install_later_clicked.connect(self.on_install_later)
        
        # Position module (centered on splash screen)
        module_x = (self.width() - self.update_module.width()) // 2
        module_y = (self.height() - self.update_module.height()) // 2
        self.update_module.move(module_x, module_y)
        self.update_module.show()
    
    def on_install_now(self):
        """Handle Install Now button click"""
        logger.info("User chose to install update now")
        # TODO: Implement update installation
        # This will be implemented in a later phase
        self.update_module.hide()
    
    def on_install_later(self):
        """Handle Install Later button click"""
        logger.info("User chose to install update later")
        if self.update_module:
            self.update_module.hide()
        self.update_status("Ready!")
