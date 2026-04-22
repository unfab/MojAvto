import React, { useEffect, useState } from 'react';
import { useSearchStore } from '../store/useSearchStore';
import RangeSlider from '../components/filters/RangeSlider';
import CustomSelect from '../components/filters/CustomSelect';
import CheckboxGroup from '../components/filters/CheckboxGroup';

export default function AdvancedSearch() {
  const { filters, setFilter, resetFilters } = useSearchStore();
  const [brandData, setBrandData] = useState({});
  const [availableModels, setAvailableModels] = useState([]);

  // Nalaganje znamk in modelov iz obstoječega JSON-a
  useEffect(() => {
    fetch('/json/brands_models_global.json')
      .then(r => r.json())
      .then(data => setBrandData(data))
      .catch(err => console.error("Napaka pri nalaganju znamk:", err));
  }, []);

  // Posodobitev modelov, ko se spremeni znamka
  const handleBrandChange = (brand) => {
    setFilter('brand', brand ? [brand] : []);
    if (brand && brandData[brand]) {
      const models = brandData[brand];
      setAvailableModels(Array.isArray(models) ? models : Object.keys(models));
    } else {
      setAvailableModels([]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col md:flex-row gap-8">
      {/* Sidebar s filtri */}
      <aside className="w-full md:w-80 flex flex-col gap-2">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Filtri</h2>
            <button 
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:underline"
            >
              Ponastavi
            </button>
          </div>

          <CustomSelect 
            label="Znamka"
            value={filters.brand[0] || ''}
            options={Object.keys(brandData).sort()}
            onChange={handleBrandChange}
            placeholder="Vse znamke"
          />

          <CustomSelect 
            label="Model"
            value={filters.model || ''}
            options={availableModels.sort()}
            onChange={(val) => setFilter('model', val)}
            placeholder="Vsi modeli"
            disabled={!availableModels.length}
          />

          <RangeSlider 
            label="Cena (€)"
            value={filters.price}
            onChange={(val) => setFilter('price', val)}
            unit="€"
          />

          <RangeSlider 
            label="Letnik"
            value={filters.year}
            onChange={(val) => setFilter('year', val)}
            min={1980}
            max={2026}
          />

          <CheckboxGroup 
            label="Gorivo"
            options={['Bencin', 'Diesel', 'Hibrid', 'Elektrika']}
            selectedValues={filters.fuel}
            onChange={(val) => setFilter('fuel', val)}
          />

          <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all mt-4">
            Prikaži rezultate
          </button>
        </div>
      </aside>

      {/* Rezultati iskanja */}
      <main className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Rezultati iskanja</h1>
          <span className="text-gray-500">Prikazujem 0 oglasov</span>
        </div>
        
        {/* Tu bomo kasneje dodali ListingCard komponente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-12 border-2 border-dashed border-gray-200 rounded-3xl text-center text-gray-400">
            Nalaganje oglasov...
          </div>
        </div>
      </main>
    </div>
  );
}
