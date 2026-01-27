package com.idp.service;

import com.idp.dto.SignalementCreateRequest;
import com.idp.dto.SignalementRecapResponse;
import com.idp.dto.SignalementResponse;
import com.idp.dto.SignalementStatusRequest;
import com.idp.dto.SignalementUpdateRequest;
import com.idp.entity.Signalement;
import com.idp.entity.SignalementStatus;
import com.idp.entity.User;
import com.idp.repository.SignalementRepository;
import com.idp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SignalementService {

    private final SignalementRepository signalementRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<SignalementResponse> getAll() {
        return signalementRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SignalementResponse getById(Long id) {
        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Signalement non trouvé"));
        return toResponse(signalement);
    }

    @Transactional
    public SignalementResponse create(SignalementCreateRequest request, String userId) {
        Signalement signalement = new Signalement();
        signalement.setDateSignalement(
                request.getDateSignalement() != null ? request.getDateSignalement() : LocalDateTime.now());
        signalement.setStatut(Optional.ofNullable(request.getStatut()).orElse(SignalementStatus.NOUVEAU));
        signalement.setSurfaceM2(request.getSurfaceM2());
        signalement.setBudget(request.getBudget());
        signalement.setEntreprise(request.getEntreprise());
        signalement.setLatitude(request.getLatitude());
        signalement.setLongitude(request.getLongitude());

        if (userId != null) {
            userRepository.findById(userId).ifPresent(signalement::setCreatedBy);
        }

        Signalement saved = signalementRepository.save(signalement);
        return toResponse(saved);
    }

    @Transactional
    public SignalementResponse update(Long id, SignalementUpdateRequest request) {
        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Signalement non trouvé"));

        if (request.getDateSignalement() != null) {
            signalement.setDateSignalement(request.getDateSignalement());
        }
        if (request.getStatut() != null) {
            signalement.setStatut(request.getStatut());
        }
        if (request.getSurfaceM2() != null) {
            signalement.setSurfaceM2(request.getSurfaceM2());
        }
        if (request.getBudget() != null) {
            signalement.setBudget(request.getBudget());
        }
        if (request.getEntreprise() != null) {
            signalement.setEntreprise(request.getEntreprise());
        }
        if (request.getLatitude() != null) {
            signalement.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            signalement.setLongitude(request.getLongitude());
        }

        Signalement saved = signalementRepository.save(signalement);
        return toResponse(saved);
    }

    @Transactional
    public SignalementResponse updateStatus(Long id, SignalementStatusRequest request) {
        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Signalement non trouvé"));

        signalement.setStatut(request.getStatut());
        Signalement saved = signalementRepository.save(signalement);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public SignalementRecapResponse getRecap() {
        long total = signalementRepository.count();
        long termines = signalementRepository.countByStatut(SignalementStatus.TERMINE);
        Double surface = signalementRepository.sumSurface();
        BigDecimal budget = signalementRepository.sumBudget();

        SignalementRecapResponse recap = new SignalementRecapResponse();
        recap.setTotal(total);
        recap.setTermines(termines);
        recap.setSurfaceTotale(surface != null ? surface : 0);
        recap.setBudgetTotal(budget != null ? budget : BigDecimal.ZERO);
        recap.setPourcentageTermines(total > 0 ? (double) termines / total * 100d : 0d);
        return recap;
    }

    private SignalementResponse toResponse(Signalement signalement) {
        SignalementResponse response = new SignalementResponse();
        response.setId(signalement.getId());
        response.setDateSignalement(signalement.getDateSignalement());
        response.setStatut(signalement.getStatut());
        response.setSurfaceM2(signalement.getSurfaceM2());
        response.setBudget(signalement.getBudget());
        response.setEntreprise(signalement.getEntreprise());
        response.setLatitude(signalement.getLatitude());
        response.setLongitude(signalement.getLongitude());
        response.setCreatedAt(signalement.getCreatedAt());
        response.setUpdatedAt(signalement.getUpdatedAt());

        User createdBy = signalement.getCreatedBy();
        if (createdBy != null) {
            response.setCreatedById(createdBy.getId());
            response.setCreatedByEmail(createdBy.getEmail());
        }
        return response;
    }
}
