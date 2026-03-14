"""
Notification Preferences tab for settings
"""

from datetime import datetime, timezone

from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import (
    QWidget,
    QVBoxLayout,
    QLabel,
    QGridLayout,
    QCheckBox,
    QComboBox,
    QPushButton,
    QHBoxLayout,
    QMessageBox,
    QGroupBox,
)

from src.utils.notification_preferences import (
    DEFAULT_CHANNELS,
    clear_snooze,
    get_notification_preferences,
    set_channel_settings,
    snooze_channels,
)


def _utc_now_naive() -> datetime:
    """Return current UTC timestamp as naive datetime."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class NotificationPreferencesWidget(QWidget):
    """Widget for editing notification preferences."""
    
    SEVERITY_LABELS = {
        "info": "Info & higher",
        "warning": "Warnings & critical",
        "critical": "Critical only",
    }
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.channel_controls = {}
        self.build_ui()
        self.load_preferences()
    
    def build_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(16, 16, 16, 16)
        
        header = QLabel("Notification & Alert Preferences")
        header.setStyleSheet("""
            color: #162640;
            font-size: 20px;
            font-weight: 700;
        """)
        layout.addWidget(header)
        
        description = QLabel("Choose which channels can alert you on desktop and mobile, set minimum severity, and snooze notifications when you need focus time.")
        description.setWordWrap(True)
        description.setStyleSheet("color: #5D6F8B; font-size: 14px;")
        layout.addWidget(description)
        
        group = QGroupBox("Channels")
        group_layout = QGridLayout(group)
        group_layout.setSpacing(12)
        group_layout.setContentsMargins(12, 16, 12, 16)
        group_layout.addWidget(QLabel("Channel"), 0, 0)
        group_layout.addWidget(QLabel("Enabled"), 0, 1)
        group_layout.addWidget(QLabel("Desktop"), 0, 2)
        group_layout.addWidget(QLabel("Mobile"), 0, 3)
        group_layout.addWidget(QLabel("Min Severity"), 0, 4)
        group_layout.addWidget(QLabel("Snoozed Until"), 0, 5)
        group_layout.addWidget(QLabel("Actions"), 0, 6)
        
        for row, (channel, description_text) in enumerate(DEFAULT_CHANNELS, start=1):
            channel_label = QLabel(f"<b>{channel}</b><br/><span style='color:#5D6F8B;'>{description_text}</span>")
            channel_label.setTextFormat(Qt.TextFormat.RichText)
            group_layout.addWidget(channel_label, row, 0)
            
            enabled_checkbox = QCheckBox()
            desktop_checkbox = QCheckBox()
            mobile_checkbox = QCheckBox()
            
            severity_combo = QComboBox()
            for key, label in self.SEVERITY_LABELS.items():
                severity_combo.addItem(label, key)
            
            snooze_label = QLabel("—")
            clear_btn = QPushButton("Unsnooze")
            clear_btn.setProperty("channel", channel)
            clear_btn.clicked.connect(self.clear_channel_snooze)
            clear_btn.setEnabled(False)
            
            group_layout.addWidget(enabled_checkbox, row, 1, alignment=Qt.AlignmentFlag.AlignCenter)
            group_layout.addWidget(desktop_checkbox, row, 2, alignment=Qt.AlignmentFlag.AlignCenter)
            group_layout.addWidget(mobile_checkbox, row, 3, alignment=Qt.AlignmentFlag.AlignCenter)
            group_layout.addWidget(severity_combo, row, 4)
            group_layout.addWidget(snooze_label, row, 5)
            group_layout.addWidget(clear_btn, row, 6)
            
            self.channel_controls[channel] = {
                "enabled": enabled_checkbox,
                "desktop": desktop_checkbox,
                "mobile": mobile_checkbox,
                "severity": severity_combo,
                "snooze_label": snooze_label,
                "clear_btn": clear_btn,
            }
        
        layout.addWidget(group)
        
        # Snooze buttons
        snooze_layout = QHBoxLayout()
        snooze_layout.addWidget(QLabel("Snooze all channels:"))
        for label, minutes in [("15 min", 15), ("30 min", 30), ("1 hr", 60), ("4 hr", 240)]:
            btn = QPushButton(label)
            btn.clicked.connect(lambda _, m=minutes: self.handle_snooze_all(m))
            snooze_layout.addWidget(btn)
        clear_all = QPushButton("Clear Snooze")
        clear_all.clicked.connect(self.handle_clear_all_snooze)
        snooze_layout.addWidget(clear_all)
        snooze_layout.addStretch()
        layout.addLayout(snooze_layout)
        
        # Save button
        button_layout = QHBoxLayout()
        button_layout.addStretch()
        save_btn = QPushButton("Save Preferences")
        save_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 20px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #1D66EA;
            }
        """)
        save_btn.clicked.connect(self.handle_save)
        button_layout.addWidget(save_btn)
        layout.addLayout(button_layout)
        layout.addStretch()
    
    def load_preferences(self):
        prefs = get_notification_preferences(self.user_id)
        for channel, controls in self.channel_controls.items():
            pref = prefs.get(channel)
            if not pref:
                continue
            controls["enabled"].setChecked(pref.is_enabled)
            controls["desktop"].setChecked(pref.desktop_enabled)
            controls["mobile"].setChecked(pref.mobile_enabled)
            severity_index = controls["severity"].findData(pref.severity_threshold)
            if severity_index >= 0:
                controls["severity"].setCurrentIndex(severity_index)
            snooze_label = "—"
            if pref.snoozed_until and pref.snoozed_until > _utc_now_naive():
                snooze_label = pref.snoozed_until.strftime("%b %d %H:%M")
                controls["clear_btn"].setEnabled(True)
            else:
                controls["clear_btn"].setEnabled(False)
            controls["snooze_label"].setText(snooze_label)
    
    def handle_save(self):
        try:
            for channel, controls in self.channel_controls.items():
                set_channel_settings(
                    self.user_id,
                    channel,
                    is_enabled=controls["enabled"].isChecked(),
                    desktop_enabled=controls["desktop"].isChecked(),
                    mobile_enabled=controls["mobile"].isChecked(),
                    severity_threshold=controls["severity"].currentData(),
                )
            QMessageBox.information(self, "Saved", "Notification preferences updated.")
        except Exception as exc:
            QMessageBox.critical(self, "Error", f"Failed to save preferences:\n{exc}")
        finally:
            self.load_preferences()
    
    def handle_snooze_all(self, minutes: int):
        try:
            snooze_channels(self.user_id, minutes)
            QMessageBox.information(self, "Snoozed", f"Alerts snoozed for {minutes} minutes.")
        except Exception as exc:
            QMessageBox.critical(self, "Error", f"Failed to snooze alerts:\n{exc}")
        finally:
            self.load_preferences()
    
    def handle_clear_all_snooze(self):
        try:
            clear_snooze(self.user_id)
            QMessageBox.information(self, "Cleared", "All snoozes cleared.")
        except Exception as exc:
            QMessageBox.critical(self, "Error", f"Failed to clear snooze:\n{exc}")
        finally:
            self.load_preferences()
    
    def clear_channel_snooze(self):
        channel = self.sender().property("channel")
        try:
            clear_snooze(self.user_id, channels=[channel])
        except Exception as exc:
            QMessageBox.critical(self, "Error", f"Failed to clear snooze:\n{exc}")
        finally:
            self.load_preferences()

