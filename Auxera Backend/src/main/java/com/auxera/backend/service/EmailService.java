private String buildOtpHtml(String otp) {
    return """
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color:#f5f5f5; padding:30px;">
            <div style="max-width:600px; margin:0 auto; background:white; border-radius:16px; padding:40px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                
                <div style="text-align:center; margin-bottom:30px;">
                    <h1 style="font-family: 'Times New Roman', serif; font-size:32px; font-weight:700; letter-spacing:-1px; color:#1a1a1a; margin:0;">
                        AUXERA
                    </h1>
                    <p style="color:#666; font-size:14px; margin:5px 0 0; letter-spacing:1px;">
                        LUXURY REDEFINED
                    </p>
                </div>
                
                <div style="width:60px; height:2px; background:#1a1a1a; margin:0 auto 30px;"></div>
                
                <h2 style="color:#1a1a1a; font-size:24px; font-weight:500; text-align:center; margin-bottom:10px;">
                    Reset Your Password
                </h2>
                
                <p style="color:#666; text-align:center; font-size:16px; line-height:1.6; margin-bottom:30px;">
                    Hello,<br>
                    We received a request to reset your password for your AUXERA account.
                </p>
                
                <div style="text-align:center; margin:40px 0;">
                    <p style="color:#666; font-size:14px; margin-bottom:15px; letter-spacing:2px;">
                        YOUR VERIFICATION CODE
                    </p>
                    <div style="text-align:center; width:100%;">
                        <span style="
                            font-family: 'Courier New', monospace;
                            font-size:36px;
                            font-weight:600;
                            letter-spacing:8px;
                            background:#1a1a1a;
                            color:white;
                            padding:15px 30px;
                            border-radius:8px;
                            display:inline-block;
                            margin:0 auto;
                        \">""" + otp + """</span>
                    </div>
                </div>
                
                <div style="background:#f9f9f9; padding:20px; border-radius:12px; margin:30px 0;">
                    <p style="color:#666; font-size:14px; margin:0; text-align:center;">
                        ⏰ This OTP is valid for <strong style="color:#1a1a1a;">5 minutes</strong>
                    </p>
                </div>
                
                <p style="color:#999; font-size:13px; text-align:center; margin:30px 0 20px;">
                    If you didn't request this password reset, please ignore this email or contact support if you have concerns.
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin:30px 0;" />
                
                <div style="text-align:center;">
                    <p style="font-size:12px; color:#aaa; margin:5px 0;">
                        © 2026 AUXERA. All rights reserved.
                    </p>
                    <p style="font-size:12px; color:#aaa; margin:5px 0;">
                        Luxury fashion for the discerning individual
                    </p>
                </div>
                
            </div>
        </div>
        """;
}
