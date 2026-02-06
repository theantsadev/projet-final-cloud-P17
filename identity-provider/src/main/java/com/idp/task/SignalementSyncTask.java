package com.idp.task;

import com.idp.service.SignalementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@EnableScheduling
@Slf4j
public class SignalementSyncTask {
    
    private final SignalementService signalementService;
    
    /**
     * Synchroniser tous les signalements non synchronisés toutes les 5 minutes
     */
    // @Scheduled(fixedDelay = 300000) // 5 minutes
    // public void syncPendingSignalements() {
    //     try {
    //         log.info("Démarrage de la synchronisation programmée des signalements");
    //         signalementService.synchronizeAllPending();
    //         log.info("Synchronisation programmée terminée avec succès");
    //     } catch (Exception e) {
    //         log.error("Erreur lors de la synchronisation programmée", e);
    //     }
    // }
    
    /**
     * Récupérer les nouvelles données depuis Firebase toutes les 10 minutes
     */
    // @Scheduled(fixedDelay = 600000) // 10 minutes
    // public void pullFromFirebase() {
    //     try {
    //         log.info("Démarrage de la récupération programmée depuis Firebase");
    //         signalementService.syncFromFirebase();
    //         log.info("Récupération programmée depuis Firebase terminée avec succès");
    //     } catch (Exception e) {
    //         log.error("Erreur lors de la récupération programmée depuis Firebase", e);
    //     }
    // }
}
