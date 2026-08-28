import React from 'react';
import { Fuel, Trees, Package } from 'lucide-react';

export default function NavigationTabs({ activeTab, setActiveTab }) {
  const tabs = [
    {
      id: 'combustible',
      title: 'Control de Combustible',
      description: 'Tanques, Despachos, Gasto (S/) y Rendimiento',
      icon: <Fuel size={20} />
    },
    {
      id: 'madera',
      title: 'Control de Madera',
      description: 'Lotes m³, Especies, Entradas/Salidas y Valorización',
      icon: <Trees size={20} />
    },
    {
      id: 'inventario',
      title: 'Stock de Inventario',
      description: 'Stock Actual vs Máx/Mín, Entradas/Salidas y Alertas',
      icon: <Package size={20} />
    }
  ];

  return (
    <nav className="navigation-tabs">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`nav-tab-button ${isActive ? 'active' : ''}`}
          >
            <div className="nav-tab-icon">
              {tab.icon}
            </div>
            <div className="nav-tab-info">
              <div className="nav-tab-title">
                {tab.title}
              </div>
              <div className="nav-tab-desc">
                {tab.description}
              </div>
            </div>
          </button>
        );
      })}
    </nav>
  );
}
