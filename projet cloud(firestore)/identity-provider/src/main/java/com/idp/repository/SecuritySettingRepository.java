package com.idp.repository;

import com.idp.entity.SecuritySetting;

import com.idp.entity.SecuritySetting;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SecuritySettingRepository extends JpaRepository<SecuritySetting, Long> {
    Optional<SecuritySetting> findByKey(String key);

    List<SecuritySetting> findBySyncStatus(String syncStatus);
}