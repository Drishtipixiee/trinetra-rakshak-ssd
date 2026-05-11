import re
with open(r'c:\Users\pande\OneDrive\Desktop\trinetra-rakshak-ssd\backend\api\index.py', 'r', encoding='utf-8') as f:
    text = f.read()
target = r'server\.login\(smtp_email, smtp_password\)\s*server\.send_message\(msg\)'
repl = r'''server.login(smtp_email, smtp_password)
            recipient_list = [e.strip() for e in to_email.split(',')] if ',' in to_email else [to_email]
            for recipient in recipient_list:
                if recipient:
                    if "To" in msg:
                        msg.replace_header("To", recipient)
                    else:
                        msg.add_header("To", recipient)
                    server.send_message(msg)'''
text = re.sub(target, repl, text)
with open(r'c:\Users\pande\OneDrive\Desktop\trinetra-rakshak-ssd\backend\api\index.py', 'w', encoding='utf-8') as f:
    f.write(text)
