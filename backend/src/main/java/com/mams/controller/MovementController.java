package com.mams.controller;

import com.mams.dto.request.*;
import com.mams.dto.response.ApiResponse;
import com.mams.dto.response.MovementLedgerDto;
import com.mams.service.MovementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/movements")
@Tag(name = "Movements & Logistics", description = "Endpoints for asset procurement, base transfers, personnel assignments, and expenditures")
@SecurityRequirement(name = "BearerAuth")
public class MovementController {

    private final MovementService movementService;

    public MovementController(MovementService movementService) {
        this.movementService = movementService;
    }

    @PostMapping("/purchase")
    @Operation(summary = "Record new procurement / purchase of assets into base inventory")
    public ResponseEntity<ApiResponse<MovementLedgerDto>> recordPurchase(
            @Valid @RequestBody PurchaseRequest request,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "USER";
        MovementLedgerDto result = movementService.recordPurchase(request, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Purchase recorded and inventory updated successfully", result));
    }

    @PostMapping("/transfer")
    @Operation(summary = "Transfer military assets from one base to another")
    public ResponseEntity<ApiResponse<MovementLedgerDto>> recordTransfer(
            @Valid @RequestBody TransferRequest request,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "USER";
        MovementLedgerDto result = movementService.recordTransfer(request, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Asset transfer recorded successfully across bases", result));
    }

    @PostMapping("/assign")
    @Operation(summary = "Assign / Issue weapons or equipment to military personnel")
    public ResponseEntity<ApiResponse<MovementLedgerDto>> recordAssignment(
            @Valid @RequestBody AssignmentRequest request,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "USER";
        MovementLedgerDto result = movementService.recordAssignment(request, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Equipment assigned to personnel successfully", result));
    }

    @PostMapping("/return")
    @Operation(summary = "Record return of assigned equipment back to base armory")
    public ResponseEntity<ApiResponse<MovementLedgerDto>> recordReturn(
            @Valid @RequestBody ReturnAssignmentRequest request,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "USER";
        MovementLedgerDto result = movementService.recordReturn(request, username);
        return ResponseEntity.ok(ApiResponse.ok("Equipment returned to base inventory successfully", result));
    }

    @PostMapping("/expend")
    @Operation(summary = "Record expenditure / consumption of ammunition or fuel during operations")
    public ResponseEntity<ApiResponse<MovementLedgerDto>> recordExpenditure(
            @Valid @RequestBody ExpenditureRequest request,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "USER";
        MovementLedgerDto result = movementService.recordExpenditure(request, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Asset expenditure recorded and closing balance deducted", result));
    }

    @GetMapping
    @Operation(summary = "Get transaction ledger history with optional filters")
    public ResponseEntity<ApiResponse<List<MovementLedgerDto>>> getMovements(
            @RequestParam(required = false) Long baseId,
            @RequestParam(required = false) Long equipmentTypeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<MovementLedgerDto> movements = movementService.getMovements(baseId, equipmentTypeId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok("Movement transactions retrieved successfully", movements));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get specific movement transaction details by ID")
    public ResponseEntity<ApiResponse<MovementLedgerDto>> getMovementById(@PathVariable Long id) {
        MovementLedgerDto movement = movementService.getMovementById(id);
        return ResponseEntity.ok(ApiResponse.ok("Movement transaction details retrieved", movement));
    }
}
