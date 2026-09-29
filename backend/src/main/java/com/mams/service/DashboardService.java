package com.mams.service;

import com.mams.dto.response.DashboardSummaryDto;
import com.mams.dto.response.MovementLedgerDto;

import java.util.List;
import java.util.Map;

public interface DashboardService {
    DashboardSummaryDto getSummary(Long baseId, Long equipmentTypeId, String period);
    List<MovementLedgerDto> getRecentMovements(Long baseId);
    List<Map<String, Object>> getInventoryByCategory(Long baseId);
}
