package com.mams.service;

import com.mams.dto.request.EquipmentCreateRequest;
import com.mams.dto.request.EquipmentUpdateRequest;
import com.mams.dto.response.EquipmentTypeDto;

import java.util.List;

public interface EquipmentService {
    List<EquipmentTypeDto> getAllEquipmentTypes();
    EquipmentTypeDto getEquipmentTypeById(Long id);
    EquipmentTypeDto createEquipment(EquipmentCreateRequest request);
    EquipmentTypeDto updateEquipment(Long id, EquipmentUpdateRequest request);
    void deleteEquipment(Long id);
}
