package com.mams.controller;

import com.mams.dto.request.EquipmentCreateRequest;
import com.mams.dto.request.EquipmentUpdateRequest;
import com.mams.dto.response.ApiResponse;
import com.mams.dto.response.EquipmentTypeDto;
import com.mams.service.EquipmentService;
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
@RequestMapping("/api/equipment")
@Tag(name = "Equipment", description = "Endpoints for registering, updating, and querying military equipment and asset types")
@SecurityRequirement(name = "BearerAuth")
public class EquipmentController {

    private final EquipmentService equipmentService;

    public EquipmentController(EquipmentService equipmentService) {
        this.equipmentService = equipmentService;
    }

    @GetMapping
    @Operation(summary = "Get list of all military equipment types")
    public ResponseEntity<ApiResponse<List<EquipmentTypeDto>>> getAllEquipmentTypes() {
        List<EquipmentTypeDto> equipmentList = equipmentService.getAllEquipmentTypes();
        return ResponseEntity.ok(ApiResponse.ok("Equipment types retrieved successfully", equipmentList));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get equipment type details by ID")
    public ResponseEntity<ApiResponse<EquipmentTypeDto>> getEquipmentById(@PathVariable Long id) {
        EquipmentTypeDto equipment = equipmentService.getEquipmentTypeById(id);
        return ResponseEntity.ok(ApiResponse.ok("Equipment details retrieved successfully", equipment));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LOGISTICS_OFFICER')")
    @Operation(summary = "Register a new military equipment / asset type into defense catalog")
    public ResponseEntity<ApiResponse<EquipmentTypeDto>> createEquipment(@Valid @RequestBody EquipmentCreateRequest request) {
        EquipmentTypeDto created = equipmentService.createEquipment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Equipment type created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LOGISTICS_OFFICER')")
    @Operation(summary = "Update an existing military equipment / asset type")
    public ResponseEntity<ApiResponse<EquipmentTypeDto>> updateEquipment(
            @PathVariable Long id,
            @Valid @RequestBody EquipmentUpdateRequest request) {
        EquipmentTypeDto updated = equipmentService.updateEquipment(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Equipment type updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate/decommission an equipment type (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteEquipment(@PathVariable Long id) {
        equipmentService.deleteEquipment(id);
        return ResponseEntity.ok(ApiResponse.ok("Equipment type deactivated successfully", null));
    }
}
