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

    public InventoryServiceImpl(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryDto> getAllInventory() {
        return inventoryRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryDto> getInventoryByBase(Long baseId) {
        return inventoryRepository.findByBaseId(baseId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryDto getInventoryByBaseAndEquipment(Long baseId, Long equipmentTypeId) {
        Inventory inventory = inventoryRepository.findByBaseIdAndEquipmentTypeId(baseId, equipmentTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for base " + baseId + " and equipment " + equipmentTypeId));
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
