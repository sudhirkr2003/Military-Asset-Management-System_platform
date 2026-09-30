package com.mams.service;

import com.mams.dto.response.DashboardSummaryDto;
import com.mams.entity.Base;
import com.mams.entity.EquipmentType;
import com.mams.entity.Inventory;
import com.mams.entity.MovementLedger;
import com.mams.entity.enums.EquipmentCategory;
import com.mams.entity.enums.MovementType;
import com.mams.repository.InventoryRepository;
import com.mams.repository.MovementLedgerRepository;
import com.mams.service.impl.DashboardServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class DashboardServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private MovementLedgerRepository movementLedgerRepository;

    @Mock
    private com.mams.security.SecurityUtils securityUtils;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    @Test
    @DisplayName("Should accurately calculate Opening, Net Movement (Purchases + Transfer In - Transfer Out), and Closing Balance")
    void testGetSummary_AccurateMathematicalCalculations() {
        when(securityUtils.validateAndGetEffectiveBaseId(any())).thenReturn(null);

        Base base = new Base(1L, "Alpha Base", "ALPHA01", "Sector 1", "Cmdr Sharma", "ACTIVE");
        EquipmentType eq = new EquipmentType(1L, "Rifle", "WPN-01", EquipmentCategory.WEAPON, "units", false, "Desc", "ACTIVE");

        Inventory inv = new Inventory(1L, base, eq, 1000L, 900L, 250L, 50L, 1200L);
        when(inventoryRepository.findAll()).thenReturn(List.of(inv));

        MovementLedger m1 = new MovementLedger(1L, base, eq, MovementType.PURCHASE, 300L, "PURCHASE", 1L, "PO", "admin");
        m1.setTimestamp(LocalDateTime.now());

        MovementLedger m2 = new MovementLedger(2L, base, eq, MovementType.TRANSFER_IN, 100L, "TRANSFER", 2L, "TI", "admin");
        m2.setTimestamp(LocalDateTime.now());

        MovementLedger m3 = new MovementLedger(3L, base, eq, MovementType.TRANSFER_OUT, 150L, "TRANSFER", 3L, "TO", "admin");
        m3.setTimestamp(LocalDateTime.now());

        when(movementLedgerRepository.findAll()).thenReturn(List.of(m1, m2, m3));

        DashboardSummaryDto summary = dashboardService.getSummary(null, null, "ALL");

        assertNotNull(summary);
        assertEquals(1000L, summary.getOpeningBalance());
        assertEquals(300L, summary.getPurchases());
        assertEquals(100L, summary.getTransferIn());
        assertEquals(150L, summary.getTransferOut());
        // Net Movement = Purchases (300) + Transfer In (100) - Transfer Out (150) = 250
        assertEquals(250L, summary.getNetMovement());
        assertEquals(250L, summary.getAssigned());
        assertEquals(50L, summary.getExpended());
        assertEquals(1200L, summary.getClosingBalance());
    }
}
