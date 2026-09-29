package com.mams.dto.response;

public class InventoryDto {

    private Long id;
    private Long baseId;
    private String baseName;
    private Long equipmentTypeId;
    private String equipmentName;
    private String equipmentCategory;
    private long openingBalance;
    private long availableQuantity;
    private long assignedQuantity;
    private long expendedQuantity;
    private long closingBalance;

    public InventoryDto() {
    }

    public InventoryDto(Long id, Long baseId, String baseName, Long equipmentTypeId, String equipmentName,
                        String equipmentCategory, long openingBalance, long availableQuantity,
                        long assignedQuantity, long expendedQuantity, long closingBalance) {
        this.id = id;
        this.baseId = baseId;
        this.baseName = baseName;
        this.equipmentTypeId = equipmentTypeId;
        this.equipmentName = equipmentName;
        this.equipmentCategory = equipmentCategory;
        this.openingBalance = openingBalance;
        this.availableQuantity = availableQuantity;
        this.assignedQuantity = assignedQuantity;
        this.expendedQuantity = expendedQuantity;
        this.closingBalance = closingBalance;
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

    public String getEquipmentCategory() {
        return equipmentCategory;
    }

    public void setEquipmentCategory(String equipmentCategory) {
        this.equipmentCategory = equipmentCategory;
    }

    public long getOpeningBalance() {
        return openingBalance;
    }

    public void setOpeningBalance(long openingBalance) {
        this.openingBalance = openingBalance;
    }

    public long getAvailableQuantity() {
        return availableQuantity;
    }

    public void setAvailableQuantity(long availableQuantity) {
        this.availableQuantity = availableQuantity;
    }

    public long getAssignedQuantity() {
        return assignedQuantity;
    }

    public void setAssignedQuantity(long assignedQuantity) {
        this.assignedQuantity = assignedQuantity;
    }

    public long getExpendedQuantity() {
        return expendedQuantity;
    }

    public void setExpendedQuantity(long expendedQuantity) {
        this.expendedQuantity = expendedQuantity;
    }

    public long getClosingBalance() {
        return closingBalance;
    }

    public void setClosingBalance(long closingBalance) {
        this.closingBalance = closingBalance;
    }
}
