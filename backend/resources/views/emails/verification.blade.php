<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px;">
    <div style="max-width: 420px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #1a1a1a;">JobHunt</h1>
            <p style="margin: 8px 0 0; color: #666; font-size: 14px;">Email Verification</p>
        </div>

        <p style="color: #333; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            Use the following code to verify your email address:
        </p>

        <div style="background: #f0f0ff; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; font-family: monospace;">{{ $code }}</span>
        </div>

        <p style="color: #888; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
            This code expires in <strong>10 minutes</strong>. If you didn't request this, you can safely ignore this email.
        </p>
    </div>
</body>
</html>
