package com.mams.service;

import com.mams.dto.request.PurchaseRequest;
import com.mams.dto.request.TransferRequest;
import com.mams.dto.response.MovementLedgerDto;
import com.mams.entity.Base;
import com.mams.entity.EquipmentType;
import com.mams.entity.Inventory;
import com.mams.entity.MovementLedger;
import com.mams.entity.enums.EquipmentCategory;
import com.mams.entity.enums.MovementType;
import com.mams.exception.BadRequestException;
import com.mams.exception.ResourceNotFoundException;
import com.mams.repository.BaseRepository;
import com.mams.repository.EquipmentTypeRepository;
import com.mams.repository.InventoryRepository;
import com.mams.repository.MovementLedgerRepository;
import com.mams.service.impl.MovementServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MovementServiceTest {

    @Mock
    private MovementLedgerRepository movementLedgerRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private BaseRepository baseRepository;

    @Mock
    private EquipmentTypeRepository equipmentTypeRepository;

    @Mock
    private com.mams.security.SecurityUtils securityUtils;

    @InjectMocks
    private MovementServiceImpl movementService;

    private Base testBase1;
    private Base testBase2;
    private EquipmentType testEquipment;
    private Inventory testInventory1;

    @BeforeEach
    void setUp() {
        testBase1 = new Base(1L, "Northern Command", "NC-01", "Ladakh Sector", "Lt. Gen. Rawat", "ACTIVE");
        testBase2 = new Base(2L, "Western Air Base", "WAB-02", "Punjab Sector", "Air Marshal Sinha", "ACTIVE");

        testEquipment = new EquipmentType(10L, "T-90 Bhishma MBT", "T90-MBT", EquipmentCategory.VEHICLE, "units", false, "Main battle tank", "ACTIVE");

        testInventory1 = new Inventory(100L, testBase1, testEquipment, 50, 50, 0, 0, 50);
    }

    @Test
    @DisplayName("Should successfully record new asset purchase and increment base inventory")
    void testRecordPurchase_Success() {
        PurchaseRequest request = new PurchaseRequest();
        request.setBaseId(1L);
        request.setEquipmentTypeId(10L);
        request.setQuantity(20);
        request.setSupplier("Heavy Vehicles Factory Avadi");
        request.setInvoiceNumber("PO-2026-T90-01");
        request.setRemarks("Standard procurement batch");

        when(baseRepository.findById(1L)).thenReturn(Optional.of(testBase1));
        when(equipmentTypeRepository.findById(10L)).thenReturn(Optional.of(testEquipment));
        when(inventoryRepository.findByBaseIdAndEquipmentTypeId(1L, 10L)).thenReturn(Optional.of(testInventory1));

        MovementLedger savedLedger = new MovementLedger(
                501L, testBase1, testEquipment, MovementType.PURCHASE, 20,
                "PURCHASE", 100L, "Purchased from Heavy Vehicles Factory Avadi", "ADMIN"
        );
        when(movementLedgerRepository.save(any(MovementLedger.class))).thenReturn(savedLedger);

        MovementLedgerDto result = movementService.recordPurchase(request, "ADMIN");

        assertNotNull(result);
        assertEquals(20, result.getQuantity());
        assertEquals(MovementType.PURCHASE, result.getMovementType());
        assertEquals("Northern Command", result.getBaseName());
        assertEquals(70, testInventory1.getAvailableQuantity()); // 50 + 20
        assertEquals(70, testInventory1.getClosingBalance()); // 50 + 20

        verify(inventoryRepository, times(1)).save(testInventory1);
        verify(movementLedgerRepository, times(1)).save(any(MovementLedger.class));
    }

    @Test
    @DisplayName("Should fail purchase when base is not found")
    void testRecordPurchase_BaseNotFound() {
        PurchaseRequest request = new PurchaseRequest();
        request.setBaseId(999L);
        request.setEquipmentTypeId(10L);
        request.setQuantity(5);

        when(baseRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            movementService.recordPurchase(request, "ADMIN");
        });

        verify(movementLedgerRepository, never()).save(any(MovementLedger.class));
    }

    @Test
    @DisplayName("Should successfully transfer assets from source base to destination base")
    void testRecordTransfer_Success() {
        TransferRequest request = new TransferRequest();
        request.setFromBaseId(1L);
        request.setToBaseId(2L);
        request.setEquipmentTypeId(10L);
        request.setQuantity(10);
        request.setReason("Western border reinforcement");
        request.setRemarks("Escorted movement");

        when(baseRepository.findById(1L)).thenReturn(Optional.of(testBase1));
        when(baseRepository.findById(2L)).thenReturn(Optional.of(testBase2));
        when(equipmentTypeRepository.findById(10L)).thenReturn(Optional.of(testEquipment));
        when(inventoryRepository.findByBaseIdAndEquipmentTypeId(1L, 10L)).thenReturn(Optional.of(testInventory1));

        Inventory destInventory = new Inventory(200L, testBase2, testEquipment, 10, 10, 0, 0, 10);
        when(inventoryRepository.findByBaseIdAndEquipmentTypeId(2L, 10L)).thenReturn(Optional.of(destInventory));

        MovementLedger savedTransferOut = new MovementLedger(
                601L, testBase1, testEquipment, MovementType.TRANSFER_OUT, 10,
                "TRANSFER", 100L, "Transferred to Western Air Base", "ADMIN"
        );
        when(movementLedgerRepository.save(any(MovementLedger.class))).thenReturn(savedTransferOut);

        MovementLedgerDto result = movementService.recordTransfer(request, "ADMIN");

        assertNotNull(result);
        assertEquals(40, testInventory1.getAvailableQuantity()); // 50 - 10
        assertEquals(40, testInventory1.getClosingBalance()); // 50 - 10
        assertEquals(20, destInventory.getAvailableQuantity()); // 10 + 10
        assertEquals(20, destInventory.getClosingBalance()); // 10 + 10

        verify(inventoryRepository, times(1)).save(testInventory1);
        verify(inventoryRepository, times(1)).save(destInventory);
        verify(movementLedgerRepository, times(2)).save(any(MovementLedger.class)); // 1 for Out, 1 for In
    }

    @Test
    @DisplayName("Should reject transfer when source base and destination base are identical")
    void testRecordTransfer_SameBase_ThrowsBadRequest() {
        TransferRequest request = new TransferRequest();
        request.setFromBaseId(1L);
        request.setToBaseId(1L);
        request.setEquipmentTypeId(10L);
        request.setQuantity(5);

        assertThrows(BadRequestException.class, () -> {
            movementService.recordTransfer(request, "ADMIN");
        });

        verify(movementLedgerRepository, never()).save(any(MovementLedger.class));
    }

    @Test
    @DisplayName("Should reject transfer when source base has insufficient available quantity")
    void testRecordTransfer_InsufficientStock_ThrowsBadRequest() {
        TransferRequest request = new TransferRequest();
        request.setFromBaseId(1L);
        request.setToBaseId(2L);
        request.setEquipmentTypeId(10L);
        request.setQuantity(100); // Only 50 available

        when(baseRepository.findById(1L)).thenReturn(Optional.of(testBase1));
        when(baseRepository.findById(2L)).thenReturn(Optional.of(testBase2));
        when(equipmentTypeRepository.findById(10L)).thenReturn(Optional.of(testEquipment));
        when(inventoryRepository.findByBaseIdAndEquipmentTypeId(1L, 10L)).thenReturn(Optional.of(testInventory1));

        assertThrows(BadRequestException.class, () -> {
            movementService.recordTransfer(request, "ADMIN");
        });

        verify(movementLedgerRepository, never()).save(any(MovementLedger.class));
    }
}
