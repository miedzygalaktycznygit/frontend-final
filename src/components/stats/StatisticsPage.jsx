import React, { useState, useEffect, useMemo } from 'react';
import { useAppData } from '../AppContext';

export default function StatisticsPage() {
    const { stats, fetchStats, API_URL } = useAppData();
    const [currentYearIndex, setCurrentYearIndex] = useState(0);
    const [localStats, setLocalStats] = useState(stats);

    useEffect(() => {
        setLocalStats(stats);
    }, [stats]);

    const statsByYear = useMemo(() => {
        const groupedStats = localStats.reduce((acc, stat) => {
            const year = stat.rok;
            if (!acc[year]) {
                acc[year] = {};
            }
            if (!acc[year][stat.miesiac]) {
                acc[year][stat.miesiac] = {
                    id_pl: null,
                    ilosc_pl: null,
                    id_1_euro: null,
                    ilosc_1_euro: null,
                    id_2_euro: null,
                    ilosc_2_euro: null,
                    rok: stat.rok,
                    miesiac: stat.miesiac
                };
            }
            if (stat.rodzaj_produktu === 'PL') {
                acc[year][stat.miesiac].ilosc_pl = stat.ilosc;
                acc[year][stat.miesiac].id_pl = stat.id;
            } else if (stat.rodzaj_produktu === '1 EURO') {
                acc[year][stat.miesiac].ilosc_1_euro = stat.ilosc;
                acc[year][stat.miesiac].id_1_euro = stat.id;
            } else if (stat.rodzaj_produktu === '2 EURO') {
                acc[year][stat.miesiac].ilosc_2_euro = stat.ilosc;
                acc[year][stat.miesiac].id_2_euro = stat.id;
            }
            return acc;
        }, {});

        const sortedGroupedStats = {};
        for (const year in groupedStats) {
            sortedGroupedStats[year] = Object.values(groupedStats[year]).sort((a, b) => a.miesiac - b.miesiac);
        }
        return sortedGroupedStats;
    }, [localStats]);

    const availableYears = Object.keys(statsByYear).sort();
    const currentYearData = statsByYear[availableYears[currentYearIndex]] || [];
    
    const handlePrevYear = () => {
        setCurrentYearIndex(prev => Math.max(0, prev - 1));
    };
    const handleNextYear = () => {
        setCurrentYearIndex(prev => Math.min(availableYears.length - 1, prev + 1));
    };

    const updateStat = async (id, ilosc, rodzaj_produktu) => {
        try {
            await fetch(`${API_URL}/statystyki/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ilosc: ilosc === '' ? null : parseInt(ilosc, 10), rodzaj_produktu })
            });
            fetchStats();
        } catch (error) {
            console.error("Błąd aktualizacji statystyk:", error);
        }
    };

    const createStat = async (newStatData) => {
        try {
            await fetch(`${API_URL}/statystyki`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStatData)
            });
            fetchStats();
        } catch (error) {
            console.error("Błąd tworzenia statystyk:", error);
        }
    };
    
    const handleInputChange = (id, newIlosc, rodzaj_produktu, miesiac, rok) => {
        let updatedStats = localStats.map(stat => {
            if (stat.rok === rok && stat.miesiac === miesiac && stat.rodzaj_produktu === rodzaj_produktu) {
                return { ...stat, ilosc: newIlosc };
            }
            return stat;
        });

        const foundExisting = updatedStats.some(stat => 
            stat.rok === rok && stat.miesiac === miesiac && stat.rodzaj_produktu === rodzaj_produktu
        );

        if (!foundExisting && (id === null || String(id).startsWith('temp_'))) {
            const tempId = `temp_${rok}_${miesiac}_${rodzaj_produktu}`;
            updatedStats = [...updatedStats, {
                id: tempId,
                rok: rok,
                miesiac: miesiac,
                ilosc: newIlosc,
                rodzaj_produktu: rodzaj_produktu
            }];
        }
        setLocalStats(updatedStats);
    };

    const handleInputBlur = (id, ilosc, rodzaj_produktu, rok, miesiac) => {
        const parsedIlosc = ilosc === '' ? null : parseInt(ilosc, 10);
        if (id === null || String(id).startsWith('temp_')) {
            createStat({ rok, miesiac, ilosc: parsedIlosc, rodzaj_produktu });
        } else {
            updateStat(id, parsedIlosc, rodzaj_produktu);
        }
    };

    const summary = useMemo(() => {
        const totalSales = stats.reduce((acc, curr) => acc + (curr.ilosc || 0), 0);
        const currentYearSales = currentYearData.reduce((sum, monthData) => 
            sum + (monthData.ilosc_pl || 0) + (monthData.ilosc_1_euro || 0) + (monthData.ilosc_2_euro || 0), 0);
        const currentYear = availableYears[currentYearIndex];
        
        const yearlySales = Object.entries(statsByYear).map(([year, yearData]) => {
            const total = yearData.reduce((sum, month) => 
                sum + (month.ilosc_pl || 0) + (month.ilosc_1_euro || 0) + (month.ilosc_2_euro || 0), 0);
            return { year: parseInt(year), total };
        }).filter(y => y.total > 0);

        let trend = "Brak wystarczających danych do predykcji.";
        if (yearlySales.length >= 2) {
            let n = yearlySales.length;
            let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
            yearlySales.forEach(p => {
                sumX += p.year;
                sumY += p.total;
                sumXY += p.year * p.total;
                sumX2 += p.year * p.year;
            });

            const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            const lastYearData = yearlySales[yearlySales.length - 1];
            const nextYear = lastYearData.year + 1;
            const prediction = Math.round(Math.max(0, slope * nextYear + ((sumY / n) - slope * (sumX / n))));

            let percentageChange = 0;
            if (lastYearData.total > 0) {
                percentageChange = ((prediction - lastYearData.total) / lastYearData.total) * 100;
            }

            const trendDirection = percentageChange >= 0 ? "wzrost" : "spadek";
            trend = `Przewidywany ${trendDirection} o ${Math.abs(percentageChange).toFixed(2)}%. Prognoza na ${nextYear}: ~${prediction.toLocaleString('pl-PL')} szt.`;
        }
        
        return { totalSales, currentYearSales, currentYear, trend };
    }, [stats, statsByYear, currentYearData, availableYears, currentYearIndex]);

    const seasonalSuggestions = useMemo(() => {
        const suggestions = {};
        const currentYear = parseInt(availableYears[currentYearIndex]);
        const prevYear = currentYear - 1;
        const prevYearData = statsByYear[prevYear];

        if (prevYearData) {
            currentYearData.forEach(currentMonthStat => {
                ['ilosc_pl', 'ilosc_1_euro', 'ilosc_2_euro'].forEach(productKey => {
                    const prevMonthInCurrentYear = currentYearData.find(s => s.miesiac === currentMonthStat.miesiac - 1);
                    const prevMonthInPrevYear = prevYearData.find(s => s.miesiac === currentMonthStat.miesiac - 1);
                    const currentMonthInPrevYear = prevYearData.find(s => s.miesiac === currentMonthStat.miesiac);

                    if (prevMonthInCurrentYear && prevMonthInPrevYear && currentMonthInPrevYear) {
                        const prevMonthCurrentYearValue = prevMonthInCurrentYear[productKey];
                        const prevMonthPrevYearValue = prevMonthInPrevYear[productKey];
                        const currentMonthPrevYearValue = currentMonthInPrevYear[productKey];

                        if (prevMonthCurrentYearValue > 0 && prevMonthPrevYearValue > 0 && currentMonthPrevYearValue !== null) {
                            const seasonalChange = currentMonthPrevYearValue / prevMonthPrevYearValue;
                            const suggestion = Math.round(prevMonthCurrentYearValue * seasonalChange);
                            suggestions[`${currentMonthStat.miesiac}_${productKey}`] = suggestion;
                        }
                    }
                });
            });
        }
        return suggestions;
    }, [currentYearData, statsByYear, availableYears, currentYearIndex]);


    const monthNames = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];

    return (
        <div className="stats-page-container">
            <div className="stats-table-container card">
                <div className="year-navigation">
                    <button onClick={handlePrevYear} disabled={currentYearIndex === 0} className="btn">‹ Poprzedni rok</button>
                    <h2>Statystyki za rok: {availableYears[currentYearIndex]}</h2>
                    <button onClick={handleNextYear} disabled={currentYearIndex === availableYears.length - 1} className="btn">Następny rok ›</button>
                </div>
                <table className="stats-table">
                    <thead><tr>
                        <th>Miesiąc</th>
                        <th>Ilość sprzedanych skarbonek PL</th>
                        <th>Ilość sprzedanych skarbonek 1 EURO</th>
                        <th>Ilość sprzedanych skarbonek 2 EURO</th>
                    </tr></thead>
                    <tbody>
                        {currentYearData.map(stat => (
                            <tr key={stat.miesiac}>
                                <td>{monthNames[stat.miesiac - 1]}</td>
                                <td><div className="input-with-suggestion">
                                    <input
                                        type="number"
                                        value={stat.ilosc_pl === null ? '' : stat.ilosc_pl}
                                        onChange={(e) => handleInputChange(stat.id_pl, e.target.value, 'PL', stat.miesiac, stat.rok)}
                                        onBlur={(e) => handleInputBlur(stat.id_pl, e.target.value, 'PL', stat.rok, stat.miesiac)}
                                        className="input-field"
                                        placeholder="Wprowadź ilość..."
                                    />
                                    {seasonalSuggestions[`${stat.miesiac}_ilosc_pl`] && (
                                        <span className="suggestion-text">
                                            (sugestia: {seasonalSuggestions[`${stat.miesiac}_ilosc_pl`]}, roboczogodziny: {Math.ceil(seasonalSuggestions[`${stat.miesiac}_ilosc_pl`] / 5)})
                                        </span>
                                    )}
                                </div></td>
                                <td><div className="input-with-suggestion">
                                    <input
                                        type="number"
                                        value={stat.ilosc_1_euro === null ? '' : stat.ilosc_1_euro}
                                        onChange={(e) => handleInputChange(stat.id_1_euro, e.target.value, '1 EURO', stat.miesiac, stat.rok)}
                                        onBlur={(e) => handleInputBlur(stat.id_1_euro, e.target.value, '1 EURO', stat.rok, stat.miesiac)}
                                        className="input-field"
                                        placeholder="Wprowadź ilość..."
                                    />
                                    {seasonalSuggestions[`${stat.miesiac}_ilosc_1_euro`] && (
                                        <span className="suggestion-text">
                                            (sugestia: {seasonalSuggestions[`${stat.miesiac}_ilosc_1_euro`]}, roboczogodziny: {Math.ceil(seasonalSuggestions[`${stat.miesiac}_ilosc_1_euro`] / 5)})
                                        </span>
                                    )}
                                </div></td>
                                <td><div className="input-with-suggestion">
                                    <input
                                        type="number"
                                        value={stat.ilosc_2_euro === null ? '' : stat.ilosc_2_euro}
                                        onChange={(e) => handleInputChange(stat.id_2_euro, e.target.value, '2 EURO', stat.miesiac, stat.rok)}
                                        onBlur={(e) => handleInputBlur(stat.id_2_euro, e.target.value, '2 EURO', stat.rok, stat.miesiac)}
                                        className="input-field"
                                        placeholder="Wprowadź ilość..."
                                    />
                                    {seasonalSuggestions[`${stat.miesiac}_ilosc_2_euro`] && (
                                        <span className="suggestion-text">
                                            (sugestia: {seasonalSuggestions[`${stat.miesiac}_ilosc_2_euro`]}, roboczogodziny: {Math.ceil(seasonalSuggestions[`${stat.miesiac}_ilosc_2_euro`] / 5)})
                                        </span>
                                    )}
                                </div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="stats-summary-container card">
                <h3>Podsumowanie</h3>
                <div className="summary-item">
                    <h4>Sprzedaż w roku {summary.currentYear}</h4>
                    <p className="summary-value">{summary.currentYearSales.toLocaleString('pl-PL')} szt.</p>
                </div>
                <div className="summary-item">
                    <h4>Całkowita sprzedaż (wszystkie lata)</h4>
                    <p className="summary-value">{summary.totalSales.toLocaleString('pl-PL')} szt.</p>
                </div>
                <div className="summary-item">
                    <h4>Prognoza na następny rok</h4>
                    <p className="summary-value trend-text">{summary.trend}</p>
                </div>
            </div>
        </div>
    );
}