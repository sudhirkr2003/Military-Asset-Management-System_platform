package com.mams.service;

import com.mams.dto.request.PersonnelCreateRequest;
import com.mams.dto.request.PersonnelUpdateRequest;
import com.mams.dto.response.UserSummaryDto;
import com.mams.entity.enums.RoleType;

import java.util.List;

public interface PersonnelService {
    List<UserSummaryDto> getAllPersonnel(Long baseId, RoleType role);
    UserSummaryDto getPersonnelById(Long id);
    UserSummaryDto createPersonnel(PersonnelCreateRequest request);
    UserSummaryDto updatePersonnel(Long id, PersonnelUpdateRequest request);
    void deletePersonnel(Long id);
}
