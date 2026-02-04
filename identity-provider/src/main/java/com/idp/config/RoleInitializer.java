package com.idp.config;

import com.idp.entity.Role;
import com.idp.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RoleInitializer implements ApplicationRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("Initialisation des rôles par défaut...");
        
        // Vérifier et créer les rôles s'ils n'existent pas
        createRoleIfNotExists("USER", "Rôle utilisateur standard");
        createRoleIfNotExists("MANAGER", "Rôle gestionnaire");
        
        log.info("✅ Initialisation des rôles complétée");
    }

    private void createRoleIfNotExists(String nom, String description) {
        if (roleRepository.findByNom(nom).isEmpty()) {
            Role role = Role.builder()
                    .nom(nom)
                    .build();
            roleRepository.save(role);
            log.info("✅ Rôle créé: {}", nom);
        } else {
            log.info("✓ Rôle existe déjà: {}", nom);
        }
    }
}
