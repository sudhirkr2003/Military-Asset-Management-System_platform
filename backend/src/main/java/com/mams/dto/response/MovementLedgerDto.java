package com.mams.dto.response;

import com.mams.entity.enums.MovementType;

import java.time.LocalDateTime;

public class MovementLedgerDto {
    private Long id;
    private Long baseId;
    private String baseName;
    private Long equipmentTypeId;
    private String equipmentName;
    private MovementType movementType;
    private long quantity;
    private String referenceType;
    private Long referenceId;
    private String remarks;
    private String createdBy;
    private LocalDateTime timestamp;

    public MovementLedgerDto() {
    }

    public MovementLedgerDto(Long id, Long baseId, String baseName, Long equipmentTypeId, String equipmentName,
                             MovementType movementType, long quantity, String referenceType, Long referenceId,
                             String remarks, String createdBy, LocalDateTime timestamp) {
        this.id = id;
        this.baseId = baseId;
        this.baseName = baseName;
        this.equipmentTypeId = equipmentTypeId;
        this.equipmentName = equipmentName;
        this.movementType = movementType;
        this.quantity = quantity;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.remarks = remarks;
        this.createdBy = createdBy;
        this.timestamp = timestamp;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getBaseId() {
        return baseId;
    }

    public void setBaseId(Long baseId) {
        this.baseId = baseId;
    }

    public String getBaseName() {
        return baseName;
    }

    public void setBaseName(String baseName) {
        this.baseName = baseName;
    }

    public Long getEquipmentTypeId() {
        return equipmentTypeId;
    }

    public void setEquipmentTypeId(Long equipmentTypeId) {
        this.equipmentTypeId = equipmentTypeId;
    }

    public String getEquipmentName() {
        return equipmentName;
    }

    public void setEquipmentName(String equipmentName) {
        this.equipmentName = equipmentName;
    }

    public MovementType getMovementType() {
        return movementType;
    }

    public void setMovementType(MovementType movementType) {
        this.movementType = movementType;
    }

    public long getQuantity() {
        return quantity;
    }

    public void setQuantity(long quantity) {
        this.quantity = quantity;
    }

    public String getReferenceType() {
        return referenceType;
    }

    public void setReferenceType(String referenceType) {
        this.referenceType = referenceType;
    }

    public Long getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(Long referenceId) {
        this.referenceId = referenceId;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
