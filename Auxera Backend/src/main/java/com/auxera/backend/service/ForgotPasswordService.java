package com.auxera.backend.service;

import com.auxera.backend.service.EmailService;
import com.auxera.backend.entity.PasswordReset;
import com.auxera.backend.entity.User;
import com.auxera.backend.repository.PasswordResetRepository;
import com.auxera.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;


@Service
@RequiredArgsConstructor
public class ForgotPasswordService {

    private final EmailService emailService;
    private final UserRepository userRepository;
    private final PasswordResetRepository passwordResetRepository;

    private static final SecureRandom secureRandom = new SecureRandom();

    // ======================================
    // Generate Secure 6 Digit OTP
    // ======================================
    public String generateOtp() {
        int otp = secureRandom.nextInt(900000) + 100000;
        return String.valueOf(otp);
    }

    // ======================================
    // Send OTP Email
    // ======================================
    public void sendOtpEmail(String email, String otp) {
        emailService.sendOtp(email, otp);
    }

    // ======================================
    // Forgot Password - Generate & Send OTP
    // ======================================
    public boolean generateAndSendOtp(String email) {

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return false;

        String otp = generateOtp();

        PasswordReset reset = passwordResetRepository
                .findByEmail(email)
                .orElse(new PasswordReset());

        reset.setEmail(email);
        reset.setOtp(otp);
        reset.setExpiryTime(LocalDateTime.now().plusMinutes(5));
        reset.setAttemptCount(0);

        passwordResetRepository.save(reset);

        sendOtpEmail(email, otp);

        return true;
    }

    // ======================================
    // Verify OTP
    // ======================================
    public boolean verifyOtp(String email, String otp) {

        PasswordReset reset = passwordResetRepository
                .findByEmail(email)
                .orElse(null);

        if (reset == null) return false;

        // Expired
        if (reset.getExpiryTime().isBefore(LocalDateTime.now()))
            return false;

        // Too many attempts
        if (reset.getAttemptCount() >= 5)
            return false;

        // Wrong OTP
        if (!reset.getOtp().equals(otp)) {
            reset.setAttemptCount(reset.getAttemptCount() + 1);
            passwordResetRepository.save(reset);
            return false;
        }

        return true;
    }

    // ======================================
    // Reset Password
    // ======================================
    public boolean resetPassword(String email, String otp, String newPassword) {

        boolean validOtp = verifyOtp(email, otp);
        if (!validOtp) return false;

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return false;

        user.setPassword(newPassword);
        userRepository.save(user);

        // Clear OTP after success
        PasswordReset reset = passwordResetRepository
                .findByEmail(email)
                .orElse(null);

        if (reset != null) {
            reset.setOtp(null);
            reset.setExpiryTime(null);
            reset.setAttemptCount(0);
            passwordResetRepository.save(reset);
        }

        return true;
    }
}