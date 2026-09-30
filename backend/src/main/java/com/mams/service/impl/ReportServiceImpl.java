package com.mams.service.impl;

import com.mams.dto.response.InventoryDto;
import com.mams.dto.response.MovementLedgerDto;
import com.mams.entity.Inventory;
import com.mams.entity.MovementLedger;
import com.mams.entity.enums.MovementType;
import com.mams.repository.BaseRepository;
import com.mams.repository.InventoryRepository;
import com.mams.repository.MovementLedgerRepository;
import com.mams.service.ReportService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReportServiceImpl implements ReportService {

    private final MovementLedgerRepository movementLedgerRepository;
    private final InventoryRepository inventoryRepository;
    private final BaseRepository baseRepository;
    private final com.mams.security.SecurityUtils securityUtils;

    public ReportServiceImpl(MovementLedgerRepository movementLedgerRepository,
                             InventoryRepository inventoryRepository,
                             BaseRepository baseRepository,
                             com.mams.security.SecurityUtils securityUtils) {
        this.movementLedgerRepository = movementLedgerRepository;
        this.inventoryRepository = inventoryRepository;
        this.baseRepository = baseRepository;
        this.securityUtils = securityUtils;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovementLedgerDto> getMovementAuditReport(Long baseId, MovementType movementType, LocalDateTime startDate, LocalDateTime endDate) {
        Long effectiveBaseId = securityUtils.validateAndGetEffectiveBaseId(baseId);
        List<MovementLedger> movements = movementLedgerRepository.findAll();

        return movements.stream()
                .filter(m -> effectiveBaseId == null || (m.getBase() != null && m.getBase().getId().equals(effectiveBaseId)))
                .filter(m -> movementType == null || m.getMovementType() == movementType)
                .filter(m -> startDate == null || (m.getTimestamp() != null && !m.getTimestamp().isBefore(startDate)))
                .filter(m -> endDate == null || (m.getTimestamp() != null && !m.getTimestamp().isAfter(endDate)))
                .sorted((a, b) -> {
                    if (a.getTimestamp() == null || b.getTimestamp() == null) return 0;
                    return b.getTimestamp().compareTo(a.getTimestamp());
                })
                .map(this::mapToMovementDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovementLedgerDto> getExpenditureReport(Long baseId, LocalDateTime startDate, LocalDateTime endDate) {
        return getMovementAuditReport(baseId, MovementType.EXPENDITURE, startDate, endDate);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryDto> getInventoryAuditReport(Long baseId) {
        Long effectiveBaseId = securityUtils.validateAndGetEffectiveBaseId(baseId);
        List<Inventory> inventories = inventoryRepository.findAll();

        return inventories.stream()
                .filter(i -> effectiveBaseId == null || (i.getBase() != null && i.getBase().getId().equals(effectiveBaseId)))
                .map(this::mapToInventoryDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportReportToCsv(String reportType, Long baseId, MovementType movementType, LocalDateTime startDate, LocalDateTime endDate) {
        StringBuilder csv = new StringBuilder();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        if ("inventory".equalsIgnoreCase(reportType)) {
            csv.append("Base Installation,Equipment Name,Category,Opening Balance,Available Quantity,Assigned Quantity,Expended Quantity,Closing Balance\n");
            List<InventoryDto> invs = getInventoryAuditReport(baseId);
            for (InventoryDto inv : invs) {
                csv.append(escapeCsv(inv.getBaseName())).append(",")
                        .append(escapeCsv(inv.getEquipmentName())).append(",")
                        .append(escapeCsv(inv.getEquipmentCategory())).append(",")
                        .append(inv.getOpeningBalance()).append(",")
                        .append(inv.getAvailableQuantity()).append(",")
                        .append(inv.getAssignedQuantity()).append(",")
                        .append(inv.getExpendedQuantity()).append(",")
                        .append(inv.getClosingBalance())
                        .append("\n");
            }
        } else if ("expenditures".equalsIgnoreCase(reportType)) {
            csv.append("Transaction ID,Date Time,Base,Equipment,Category,Quantity Expended,Remarks / Operational Purpose,Logged By\n");
            List<MovementLedgerDto> exps = getExpenditureReport(baseId, startDate, endDate);
            for (MovementLedgerDto m : exps) {
                csv.append(m.getId()).append(",")
                        .append(m.getTimestamp() != null ? m.getTimestamp().format(dtf) : "").append(",")
                        .append(escapeCsv(m.getBaseName())).append(",")
                        .append(escapeCsv(m.getEquipmentName())).append(",")
                        .append(escapeCsv(m.getEquipmentCategory())).append(",")
                        .append(m.getQuantity()).append(",")
                        .append(escapeCsv(m.getRemarks())).append(",")
                        .append(escapeCsv(m.getCreatedBy()))
                        .append("\n");
            }
        } else {
            // Default: Full Movement Ledger
            csv.append("Transaction ID,Date Time,Base Installation,Equipment Name,Category,Movement Type,Quantity,Reference / Remarks,Logged By\n");
            List<MovementLedgerDto> movements = getMovementAuditReport(baseId, movementType, startDate, endDate);
            for (MovementLedgerDto m : movements) {
                csv.append(m.getId()).append(",")
                        .append(m.getTimestamp() != null ? m.getTimestamp().format(dtf) : "").append(",")
                        .append(escapeCsv(m.getBaseName())).append(",")
                        .append(escapeCsv(m.getEquipmentName())).append(",")
                        .append(escapeCsv(m.getEquipmentCategory())).append(",")
                        .append(m.getMovementType() != null ? m.getMovementType().name() : "").append(",")
                        .append(m.getQuantity()).append(",")
                        .append(escapeCsv(m.getRemarks())).append(",")
                        .append(escapeCsv(m.getCreatedBy()))
                        .append("\n");
            }
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private MovementLedgerDto mapToMovementDto(MovementLedger m) {
        return new MovementLedgerDto(
                m.getId(),
                m.getBase() != null ? m.getBase().getId() : null,
                m.getBase() != null ? m.getBase().getName() : null,
                m.getEquipmentType() != null ? m.getEquipmentType().getId() : null,
                m.getEquipmentType() != null ? m.getEquipmentType().getName() : null,
                m.getEquipmentType() != null && m.getEquipmentType().getCategory() != null ? m.getEquipmentType().getCategory().name() : null,
                m.getMovementType(),
                m.getQuantity(),
                m.getReferenceType(),
                m.getReferenceId(),
                m.getRemarks(),
                m.getCreatedBy() != null ? m.getCreatedBy() : "ADMIN",
                m.getTimestamp()
        );
    }

    private InventoryDto mapToInventoryDto(Inventory i) {
        return new InventoryDto(
                i.getId(),
                i.getBase() != null ? i.getBase().getId() : null,
                i.getBase() != null ? i.getBase().getName() : null,
                i.getEquipmentType() != null ? i.getEquipmentType().getId() : null,
                i.getEquipmentType() != null ? i.getEquipmentType().getName() : null,
                i.getEquipmentType() != null && i.getEquipmentType().getCategory() != null ? i.getEquipmentType().getCategory().name() : null,
                i.getOpeningBalance(),
                i.getAvailableQuantity(),
                i.getAssignedQuantity(),
                i.getExpendedQuantity(),
                i.getClosingBalance()
        );
    }
}
