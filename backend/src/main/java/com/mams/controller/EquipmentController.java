package com.mams.controller;

import com.mams.dto.response.ApiResponse;
import com.mams.dto.response.EquipmentTypeDto;
import com.mams.service.EquipmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipment")
@Tag(name = "Equipment", description = "Endpoints for managing and querying military equipment types")
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
}
