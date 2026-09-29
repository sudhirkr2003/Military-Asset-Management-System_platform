package com.mams.controller;

import com.mams.dto.response.ApiResponse;
import com.mams.dto.response.DashboardSummaryDto;
import com.mams.dto.response.MovementLedgerDto;
import com.mams.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard", description = "Endpoints for military asset dashboard summary, KPI metrics, charts, and activity")
@SecurityRequirement(name = "BearerAuth")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Get dashboard KPI summary (Opening balance, Purchases, Transfers, Net Movement, Assigned, Expended, Closing)")
    public ResponseEntity<ApiResponse<DashboardSummaryDto>> getSummary(
            @RequestParam(required = false) Long baseId,
            @RequestParam(required = false) Long equipmentTypeId,
            @RequestParam(required = false, defaultValue = "all") String period
    ) {
        DashboardSummaryDto summary = dashboardService.getSummary(baseId, equipmentTypeId, period);
        return ResponseEntity.ok(ApiResponse.ok("Dashboard summary retrieved successfully", summary));
    }

    @GetMapping("/recent-movements")
    @Operation(summary = "Get recent inventory movements and transactions")
    public ResponseEntity<ApiResponse<List<MovementLedgerDto>>> getRecentMovements(
            @RequestParam(required = false) Long baseId
    ) {
        List<MovementLedgerDto> movements = dashboardService.getRecentMovements(baseId);
        return ResponseEntity.ok(ApiResponse.ok("Recent movements retrieved successfully", movements));
    }

    @GetMapping("/category-distribution")
    @Operation(summary = "Get available inventory distribution by equipment category")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCategoryDistribution(
            @RequestParam(required = false) Long baseId
    ) {
        List<Map<String, Object>> distribution = dashboardService.getInventoryByCategory(baseId);
        return ResponseEntity.ok(ApiResponse.ok("Category distribution retrieved successfully", distribution));
    }
}
