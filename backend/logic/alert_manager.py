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


def send_email(message, level="CRITICAL"):
    """
    Send an email alert using Gmail SMTP.
    Requires SMTP_EMAIL and SMTP_PASSWORD environment variables.
    SMTP_PASSWORD should be a Gmail App Password.

    Returns:
        True if sent successfully, False otherwise.
    """
    smtp_email = os.environ.get("SMTP_EMAIL")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    to_email = os.environ.get("ALERT_EMAIL")

    if not smtp_email or not smtp_password or not to_email:
        logger.warning("SMTP/Email credentials not configured. Skipping email alert.")
        return False

    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        subject = f"[TRINETRA {level}] Incident Report"

        msg = MIMEMultipart("alternative")
        msg["From"] = smtp_email
        msg["To"] = to_email
        msg["Subject"] = subject

        # Plain text
        msg.attach(MIMEText(message, "plain"))

        # HTML version
        html = f"""<html><body style="background:#0a0a0a;color:#e0e0e0;font-family:monospace;padding:20px;">
        <h2 style="color:#22c55e;">TRINETRA RAKSHAK -- [{level}] Incident Report</h2>
        <pre style="color:#e0e0e0;line-height:1.6;white-space:pre-wrap;">{message}</pre>
        <hr style="border-color:#333;"/>
        <p style="color:#555;font-size:0.8em;">Auto-generated by Trinetra Rakshak AI Surveillance System</p>
        </body></html>"""
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(smtp_email, smtp_password)
            server.send_message(msg)

        logger.info(f"Email alert sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Email alert failed: {e}")
        return False


def dispatch_alerts(score, module, message):
    """
    Central alert dispatcher. Routes alerts based on risk score thresholds.

    - score > 75 (CRITICAL): Telegram + SMS + WhatsApp + Email
    - score > 50 (WARNING): Telegram + Email
    - score <= 50: No external alerts

    Args:
        score: Float risk score (0-100).
        module: The module name that triggered the alert.
        message: Human-readable alert message.

    Returns:
        Dict with dispatch results.
    """
    results = {"telegram": False, "sms": False, "whatsapp": False, "email": False, "level": "NONE"}

    full_message = f"Module: {module}\nScore: {score:.1f}%\n{message}"

    if score > 75:
        results["level"] = "CRITICAL"
        results["telegram"] = send_telegram(full_message, level="CRITICAL")
        results["sms"] = send_sms(full_message)
        results["whatsapp"] = send_whatsapp(full_message)
        results["email"] = send_email(full_message, level="CRITICAL")
    elif score > 50:
        results["level"] = "WARNING"
        results["telegram"] = send_telegram(full_message, level="WARNING")
        results["email"] = send_email(full_message, level="WARNING")

    return results

