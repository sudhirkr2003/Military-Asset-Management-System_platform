package com.mams.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "inventory", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"base_id", "equipment_type_id"})
})
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "base_id", nullable = false)
    private Base base;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "equipment_type_id", nullable = false)
    private EquipmentType equipmentType;

    @Column(name = "opening_balance", nullable = false)
    private long openingBalance = 0;

    @Column(name = "available_quantity", nullable = false)
    private long availableQuantity = 0;

    @Column(name = "assigned_quantity", nullable = false)
    private long assignedQuantity = 0;

    @Column(name = "expended_quantity", nullable = false)
    private long expendedQuantity = 0;

    @Column(name = "closing_balance", nullable = false)
    private long closingBalance = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Inventory() {
    }

    public Inventory(Long id, Base base, EquipmentType equipmentType, long openingBalance,
                     long availableQuantity, long assignedQuantity, long expendedQuantity, long closingBalance) {
        this.id = id;
        this.base = base;
        this.equipmentType = equipmentType;
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

    public Base getBase() {
        return base;
    }

    public void setBase(Base base) {
        this.base = base;
    }

    public EquipmentType getEquipmentType() {
        return equipmentType;
    }

    public void setEquipmentType(EquipmentType equipmentType) {
        this.equipmentType = equipmentType;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
