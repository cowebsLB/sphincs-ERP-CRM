"""
Notification preferences helpers
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from loguru import logger

from src.database.connection import get_db_session
from src.database.models import NotificationPreference, Staff


def _utc_now_naive() -> datetime:
    """Return current UTC timestamp as naive datetime."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

DEFAULT_CHANNELS = [
    ("Inventory", "Inventory & expiry alerts"),
    ("Operations", "Operations hub tasks"),
    ("Sales", "Sales, POS, loyalty events"),
    ("Safety", "Safety & compliance"),
    ("Finance", "Financial & cash flow"),
    ("POS", "Point-of-sale orders"),
    ("System", "System health & updates"),
]

SEVERITY_ORDER = {
    "info": 1,
    "warning": 2,
    "critical": 3,
}


@dataclass
class ChannelPreference:
    channel: str
    is_enabled: bool = True
    severity_threshold: str = "info"
    desktop_enabled: bool = True
    mobile_enabled: bool = True
    snoozed_until: Optional[datetime] = None

    @property
    def severity_rank(self) -> int:
        return SEVERITY_ORDER.get(self.severity_threshold, 1)

    def to_dict(self) -> dict:
        return {
            "channel": self.channel,
            "is_enabled": self.is_enabled,
            "severity_threshold": self.severity_threshold,
            "desktop_enabled": self.desktop_enabled,
            "mobile_enabled": self.mobile_enabled,
            "snoozed_until": self.snoozed_until.isoformat() if self.snoozed_until else None,
        }


def _ensure_default_preferences(session, staff_id: int):
    """Ensure a row exists for every default channel."""
    existing = {
        pref.channel: pref
        for pref in session.query(NotificationPreference)
        .filter(NotificationPreference.staff_id == staff_id)
        .all()
    }
    created = False
    for channel, _ in DEFAULT_CHANNELS:
        if channel not in existing:
            pref = NotificationPreference(
                staff_id=staff_id,
                channel=channel,
                is_enabled=True,
                severity_threshold="info",
                desktop_enabled=True,
                mobile_enabled=True,
            )
            session.add(pref)
            created = True
    if created:
        session.commit()


def _resolve_valid_staff_id(session, staff_id: int) -> Optional[int]:
    """Return a valid staff_id or None when the provided id is invalid."""
    if not staff_id:
        return None
    exists = (
        session.query(Staff.staff_id)
        .filter(Staff.staff_id == staff_id)
        .first()
    )
    return staff_id if exists else None


def _build_default_preferences_map() -> Dict[str, ChannelPreference]:
    """Build in-memory default preferences for graceful fallback."""
    return {
        channel: ChannelPreference(channel=channel)
        for channel, _ in DEFAULT_CHANNELS
    }


def get_notification_preferences(staff_id: int) -> Dict[str, ChannelPreference]:
    """Return preference objects keyed by channel name."""
    session = get_db_session()
    try:
        valid_staff_id = _resolve_valid_staff_id(session, staff_id)
        if not valid_staff_id:
            logger.warning(
                "Notification preferences skipped: invalid staff_id={}; using in-memory defaults.",
                staff_id,
            )
            return _build_default_preferences_map()

        _ensure_default_preferences(session, valid_staff_id)
        records = (
            session.query(NotificationPreference)
            .filter(NotificationPreference.staff_id == valid_staff_id)
            .all()
        )
        prefs: Dict[str, ChannelPreference] = {}
        for record in records:
            prefs[record.channel] = ChannelPreference(
                channel=record.channel,
                is_enabled=record.is_enabled,
                severity_threshold=record.severity_threshold or "info",
                desktop_enabled=record.desktop_enabled,
                mobile_enabled=record.mobile_enabled,
                snoozed_until=record.snoozed_until,
            )
        return prefs
    except Exception as exc:
        logger.error(f"Failed to load notification preferences: {exc}")
        return _build_default_preferences_map()
    finally:
        session.close()


