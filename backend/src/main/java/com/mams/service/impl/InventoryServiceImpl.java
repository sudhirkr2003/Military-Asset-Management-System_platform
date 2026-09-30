package com.mams.service.impl;

import com.mams.dto.response.InventoryDto;
import com.mams.entity.Inventory;
import com.mams.exception.ResourceNotFoundException;
import com.mams.repository.InventoryRepository;
import com.mams.service.InventoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;
    private final com.mams.security.SecurityUtils securityUtils;

    public InventoryServiceImpl(InventoryRepository inventoryRepository,
                                com.mams.security.SecurityUtils securityUtils) {
        this.inventoryRepository = inventoryRepository;
        this.securityUtils = securityUtils;
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryDto> getAllInventory() {
        if (securityUtils.isCurrentUserBaseCommander()) {
            Long userBaseId = securityUtils.getCurrentUserBaseId();
            if (userBaseId != null) {
                return getInventoryByBase(userBaseId);
            }
        }
        return inventoryRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryDto> getInventoryByBase(Long baseId) {
        Long effectiveBaseId = securityUtils.validateAndGetEffectiveBaseId(baseId);
        return inventoryRepository.findByBaseId(effectiveBaseId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryDto getInventoryByBaseAndEquipment(Long baseId, Long equipmentTypeId) {
        Long effectiveBaseId = securityUtils.validateAndGetEffectiveBaseId(baseId);
        Inventory inventory = inventoryRepository.findByBaseIdAndEquipmentTypeId(effectiveBaseId, equipmentTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for base " + effectiveBaseId + " and equipment " + equipmentTypeId));
        return mapToDto(inventory);
    }

    private InventoryDto mapToDto(Inventory i) {
        return new InventoryDto(
                i.getId(),
                i.getBase() != null ? i.getBase().getId() : null,
                i.getBase() != null ? i.getBase().getName() : null,
                i.getEquipmentType() != null ? i.getEquipmentType().getId() : null,
                i.getEquipmentType() != null ? i.getEquipmentType().getName() : null,
                i.getEquipmentType() != null && i.getEquipmentType().getCategory() != null ?
                        i.getEquipmentType().getCategory().name() : null,
                i.getOpeningBalance(),
                i.getAvailableQuantity(),
                i.getAssignedQuantity(),
                i.getExpendedQuantity(),
                i.getClosingBalance()
        );
    }
}
