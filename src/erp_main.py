"""
Sphincs ERP - Main Entry Point
Enterprise Resource Planning Application

Documentation:
- docs/INDEX.md
- docs/erp/uiux-roadmap.md
- docs/erp/uiux-audit-baseline.md
- docs/erp/uiux-phase1-shell-refresh.md
- docs/erp/uiux-phase2-global-refresh.md
- docs/erp/implementation-summary-2026-03-09.md
- docs/erp/worklog.md
"""
import sys
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from PyQt6.QtWidgets import QApplication, QDialog
from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtGui import QIcon, QPixmap
from loguru import logger

from src.config.settings import get_settings
from src.utils.logger import setup_logger
from src.gui.splash_screen import SplashScreen
from src.gui.login_window import LoginWindow
from src.gui.erp_dashboard import ERPDashboard
from src.database.connection import get_db_manager
from src import __version__
from src.gui.table_utils import install_table_auto_resize
from src.gui.design_system import ERP_APP_BASE_STYLE
from src.gui.design_system import install_workspace_theme


def main():
    """Main entry point for Sphincs ERP"""
    # Setup logging
    app_logger = setup_logger("SphincsERP")
    logger.info("Starting Sphincs ERP...")
    
    # PyQt6 has high DPI scaling enabled by default
    # No need to set these attributes (they were removed in PyQt6)
    
    # Create application
    app = QApplication(sys.argv)
    app.setApplicationName("Sphincs ERP")
    app.setApplicationVersion(__version__)
    app.setOrganizationName("Sphincs")
    app.setStyleSheet(ERP_APP_BASE_STYLE)
    install_table_auto_resize(app)
    install_workspace_theme(app)
    
    # Set application icon
    icon_path = project_root / "assets" / "icons" / "sphincs_icon.ico"
    if not icon_path.exists():
        # Backward-compat fallback for older layouts.
        icon_path = project_root / "sphincs_icon.ico"
    splash_icon_pixmap = None
    if icon_path.exists():
        icon = QIcon(str(icon_path))
        app.setWindowIcon(icon)
        # Convert QIcon to QPixmap for splash screen
        splash_icon_pixmap = icon.pixmap(128, 128)  # Use 128x128 size for splash
    
    # Get settings
    settings = get_settings()
    
    # Create and show splash screen
    splash = SplashScreen(
        app_name="Sphincs ERP",
        app_version=__version__,
        app_icon=splash_icon_pixmap
    )
    splash.show()
    
    # Process events to show splash screen
    app.processEvents()
    
    # Simulate initialization tasks
    def initialize_app():
        """Initialize application components"""
        splash.update_status("Loading configuration...")
        app.processEvents()
        
        # Initialize database
        splash.update_status("Connecting to database...")
        app.processEvents()
        try:
            db_manager = get_db_manager()
            db_manager.create_tables()
            logger.info("Database initialized")
            
            # Create default roles if they don't exist
            try:
                from src.utils.create_roles import create_default_roles
                create_default_roles()
            except Exception as e:
                logger.warning(f"Could not create default roles: {e}")
        except Exception as e:
            logger.error(f"Database initialization error: {e}")
            splash.update_status("Database error - check logs")
            app.processEvents()
        
        # Wait for update check to complete (if enabled)
        if settings.get_bool('Updates', 'check_on_startup', True):
            # Give update check time to complete
            QTimer.singleShot(2000, finish_initialization)
        else:
            finish_initialization()
    
    def finish_initialization():
        """Finish initialization and show main window"""
        splash.update_status("Ready!")
        app.processEvents()
        
        # Keep splash screen visible for a moment
        QTimer.singleShot(1500, lambda: show_main_window())
        
        logger.info("Sphincs ERP initialized successfully")
    
    # Store main window in outer scope so it doesn't get garbage collected
    main_window = None
    
    def show_main_window():
        """Show main window (placeholder for now)"""
        nonlocal main_window

        # Close splash screen
        splash.close()
        
        show_login_window()
    
    def show_login_window():
        """Show login window"""
        nonlocal main_window
        
        # Close main window if it exists
        if main_window:
            main_window.close()
            main_window = None
        
        # Show login window
        login_window = LoginWindow(app_name="Sphincs ERP")
        
        def on_login_success(user):
            """Handle successful login"""
            logger.info(f"User logged in: {user.username} (Role: {user.role})")
            login_window.close()
            # Pass user data to main window
            resolved_user_id = getattr(user, "staff_id", None) or getattr(user, "user_id", None)
            show_erp_main_window(user.username, user.role, int(resolved_user_id or 0))
        
        login_window.login_successful.connect(on_login_success)
        
        if login_window.exec() == QDialog.DialogCode.Rejected:
            # User cancelled login, exit application
            logger.info("Login cancelled by user")
            app.quit()
    
    def show_erp_main_window(username: str, role: str, user_id: int):
        """Show main ERP window after login"""
        nonlocal main_window
        
        # Create and show ERP dashboard (will be maximized in __init__)
        main_window = ERPDashboard(username, role, user_id)
        
        # Connect logout signal to show login window again
        def on_logout():
            """Handle logout - return to login window"""
            logger.info("Logout - returning to login window")
            show_login_window()
        
        main_window.logout_requested.connect(on_logout)
        main_window.show()
        
        logger.info("ERP Dashboard displayed")
    
    # Start initialization after short delay
    QTimer.singleShot(500, initialize_app)
    
    # Run application
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
