package com.mams.service;

import com.mams.dto.response.EquipmentTypeDto;

import java.util.List;

public interface EquipmentService {
    List<EquipmentTypeDto> getAllEquipmentTypes();
    EquipmentTypeDto getEquipmentTypeById(Long id);
}
