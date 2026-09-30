package com.mams.controller;

import com.mams.dto.request.PersonnelCreateRequest;
import com.mams.dto.request.PersonnelUpdateRequest;
import com.mams.dto.response.ApiResponse;
import com.mams.dto.response.UserSummaryDto;
import com.mams.entity.enums.RoleType;
import com.mams.service.PersonnelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/personnel")
@Tag(name = "Personnel", description = "Endpoints for managing military officers, base commanders, logistics officers, and soldiers")
@SecurityRequirement(name = "BearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class PersonnelController {

    private final PersonnelService personnelService;

    public PersonnelController(PersonnelService personnelService) {
        this.personnelService = personnelService;
    }

    @GetMapping
    @Operation(summary = "Get list of all military personnel (optionally filter by baseId or role)")
    public ResponseEntity<ApiResponse<List<UserSummaryDto>>> getAllPersonnel(
            @RequestParam(required = false) Long baseId,
            @RequestParam(required = false) RoleType role) {
        List<UserSummaryDto> list = personnelService.getAllPersonnel(baseId, role);
        return ResponseEntity.ok(ApiResponse.ok("Personnel retrieved successfully", list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get personnel details by ID")
    public ResponseEntity<ApiResponse<UserSummaryDto>> getPersonnelById(@PathVariable Long id) {
        UserSummaryDto personnel = personnelService.getPersonnelById(id);
        return ResponseEntity.ok(ApiResponse.ok("Personnel details retrieved successfully", personnel));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Register new military personnel/officer into system")
    public ResponseEntity<ApiResponse<UserSummaryDto>> createPersonnel(@Valid @RequestBody PersonnelCreateRequest request) {
        UserSummaryDto created = personnelService.createPersonnel(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Personnel registered successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update personnel details, base assignment, or military role")
    public ResponseEntity<ApiResponse<UserSummaryDto>> updatePersonnel(
            @PathVariable Long id,
            @Valid @RequestBody PersonnelUpdateRequest request) {
        UserSummaryDto updated = personnelService.updatePersonnel(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Personnel details updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate/decommission personnel record (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deletePersonnel(@PathVariable Long id) {
        personnelService.deletePersonnel(id);
        return ResponseEntity.ok(ApiResponse.ok("Personnel deactivated successfully", null));
    }
}