def set_channel_settings(
    staff_id: int,
    channel: str,
    *,
    is_enabled: Optional[bool] = None,
    severity_threshold: Optional[str] = None,
    desktop_enabled: Optional[bool] = None,
    mobile_enabled: Optional[bool] = None,
):
    session = get_db_session()
    try:
        valid_staff_id = _resolve_valid_staff_id(session, staff_id)
        if not valid_staff_id:
            logger.warning("Skipping preference update; invalid staff_id={}", staff_id)
            return

        pref = (
            session.query(NotificationPreference)
            .filter(
                NotificationPreference.staff_id == valid_staff_id,
                NotificationPreference.channel == channel,
            )
            .first()
        )
        if not pref:
            pref = NotificationPreference(
                staff_id=valid_staff_id,
                channel=channel,
            )
            session.add(pref)
        if is_enabled is not None:
            pref.is_enabled = is_enabled
        if severity_threshold:
            pref.severity_threshold = severity_threshold
        if desktop_enabled is not None:
            pref.desktop_enabled = desktop_enabled
        if mobile_enabled is not None:
            pref.mobile_enabled = mobile_enabled
        session.commit()
    except Exception as exc:
        session.rollback()
        logger.error(f"Failed to update notification preference: {exc}")
        raise
    finally:
        session.close()


def snooze_channels(staff_id: int, minutes: int, channels: Optional[List[str]] = None):
    """Snooze specific channels (or all) for a duration."""
    session = get_db_session()
    try:
        valid_staff_id = _resolve_valid_staff_id(session, staff_id)
        if not valid_staff_id:
            logger.warning("Skipping snooze; invalid staff_id={}", staff_id)
            return

        _ensure_default_preferences(session, valid_staff_id)
        query = session.query(NotificationPreference).filter(
            NotificationPreference.staff_id == valid_staff_id
        )
        if channels:
            query = query.filter(NotificationPreference.channel.in_(channels))
        until = _utc_now_naive() + timedelta(minutes=minutes)
        query.update({NotificationPreference.snoozed_until: until}, synchronize_session=False)
        session.commit()
    except Exception as exc:
        session.rollback()
        logger.error(f"Failed to snooze notifications: {exc}")
        raise
    finally:
        session.close()


def clear_snooze(staff_id: int, channels: Optional[List[str]] = None):
    """Clear snooze for channels or all."""
    session = get_db_session()
    try:
        valid_staff_id = _resolve_valid_staff_id(session, staff_id)
        if not valid_staff_id:
            logger.warning("Skipping clear snooze; invalid staff_id={}", staff_id)
            return

        query = session.query(NotificationPreference).filter(
            NotificationPreference.staff_id == valid_staff_id
        )
        if channels:
            query = query.filter(NotificationPreference.channel.in_(channels))
        query.update({NotificationPreference.snoozed_until: None}, synchronize_session=False)
        session.commit()
    except Exception as exc:
        session.rollback()
        logger.error(f"Failed to clear snooze: {exc}")
        raise
    finally:
        session.close()


def severity_allows(pref: ChannelPreference, severity: str) -> bool:
    return SEVERITY_ORDER.get(severity, 1) >= pref.severity_rank


def is_channel_allowed(
    pref: ChannelPreference,
    severity: str,
    target: str = "desktop",
) -> bool:
    if not pref or not pref.is_enabled:
        return False
    if pref.snoozed_until and pref.snoozed_until > _utc_now_naive():
        return False
    if target == "desktop" and not pref.desktop_enabled:
        return False
    if target == "mobile" and not pref.mobile_enabled:
        return False
    return severity_allows(pref, severity)


def filter_notifications_for_user(
    notifications: List[dict],
    staff_id: int,
    *,
    target: str = "desktop",
    preferences: Optional[Dict[str, ChannelPreference]] = None,
) -> List[dict]:
    """Filter a list of notification dicts according to user preferences."""
    prefs = preferences or get_notification_preferences(staff_id)
    filtered = []
    for data in notifications:
        channel = data.get("module", "System")
        severity = data.get("severity", "info")
        pref = prefs.get(channel) or prefs.get(channel.capitalize())
        if not pref:
            # Default allow
            filtered.append(data)
            continue
        if is_channel_allowed(pref, severity, target=target):
            filtered.append(data)
    return filtered


def should_display_notification(
    data: dict,
    *,
    staff_id: int,
    target: str = "desktop",
    preferences: Optional[Dict[str, ChannelPreference]] = None,
) -> bool:
    prefs = preferences or get_notification_preferences(staff_id)
    channel = data.get("module", "System")
    severity = data.get("severity", "info")
    pref = prefs.get(channel) or prefs.get(channel.capitalize())
    if not pref:
        return True
    return is_channel_allowed(pref, severity, target=target)


