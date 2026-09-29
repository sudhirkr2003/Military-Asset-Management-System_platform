package com.mams.controller;

import com.mams.dto.request.BaseCreateRequest;
import com.mams.dto.response.ApiResponse;
import com.mams.dto.response.BaseDto;
import com.mams.service.BaseService;
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
@RequestMapping("/api/bases")
@Tag(name = "Bases", description = "Endpoints for managing and querying military bases and defense installations")
@SecurityRequirement(name = "BearerAuth")
public class BaseController {

    private final BaseService baseService;

    public BaseController(BaseService baseService) {
        this.baseService = baseService;
    }

    @GetMapping
    @Operation(summary = "Get list of all military bases")
    public ResponseEntity<ApiResponse<List<BaseDto>>> getAllBases() {
        List<BaseDto> bases = baseService.getAllBases();
        return ResponseEntity.ok(ApiResponse.ok("Bases retrieved successfully", bases));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get military base details by ID")
    public ResponseEntity<ApiResponse<BaseDto>> getBaseById(@PathVariable Long id) {
        BaseDto base = baseService.getBaseById(id);
        return ResponseEntity.ok(ApiResponse.ok("Base details retrieved successfully", base));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Register a new military installation or command sector")
    public ResponseEntity<ApiResponse<BaseDto>> createBase(@Valid @RequestBody BaseCreateRequest request) {
        BaseDto created = baseService.createBase(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Military base created successfully", created));
    }
}
