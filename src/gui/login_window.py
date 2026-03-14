"""
Login window for authentication
"""
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QLabel, QLineEdit,
    QPushButton, QCheckBox, QFrame
)
from PyQt6.QtCore import Qt, pyqtSignal, QTimer
from PyQt6.QtGui import QFont
from loguru import logger
from src.utils.auth import authenticate_user
from src.config.settings import get_settings
from src.gui.design_system import apply_windows11_window_effect

try:
    import keyring
    KEYRING_AVAILABLE = True
except ImportError:
    KEYRING_AVAILABLE = False
    logger.warning("keyring not available, passwords will be stored in config (less secure)")


class LoginWindow(QDialog):
    """Login dialog window"""

    login_successful = pyqtSignal(object)

    def __init__(self, app_name: str = "Sphincs", parent=None):
        super().__init__(parent)
        self.app_name = app_name
        self.settings = get_settings()
        self.setup_ui()
        self.setup_connections()
        self.load_saved_credentials()

        if self.username_input.text():
            QTimer.singleShot(100, self.password_input.setFocus)
        else:
            QTimer.singleShot(100, self.username_input.setFocus)

    def setup_ui(self):
        """Setup login window UI"""
        self.setWindowTitle(f"{self.app_name} - Login")
        self.setFixedWidth(430)
        self.setMinimumHeight(460)
        self.setModal(True)
        self.setStyleSheet("""
            QDialog {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                    stop:0 #0D101A, stop:0.5 #111626, stop:1 #0D111D);
            }
        """)

        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(24, 24, 24, 24)

        panel = QFrame()
        panel.setStyleSheet("""
            QFrame {
                background-color: rgba(29, 37, 55, 0.78);
                border: 1px solid rgba(126, 154, 201, 0.34);
                border-radius: 22px;
            }
        """)
        panel_layout = QVBoxLayout(panel)
        panel_layout.setSpacing(0)
        panel_layout.setContentsMargins(24, 24, 24, 24)
        layout.addWidget(panel)

        title_label = QLabel(self.app_name)
        title_font = QFont("Segoe UI Variable Text", 30, QFont.Weight.DemiBold)
        title_label.setFont(title_font)
        title_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title_label.setStyleSheet("color: #ECF3FF; margin-bottom: 6px;")
        panel_layout.addWidget(title_label)

        subtitle_label = QLabel("Sign in to continue")
        subtitle_font = QFont("Segoe UI", 12)
        subtitle_label.setFont(subtitle_font)
        subtitle_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        subtitle_label.setStyleSheet("color: #9AAAC8; margin-bottom: 20px;")
        panel_layout.addWidget(subtitle_label)

        username_label = QLabel("Username:")
        username_label.setStyleSheet("color: #D8E6FF; font-weight: 600; font-size: 14px; margin-bottom: 8px;")
        panel_layout.addWidget(username_label)

        self.username_input = QLineEdit()
        self.username_input.setPlaceholderText("Enter your username")
        self.username_input.setMinimumHeight(42)
        self.username_input.setStyleSheet("""
            QLineEdit {
                padding: 10px 16px;
                border: 1px solid rgba(131, 156, 197, 0.38);
                border-radius: 12px;
                font-size: 16px;
                background-color: rgba(16, 22, 35, 0.92);
                color: #EAF1FF;
                min-height: 42px;
            }
            QLineEdit:focus {
                border: 2px solid #5A95FF;
                outline: none;
            }
        """)
        panel_layout.addWidget(self.username_input)

        panel_layout.addSpacing(14)

        password_label = QLabel("Password:")
        password_label.setStyleSheet("color: #D8E6FF; font-weight: 600; font-size: 14px; margin-bottom: 8px;")
        panel_layout.addWidget(password_label)

        self.password_input = QLineEdit()
        self.password_input.setPlaceholderText("Enter your password")
        self.password_input.setEchoMode(QLineEdit.EchoMode.Password)
        self.password_input.setMinimumHeight(42)
        self.password_input.setStyleSheet("""
            QLineEdit {
                padding: 10px 16px;
                border: 1px solid rgba(131, 156, 197, 0.38);
                border-radius: 12px;
                font-size: 16px;
                background-color: rgba(16, 22, 35, 0.92);
                color: #EAF1FF;
                min-height: 42px;
            }
            QLineEdit:focus {
                border: 2px solid #5A95FF;
                outline: none;
            }
        """)
        panel_layout.addWidget(self.password_input)

        panel_layout.addSpacing(14)
        self.remember_checkbox = QCheckBox("Remember me")
        self.remember_checkbox.setStyleSheet("color: #BFD0EE; font-size: 14px;")
        panel_layout.addWidget(self.remember_checkbox)

        self.status_label = QLabel("")
        self.status_label.setStyleSheet("color: #FF7B8E; font-size: 12px; min-height: 20px; margin-top: 8px;")
        self.status_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.status_label.setWordWrap(True)
        panel_layout.addWidget(self.status_label)

        panel_layout.addSpacing(14)

        self.login_button = QPushButton("Login")
        self.login_button.setMinimumHeight(50)
        self.login_button.setStyleSheet("""
            QPushButton {
                background-color: rgba(68, 116, 200, 0.92);
                color: #F8FBFF;
                border: none;
                border-radius: 12px;
                padding: 10px 24px;
                font-size: 16px;
                font-weight: 700;
                min-height: 50px;
            }
            QPushButton:hover {
                background-color: rgba(89, 136, 221, 0.95);
            }
            QPushButton:pressed {
                background-color: rgba(53, 95, 175, 0.95);
            }
            QPushButton:disabled {
                background-color: rgba(53, 63, 84, 0.84);
                color: #8398BC;
            }
        """)
        panel_layout.addWidget(self.login_button)

        panel_layout.addSpacing(16)
        self.status_indicator = QLabel("Online")
        self.status_indicator.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.status_indicator.setStyleSheet("color: #59D4B5; font-size: 12px; margin-top: 4px; font-weight: 600;")
        panel_layout.addWidget(self.status_indicator)

        panel_layout.addStretch()
        QTimer.singleShot(0, lambda: apply_windows11_window_effect(self))

    def setup_connections(self):
        """Setup signal connections"""
        self.login_button.clicked.connect(self.handle_login)
        self.username_input.returnPressed.connect(self.handle_login)
        self.password_input.returnPressed.connect(self.handle_login)

    def handle_login(self):
        """Handle login button click"""
        username = self.username_input.text().strip()
        password = self.password_input.text().strip()

        self.status_label.setText("")

        if not username:
            self.show_error("Please enter your username")
            self.username_input.setFocus()
            return

        if not password:
            self.show_error("Please enter your password")
            self.password_input.setFocus()
            return

        self.login_button.setEnabled(False)
        self.login_button.setText("Logging in...")

        user_data = authenticate_user(username, password)

        if user_data:
            logger.info(f"Login successful for user: {username}")
            self.save_credentials(username, password)
            from types import SimpleNamespace
            user_obj = SimpleNamespace(**user_data)
            self.login_successful.emit(user_obj)
            self.accept()
        else:
            self.show_error("Invalid username or password")
            self.password_input.clear()
            self.password_input.setFocus()
            self.login_button.setEnabled(True)
            self.login_button.setText("Login")

    def show_error(self, message: str):
        """Show error message"""
        self.status_label.setText(message)
        self.status_label.setStyleSheet("color: #D92D20; font-size: 12px; min-height: 20px;")

    def load_saved_credentials(self):
        """Load saved credentials if remember me was checked previously"""
        try:
            remember_me = self.settings.get_bool('Login', 'remember_me', False)
            if not remember_me:
                return

            saved_username = self.settings.get('Login', 'username', '')
            if saved_username:
                self.username_input.setText(saved_username)
                self.remember_checkbox.setChecked(True)

            saved_password = self._get_saved_password(saved_username)
            if saved_password:
                self.password_input.setText(saved_password)

        except Exception as e:
            logger.error(f"Error loading saved credentials: {e}")

    def save_credentials(self, username: str, password: str):
        """Save or clear credentials based on remember checkbox"""
        try:
            if self.remember_checkbox.isChecked():
                self.settings.set('Login', 'remember_me', 'true')
                self.settings.set('Login', 'username', username)
                self._save_password(username, password)
                logger.info(f"Credentials saved for user: {username}")
            else:
                self.settings.set('Login', 'remember_me', 'false')
                self.settings.set('Login', 'username', '')
                self._clear_saved_password(username)
                logger.info("Saved credentials cleared")
        except Exception as e:
            logger.error(f"Error saving credentials: {e}")

    def _save_password(self, username: str, password: str):
        """Save password securely"""
        if KEYRING_AVAILABLE:
            try:
                keyring.set_password(f"{self.app_name}_Login", username, password)
            except Exception as e:
                logger.error(f"Error saving password to keyring: {e}")
                self.settings.set('Login', 'password', password)
        else:
            logger.warning("Using config file for password storage (keyring not available)")
            self.settings.set('Login', 'password', password)

    def _get_saved_password(self, username: str) -> str:
        """Get saved password securely"""
        if KEYRING_AVAILABLE:
            try:
                password = keyring.get_password(f"{self.app_name}_Login", username)
                return password or ""
            except Exception as e:
                logger.error(f"Error getting password from keyring: {e}")
                return self.settings.get('Login', 'password', '')
        return self.settings.get('Login', 'password', '')

    def _clear_saved_password(self, username: str):
        """Clear saved password"""
        if KEYRING_AVAILABLE:
            try:
                keyring.delete_password(f"{self.app_name}_Login", username)
            except Exception as e:
                logger.error(f"Error clearing password from keyring: {e}")

        try:
            self.settings.set('Login', 'password', '')
        except Exception:
            pass

    def keyPressEvent(self, event):
        """Handle keyboard events"""
        if event.key() == Qt.Key.Key_Escape:
            self.reject()
        else:
            super().keyPressEvent(event)
