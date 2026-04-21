package com.cartify.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmailService {

    @Value("${brevo.api.key}")
    private String brevoApiKey;

    @Value("${user.mail}")
    private String userEmail;

    private final RestTemplate restTemplate = new RestTemplate();

    @Async
    public void sendOtp(String toEmail, String otp) {

        String url = "https://api.brevo.com/v3/smtp/email";

        Map<String, Object> requestBody = Map.of(
                "sender", Map.of(
                        "name", "cartify",
                        "email", userEmail
                ),
                "to", new Object[]{
                        Map.of("email", toEmail)
                },
                "subject", "Reset Your cartify Password",
                "htmlContent", buildOtpHtml(otp)
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", brevoApiKey);

        HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(requestBody, headers);

        try {
            restTemplate.postForEntity(url, entity, String.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email via Brevo API", e);
        }
    }

    private String buildOtpHtml(String otp) {
        return """
            <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color:#f5f5f5; padding:30px;">
                <div style="max-width:600px; background:white; border-radius:16px; padding:40px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                    
                    <div style="text-align:center; margin-bottom:30px;">
                        <h1 style="font-family: 'Times New Roman', serif; font-size:32px; font-weight:700; letter-spacing:-1px; color:#1a1a1a; margin:0;">
                            CARTIFY
                        </h1>
                        <p style="color:#666; font-size:14px; margin:5px; letter-spacing:1px;">
                            LUXURY REDEFINED
                        </p>
                    </div>
                    
                    <h2 style="color:#1a1a1a; font-size:24px; font-weight:500; text-align:center; margin-bottom:10px;">
                        Reset Your Password
                    </h2>
                    
                    <p style="color:#666; text-align:center; font-size:16px; line-height:1.6; margin-bottom:30px;">
                        Hello,<br>
                        We received a request to reset your password for your cartify account.
                    </p>
                    
                    <div style="text-align:center; margin:40px 20px;">
                        <p style="color:#666; font-size:14px; margin-bottom:15px; letter-spacing:2px; text-align:center;">
                            YOUR VERIFICATION CODE
                        </p>
                        <div style="display:flex; justify-content:center; align-items:center;">
                            <span style="
                                font-family: 'Courier New', monospace;
                                font-size:24px;
                                font-weight:600;
                                letter-spacing:8px;
                                background:#1a1a1a;
                                color:white;
                                padding:15px;
                                border-radius:8px;
                                display:inline-block;
                                
                               ">
                                """ + otp + """
                            </span>
                        </div>
                    </div>
                    
                    <div style="background:#f9f9f9; padding:20px; border-radius:12px; margin:30px 0; text-align:center;">
                        <p style="color:#666; text-align:center; font-size:14px; margin:0;">
                            ⏰ This OTP is valid for <strong style="color:#1a1a1a;">5 minutes</strong>
                        </p>
                    </div>
                    
                    <p style="color:#999; font-size:13px; text-align:center; margin:30px 0 20px;">
                        If you didn't request this password reset, please ignore this email or contact support if you have concerns.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin:30px 0;" />
                    
                    <div style="text-align:center;">
                        <p style="font-size:12px; color:#aaa; margin:5px 0;">
                            © 2026 cartify. All rights reserved.
                        </p>
                        <p style="font-size:12px; color:#aaa; margin:5px 0;">
                            Luxury fashion for the discerning individual
                        </p>
                    </div>
                    
                </div>
            </div>
            """;
    }
}