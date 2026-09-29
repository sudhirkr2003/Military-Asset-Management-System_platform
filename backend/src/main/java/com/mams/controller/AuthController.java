package com.mams.controller;

import com.mams.dto.request.LoginRequest;
import com.mams.dto.request.RegisterRequest;
import com.mams.dto.response.ApiResponse;
import com.mams.dto.response.AuthResponse;
import com.mams.dto.response.UserSummaryDto;
import com.mams.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints for user login, current user profile, and user registration")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and get JWT access token")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user details", security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<ApiResponse<UserSummaryDto>> getCurrentUser() {
        UserSummaryDto userSummary = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok("User profile retrieved successfully", userSummary));
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user account (Admin only)", security = @SecurityRequirement(name = "BearerAuth"))
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserSummaryDto>> register(@Valid @RequestBody RegisterRequest registerRequest) {
        UserSummaryDto userSummary = authService.register(registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("User registered successfully", userSummary));
    }
}
