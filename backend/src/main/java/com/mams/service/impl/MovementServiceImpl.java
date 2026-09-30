package com.mams.service.impl;

import com.mams.dto.request.*;
import com.mams.dto.response.MovementLedgerDto;
import com.mams.entity.Base;
import com.mams.entity.EquipmentType;
import com.mams.entity.Inventory;
import com.mams.entity.MovementLedger;
import com.mams.entity.enums.MovementType;
import com.mams.exception.BadRequestException;
import com.mams.exception.ResourceNotFoundException;
import com.mams.repository.BaseRepository;
import com.mams.repository.EquipmentTypeRepository;
import com.mams.repository.InventoryRepository;
import com.mams.repository.MovementLedgerRepository;
import com.mams.service.MovementService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MovementServiceImpl implements MovementService {

    private final MovementLedgerRepository movementLedgerRepository;
    private final InventoryRepository inventoryRepository;
    private final BaseRepository baseRepository;
    private final EquipmentTypeRepository equipmentTypeRepository;
    private final com.mams.security.SecurityUtils securityUtils;

    public MovementServiceImpl(MovementLedgerRepository movementLedgerRepository,
                               InventoryRepository inventoryRepository,
                               BaseRepository baseRepository,
                               EquipmentTypeRepository equipmentTypeRepository,
                               com.mams.security.SecurityUtils securityUtils) {
        this.movementLedgerRepository = movementLedgerRepository;
        this.inventoryRepository = inventoryRepository;
        this.baseRepository = baseRepository;
        this.equipmentTypeRepository = equipmentTypeRepository;
        this.securityUtils = securityUtils;
    }

    @Override
    @Transactional
    public MovementLedgerDto recordPurchase(PurchaseRequest request, String currentUser) {
        Base base = baseRepository.findById(request.getBaseId())
                .orElseThrow(() -> new ResourceNotFoundException("Base not found with id: " + request.getBaseId()));

        EquipmentType equipmentType = equipmentTypeRepository.findById(request.getEquipmentTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment Type not found with id: " + request.getEquipmentTypeId()));

        // 1. Update/Initialize Inventory
        Inventory inventory = inventoryRepository.findByBaseIdAndEquipmentTypeId(base.getId(), equipmentType.getId())
                .orElseGet(() -> new Inventory(null, base, equipmentType, 0, 0, 0, 0, 0));

        inventory.setAvailableQuantity(inventory.getAvailableQuantity() + request.getQuantity());
        inventory.setClosingBalance(inventory.getClosingBalance() + request.getQuantity());
        inventoryRepository.save(inventory);

        // 2. Add Ledger Entry
        String remarkText = "Purchased from " + (request.getSupplier() != null ? request.getSupplier() : "Vendor");
        if (request.getInvoiceNumber() != null && !request.getInvoiceNumber().isBlank()) {
            remarkText += " [Inv: " + request.getInvoiceNumber() + "]";
        }
        if (request.getRemarks() != null && !request.getRemarks().isBlank()) {
            remarkText += " - " + request.getRemarks();
        }

        MovementLedger ledger = new MovementLedger();
        ledger.setBase(base);
        ledger.setEquipmentType(equipmentType);
        ledger.setMovementType(MovementType.PURCHASE);
        ledger.setQuantity(request.getQuantity());
        ledger.setReferenceType("PURCHASE");
        ledger.setRemarks(remarkText);
        ledger.setCreatedBy(currentUser != null ? currentUser : "SYSTEM");

        MovementLedger savedLedger = movementLedgerRepository.save(ledger);
        return mapToDto(savedLedger);
    }

    @Override
    @Transactional
    public MovementLedgerDto recordTransfer(TransferRequest request, String currentUser) {
        if (request.getFromBaseId().equals(request.getToBaseId())) {
            throw new BadRequestException("Source base and destination base cannot be identical");
        }

        Base fromBase = baseRepository.findById(request.getFromBaseId())
                .orElseThrow(() -> new ResourceNotFoundException("Source Base not found with id: " + request.getFromBaseId()));

        Base toBase = baseRepository.findById(request.getToBaseId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination Base not found with id: " + request.getToBaseId()));

        EquipmentType equipmentType = equipmentTypeRepository.findById(request.getEquipmentTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment Type not found with id: " + request.getEquipmentTypeId()));

        // 1. Deduct from Source Base Inventory
        Inventory fromInventory = inventoryRepository.findByBaseIdAndEquipmentTypeId(fromBase.getId(), equipmentType.getId())
                .orElseThrow(() -> new BadRequestException("No inventory record found at source base for this equipment"));

        if (fromInventory.getAvailableQuantity() < request.getQuantity()) {
            throw new BadRequestException("Insufficient available stock at " + fromBase.getName() +
                    ". Available: " + fromInventory.getAvailableQuantity() + ", Requested: " + request.getQuantity());
        }

        fromInventory.setAvailableQuantity(fromInventory.getAvailableQuantity() - request.getQuantity());
        fromInventory.setClosingBalance(fromInventory.getClosingBalance() - request.getQuantity());
        inventoryRepository.save(fromInventory);

        // 2. Add to Destination Base Inventory
        Inventory toInventory = inventoryRepository.findByBaseIdAndEquipmentTypeId(toBase.getId(), equipmentType.getId())
                .orElseGet(() -> new Inventory(null, toBase, equipmentType, 0, 0, 0, 0, 0));

        toInventory.setAvailableQuantity(toInventory.getAvailableQuantity() + request.getQuantity());
        toInventory.setClosingBalance(toInventory.getClosingBalance() + request.getQuantity());
        inventoryRepository.save(toInventory);

        // 3. Create TRANSFER_OUT ledger for source base
        MovementLedger outLedger = new MovementLedger();
        outLedger.setBase(fromBase);
        outLedger.setEquipmentType(equipmentType);
        outLedger.setMovementType(MovementType.TRANSFER_OUT);
        outLedger.setQuantity(request.getQuantity());
        outLedger.setReferenceType("TRANSFER");
        outLedger.setRemarks("Transferred to " + toBase.getName() + (request.getRemarks() != null ? " - " + request.getRemarks() : ""));
        outLedger.setCreatedBy(currentUser != null ? currentUser : "SYSTEM");
        MovementLedger savedOutLedger = movementLedgerRepository.save(outLedger);

        // 4. Create TRANSFER_IN ledger for destination base
        MovementLedger inLedger = new MovementLedger();
        inLedger.setBase(toBase);
        inLedger.setEquipmentType(equipmentType);
        inLedger.setMovementType(MovementType.TRANSFER_IN);
        inLedger.setQuantity(request.getQuantity());
        inLedger.setReferenceType("TRANSFER");
        inLedger.setRemarks("Received from " + fromBase.getName() + (request.getRemarks() != null ? " - " + request.getRemarks() : ""));
        inLedger.setCreatedBy(currentUser != null ? currentUser : "SYSTEM");
        movementLedgerRepository.save(inLedger);

        return mapToDto(savedOutLedger);
    }

    @Override
    @Transactional
    public MovementLedgerDto recordAssignment(AssignmentRequest request, String currentUser) {
        securityUtils.enforceBaseOwnership(request.getBaseId());

        Base base = baseRepository.findById(request.getBaseId())
                .orElseThrow(() -> new ResourceNotFoundException("Base not found with id: " + request.getBaseId()));

        EquipmentType equipmentType = equipmentTypeRepository.findById(request.getEquipmentTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment Type not found with id: " + request.getEquipmentTypeId()));

        Inventory inventory = inventoryRepository.findByBaseIdAndEquipmentTypeId(base.getId(), equipmentType.getId())
                .orElseThrow(() -> new BadRequestException("No inventory found for this equipment at " + base.getName()));

        if (inventory.getAvailableQuantity() < request.getQuantity()) {
            throw new BadRequestException("Insufficient available stock for assignment. Available: " +
                    inventory.getAvailableQuantity() + ", Requested: " + request.getQuantity());
        }

        inventory.setAvailableQuantity(inventory.getAvailableQuantity() - request.getQuantity());
        inventory.setAssignedQuantity(inventory.getAssignedQuantity() + request.getQuantity());
        inventoryRepository.save(inventory);

        String remarkText = "Assigned to " + (request.getPersonnelName() != null ? request.getPersonnelName() : "Personnel");
        if (request.getServiceNumber() != null && !request.getServiceNumber().isBlank()) {
            remarkText += " (" + request.getServiceNumber() + ")";
        }
        if (request.getPurpose() != null && !request.getPurpose().isBlank()) {
            remarkText += " - Purpose: " + request.getPurpose();
        }

        MovementLedger ledger = new MovementLedger();
        ledger.setBase(base);
        ledger.setEquipmentType(equipmentType);
        ledger.setMovementType(MovementType.ASSIGNMENT);
        ledger.setQuantity(request.getQuantity());
        ledger.setReferenceType("ASSIGNMENT");
        ledger.setReferenceId(request.getPersonnelId());
        ledger.setRemarks(remarkText);
        ledger.setCreatedBy(currentUser != null ? currentUser : "SYSTEM");

        MovementLedger savedLedger = movementLedgerRepository.save(ledger);
        return mapToDto(savedLedger);
    }

    @Override
    @Transactional
    public MovementLedgerDto recordReturn(ReturnAssignmentRequest request, String currentUser) {
        securityUtils.enforceBaseOwnership(request.getBaseId());

        Base base = baseRepository.findById(request.getBaseId())
                .orElseThrow(() -> new ResourceNotFoundException("Base not found with id: " + request.getBaseId()));

        EquipmentType equipmentType = equipmentTypeRepository.findById(request.getEquipmentTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment Type not found with id: " + request.getEquipmentTypeId()));

        Inventory inventory = inventoryRepository.findByBaseIdAndEquipmentTypeId(base.getId(), equipmentType.getId())
                .orElseThrow(() -> new BadRequestException("No inventory found for this equipment at " + base.getName()));

        if (inventory.getAssignedQuantity() < request.getQuantity()) {
            throw new BadRequestException("Return quantity (" + request.getQuantity() +
                    ") exceeds currently assigned quantity (" + inventory.getAssignedQuantity() + ")");
        }

        inventory.setAssignedQuantity(inventory.getAssignedQuantity() - request.getQuantity());
        inventory.setAvailableQuantity(inventory.getAvailableQuantity() + request.getQuantity());
        inventoryRepository.save(inventory);

        String remarkText = "Returned to armory by " + (request.getServiceNumber() != null ? request.getServiceNumber() : "personnel");
        if (request.getRemarks() != null && !request.getRemarks().isBlank()) {
            remarkText += " - " + request.getRemarks();
        }

        MovementLedger ledger = new MovementLedger();
        ledger.setBase(base);
        ledger.setEquipmentType(equipmentType);
        ledger.setMovementType(MovementType.RETURN);
        ledger.setQuantity(request.getQuantity());
        ledger.setReferenceType("RETURN");
        ledger.setReferenceId(request.getPersonnelId());
        ledger.setRemarks(remarkText);
        ledger.setCreatedBy(currentUser != null ? currentUser : "SYSTEM");

        MovementLedger savedLedger = movementLedgerRepository.save(ledger);
        return mapToDto(savedLedger);
    }

    @Override
    @Transactional
    public MovementLedgerDto recordExpenditure(ExpenditureRequest request, String currentUser) {
        securityUtils.enforceBaseOwnership(request.getBaseId());

        Base base = baseRepository.findById(request.getBaseId())
                .orElseThrow(() -> new ResourceNotFoundException("Base not found with id: " + request.getBaseId()));

        EquipmentType equipmentType = equipmentTypeRepository.findById(request.getEquipmentTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment Type not found with id: " + request.getEquipmentTypeId()));

        Inventory inventory = inventoryRepository.findByBaseIdAndEquipmentTypeId(base.getId(), equipmentType.getId())
                .orElseThrow(() -> new BadRequestException("No inventory found for this equipment at " + base.getName()));

        if (inventory.getAvailableQuantity() < request.getQuantity()) {
            throw new BadRequestException("Insufficient available stock for expenditure. Available: " +
                    inventory.getAvailableQuantity() + ", Requested: " + request.getQuantity());
        }

        inventory.setAvailableQuantity(inventory.getAvailableQuantity() - request.getQuantity());
        inventory.setExpendedQuantity(inventory.getExpendedQuantity() + request.getQuantity());
        inventory.setClosingBalance(inventory.getClosingBalance() - request.getQuantity());
        inventoryRepository.save(inventory);

        String remarkText = "Expended";
        if (request.getOperationOrExercise() != null && !request.getOperationOrExercise().isBlank()) {
            remarkText += " during: " + request.getOperationOrExercise();
        }
        if (request.getRemarks() != null && !request.getRemarks().isBlank()) {
            remarkText += " - " + request.getRemarks();
        }

        MovementLedger ledger = new MovementLedger();
        ledger.setBase(base);
        ledger.setEquipmentType(equipmentType);
        ledger.setMovementType(MovementType.EXPENDITURE);
        ledger.setQuantity(request.getQuantity());
        ledger.setReferenceType("EXPENDITURE");
        ledger.setRemarks(remarkText);
        ledger.setCreatedBy(currentUser != null ? currentUser : "SYSTEM");

        MovementLedger savedLedger = movementLedgerRepository.save(ledger);
        return mapToDto(savedLedger);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovementLedgerDto> getMovements(Long baseId, Long equipmentTypeId, LocalDateTime startDate, LocalDateTime endDate) {
        Long effectiveBaseId = securityUtils.validateAndGetEffectiveBaseId(baseId);

        List<MovementLedger> movements;
        if (effectiveBaseId != null) {
            movements = movementLedgerRepository.findByBaseId(effectiveBaseId);
        } else {
            movements = movementLedgerRepository.findAll();
        }

        return movements.stream()
                .filter(m -> equipmentTypeId == null || m.getEquipmentType().getId().equals(equipmentTypeId))
                .filter(m -> startDate == null || !m.getTimestamp().isBefore(startDate))
                .filter(m -> endDate == null || !m.getTimestamp().isAfter(endDate))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public MovementLedgerDto getMovementById(Long id) {
        MovementLedger ledger = movementLedgerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movement transaction not found with id: " + id));

        if (ledger.getBase() != null) {
            securityUtils.validateAndGetEffectiveBaseId(ledger.getBase().getId());
        }

        return mapToDto(ledger);
    }

    private MovementLedgerDto mapToDto(MovementLedger m) {
        MovementLedgerDto dto = new MovementLedgerDto();
        dto.setId(m.getId());
        dto.setBaseId(m.getBase() != null ? m.getBase().getId() : null);
        dto.setBaseName(m.getBase() != null ? m.getBase().getName() : null);
        dto.setEquipmentTypeId(m.getEquipmentType() != null ? m.getEquipmentType().getId() : null);
        dto.setEquipmentName(m.getEquipmentType() != null ? m.getEquipmentType().getName() : null);
        dto.setEquipmentCategory(m.getEquipmentType() != null && m.getEquipmentType().getCategory() != null ?
                m.getEquipmentType().getCategory().name() : null);
        dto.setMovementType(m.getMovementType());
        dto.setQuantity(m.getQuantity());
        dto.setReferenceType(m.getReferenceType());
        dto.setReferenceId(m.getReferenceId());
        dto.setRemarks(m.getRemarks());
        dto.setCreatedBy(m.getCreatedBy());
        dto.setTimestamp(m.getTimestamp());
        return dto;
    }
}
