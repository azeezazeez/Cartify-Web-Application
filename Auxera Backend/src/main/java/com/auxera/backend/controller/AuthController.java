package com.auxera.backend.controller;

import com.auxera.backend.dto.ApiResponse;
import com.auxera.backend.dto.ForgotPasswordRequest;
import com.auxera.backend.dto.ResetPasswordRequest;
import com.auxera.backend.entity.User;
import com.auxera.backend.repository.UserRepository;
import com.auxera.backend.service.ForgotPasswordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin("*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private  ForgotPasswordService forgotPasswordService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String username = request.get("username");
        String password = request.get("password");

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("Email already registered"));
        }

        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("Username already taken"));
        }

        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPassword(password); // In production, you should still encrypt this!

        long userCount = userRepository.count();
        user.setRole(userCount == 0 ? "ADMIN" : "USER");
        user.setCreatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("id", savedUser.getId());
        response.put("email", savedUser.getEmail());
        response.put("username", savedUser.getUsername());
        response.put("role", savedUser.getRole());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
    }

    // ===============================
    // FORGOT PASSWORD (Send OTP)
    // ===============================
    @PostMapping("/forgot-password/generate-otp")
    public ResponseEntity<?> forgotPassword(
            @RequestBody ForgotPasswordRequest request) {

        boolean result = forgotPasswordService
                .generateAndSendOtp(request.getEmail());

        if (!result) {
            return ResponseEntity.status(404).body(
                    new ApiResponse(
                            false, "Failed to generate OTP", ""
                    )
            );
        }

        return ResponseEntity.ok(
                new ApiResponse(
                        true, "OTP Sent Successfully", ""
                )
        );
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<?> resetPassword(
            @RequestBody ResetPasswordRequest request) {

        boolean result = forgotPasswordService.resetPassword(
                request.getEmail(),
                request.getOtp(),
                request.getNewPassword()
        );

        if (!result) {
            return ResponseEntity.status(400).body(
                    new ApiResponse(
                            false, "Password Reset Failed", ""
                    )
            );
        }

        return ResponseEntity.ok(
                new ApiResponse(
                        true,
                        "Password reset successful",
                        ""
                )
        );
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid email or password"));
        }

        User user = userOpt.get();

        // In production, use password encoder!
        if (!password.equals(user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid email or password"));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("username", user.getUsername());
        response.put("role", user.getRole());

        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }
}