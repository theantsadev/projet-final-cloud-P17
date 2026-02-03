package com.idp.entity;

public enum StatutSignalement {
    NOUVEAU("nouveau"),
    EN_COURS("en_cours"),
    TERMINE("termine"),
    ANNULE("annule");
    
    private final String valeur;
    
    StatutSignalement(String valeur) {
        this.valeur = valeur;
    }
    
    public String getValeur() {
        return valeur;
    }
}
