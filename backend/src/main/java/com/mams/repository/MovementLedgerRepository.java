package com.mams.repository;

import com.mams.entity.MovementLedger;
import com.mams.entity.enums.MovementType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MovementLedgerRepository extends JpaRepository<MovementLedger, Long> {

    List<MovementLedger> findByBaseId(Long baseId);

    @Query("SELECT SUM(m.quantity) FROM MovementLedger m WHERE m.movementType = :movementType " +
            "AND (:baseId IS NULL OR m.base.id = :baseId) " +
            "AND (:equipmentTypeId IS NULL OR m.equipmentType.id = :equipmentTypeId) " +
            "AND (:startDate IS NULL OR m.timestamp >= :startDate) " +
            "AND (:endDate IS NULL OR m.timestamp <= :endDate)")
    Long sumQuantityByMovementTypeAndFilters(
            @Param("movementType") MovementType movementType,
            @Param("baseId") Long baseId,
            @Param("equipmentTypeId") Long equipmentTypeId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT m FROM MovementLedger m WHERE (:baseId IS NULL OR m.base.id = :baseId) " +
            "ORDER BY m.timestamp DESC")
    List<MovementLedger> findRecentMovements(@Param("baseId") Long baseId);
}
