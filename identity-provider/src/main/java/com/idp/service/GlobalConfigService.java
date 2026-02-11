package com.idp.service;

import com.idp.entity.GlobalConfig;
import com.idp.exception.BusinessException;
import com.idp.repository.GlobalConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service de gestion de la configuration globale.
 * Notamment le prix global au m² pour le calcul du budget.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GlobalConfigService {

    private final GlobalConfigRepository globalConfigRepository;

    /**
     * Valeur par défaut du prix global au m² (en Ariary)
     */
    private static final BigDecimal DEFAULT_PRIX_M2_GLOBAL = new BigDecimal("50000");

    /**
     * Récupérer le prix global au m²
     */
    public BigDecimal getPrixM2Global() {
        return globalConfigRepository.findByConfigKey(GlobalConfig.PRIX_M2_GLOBAL_KEY)
                .map(GlobalConfig::getValueAsBigDecimal)
                .orElse(DEFAULT_PRIX_M2_GLOBAL);
    }

    /**
     * Mettre à jour le prix global au m²
     */
    @Transactional
    public GlobalConfig setPrixM2Global(BigDecimal prixM2) {
        log.info("Mise à jour du prix global au m²: {} Ar", prixM2);

        if (prixM2 == null || prixM2.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("INVALID_PRICE", 
                    "Le prix au m² doit être supérieur à 0");
        }

        GlobalConfig config = globalConfigRepository.findByConfigKey(GlobalConfig.PRIX_M2_GLOBAL_KEY)
                .orElse(GlobalConfig.builder()
                        .configKey(GlobalConfig.PRIX_M2_GLOBAL_KEY)
                        .description("Prix global par mètre carré pour le calcul du budget (en Ariary)")
                        .build());

        config.setValueFromBigDecimal(prixM2);
        GlobalConfig saved = globalConfigRepository.save(config);

        log.info("✅ Prix global au m² mis à jour: {} Ar", prixM2);
        return saved;
    }

    /**
     * Calculer le budget d'un signalement
     * Formule: budget = prix_m2_global × niveau × surface_m2
     */
    public BigDecimal calculateBudget(BigDecimal surfaceM2, Integer niveau) {
        if (surfaceM2 == null || niveau == null) {
            log.warn("Surface ou niveau non défini, budget = 0");
            return BigDecimal.ZERO;
        }

        BigDecimal prixM2Global = getPrixM2Global();
        BigDecimal budget = prixM2Global
                .multiply(BigDecimal.valueOf(niveau))
                .multiply(surfaceM2);

        log.debug("Calcul budget: {} × {} × {} = {} Ar", 
                prixM2Global, niveau, surfaceM2, budget);

        return budget;
    }

    /**
     * Récupérer une configuration par clé
     */
    public GlobalConfig getConfig(String key) {
        return globalConfigRepository.findByConfigKey(key)
                .orElseThrow(() -> new BusinessException("CONFIG_NOT_FOUND",
                        "Configuration non trouvée: " + key));
    }

    /**
     * Récupérer toutes les configurations
     */
    public List<GlobalConfig> getAllConfigs() {
        return globalConfigRepository.findAll();
    }

    /**
     * Créer ou mettre à jour une configuration
     */
    @Transactional
    public GlobalConfig setConfig(String key, String value, String description) {
        GlobalConfig config = globalConfigRepository.findByConfigKey(key)
                .orElse(GlobalConfig.builder()
                        .configKey(key)
                        .build());

        config.setConfigValue(value);
        if (description != null) {
            config.setDescription(description);
        }

        return globalConfigRepository.save(config);
    }

    /**
     * Initialiser les configurations par défaut si elles n'existent pas
     */
    @Transactional
    public void initializeDefaults() {
        if (!globalConfigRepository.existsByConfigKey(GlobalConfig.PRIX_M2_GLOBAL_KEY)) {
            log.info("Initialisation du prix global au m² par défaut: {} Ar", DEFAULT_PRIX_M2_GLOBAL);
            setPrixM2Global(DEFAULT_PRIX_M2_GLOBAL);
        }
    }
}
