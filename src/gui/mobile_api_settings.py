"""
Mobile API Settings - Configure mobile API server
"""

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QLineEdit, QFormLayout, QMessageBox, QCheckBox, QSpinBox
)
from PyQt6.QtCore import QThread, pyqtSignal
from loguru import logger
from src.api.start_mobile_api import start_mobile_api


class MobileAPIServerThread(QThread):
    """Thread for running mobile API server"""
    server_started = pyqtSignal(str)
    server_error = pyqtSignal(str)
    
    def __init__(self, host, port, debug, api_key):
        super().__init__()
        self.host = host
        self.port = port
        self.debug = debug
        self.api_key = api_key
        self.running = False
    
    def run(self):
        """Run the API server"""
        try:
            self.running = True
            self.server_started.emit(f"Server starting on {self.host}:{self.port}")
            start_mobile_api(host=self.host, port=self.port, debug=self.debug, api_key=self.api_key)
        except Exception as e:
            self.server_error.emit(str(e))
    
    def stop(self):
        """Stop the server"""
        self.running = False
        self.terminate()


class MobileAPISettingsDialog(QDialog):
    """Dialog for configuring and starting mobile API server"""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.server_thread = None
        self.setWindowTitle("Mobile API Server Settings")
        self.setMinimumSize(500, 400)
        self.setup_ui()
    
    def setup_ui(self):
        """Setup API settings dialog"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(20, 20, 20, 20)
        
        form = QFormLayout()
        
        # Host
        self.host_input = QLineEdit()
        self.host_input.setText("0.0.0.0")
        self.host_input.setPlaceholderText("0.0.0.0 for all interfaces")
        form.addRow("Host:", self.host_input)
        
        # Port
        self.port_spin = QSpinBox()
        self.port_spin.setMinimum(1000)
        self.port_spin.setMaximum(65535)
        self.port_spin.setValue(5000)
        form.addRow("Port:", self.port_spin)
        
        # API Key
        self.api_key_input = QLineEdit()
        self.api_key_input.setPlaceholderText("Leave empty to disable authentication")
        self.api_key_input.setEchoMode(QLineEdit.EchoMode.Password)
        form.addRow("API Key (optional):", self.api_key_input)
        
        # Debug mode
        self.debug_check = QCheckBox()
        self.debug_check.setChecked(False)
        form.addRow("Debug Mode:", self.debug_check)
        
        layout.addLayout(form)
        
        # Status
        self.status_label = QLabel("Status: Not running")
        self.status_label.setStyleSheet("""
            color: #5D6F8B;
            font-size: 14px;
            padding: 12px;
            background-color: #F9FAFB;
            border-radius: 8px;
        """)
        layout.addWidget(self.status_label)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        self.start_stop_btn = QPushButton("Start Server")
        self.start_stop_btn.setStyleSheet("""
            QPushButton {
                background-color: #14B8A6;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
                font-weight: 600;
            }
        """)
        self.start_stop_btn.clicked.connect(self.toggle_server)
        buttons_layout.addWidget(self.start_stop_btn)
        
        close_btn = QPushButton("Close")
        close_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(close_btn)
        
        layout.addLayout(buttons_layout)
    
    def toggle_server(self):
        """Start or stop the server"""
        if self.server_thread and self.server_thread.isRunning():
            # Stop server
            self.server_thread.stop()
            self.server_thread.wait()
            self.server_thread = None
            self.start_stop_btn.setText("Start Server")
            self.start_stop_btn.setStyleSheet("""
                QPushButton {
                    background-color: #14B8A6;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 10px 20px;
                    font-weight: 600;
                }
            """)
            self.status_label.setText("Status: Stopped")
            self.status_label.setStyleSheet("""
                color: #D92D20;
                font-size: 14px;
                padding: 12px;
                background-color: #FFE9E8;
                border-radius: 8px;
            """)
        else:
            # Start server
            host = self.host_input.text().strip() or "0.0.0.0"
            port = self.port_spin.value()
            api_key = self.api_key_input.text().strip() or None
            debug = self.debug_check.isChecked()
            
            self.server_thread = MobileAPIServerThread(host, port, debug, api_key)
            self.server_thread.server_started.connect(self.on_server_started)
            self.server_thread.server_error.connect(self.on_server_error)
            self.server_thread.start()
            
            self.start_stop_btn.setText("Stop Server")
            self.start_stop_btn.setStyleSheet("""
                QPushButton {
                    background-color: #D92D20;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 10px 20px;
                    font-weight: 600;
                }
            """)
    
    def on_server_started(self, message):
        """Handle server started signal"""
        host = self.host_input.text().strip() or "0.0.0.0"
        port = self.port_spin.value()
        self.status_label.setText(f"Status: Running on http://{host}:{port}/api/mobile")
        self.status_label.setStyleSheet("""
            color: #14B8A6;
            font-size: 14px;
            padding: 12px;
            background-color: #D1FAE5;
            border-radius: 8px;
        """)
        QMessageBox.information(self, "Server Started", f"Mobile API server is running on port {port}")
    
    def on_server_error(self, error):
        """Handle server error signal"""
        self.status_label.setText(f"Status: Error - {error}")
        self.status_label.setStyleSheet("""
            color: #D92D20;
            font-size: 14px;
            padding: 12px;
            background-color: #FFE9E8;
            border-radius: 8px;
        """)
        QMessageBox.critical(self, "Server Error", f"Failed to start server: {error}")
        if self.server_thread:
            self.server_thread.stop()
            self.server_thread = None
        self.start_stop_btn.setText("Start Server")

