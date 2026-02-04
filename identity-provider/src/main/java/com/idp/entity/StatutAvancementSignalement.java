package com.idp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "statut_avancement_signalement")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatutAvancementSignalement {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String statut;
    
    @Column(nullable = false)
    private Integer avancement;
}