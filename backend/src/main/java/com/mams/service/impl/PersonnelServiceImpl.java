package com.mams.service.impl;

import com.mams.dto.request.PersonnelCreateRequest;
import com.mams.dto.request.PersonnelUpdateRequest;
import com.mams.dto.response.UserSummaryDto;
import com.mams.entity.Base;
import com.mams.entity.User;
import com.mams.entity.enums.RoleType;
import com.mams.exception.BadRequestException;
import com.mams.exception.ResourceNotFoundException;
import com.mams.repository.BaseRepository;
import com.mams.repository.UserRepository;
import com.mams.service.PersonnelService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PersonnelServiceImpl implements PersonnelService {

    private final UserRepository userRepository;
    private final BaseRepository baseRepository;
    private final PasswordEncoder passwordEncoder;

    public PersonnelServiceImpl(UserRepository userRepository,
                                BaseRepository baseRepository,
                                PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.baseRepository = baseRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSummaryDto> getAllPersonnel(Long baseId, RoleType role) {
        List<User> users = userRepository.findAll();

        return users.stream()
                .filter(u -> baseId == null || (u.getBase() != null && u.getBase().getId().equals(baseId)))
                .filter(u -> role == null || u.getRole() == role)
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummaryDto getPersonnelById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return mapToDto(user);
    }

    @Override
    @Transactional
    public UserSummaryDto createPersonnel(PersonnelCreateRequest request) {
        String cleanUsername = request.getUsername().trim().toLowerCase();
        String cleanEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsername(cleanUsername)) {
            throw new BadRequestException("Service Username '" + cleanUsername + "' is already registered");
        }

        if (userRepository.existsByEmail(cleanEmail)) {
            throw new BadRequestException("Email address '" + cleanEmail + "' is already in use");
        }

        Base base = null;
        if (request.getBaseId() != null) {
            base = baseRepository.findById(request.getBaseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Base", "id", request.getBaseId()));
        }

        User user = new User(
                null,
                cleanUsername,
                cleanEmail,
                passwordEncoder.encode(request.getPassword()),
                request.getFullName().trim(),
                request.getRole(),
                base,
                "ACTIVE"
        );

        User saved = userRepository.save(user);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public UserSummaryDto updatePersonnel(Long id, PersonnelUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        String cleanEmail = request.getEmail().trim().toLowerCase();
        Optional<User> existingByEmail = userRepository.findByEmail(cleanEmail);
        if (existingByEmail.isPresent() && !existingByEmail.get().getId().equals(id)) {
            throw new BadRequestException("Email '" + cleanEmail + "' is already used by another user");
        }

        user.setFullName(request.getFullName().trim());
        user.setEmail(cleanEmail);
        user.setRole(request.getRole());

        if (request.getBaseId() != null) {
            Base base = baseRepository.findById(request.getBaseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Base", "id", request.getBaseId()));
            user.setBase(base);
        } else if (request.getRole() == RoleType.ADMIN) {
            user.setBase(null);
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            user.setStatus(request.getStatus().trim().toUpperCase());
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (request.getPassword().length() < 6) {
                throw new BadRequestException("Password must be at least 6 characters long");
            }
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User updated = userRepository.save(user);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void deletePersonnel(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        // Soft delete / deactivate
        user.setStatus("INACTIVE");
        userRepository.save(user);
    }

    private UserSummaryDto mapToDto(User user) {
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
