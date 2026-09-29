package com.mams.service.impl;

import com.mams.dto.request.LoginRequest;
import com.mams.dto.request.RegisterRequest;
import com.mams.dto.response.AuthResponse;
import com.mams.dto.response.UserSummaryDto;
import com.mams.entity.Base;
import com.mams.entity.User;
import com.mams.entity.enums.RoleType;
import com.mams.exception.BadRequestException;
import com.mams.exception.ResourceNotFoundException;
import com.mams.repository.BaseRepository;
import com.mams.repository.UserRepository;
import com.mams.security.jwt.JwtUtils;
import com.mams.security.services.UserDetailsImpl;
import com.mams.service.AuthService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final BaseRepository baseRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           UserRepository userRepository,
                           BaseRepository baseRepository,
                           PasswordEncoder passwordEncoder,
                           JwtUtils jwtUtils) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.baseRepository = baseRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsernameOrEmail(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        String jwt = jwtUtils.generateToken(
                userDetails.getUsername(),
                userDetails.getRole().name(),
                userDetails.getBaseId()
        );

        UserSummaryDto userSummary = new UserSummaryDto(
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                userDetails.getFullName(),
                userDetails.getRole(),
                userDetails.getBaseId(),
                userDetails.getBaseName(),
                userDetails.getBaseCode(),
                userDetails.getStatus()
        );

        return new AuthResponse(jwt, "Bearer", userSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummaryDto getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new BadRequestException("No authenticated user found in security context");
        }

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userDetails.getId()));

        return mapToUserSummary(user);
    }

    @Override
    @Transactional
    public UserSummaryDto register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username is already taken: " + request.getUsername());
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already in use: " + request.getEmail());
        }

        Base base = null;
        if (request.getBaseId() != null) {
            base = baseRepository.findById(request.getBaseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Base", "id", request.getBaseId()));
        } else if (request.getRole() != RoleType.ADMIN) {
            base = baseRepository.findAll().stream().findFirst().orElse(null);
        }

        User user = new User(
                null,
                request.getUsername().trim().toLowerCase(),
                request.getEmail().trim().toLowerCase(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName() != null ? request.getFullName().trim() : "",
                request.getRole(),
                base,
                "ACTIVE"
        );

        User savedUser = userRepository.save(user);
        return mapToUserSummary(savedUser);
    }

    private UserSummaryDto mapToUserSummary(User user) {
        return new UserSummaryDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getBase() != null ? user.getBase().getId() : null,
                user.getBase() != null ? user.getBase().getName() : null,
                user.getBase() != null ? user.getBase().getCode() : null,
                user.getStatus()
        );
    }
}
