import React, { useState, useMemo } from 'react';
import { calculateLeasing, estimateRunningCosts, estimateMaintenance } from '../utils/costCalculator.js';

const MONTH_OPTIONS = [12, 24, 36, 48, 60, 72, 84];

export default function CostPanel({ price, powerKw, fuelType }) {
    if (!price || !powerKw) return null;

    const [isExpanded, setIsExpanded] = useState(false);
    const [downPayment, setDownPayment] = useState(Math.round(price * 0.2));
    const [months, setMonths] = useState(60);

    const maxDownPayment = Math.round(price * 0.5);

    const leasing = useMemo(
        () => calculateLeasing(price, downPayment, months),
        [price, downPayment, months]
    );
    const running = useMemo(
        () => estimateRunningCosts(powerKw, fuelType),
        [powerKw, fuelType]
    );
    const maintenance = useMemo(
        () => estimateMaintenance(price),
        [price]
    );

    const total = leasing + running + maintenance;
    const downPct = Math.round((downPayment / price) * 100);

    return (
        <div className="cost-panel glass-card">
            <div className="cost-panel__collapsed" onClick={() => setIsExpanded(v => !v)}>
                <div className="cost-panel__total-label">Realni mesečni strošek</div>
                <div className="cost-panel__total-value">~ {total.toLocaleString('sl-SI')} €</div>
                <div className="cost-panel__toggle">
                    {isExpanded ? 'Skrij razčlenitev' : 'Razčleni stroške'}
                    <span className={`cost-panel__chevron ${isExpanded ? 'cost-panel__chevron--up' : ''}`}>›</span>
                </div>
            </div>

            {isExpanded && (
                <div className="cost-panel__expanded">
                    <div className="cost-panel__slider-group">
                        <div className="cost-panel__slider-header">
                            <span>Polog</span>
                            <span className="cost-panel__slider-value">
                                {downPayment.toLocaleString('sl-SI')} € ({downPct}%)
                            </span>
                        </div>
                        <input
                            type="range"
                            className="cost-panel__range"
                            min={0}
                            max={maxDownPayment}
                            step={100}
                            value={downPayment}
                            onChange={e => setDownPayment(Number(e.target.value))}
                        />
                        <div className="cost-panel__slider-limits">
                            <span>0 €</span>
                            <span>{maxDownPayment.toLocaleString('sl-SI')} €</span>
                        </div>
                    </div>

                    <div className="cost-panel__slider-group">
                        <div className="cost-panel__slider-header">
                            <span>Doba odplačevanja</span>
                            <span className="cost-panel__slider-value">{months} mes.</span>
                        </div>
                        <div className="cost-panel__month-btns">
                            {MONTH_OPTIONS.map(m => (
                                <button
                                    key={m}
                                    className={`cost-panel__month-btn ${months === m ? 'cost-panel__month-btn--active' : ''}`}
                                    onClick={() => setMonths(m)}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="cost-panel__breakdown">
                        <div className="cost-panel__breakdown-row">
                            <span>🏦 Informativni lizing (6.5% OM)</span>
                            <span>{leasing.toLocaleString('sl-SI')} €</span>
                        </div>
                        <div className="cost-panel__breakdown-row">
                            <span>🛡️ Zavarovanje in takse (ocena)</span>
                            <span>{running.toLocaleString('sl-SI')} €</span>
                        </div>
                        <div className="cost-panel__breakdown-row">
                            <span>🔧 Redno vzdrževanje (ocena)</span>
                            <span>{maintenance.toLocaleString('sl-SI')} €</span>
                        </div>
                        <div className="cost-panel__breakdown-row cost-panel__breakdown-row--total">
                            <span>Skupaj / mesec</span>
                            <span>{total.toLocaleString('sl-SI')} €</span>
                        </div>
                    </div>

                    <p className="cost-panel__disclaimer">
                        Izračuni so zgolj informativne narave in ne predstavljajo zavezujoče ponudbe.
                        Končni pogoji financiranja so odvisni od posamezne lizing hiše.
                    </p>
                </div>
            )}
        </div>
    );
}
