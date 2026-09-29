package com.mams.repository;

import com.mams.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    List<Inventory> findByBaseId(Long baseId);
    List<Inventory> findByEquipmentTypeId(Long equipmentTypeId);
    Optional<Inventory> findByBaseIdAndEquipmentTypeId(Long baseId, Long equipmentTypeId);

    @Query("SELECT SUM(i.openingBalance) FROM Inventory i WHERE (:baseId IS NULL OR i.base.id = :baseId) AND (:equipmentTypeId IS NULL OR i.equipmentType.id = :equipmentTypeId)")
    Long sumOpeningBalance(@Param("baseId") Long baseId, @Param("equipmentTypeId") Long equipmentTypeId);

    @Query("SELECT SUM(i.availableQuantity) FROM Inventory i WHERE (:baseId IS NULL OR i.base.id = :baseId) AND (:equipmentTypeId IS NULL OR i.equipmentType.id = :equipmentTypeId)")
    Long sumAvailableQuantity(@Param("baseId") Long baseId, @Param("equipmentTypeId") Long equipmentTypeId);

    @Query("SELECT SUM(i.assignedQuantity) FROM Inventory i WHERE (:baseId IS NULL OR i.base.id = :baseId) AND (:equipmentTypeId IS NULL OR i.equipmentType.id = :equipmentTypeId)")
    Long sumAssignedQuantity(@Param("baseId") Long baseId, @Param("equipmentTypeId") Long equipmentTypeId);

    @Query("SELECT SUM(i.expendedQuantity) FROM Inventory i WHERE (:baseId IS NULL OR i.base.id = :baseId) AND (:equipmentTypeId IS NULL OR i.equipmentType.id = :equipmentTypeId)")
    Long sumExpendedQuantity(@Param("baseId") Long baseId, @Param("equipmentTypeId") Long equipmentTypeId);

    @Query("SELECT SUM(i.closingBalance) FROM Inventory i WHERE (:baseId IS NULL OR i.base.id = :baseId) AND (:equipmentTypeId IS NULL OR i.equipmentType.id = :equipmentTypeId)")
    Long sumClosingBalance(@Param("baseId") Long baseId, @Param("equipmentTypeId") Long equipmentTypeId);
}
