"""
POS Login Screen - Number-based two-step authentication with on-screen keypad
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit,
    QPushButton, QFrame, QGridLayout
)
from PyQt6.QtCore import Qt, pyqtSignal, QTimer
from PyQt6.QtGui import QKeySequence, QShortcut
from loguru import logger
from src.utils.auth import authenticate_staff_by_id


class POSLoginScreen(QWidget):
    """POS Login Screen - Two-step number-based authentication"""
    
    # Signal emitted when login is successful
    login_successful = pyqtSignal(object)  # Emits staff/user data
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.current_step = 1  # 1 = Staff ID, 2 = Password
        self.staff_id = None
        self.setup_ui()
        self.setup_keyboard_shortcuts()
    
    def setup_ui(self):
        """Setup professional login screen UI with on-screen keypad on the right"""
        # Set background
        self.setStyleSheet("""
            QWidget {
                background-color: #F3F4F6;
            }
        """)
        
        # === MAIN LAYOUT ===
        main_layout = QHBoxLayout(self)
        main_layout.setSpacing(0)
        main_layout.setContentsMargins(40, 40, 40, 40)
        
        # === LEFT SIDE: LOGIN FORM ===
        left_card = QFrame()
        left_card.setStyleSheet("""
            QFrame {
                background-color: white;
                border-radius: 16px;
                padding: 40px;
                border: 2px solid #E5E7EB;
            }
        """)
        left_card.setFixedWidth(500)
        left_layout = QVBoxLayout(left_card)
        left_layout.setSpacing(24)
        
        # === TITLE ===
        title = QLabel("Sphincs POS")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title.setStyleSheet("""
            color: #2563EB;
            font-size: 36px;
            font-weight: 800;
        """)
        left_layout.addWidget(title)
        
        subtitle = QLabel("Staff Login")
        subtitle.setAlignment(Qt.AlignmentFlag.AlignCenter)
        subtitle.setStyleSheet("""
            color: #6B7280;
            font-size: 18px;
            font-weight: 500;
        """)
        left_layout.addWidget(subtitle)
        
        left_layout.addSpacing(20)
        
        # === STEP LABEL ===
        self.step_label = QLabel("Enter Staff ID")
        self.step_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.step_label.setStyleSheet("""
            color: #111827;
            font-size: 20px;
            font-weight: 600;
            padding: 8px 0;
        """)
        left_layout.addWidget(self.step_label)
        
        # === INPUT FIELD ===
        self.input_field = QLineEdit()
        self.input_field.setPlaceholderText("Enter number...")
        self.input_field.setFixedHeight(90)
        self.input_field.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.input_field.setReadOnly(True)  # Only allow keypad input
        self.input_field.setStyleSheet("""
            QLineEdit {
                border: 3px solid #D1D5DB;
                border-radius: 12px;
                padding: 20px;
                font-size: 36px;
                font-weight: 700;
                background-color: #F9FAFB;
                color: #111827;
                letter-spacing: 6px;
            }
            QLineEdit:focus {
                border-color: #2563EB;
                background-color: white;
            }
            QLineEdit::placeholder {
                color: #9CA3AF;
                font-weight: 400;
            }
        """)
        left_layout.addWidget(self.input_field)
        
        # === ERROR LABEL ===
        self.status_label = QLabel("")
        self.status_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.status_label.setStyleSheet("""
            color: #EF4444;
            font-size: 16px;
            font-weight: 600;
            min-height: 28px;
        """)
        self.status_label.setWordWrap(True)
        left_layout.addWidget(self.status_label)
        
        left_layout.addStretch()
        
        main_layout.addWidget(left_card)
        
        # === RIGHT SIDE: NUMBER PAD ===
        right_card = QFrame()
        right_card.setStyleSheet("""
            QFrame {
                background-color: white;
                border-radius: 16px;
                padding: 30px;
                border: 2px solid #E5E7EB;
            }
        """)
        right_card.setFixedWidth(450)
        keypad_layout = QGridLayout(right_card)
        keypad_layout.setSpacing(16)
        keypad_layout.setContentsMargins(20, 20, 20, 20)
        
        # Number pad buttons (1-9, 0, Clear, Enter) - LARGER BUTTONS
        buttons = [
            ('1', 0, 0), ('2', 0, 1), ('3', 0, 2),
            ('4', 1, 0), ('5', 1, 1), ('6', 1, 2),
            ('7', 2, 0), ('8', 2, 1), ('9', 2, 2),
            ('Clear', 3, 0), ('0', 3, 1), ('Enter', 3, 2)
        ]
        
        self.keypad_buttons = {}
        for btn_text, row, col in buttons:
            btn = QPushButton(btn_text)
            btn.setFixedSize(110, 110)  # Larger buttons for better touch access
            
            if btn_text == 'Enter':
                btn.setStyleSheet("""
                    QPushButton {
                        background-color: #2563EB;
                        color: white;
                        font-size: 20px;
                        font-weight: 700;
                        border: none;
                        border-radius: 14px;
                    }
                    QPushButton:hover {
                        background-color: #1E40AF;
                    }
                    QPushButton:pressed {
                        background-color: #1D4ED8;
                    }
                    QPushButton:disabled {
                        background-color: #E5E7EB;
                        color: #9CA3AF;
                    }
                """)
                btn.clicked.connect(self.handle_enter)
                self.enter_btn = btn
            elif btn_text == 'Clear':
                btn.setStyleSheet("""
                    QPushButton {
                        background-color: #EF4444;
                        color: white;
                        font-size: 18px;
                        font-weight: 700;
                        border: none;
                        border-radius: 14px;
                    }
                    QPushButton:hover {
                        background-color: #DC2626;
                    }
                    QPushButton:pressed {
                        background-color: #B91C1C;
                    }
                """)
                btn.clicked.connect(self.handle_clear)
                self.clear_btn = btn
            else:
                btn.setStyleSheet("""
                    QPushButton {
                        background-color: white;
                        color: #111827;
                        font-size: 32px;
                        font-weight: 700;
                        border: 3px solid #D1D5DB;
                        border-radius: 14px;
                    }
                    QPushButton:hover {
                        background-color: #F9FAFB;
                        border-color: #2563EB;
                    }
                    QPushButton:pressed {
                        background-color: #F3F4F6;
                        border-color: #1D4ED8;
                    }
                """)
                btn.clicked.connect(lambda checked, num=btn_text: self.on_keypad_number(num))
                self.keypad_buttons[btn_text] = btn
            
            keypad_layout.addWidget(btn, row, col)
        
        main_layout.addWidget(right_card)
        
        # Don't focus on input field (keypad only)
        self.input_field.setFocusPolicy(Qt.FocusPolicy.NoFocus)
    
    def setup_keyboard_shortcuts(self):
        """Setup keyboard shortcuts"""
        # Enter key submits
        enter_shortcut = QShortcut(QKeySequence("Return"), self)
        enter_shortcut.activated.connect(self.handle_enter)
        
        # Escape clears
        esc_shortcut = QShortcut(QKeySequence("Escape"), self)
        esc_shortcut.activated.connect(self.handle_clear)
    
    def on_keypad_number(self, number: str):
        """Handle number pad button press"""
        current_text = self.input_field.text()
        if number.isdigit():
            self.input_field.setText(current_text + number)
        self.status_label.setText("")  # Clear error on new input
    
    def on_input_changed(self, text: str):
        """Handle input changes - only allow numbers (for keyboard input if needed)"""
        # Filter to only numbers
        filtered = ''.join(filter(str.isdigit, text))
        if filtered != text:
            self.input_field.setText(filtered)
    
    def handle_clear(self):
        """Clear input and reset if on password step"""
        if self.current_step == 2:
            # Go back to step 1
            self.current_step = 1
            self.staff_id = None
            self.step_label.setText("Enter Staff ID")
            self.input_field.setPlaceholderText("Enter number...")
            self.input_field.setEchoMode(QLineEdit.EchoMode.Normal)
            self.status_label.setText("")
        else:
            # Clear last digit or entire field
            current_text = self.input_field.text()
            if current_text:
                self.input_field.setText(current_text[:-1])
            else:
                self.input_field.clear()
        self.status_label.setText("")
    
    def handle_enter(self):
        """Handle Enter button click"""
        text = self.input_field.text().strip()
        
        if not text:
            self.show_error("Please enter a number")
            return
        
        if self.current_step == 1:
            # Step 1: Validate and store staff ID
            try:
                staff_id = int(text)
                self.staff_id = staff_id
                # Move to step 2
                self.current_step = 2
                self.step_label.setText("Enter PIN")
                self.input_field.clear()
                self.input_field.setPlaceholderText("Enter PIN...")
                self.input_field.setEchoMode(QLineEdit.EchoMode.Password)
                self.status_label.setText("")
                logger.info(f"Staff ID entered: {staff_id}")
            except ValueError:
                self.show_error("Please enter a valid number")
        
        elif self.current_step == 2:
            # Step 2: Authenticate with PIN (numeric password)
            # Convert PIN to string for authentication
            pin = text
            self.enter_btn.setEnabled(False)
            original_text = self.enter_btn.text()
            self.enter_btn.setText("Logging in...")
            
            # Authenticate (password should be numeric)
            staff_data = authenticate_staff_by_id(self.staff_id, pin)
            
            if staff_data:
                logger.info(f"POS login successful for staff ID: {self.staff_id}")
                from types import SimpleNamespace
                staff_obj = SimpleNamespace(**staff_data)
                self.login_successful.emit(staff_obj)
            else:
                self.show_error("Invalid PIN")
                self.input_field.clear()
                self.enter_btn.setEnabled(True)
                self.enter_btn.setText(original_text)
    
    def show_error(self, message: str):
        """Show error message"""
        self.status_label.setText(message)

