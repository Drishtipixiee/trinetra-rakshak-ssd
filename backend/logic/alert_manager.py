"""
Alert Manager for Trinetra Rakshak
Handles real-world alert dispatch via Telegram, Twilio SMS, and WhatsApp.
All credentials are sourced from environment variables -- never hardcoded.
"""

import os
import logging

logger = logging.getLogger(__name__)


def send_telegram(message, level="INFO"):
    """
    Send a Telegram alert message using the Bot API via python-requests.

    Args:
        message: The alert text to send.
        level: Alert severity level (CRITICAL, WARNING, INFO).

    Returns:
        True if sent successfully, False otherwise.
    """
    import requests

    token = os.environ.get("TELEGRAM_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")

    if not token or not chat_id:
        logger.warning("Telegram credentials not configured. Skipping alert.")
        return False

    formatted = f"[{level}] TRINETRA RAKSHAK\n{'=' * 30}\n{message}"

    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": formatted,
            "parse_mode": "HTML",
        }
        resp = requests.post(url, json=payload, timeout=10)
        resp.raise_for_status()
        logger.info("Telegram alert sent successfully.")
        return True
    except Exception as e:
        logger.error(f"Telegram alert failed: {e}")
        return False


def send_sms(message):
    """
    Send an SMS alert using Twilio REST API.
    Only called for CRITICAL alerts (score > 75) to avoid spam.

    Returns:
        True if sent successfully, False otherwise.
    """
    try:
        from twilio.rest import Client
    except ImportError:
        logger.warning("Twilio library not installed. Skipping SMS.")
        return False

    account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    from_number = os.environ.get("TWILIO_FROM_NUMBER")
    to_number = os.environ.get("ALERT_PHONE_NUMBER")

    if not all([account_sid, auth_token, from_number, to_number]):
        logger.warning("Twilio SMS credentials not configured. Skipping alert.")
        return False

    try:
        client = Client(account_sid, auth_token)
        msg = client.messages.create(
            body=f"[TRINETRA CRITICAL] {message}",
            from_=from_number,
            to=to_number,
        )
        logger.info(f"SMS sent: SID {msg.sid}")
        return True
    except Exception as e:
        logger.error(f"Twilio SMS failed: {e}")
        return False


def send_whatsapp(message):
    """
    Send a WhatsApp alert using Twilio WhatsApp API.
    Only called for CRITICAL alerts (score > 75) to avoid spam.

    Returns:
        True if sent successfully, False otherwise.
    """
    try:
        from twilio.rest import Client
    except ImportError:
        logger.warning("Twilio library not installed. Skipping WhatsApp.")
        return False

    account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    from_number = os.environ.get("TWILIO_FROM_NUMBER")
    to_number = os.environ.get("ALERT_PHONE_NUMBER")

    if not all([account_sid, auth_token, from_number, to_number]):
        logger.warning("Twilio WhatsApp credentials not configured. Skipping alert.")
        return False

    try:
        client = Client(account_sid, auth_token)
        msg = client.messages.create(
            body=f"[TRINETRA CRITICAL] {message}",
            from_=f"whatsapp:{from_number}",
            to=f"whatsapp:{to_number}",
        )
        logger.info(f"WhatsApp sent: SID {msg.sid}")
        return True
    except Exception as e:
        logger.error(f"Twilio WhatsApp failed: {e}")
        return False


def dispatch_alerts(score, module, message):
    """
    Central alert dispatcher. Routes alerts based on risk score thresholds.

    - score > 75 (CRITICAL): Telegram + SMS + WhatsApp
    - score > 50 (WARNING): Telegram only
    - score <= 50: No external alerts

    Args:
        score: Float risk score (0-100).
        module: The module name that triggered the alert.
        message: Human-readable alert message.

    Returns:
        Dict with dispatch results.
    """
    results = {"telegram": False, "sms": False, "whatsapp": False, "level": "NONE"}

    full_message = f"Module: {module}\nScore: {score:.1f}%\n{message}"

    if score > 75:
        results["level"] = "CRITICAL"
        results["telegram"] = send_telegram(full_message, level="CRITICAL")
        results["sms"] = send_sms(full_message)
        results["whatsapp"] = send_whatsapp(full_message)
    elif score > 50:
        results["level"] = "WARNING"
        results["telegram"] = send_telegram(full_message, level="WARNING")

    return results
