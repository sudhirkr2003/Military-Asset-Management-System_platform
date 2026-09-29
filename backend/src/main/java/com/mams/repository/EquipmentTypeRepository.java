package com.mams.repository;

import com.mams.entity.EquipmentType;
import com.mams.entity.enums.EquipmentCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EquipmentTypeRepository extends JpaRepository<EquipmentType, Long> {
    Optional<EquipmentType> findByCode(String code);
    Optional<EquipmentType> findByName(String name);
    List<EquipmentType> findByCategory(EquipmentCategory category);
    List<EquipmentType> findByStatus(String status);
}
