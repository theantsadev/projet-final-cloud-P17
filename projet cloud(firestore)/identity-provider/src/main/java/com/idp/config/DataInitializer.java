package com.idp.config;

import com.idp.entity.Role;
import com.idp.repository.RoleRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer {

    private final RoleRepository roleRepository;

    @PostConstruct
    public void initializeRoles() {
        // Create MANAGER role if it doesn't exist
        if (roleRepository.findByName("MANAGER").isEmpty()) {
            Role managerRole = new Role();
            managerRole.setName("MANAGER");
            roleRepository.save(managerRole);
        }

        // Create USER role if it doesn't exist
        if (roleRepository.findByName("USER").isEmpty()) {
            Role userRole = new Role();
            userRole.setName("USER");
            roleRepository.save(userRole);
        }
    }
}
