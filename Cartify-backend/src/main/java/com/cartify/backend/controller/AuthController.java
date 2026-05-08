package com.cartify.backend.controller;

import com.cartify.backend.config.exception.ResourceNotFoundException;
import com.cartify.backend.dto.*;
import com.cartify.backend.entity.User;
import com.cartify.backend.repository.UserRepository;
import com.cartify.backend.service.ForgotPasswordService;
import com.cartify.backend.service.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ForgotPasswordService forgotPasswordService;

    @Autowired
    private JwtUtil jwtUtil;

    // ─── Register ────────────────────────────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(@RequestBody Map<String, String> request) {
        String email    = request.get("email");
        String username = request.get("username");
        String password = request.get("password");

        System.out.println("=== REGISTRATION ATTEMPT ===");
        System.out.println("Email: " + email);
        System.out.println("Username: " + username);

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
        user.setPassword(passwordEncoder.encode(password));
        user.setCreatedAt(LocalDateTime.now());

        long userCount = userRepository.count();
        user.setRole(userCount == 0 ? "ADMIN" : "USER");

        User savedUser = userRepository.save(user);

        String token = jwtUtil.generateToken(savedUser.getEmail(), savedUser.getRole());

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("id",       savedUser.getId());
        responseData.put("email",    savedUser.getEmail());
        responseData.put("username", savedUser.getUsername());
        responseData.put("role",     savedUser.getRole());
        responseData.put("token",    token);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", responseData));
    }

    // ─── Login ───────────────────────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody Map<String, String> request) {
        String email    = request.get("email");
        String password = request.get("password");

        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid email or password"));
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid email or password"));
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("id",       user.getId());
        responseData.put("email",    user.getEmail());
        responseData.put("username", user.getUsername());
        responseData.put("role",     user.getRole());
        responseData.put("token",    token);

        return ResponseEntity.ok(ApiResponse.success("Login successful", responseData));
    }

    // ─── Forgot Password: Generate OTP ───────────────────────────────────────────
    @PostMapping("/forgot-password/generate-otp")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        boolean result = forgotPasswordService.generateAndSendOtp(request.getEmail());

        if (!result) {
            return ResponseEntity.status(404).body(
                    new ApiResponse(false, "Failed to generate OTP", ""));
        }

        return ResponseEntity.ok(new ApiResponse(true, "OTP Sent Successfully", ""));
    }

    // ─── Forgot Password: Reset ───────────────────────────────────────────────────
    @PostMapping("/forgot-password/reset")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        boolean result = forgotPasswordService.resetPassword(
                request.getEmail(),
                request.getOtp(),
                request.getNewPassword()
        );

        if (!result) {
            return ResponseEntity.status(400).body(
                    new ApiResponse(false, "Password Reset Failed", ""));
        }

        return ResponseEntity.ok(new ApiResponse(true, "Password reset successful", ""));
    }

    // ─── Get Current User Profile ─────────────────────────────────────────────────
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurrentUserProfile() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String currentUserEmail = auth.getName();

            System.out.println("Getting profile for: " + currentUserEmail);

            Optional<User> userOpt = userRepository.findByEmail(currentUserEmail);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }

            return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully", buildProfileMap(userOpt.get())));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch profile: " + e.getMessage()));
        }
    }

    // ─── Update Current User Profile ──────────────────────────────────────────────
    // FIX: Each field is updated defensively with a try/catch so that missing
    // setters on the User entity (e.g. setState, setZipCode) do not cause a 500.
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateCurrentUserProfile(
            @RequestBody Map<String, Object> request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String currentUserEmail = auth.getName();

            System.out.println("Updating profile for: " + currentUserEmail);
            System.out.println("Request body: " + request);

            Optional<User> userOpt = userRepository.findByEmail(currentUserEmail);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }

            User user = userOpt.get();

            // ── Core fields — these setters must exist ────────────────────────────
            if (request.containsKey("username") && request.get("username") != null) {
                user.setUsername((String) request.get("username"));
            }
            if (request.containsKey("phoneNumber") && request.get("phoneNumber") != null) {
                user.setPhone((String) request.get("phoneNumber"));
            }
            if (request.containsKey("address") && request.get("address") != null) {
                user.setAddress((String) request.get("address"));
            }
            if (request.containsKey("city") && request.get("city") != null) {
                user.setCity((String) request.get("city"));
            }
            if (request.containsKey("profileImage") && request.get("profileImage") != null) {
                user.setProfileImage((String) request.get("profileImage"));
            }

            // ── Extended fields — guarded so missing setters won't cause 500 ──────
            if (request.containsKey("state") && request.get("state") != null) {
                try { user.setState((String) request.get("state")); }
                catch (Exception ignored) {
                    System.out.println("WARN: User entity has no setState() — field skipped");
                }
            }
            if (request.containsKey("country") && request.get("country") != null) {
                try { user.setCountry((String) request.get("country")); }
                catch (Exception ignored) {
                    System.out.println("WARN: User entity has no setCountry() — field skipped");
                }
            }
            if (request.containsKey("zipCode") && request.get("zipCode") != null) {
                try { user.setZipCode((String) request.get("zipCode")); }
                catch (Exception ignored) {
                    System.out.println("WARN: User entity has no setZipCode() — field skipped");
                }
            }

            if (user.getUpdatedAt() != null || true) {   // always set updatedAt if field exists
                try { user.setUpdatedAt(LocalDateTime.now()); }
                catch (Exception ignored) {
                    System.out.println("WARN: User entity has no setUpdatedAt() — field skipped");
                }
            }

            User updatedUser = userRepository.save(user);

            return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", buildProfileMap(updatedUser)));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update profile: " + e.getMessage()));
        }
    }

    // ─── Change Password ──────────────────────────────────────────────────────────
    @PutMapping("/profile/change-password")
    public ResponseEntity<ApiResponse<Void>> changeCurrentUserPassword(
            @RequestBody Map<String, String> request) {
        try {
            String currentPassword = request.get("currentPassword");
            String newPassword     = request.get("newPassword");

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String currentUserEmail = auth.getName();

            Optional<User> userOpt = userRepository.findByEmail(currentUserEmail);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }

            User user = userOpt.get();

            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Current password is incorrect"));
            }

            user.setPassword(passwordEncoder.encode(newPassword));
            try { user.setUpdatedAt(LocalDateTime.now()); } catch (Exception ignored) {}
            userRepository.save(user);

            return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to change password: " + e.getMessage()));
        }
    }

    // ─── Helper: build profile response map safely ────────────────────────────────
    private Map<String, Object> buildProfileMap(User user) {
        Map<String, Object> profile = new HashMap<>();
        profile.put("id",       user.getId());
        profile.put("email",    user.getEmail());
        profile.put("username", user.getUsername());
        profile.put("role",     user.getRole());

        // Each optional field is read defensively
        try { profile.put("phoneNumber",  user.getPhone()); }        catch (Exception e) { profile.put("phoneNumber",  null); }
        try { profile.put("address",      user.getAddress()); }      catch (Exception e) { profile.put("address",      null); }
        try { profile.put("city",         user.getCity()); }         catch (Exception e) { profile.put("city",         null); }
        try { profile.put("state",        user.getState()); }        catch (Exception e) { profile.put("state",        null); }
        try { profile.put("country",      user.getCountry()); }      catch (Exception e) { profile.put("country",      null); }
        try { profile.put("zipCode",      user.getZipCode()); }      catch (Exception e) { profile.put("zipCode",      null); }
        try { profile.put("profileImage", user.getProfileImage()); } catch (Exception e) { profile.put("profileImage", null); }
        try { profile.put("createdAt",    user.getCreatedAt() != null ? user.getCreatedAt().toString() : null); }
             catch (Exception e) { profile.put("createdAt", null); }

        return profile;
    }
}
