package com.mams.controller;

import com.mams.dto.response.ApiResponse;
import com.mams.dto.response.InventoryDto;
import com.mams.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/inventory")
@Tag(name = "Inventory", description = "Endpoints for viewing live stock balances across military bases")
@SecurityRequirement(name = "BearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    @Operation(summary = "Get live inventory balances across all military bases")
    public ResponseEntity<ApiResponse<List<InventoryDto>>> getAllInventory() {
        List<InventoryDto> inventory = inventoryService.getAllInventory();
        return ResponseEntity.ok(ApiResponse.ok("Inventory list retrieved successfully", inventory));
    }

    @GetMapping("/base/{baseId}")
    @Operation(summary = "Get live inventory balances for a specific military base")
    public ResponseEntity<ApiResponse<List<InventoryDto>>> getInventoryByBase(@PathVariable Long baseId) {
        List<InventoryDto> inventory = inventoryService.getInventoryByBase(baseId);
        return ResponseEntity.ok(ApiResponse.ok("Base inventory retrieved successfully", inventory));
    }

    @GetMapping("/base/{baseId}/equipment/{equipmentTypeId}")
    @Operation(summary = "Get live stock balance for a specific equipment at a specific base")
    public ResponseEntity<ApiResponse<InventoryDto>> getInventoryByBaseAndEquipment(
            @PathVariable Long baseId,
            @PathVariable Long equipmentTypeId) {
        InventoryDto inventory = inventoryService.getInventoryByBaseAndEquipment(baseId, equipmentTypeId);
        return ResponseEntity.ok(ApiResponse.ok("Inventory details retrieved successfully", inventory));
    }
}
