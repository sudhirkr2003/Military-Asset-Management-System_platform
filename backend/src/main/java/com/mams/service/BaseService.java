package com.mams.service;

import com.mams.dto.request.BaseCreateRequest;
import com.mams.dto.response.BaseDto;

import java.util.List;

public interface BaseService {
    List<BaseDto> getAllBases();
    BaseDto getBaseById(Long id);
    BaseDto createBase(BaseCreateRequest request);
}
