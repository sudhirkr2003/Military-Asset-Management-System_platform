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
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardServiceImpl implements DashboardService {

    private final InventoryRepository inventoryRepository;
    private final MovementLedgerRepository movementLedgerRepository;
    private final com.mams.security.SecurityUtils securityUtils;

    public DashboardServiceImpl(InventoryRepository inventoryRepository,
                                MovementLedgerRepository movementLedgerRepository,
                                com.mams.security.SecurityUtils securityUtils) {
        this.inventoryRepository = inventoryRepository;
        this.movementLedgerRepository = movementLedgerRepository;
        this.securityUtils = securityUtils;
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryDto getSummary(Long baseId, Long equipmentTypeId, String period) {
        Long effectiveBaseId = securityUtils.validateAndGetEffectiveBaseId(baseId);
        LocalDateTime startDate = calculateStartDate(period);
        LocalDateTime endDate = LocalDateTime.now();

        List<Inventory> inventories = effectiveBaseId != null
                ? inventoryRepository.findByBaseId(effectiveBaseId)
                : inventoryRepository.findAll();

        if (equipmentTypeId != null) {
            inventories = inventories.stream()
                    .filter(i -> i.getEquipmentType() != null && equipmentTypeId.equals(i.getEquipmentType().getId()))
                    .collect(Collectors.toList());
        }

        long openingBalance = inventories.stream().mapToLong(Inventory::getOpeningBalance).sum();
        long availableQuantity = inventories.stream().mapToLong(Inventory::getAvailableQuantity).sum();
        long assignedQuantity = inventories.stream().mapToLong(Inventory::getAssignedQuantity).sum();
        long expendedQuantity = inventories.stream().mapToLong(Inventory::getExpendedQuantity).sum();
        long closingBalance = inventories.stream().mapToLong(Inventory::getClosingBalance).sum();

        List<MovementLedger> movements = effectiveBaseId != null
                ? movementLedgerRepository.findByBaseId(effectiveBaseId)
                : movementLedgerRepository.findAll();

        if (equipmentTypeId != null) {
            movements = movements.stream()
                    .filter(m -> m.getEquipmentType() != null && equipmentTypeId.equals(m.getEquipmentType().getId()))
                    .collect(Collectors.toList());
        }

        if (startDate != null) {
            movements = movements.stream()
                    .filter(m -> m.getTimestamp() != null && !m.getTimestamp().isBefore(startDate))
                    .collect(Collectors.toList());
        }

        if (endDate != null) {
            movements = movements.stream()
                    .filter(m -> m.getTimestamp() != null && !m.getTimestamp().isAfter(endDate))
                    .collect(Collectors.toList());
        }

        long purchases = movements.stream()
                .filter(m -> m.getMovementType() == MovementType.PURCHASE)
                .mapToLong(MovementLedger::getQuantity)
                .sum();

        long transferIn = movements.stream()
                .filter(m -> m.getMovementType() == MovementType.TRANSFER_IN)
                .mapToLong(MovementLedger::getQuantity)
                .sum();

        long transferOut = movements.stream()
                .filter(m -> m.getMovementType() == MovementType.TRANSFER_OUT)
                .mapToLong(MovementLedger::getQuantity)
                .sum();

        long safeClosing = closingBalance > 0
                ? closingBalance
                : (openingBalance + purchases + transferIn - transferOut - expendedQuantity);

        if (safeClosing <= 0 && (availableQuantity > 0 || assignedQuantity > 0)) {
            safeClosing = availableQuantity + assignedQuantity;
        }

        long netMovement = purchases + transferIn - transferOut;

        return new DashboardSummaryDto(
                openingBalance,
                purchases,
                transferIn,
                transferOut,
                netMovement,
                assignedQuantity,
                expendedQuantity,
                safeClosing
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovementLedgerDto> getRecentMovements(Long baseId) {
        Long effectiveBaseId = securityUtils.validateAndGetEffectiveBaseId(baseId);
        List<MovementLedger> movements = effectiveBaseId != null
                ? movementLedgerRepository.findByBaseId(effectiveBaseId)
                : movementLedgerRepository.findAll();

        return movements.stream()
                .sorted((a, b) -> {
                    if (a.getTimestamp() == null && b.getTimestamp() == null) return 0;
                    if (a.getTimestamp() == null) return 1;
                    if (b.getTimestamp() == null) return -1;
                    return b.getTimestamp().compareTo(a.getTimestamp());
                })
                .limit(10)
                .map(this::mapMovementToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getInventoryByCategory(Long baseId) {
        Long effectiveBaseId = securityUtils.validateAndGetEffectiveBaseId(baseId);
        List<Inventory> inventories = effectiveBaseId != null
                ? inventoryRepository.findByBaseId(effectiveBaseId)
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
                m.getEquipmentType() != null && m.getEquipmentType().getCategory() != null ?
                        m.getEquipmentType().getCategory().name() : null,
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

