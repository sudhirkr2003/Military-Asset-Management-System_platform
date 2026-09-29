package com.mams.repository;

import com.mams.entity.Base;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BaseRepository extends JpaRepository<Base, Long> {
    Optional<Base> findByCode(String code);
    Optional<Base> findByName(String name);
    boolean existsByCode(String code);
    boolean existsByName(String name);
}
