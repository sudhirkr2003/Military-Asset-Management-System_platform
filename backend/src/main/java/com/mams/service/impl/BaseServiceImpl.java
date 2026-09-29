package com.mams.service.impl;

import com.mams.dto.request.BaseCreateRequest;
import com.mams.dto.response.BaseDto;
import com.mams.entity.Base;
import com.mams.exception.BadRequestException;
import com.mams.exception.ResourceNotFoundException;
import com.mams.repository.BaseRepository;
import com.mams.service.BaseService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BaseServiceImpl implements BaseService {

    private final BaseRepository baseRepository;

    public BaseServiceImpl(BaseRepository baseRepository) {
        this.baseRepository = baseRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BaseDto> getAllBases() {
        return baseRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BaseDto getBaseById(Long id) {
        Base base = baseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Base", "id", id));
        return mapToDto(base);
    }

    @Override
    @Transactional
    public BaseDto createBase(BaseCreateRequest request) {
        String cleanCode = request.getCode().trim().toUpperCase();
        String cleanName = request.getName().trim();

        if (baseRepository.findByCode(cleanCode).isPresent()) {
            throw new BadRequestException("Military Base with code '" + cleanCode + "' already exists");
        }

        if (baseRepository.findByName(cleanName).isPresent()) {
            throw new BadRequestException("Military Base with name '" + cleanName + "' already exists");
        }

        Base base = new Base(
                null,
                cleanName,
                cleanCode,
                request.getLocation() != null ? request.getLocation().trim() : null,
                request.getCommanderName() != null ? request.getCommanderName().trim() : null,
                "ACTIVE"
        );

        Base saved = baseRepository.save(base);
        return mapToDto(saved);
    }

    private BaseDto mapToDto(Base base) {
        return new BaseDto(
                base.getId(),
                base.getName(),
                base.getCode(),
                base.getLocation(),
                base.getCommanderName(),
                base.getStatus()
        );
    }
}
