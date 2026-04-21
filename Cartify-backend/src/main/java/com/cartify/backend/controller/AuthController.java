package com.cartify.backend.controller;

import com.cartify.backend.config.exception.ResourceNotFoundException;
import com.cartify.backend.dto.*;
import com.cartify.backend.entity.UpdateProfile;
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
@RequestMapping("/api")
@CrossOrigin("*")
public class AuthController {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ForgotPasswordService forgotPasswordService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/auth/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(@RequestBody Map<String, String> request) {

        String email = request.get("email");
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
        responseData.put("id", savedUser.getId());
        responseData.put("email", savedUser.getEmail());
        responseData.put("username", savedUser.getUsername());
        responseData.put("role", savedUser.getRole());
        responseData.put("token", token);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", responseData));
    }

    @PostMapping("/auth/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
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
        responseData.put("id", user.getId());
        responseData.put("email", user.getEmail());
        responseData.put("username", user.getUsername());
        responseData.put("role", user.getRole());
        responseData.put("token", token);

        return ResponseEntity.ok(ApiResponse.success("Login successful", responseData));
    }

    @PostMapping("/auth/forgot-password/generate-otp")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        boolean result = forgotPasswordService.generateAndSendOtp(request.getEmail());

        if (!result) {
            return ResponseEntity.status(404).body(
                    new ApiResponse(false, "Failed to generate OTP", ""));
        }

        return ResponseEntity.ok(new ApiResponse(true, "OTP Sent Successfully", ""));
    }

    @PostMapping("/auth/forgot-password/reset")
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

    @PatchMapping("/user/profile")
    public ResponseEntity<?> updateProfile(String userId, UpdateProfile request) {
        Long id = Long.parseLong(userId);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (request.getName() != null) {
            user.setUsername(request.getName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }
        if (request.getCity() != null) {
            user.setCity(request.getCity());
        }
        if (request.getCountry() != null) {
            user.setCountry(request.getCountry());
        }

        return ResponseEntity.ok(userRepository.save(user));
    }

    // Get current user profile - FIXED
    @GetMapping("/auth/profile")
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

            User user = userOpt.get();

            Map<String, Object> profile = new HashMap<>();
            profile.put("id", user.getId());
            profile.put("email", user.getEmail());
            profile.put("username", user.getUsername());
            profile.put("phoneNumber", user.getPhone());
            profile.put("address", user.getAddress());
            profile.put("city", user.getCity());
            profile.put("state", user.getState());
            profile.put("country", user.getCountry());
            profile.put("zipCode", user.getZipCode());
            profile.put("role", user.getRole());
            profile.put("profileImage", user.getProfileImage());
            profile.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);

            return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully", profile));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch profile: " + e.getMessage()));
        }
    }

    // Update current user profile - FIXED
    @PutMapping("/auth/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateCurrentUserProfile(
            @RequestBody Map<String, Object> request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String currentUserEmail = auth.getName();

            System.out.println("Updating profile for: " + currentUserEmail);

            Optional<User> userOpt = userRepository.findByEmail(currentUserEmail);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }

            User user = userOpt.get();

            // Update only provided fields
            if (request.containsKey("username")) user.setUsername((String) request.get("username"));
            if (request.containsKey("phoneNumber")) user.setPhone((String) request.get("phoneNumber"));
            if (request.containsKey("address")) user.setAddress((String) request.get("address"));
            if (request.containsKey("city")) user.setCity((String) request.get("city"));
            if (request.containsKey("state")) user.setState((String) request.get("state"));
            if (request.containsKey("country")) user.setCountry((String) request.get("country"));
            if (request.containsKey("zipCode")) user.setZipCode((String) request.get("zipCode"));
            if (request.containsKey("profileImage")) user.setProfileImage((String) request.get("profileImage"));

            user.setUpdatedAt(LocalDateTime.now());
            User updatedUser = userRepository.save(user);

            Map<String, Object> profile = new HashMap<>();
            profile.put("id", updatedUser.getId());
            profile.put("email", updatedUser.getEmail());
            profile.put("username", updatedUser.getUsername());
            profile.put("phoneNumber", updatedUser.getPhone());
            profile.put("address", updatedUser.getAddress());
            profile.put("city", updatedUser.getCity());
            profile.put("state", updatedUser.getState());
            profile.put("country", updatedUser.getCountry());
            profile.put("zipCode", updatedUser.getZipCode());
            profile.put("role", updatedUser.getRole());
            profile.put("profileImage", updatedUser.getProfileImage());

            return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", profile));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update profile: " + e.getMessage()));
        }
    }

    // Change current user password - FIXED
    @PutMapping("/auth/profile/change-password")
    public ResponseEntity<ApiResponse<Void>> changeCurrentUserPassword(
            @RequestBody Map<String, String> request) {
        try {
            String currentPassword = request.get("currentPassword");
            String newPassword = request.get("newPassword");

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String currentUserEmail = auth.getName();

            Optional<User> userOpt = userRepository.findByEmail(currentUserEmail);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }

            User user = userOpt.get();

            // Verify current password
            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Current password is incorrect"));
            }

            // Update to new password
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);

            return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to change password: " + e.getMessage()));
        }
    }

    public void deleteUser(@RequestBody LoginRequest request) {
        userRepository.deleteById(userRepository.findByEmail(request.getEmail()).orElseThrow().getId());
    }
}
