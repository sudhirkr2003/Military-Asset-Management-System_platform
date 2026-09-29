package com.mams.service.impl;

import com.mams.dto.response.EquipmentTypeDto;
import com.mams.entity.EquipmentType;
import com.mams.exception.ResourceNotFoundException;
import com.mams.repository.EquipmentTypeRepository;
import com.mams.service.EquipmentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EquipmentServiceImpl implements EquipmentService {

    private final EquipmentTypeRepository equipmentTypeRepository;

    public EquipmentServiceImpl(EquipmentTypeRepository equipmentTypeRepository) {
        this.equipmentTypeRepository = equipmentTypeRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<EquipmentTypeDto> getAllEquipmentTypes() {
        return equipmentTypeRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public EquipmentTypeDto getEquipmentTypeById(Long id) {
        EquipmentType equipment = equipmentTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EquipmentType", "id", id));
        return mapToDto(equipment);
    }

    private EquipmentTypeDto mapToDto(EquipmentType equipment) {
        return new EquipmentTypeDto(
                equipment.getId(),
                equipment.getName(),
                equipment.getCode(),
                equipment.getCategory(),
                equipment.getUnit(),
                equipment.isConsumable(),
                equipment.getDescription(),
                equipment.getStatus()
        );
    }
}
