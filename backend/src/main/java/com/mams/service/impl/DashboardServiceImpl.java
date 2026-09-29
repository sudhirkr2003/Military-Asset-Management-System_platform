package com.mams.service.impl;

import com.mams.dto.response.DashboardSummaryDto;
import com.mams.dto.response.MovementLedgerDto;
import com.mams.entity.Inventory;
import com.mams.entity.MovementLedger;
import com.mams.entity.enums.MovementType;
import com.mams.repository.InventoryRepository;
import com.mams.repository.MovementLedgerRepository;
import com.mams.service.DashboardService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardServiceImpl implements DashboardService {

    private final InventoryRepository inventoryRepository;
    private final MovementLedgerRepository movementLedgerRepository;

    public DashboardServiceImpl(InventoryRepository inventoryRepository,
                                MovementLedgerRepository movementLedgerRepository) {
        this.inventoryRepository = inventoryRepository;
        this.movementLedgerRepository = movementLedgerRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryDto getSummary(Long baseId, Long equipmentTypeId, String period) {
        LocalDateTime startDate = calculateStartDate(period);
        LocalDateTime endDate = LocalDateTime.now();

        Long openingBalance = inventoryRepository.sumOpeningBalance(baseId, equipmentTypeId);
        Long availableQuantity = inventoryRepository.sumAvailableQuantity(baseId, equipmentTypeId);
        Long assignedQuantity = inventoryRepository.sumAssignedQuantity(baseId, equipmentTypeId);
        Long expendedQuantity = inventoryRepository.sumExpendedQuantity(baseId, equipmentTypeId);
        Long closingBalance = inventoryRepository.sumClosingBalance(baseId, equipmentTypeId);

        Long purchases = movementLedgerRepository.sumQuantityByMovementTypeAndFilters(
                MovementType.PURCHASE, baseId, equipmentTypeId, startDate, endDate);
        Long transferIn = movementLedgerRepository.sumQuantityByMovementTypeAndFilters(
                MovementType.TRANSFER_IN, baseId, equipmentTypeId, startDate, endDate);
        Long transferOut = movementLedgerRepository.sumQuantityByMovementTypeAndFilters(
                MovementType.TRANSFER_OUT, baseId, equipmentTypeId, startDate, endDate);

        long safeOpening = openingBalance != null ? openingBalance : 0;
        long safePurchases = purchases != null ? purchases : 0;
        long safeTransferIn = transferIn != null ? transferIn : 0;
        long safeTransferOut = transferOut != null ? transferOut : 0;
        long safeAssigned = assignedQuantity != null ? assignedQuantity : 0;
        long safeExpended = expendedQuantity != null ? expendedQuantity : 0;
        long safeClosing = closingBalance != null ? closingBalance : (safeOpening + safePurchases + safeTransferIn - safeTransferOut - safeExpended);

        long netMovement = safePurchases + safeTransferIn - safeTransferOut;

        return new DashboardSummaryDto(
                safeOpening,
                safePurchases,
                safeTransferIn,
                safeTransferOut,
                netMovement,
                safeAssigned,
                safeExpended,
                safeClosing
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovementLedgerDto> getRecentMovements(Long baseId) {
        return movementLedgerRepository.findRecentMovements(baseId).stream()
                .limit(10)
                .map(this::mapMovementToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getInventoryByCategory(Long baseId) {
        List<Inventory> inventories = baseId != null
                ? inventoryRepository.findByBaseId(baseId)
                : inventoryRepository.findAll();

        Map<String, Long> categoryCounts = new HashMap<>();
        for (Inventory inv : inventories) {
            if (inv.getEquipmentType() != null && inv.getEquipmentType().getCategory() != null) {
                String category = inv.getEquipmentType().getCategory().name();
                categoryCounts.put(category, categoryCounts.getOrDefault(category, 0L) + inv.getAvailableQuantity());
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, Long> entry : categoryCounts.entrySet()) {
            Map<String, Object> item = new HashMap<>();
            item.put("category", entry.getKey());
            item.put("quantity", entry.getValue());
            result.add(item);
        }

        return result;
    }

    private LocalDateTime calculateStartDate(String period) {
        if (period == null || period.trim().isEmpty() || "all".equalsIgnoreCase(period)) {
            return null;
        }
        LocalDate today = LocalDate.now();
        switch (period.toLowerCase()) {
            case "today":
                return today.atStartOfDay();
            case "this_week":
                return today.minusDays(today.getDayOfWeek().getValue() - 1).atStartOfDay();
            case "this_month":
                return today.withDayOfMonth(1).atStartOfDay();
            default:
                return null;
        }
    }

    private MovementLedgerDto mapMovementToDto(MovementLedger m) {
        return new MovementLedgerDto(
                m.getId(),
                m.getBase() != null ? m.getBase().getId() : null,
                m.getBase() != null ? m.getBase().getName() : null,
                m.getEquipmentType() != null ? m.getEquipmentType().getId() : null,
                m.getEquipmentType() != null ? m.getEquipmentType().getName() : null,
                m.getMovementType(),
                m.getQuantity(),
                m.getReferenceType(),
                m.getReferenceId(),
                m.getRemarks(),
                m.getCreatedBy(),
                m.getTimestamp()
        );
    }
}
