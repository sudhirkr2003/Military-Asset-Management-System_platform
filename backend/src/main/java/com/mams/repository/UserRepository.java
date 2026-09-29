package com.mams.repository;

import com.mams.entity.User;
import com.mams.entity.enums.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsernameOrEmail(String username, String email);
    
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    List<User> findByRole(RoleType role);
    List<User> findByBaseId(Long baseId);
}
