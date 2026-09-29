package com.mams.service.impl;

import com.mams.dto.request.EquipmentCreateRequest;
import com.mams.dto.request.EquipmentUpdateRequest;
import com.mams.dto.response.EquipmentTypeDto;
import com.mams.entity.EquipmentType;
import com.mams.exception.BadRequestException;
import com.mams.exception.ResourceNotFoundException;
import com.mams.repository.EquipmentTypeRepository;
import com.mams.service.EquipmentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
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

    @Override
    @Transactional
    public EquipmentTypeDto createEquipment(EquipmentCreateRequest request) {
        String cleanCode = request.getCode().trim().toUpperCase();
        String cleanName = request.getName().trim();

        if (equipmentTypeRepository.findByCode(cleanCode).isPresent()) {
            throw new BadRequestException("Equipment with code '" + cleanCode + "' already exists");
        }

        if (equipmentTypeRepository.findByName(cleanName).isPresent()) {
            throw new BadRequestException("Equipment with name '" + cleanName + "' already exists");
        }

        EquipmentType equipment = new EquipmentType();
        equipment.setName(cleanName);
        equipment.setCode(cleanCode);
        equipment.setCategory(request.getCategory());
        equipment.setUnit(request.getUnit() != null ? request.getUnit().trim() : "units");
        equipment.setConsumable(request.isConsumable());
        equipment.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        equipment.setStatus("ACTIVE");

        EquipmentType saved = equipmentTypeRepository.save(equipment);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public EquipmentTypeDto updateEquipment(Long id, EquipmentUpdateRequest request) {
        EquipmentType equipment = equipmentTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EquipmentType", "id", id));

        String cleanCode = request.getCode().trim().toUpperCase();
        String cleanName = request.getName().trim();

        // Check uniqueness of code if changed
        Optional<EquipmentType> existingByCode = equipmentTypeRepository.findByCode(cleanCode);
        if (existingByCode.isPresent() && !existingByCode.get().getId().equals(id)) {
            throw new BadRequestException("Equipment with code '" + cleanCode + "' already exists");
        }

        // Check uniqueness of name if changed
        Optional<EquipmentType> existingByName = equipmentTypeRepository.findByName(cleanName);
        if (existingByName.isPresent() && !existingByName.get().getId().equals(id)) {
            throw new BadRequestException("Equipment with name '" + cleanName + "' already exists");
        }

        equipment.setName(cleanName);
        equipment.setCode(cleanCode);
        equipment.setCategory(request.getCategory());
        if (request.getUnit() != null) {
            equipment.setUnit(request.getUnit().trim());
        }
        equipment.setConsumable(request.isConsumable());
        equipment.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            equipment.setStatus(request.getStatus().trim().toUpperCase());
        }

        EquipmentType updated = equipmentTypeRepository.save(equipment);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void deleteEquipment(Long id) {
        EquipmentType equipment = equipmentTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EquipmentType", "id", id));

        // Soft delete / mark inactive
        equipment.setStatus("INACTIVE");
        equipmentTypeRepository.save(equipment);
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
