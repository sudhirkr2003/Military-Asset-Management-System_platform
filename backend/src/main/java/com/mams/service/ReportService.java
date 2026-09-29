package com.mams.service;

import com.mams.dto.response.InventoryDto;
import com.mams.dto.response.MovementLedgerDto;
import com.mams.entity.enums.MovementType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface ReportService {
    List<MovementLedgerDto> getMovementAuditReport(Long baseId, MovementType movementType, LocalDateTime startDate, LocalDateTime endDate);
    List<MovementLedgerDto> getExpenditureReport(Long baseId, LocalDateTime startDate, LocalDateTime endDate);
    List<InventoryDto> getInventoryAuditReport(Long baseId);
    byte[] exportReportToCsv(String reportType, Long baseId, MovementType movementType, LocalDateTime startDate, LocalDateTime endDate);
}
