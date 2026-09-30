package com.mams.config;

import com.mams.entity.Base;
import com.mams.entity.EquipmentType;
import com.mams.entity.Inventory;
import com.mams.entity.User;
import com.mams.entity.enums.EquipmentCategory;
import com.mams.entity.enums.RoleType;
import com.mams.repository.BaseRepository;
import com.mams.repository.EquipmentTypeRepository;
import com.mams.repository.InventoryRepository;
import com.mams.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final BaseRepository baseRepository;
    private final EquipmentTypeRepository equipmentTypeRepository;
    private final InventoryRepository inventoryRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           BaseRepository baseRepository,
                           EquipmentTypeRepository equipmentTypeRepository,
                           InventoryRepository inventoryRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.baseRepository = baseRepository;
        this.equipmentTypeRepository = equipmentTypeRepository;
        this.inventoryRepository = inventoryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (baseRepository.count() == 0) {
            log.info("Initializing starter military bases...");
            Base b1 = baseRepository.save(new Base(null, "Alpha Base Command", "ALPHA01", "Northern Border Sector", "Maj. Gen. Sharma", "ACTIVE"));
            Base b2 = baseRepository.save(new Base(null, "Bravo Armor Depot", "BRAVO02", "Western Desert Sector", "Brig. Vikram Rathore", "ACTIVE"));
            Base b3 = baseRepository.save(new Base(null, "Charlie Air Support", "CHARLIE03", "Eastern Mountain Sector", "Wing Cmdr. Aditi", "ACTIVE"));
            Base b4 = baseRepository.save(new Base(null, "Delta Logistics Hub", "DELTA04", "Central Strategic Command", "Col. Ramesh Singh", "ACTIVE"));

            if (userRepository.count() == 0) {
                log.info("Seeding default administrator and officer accounts...");
                userRepository.save(new User(null, "admin", "admin@mams.mil", passwordEncoder.encode("Admin@123"), "Commander Rajesh Singh", RoleType.ADMIN, b1, "ACTIVE"));
                userRepository.save(new User(null, "commander_sharma", "sharma@mams.mil", passwordEncoder.encode("Admin@123"), "Col. Anita Sharma", RoleType.BASE_COMMANDER, b1, "ACTIVE"));
                userRepository.save(new User(null, "logistics_verma", "verma@mams.mil", passwordEncoder.encode("Admin@123"), "Major Vikram Verma", RoleType.LOGISTICS_OFFICER, b1, "ACTIVE"));
            }

            if (equipmentTypeRepository.count() == 0) {
                log.info("Seeding initial defense equipment catalog...");
                EquipmentType eq1 = equipmentTypeRepository.save(new EquipmentType(null, "INSAS 5.56mm Assault Rifle", "WPN-INSAS-01", EquipmentCategory.WEAPON, "units", false, "Standard service issue assault rifle", "ACTIVE"));
                EquipmentType eq2 = equipmentTypeRepository.save(new EquipmentType(null, "T-90 Bhishma MBT", "VEH-T90-02", EquipmentCategory.VEHICLE, "units", false, "Main battle tank with thermal optics", "ACTIVE"));
                EquipmentType eq3 = equipmentTypeRepository.save(new EquipmentType(null, "5.56x45mm NATO Ammo", "AMM-556-03", EquipmentCategory.AMMUNITION, "rounds", true, "Standard caliber ammunition rounds", "ACTIVE"));
                EquipmentType eq4 = equipmentTypeRepository.save(new EquipmentType(null, "VHF Tactical Radio Set", "COM-VHF-04", EquipmentCategory.COMMUNICATION_EQUIPMENT, "units", false, "Encrypted battlefield communicator", "ACTIVE"));

                if (inventoryRepository.count() == 0) {
                    log.info("Initializing armory stock balances...");
                    inventoryRepository.save(new Inventory(null, b1, eq1, 100, 150, 50, 0, 150));
                    inventoryRepository.save(new Inventory(null, b1, eq2, 10, 12, 2, 0, 12));
                    inventoryRepository.save(new Inventory(null, b1, eq3, 5000, 4800, 200, 0, 4800));
                    inventoryRepository.save(new Inventory(null, b2, eq1, 80, 80, 0, 0, 80));
                }
            }
            log.info("MAMS Database automatic startup seeding completed!");
        } else if (userRepository.count() == 0) {
            Base firstBase = baseRepository.findAll().get(0);
            userRepository.save(new User(null, "admin", "admin@mams.mil", passwordEncoder.encode("Admin@123"), "Commander Rajesh Singh", RoleType.ADMIN, firstBase, "ACTIVE"));
            log.info("Default Admin user created successfully!");
        }
    }
}
