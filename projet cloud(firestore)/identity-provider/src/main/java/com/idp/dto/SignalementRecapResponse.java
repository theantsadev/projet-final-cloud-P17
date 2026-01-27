package com.idp.dto;

import java.math.BigDecimal;

public class SignalementRecapResponse {
    private long total;
    private long termines;
    private double pourcentageTermines;
    private double surfaceTotale;
    private BigDecimal budgetTotal;

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public long getTermines() {
        return termines;
    }

    public void setTermines(long termines) {
        this.termines = termines;
    }

    public double getPourcentageTermines() {
        return pourcentageTermines;
    }

    public void setPourcentageTermines(double pourcentageTermines) {
        this.pourcentageTermines = pourcentageTermines;
    }

    public double getSurfaceTotale() {
        return surfaceTotale;
    }

    public void setSurfaceTotale(double surfaceTotale) {
        this.surfaceTotale = surfaceTotale;
    }

    public BigDecimal getBudgetTotal() {
        return budgetTotal;
    }

    public void setBudgetTotal(BigDecimal budgetTotal) {
        this.budgetTotal = budgetTotal;
    }
}
