package com.mams.controller;

import com.mams.dto.response.ApiResponse;
import com.mams.dto.response.InventoryDto;
import com.mams.dto.response.MovementLedgerDto;
import com.mams.entity.enums.MovementType;
import com.mams.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/reports")
@Tag(name = "Reports & Audit", description = "Endpoints for generating logistical audit reports, expenditure metrics, and CSV/PDF data exports")
@SecurityRequirement(name = "BearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/movements")
    @Operation(summary = "Get movement and procurement audit report with filters")
    public ResponseEntity<ApiResponse<List<MovementLedgerDto>>> getMovementAuditReport(
            @RequestParam(required = false) Long baseId,
            @RequestParam(required = false) MovementType movementType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<MovementLedgerDto> list = reportService.getMovementAuditReport(baseId, movementType, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok("Movement audit report generated successfully", list));
    }

    @GetMapping("/expenditures")
    @Operation(summary = "Get ammunition and fuel operational expenditure report")
    public ResponseEntity<ApiResponse<List<MovementLedgerDto>>> getExpenditureReport(
            @RequestParam(required = false) Long baseId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<MovementLedgerDto> list = reportService.getExpenditureReport(baseId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok("Expenditure report generated successfully", list));
    }

    @GetMapping("/inventory-audit")
    @Operation(summary = "Get base armory inventory audit and stock health report")
    public ResponseEntity<ApiResponse<List<InventoryDto>>> getInventoryAuditReport(
            @RequestParam(required = false) Long baseId) {
        List<InventoryDto> list = reportService.getInventoryAuditReport(baseId);
        return ResponseEntity.ok(ApiResponse.ok("Inventory audit report generated successfully", list));
    }

    @GetMapping("/export/csv")
    @Operation(summary = "Export audit or inventory report directly to CSV file")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(defaultValue = "movements") String type,
            @RequestParam(required = false) Long baseId,
            @RequestParam(required = false) MovementType movementType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        byte[] csvData = reportService.exportReportToCsv(type, baseId, movementType, startDate, endDate);
        String filename = "mams_" + type.toLowerCase() + "_report_" + System.currentTimeMillis() + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }
}
