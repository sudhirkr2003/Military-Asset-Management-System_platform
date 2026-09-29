package com.mams.service;

import com.mams.dto.response.InventoryDto;

import java.util.List;

public interface InventoryService {

    List<InventoryDto> getAllInventory();

    List<InventoryDto> getInventoryByBase(Long baseId);

    InventoryDto getInventoryByBaseAndEquipment(Long baseId, Long equipmentTypeId);
}
