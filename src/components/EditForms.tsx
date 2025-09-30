import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../store/projectStore';

interface FormData {
  // Common fields
  rechts?: string;
  hoch?: string;
  z?: string;
  
  // Immission point specific
  name?: string;
  heightOffset?: string;
  g_bodenfaktor?: string;
  
  // ESQ specific
  bezeichnung?: string;
  hoehe?: string;
  l?: string;
  s?: string;
  z_impulshaltigkeit?: string;
  z_tonhaltigkeit?: string;
  z_cmet?: string;
  raumwinkelmass?: string;
  schallleistungspegel?: boolean;
  ruhezeitzuschlag?: boolean;
  beurteilungszeitraum?: string;
  einwirkzeit?: string;
  zeiteinheit?: string;
}

export const EditForms: React.FC = () => {
  const {
    selectedElementId,
    selectedElementType,
    isEditFormOpen,
    setEditFormOpen,
    hoehenpunkte,
    esqSources,
    immissionPoints,
    updateHoehenpunkt,
    updateESQ,
    updateImmissionPoint,

  } = useProjectStore();
  
  const [formData, setFormData] = useState<FormData>({});
  
  useEffect(() => {
    if (selectedElementId) {
      if (selectedElementType === 'hoehenpunkt') {
        const hp = hoehenpunkte.get(selectedElementId);
        if (hp) {
          setFormData({
            rechts: hp.GK_Vektor.GK.Rechts.toString(),
            hoch: hp.GK_Vektor.GK.Hoch.toString(),
            z: hp.GK_Vektor.z.toString(),
          });
        }
      } else if (selectedElementType === 'immissionpoint') {
        const ip = immissionPoints.get(selectedElementId);
        if (ip) {
          setFormData({
            name: ip.Name,
            rechts: ip.Position.GK.Rechts.toString(),
            hoch: ip.Position.GK.Hoch.toString(),
            z: ip.Position.z.toString(),
            heightOffset: ip.HeightOffset.toString(),
            g_bodenfaktor: ip.G_Bodenfaktor.toString(),
          });
        }
      } else if (selectedElementType === 'esq') {
        const esq = esqSources.get(selectedElementId);
        if (esq) {
          setFormData({
            bezeichnung: esq.Bezeichnung,
            rechts: esq.Position.GK.Rechts.toString(),
            hoch: esq.Position.GK.Hoch.toString(),
            z: esq.Position.z.toString(),
            hoehe: esq.Hoehe.toString(),
            l: esq.L.toString(),
            s: esq.S.toString(),
            z_impulshaltigkeit: esq.Z_Impulshaltigkeit.toString(),
            z_tonhaltigkeit: esq.Z_Tonhaltigkeit.toString(),
            z_cmet: esq.Z_Cmet.toString(),
            raumwinkelmass: esq.Raumwinkelmass.toString(),
            schallleistungspegel: esq.Schallleistungspegel,
            ruhezeitzuschlag: esq.Ruhezeitzuschlag,
            beurteilungszeitraum: esq.Beurteilungszeitraum.toString(),
            einwirkzeit: esq.Einwirkzeit.toString(),
            zeiteinheit: esq.Zeiteinheit.toString(),
          });
        }
      }
    }
  }, [selectedElementId, selectedElementType, hoehenpunkte, immissionPoints, esqSources]);
  
  if (!isEditFormOpen || !selectedElementId) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedElementType === 'hoehenpunkt') {
      updateHoehenpunkt(selectedElementId, {
        GK_Vektor: {
          GK: {
            Rechts: parseFloat(formData.rechts || '0'),
            Hoch: parseFloat(formData.hoch || '0'),
          },
          z: parseFloat(formData.z || '0'),
        },
      });
    } else if (selectedElementType === 'immissionpoint') {
      updateImmissionPoint(selectedElementId, {
        Name: formData.name || '',
        Position: {
          GK: {
            Rechts: parseFloat(formData.rechts || '0'),
            Hoch: parseFloat(formData.hoch || '0'),
          },
          z: parseFloat(formData.z || '0'),
        },
        HeightOffset: parseFloat(formData.heightOffset || '0'),
        G_Bodenfaktor: parseFloat(formData.g_bodenfaktor || '0'),
      });
    } else if (selectedElementType === 'esq') {
      updateESQ(selectedElementId, {
        Bezeichnung: formData.bezeichnung || '',
        Position: {
          GK: {
            Rechts: parseFloat(formData.rechts || '0'),
            Hoch: parseFloat(formData.hoch || '0'),
          },
          z: parseFloat(formData.z || '0'),
        },
        Hoehe: parseFloat(formData.hoehe || '0'),
        L: parseFloat(formData.l || '0'),
        S: parseFloat(formData.s || '0'),
        Z_Impulshaltigkeit: parseFloat(formData.z_impulshaltigkeit || '0'),
        Z_Tonhaltigkeit: parseFloat(formData.z_tonhaltigkeit || '0'),
        Z_Cmet: parseFloat(formData.z_cmet || '0'),
        Raumwinkelmass: parseInt(formData.raumwinkelmass || '0') || 0,
        Schallleistungspegel: formData.schallleistungspegel || false,
        Ruhezeitzuschlag: formData.ruhezeitzuschlag || false,
        Beurteilungszeitraum: parseInt(formData.beurteilungszeitraum || '0') || 0,
        Einwirkzeit: parseFloat(formData.einwirkzeit || '0'),
        Zeiteinheit: parseInt(formData.zeiteinheit || '0') || 0,
      });
    } 
    
    setEditFormOpen(false);
  };
  
  const formStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    zIndex: 2000,
    minWidth: '300px',
    maxWidth: '500px',
    maxHeight: '80vh',
    overflowY: 'auto',
  };
  
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px',
    marginBottom: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  };
  
  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    fontSize: '12px',
  };
  
  const buttonStyle: React.CSSProperties = {
    padding: '10px 20px',
    margin: '5px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  };
  
  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1999,
        }}
        onClick={() => setEditFormOpen(false)}
      />
      
      {/* Form */}
      <div style={formStyle}>
        <h3 style={{ marginTop: 0 }}>
          {selectedElementType === 'hoehenpunkt' && 'Höhenpunkt bearbeiten'}
          {selectedElementType === 'immissionpoint' && 'Immissionspunkt bearbeiten'}
          {selectedElementType === 'esq' && 'ESQ bearbeiten'}
        </h3>
        
        <form onSubmit={handleSubmit}>
          {selectedElementType === 'hoehenpunkt' && (
            <>
              <label style={labelStyle}>GK Rechts:</label>
              <input
                style={inputStyle}
                type="number"
                step="0.01"
                value={formData.rechts || ''}
                onChange={(e) => setFormData({ ...formData, rechts: e.target.value })}
                required
              />
              
              <label style={labelStyle}>GK Hoch:</label>
              <input
                style={inputStyle}
                type="number"
                step="0.01"
                value={formData.hoch || ''}
                onChange={(e) => setFormData({ ...formData, hoch: e.target.value })}
                required
              />
              
              <label style={labelStyle}>Höhe (z):</label>
              <input
                style={inputStyle}
                type="number"
                step="0.01"
                value={formData.z || ''}
                onChange={(e) => setFormData({ ...formData, z: e.target.value })}
                required
              />
            </>
          )}
          
          {selectedElementType === 'immissionpoint' && (
            <>
              <label style={labelStyle}>Name:</label>
              <input
                style={inputStyle}
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              
              <label style={labelStyle}>GK Rechts:</label>
              <input
                style={inputStyle}
                type="number"
                step="0.01"
                value={formData.rechts || ''}
                onChange={(e) => setFormData({ ...formData, rechts: e.target.value })}
                required
              />
              
              <label style={labelStyle}>GK Hoch:</label>
              <input
                style={inputStyle}
                type="number"
                step="0.01"
                value={formData.hoch || ''}
                onChange={(e) => setFormData({ ...formData, hoch: e.target.value })}
                required
              />
              
              <label style={labelStyle}>Höhe (z):</label>
              <input
                style={inputStyle}
                type="number"
                step="0.01"
                value={formData.z || ''}
                onChange={(e) => setFormData({ ...formData, z: e.target.value })}
                required
              />
       
              <label style={labelStyle}>Höhenoffset:</label>
              <input
                style={inputStyle}
                type="number"
                step="0.1"
                value={formData.heightOffset || 0}
                onChange={(e) => setFormData({ ...formData, heightOffset: e.target.value })}
                required
              />
              
              <label style={labelStyle}>Bodenfaktor (G):</label>
              <input
                style={inputStyle}
                type="number"
                step="0.01"
                value={formData.g_bodenfaktor || ''}
                onChange={(e) => setFormData({ ...formData, g_bodenfaktor: e.target.value })}
                required
              />
            </>
          )}
          
          {selectedElementType === 'esq' && (
            <>
              <label style={labelStyle}>Bezeichnung:</label>
              <input
                style={inputStyle}
                type="text"
                value={formData.bezeichnung || ''}
                onChange={(e) => setFormData({ ...formData, bezeichnung: e.target.value })}
                required
              />
              
              <label style={labelStyle}>GK Rechts:</label>
              <input
              disabled
                style={inputStyle}
                type="number"
                step="0.01"
                value={formData.rechts || ''}
                onChange={(e) => setFormData({ ...formData, rechts: e.target.value })}
                required
              />
              
              <label style={labelStyle}>GK Hoch:</label>
              <input
              disabled
                style={inputStyle}
                type="number"
                step="0.01"
                value={formData.hoch || ''}
                onChange={(e) => setFormData({ ...formData, hoch: e.target.value })}
                required
              />
              
              <label style={labelStyle}>Position Höhe (z):</label>
              <input
                disabled
                style={inputStyle}
                type="number"
                step="0.01"
                value={formData.z || ''}
                onChange={(e) => setFormData({ ...formData, z: e.target.value })}
                required
              />
              
              <label style={{...labelStyle, color: 'red'}}>Höhe:</label>
              <input
                style={{...inputStyle, color: 'red'}}
                type="number"
                step="0.01"
                value={formData.hoehe || ''}
                onChange={(e) => setFormData({ ...formData, hoehe: e.target.value })}
                required
              />
              
              <label style={labelStyle}>Schallleistungspegel (L):</label>
              <input
                style={inputStyle}
                type="number"
                step="0.1"
                value={formData.l || ''}
                onChange={(e) => setFormData({ ...formData, l: e.target.value })}
                required
              />
              
              <label style={labelStyle}>S:</label>
              <input
                style={inputStyle}
                type="number"
                step="0.1"
                value={formData.s || ''}
                onChange={(e) => setFormData({ ...formData, s: e.target.value })}
              />
              
              <label style={labelStyle}>Z Impulshaltigkeit:</label>
              <input
                style={inputStyle}
                type="number"
                step="0.1"
                value={formData.z_impulshaltigkeit || ''}
                onChange={(e) => setFormData({ ...formData, z_impulshaltigkeit: e.target.value })}
              />
              
              <label style={labelStyle}>Z Tonhaltigkeit:</label>
              <input
                style={inputStyle}
                type="number"
                step="0.1"
                value={formData.z_tonhaltigkeit || ''}
                onChange={(e) => setFormData({ ...formData, z_tonhaltigkeit: e.target.value })}
              />
              
              <label style={labelStyle}>Z Cmet:</label>
              <input
                style={inputStyle}
                type="number"
                step="0.1"
                value={formData.z_cmet || ''}
                onChange={(e) => setFormData({ ...formData, z_cmet: e.target.value })}
              />
              
              <label style={labelStyle}>Raumwinkelmass:</label>
              <select
                style={inputStyle}
                value={formData.raumwinkelmass ?? '0'}
                onChange={(e) => setFormData({ ...formData, raumwinkelmass: e.target.value })}
                required
              >
                <option value="0">0</option>
                <option value="3">3</option>
                <option value="6">6</option>
                <option value="9">9</option>
              </select>
              
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={formData.schallleistungspegel || false}
                  onChange={(e) => setFormData({ ...formData, schallleistungspegel: e.target.checked })}
                  style={{ marginRight: '5px' }}
                />
                Schallleistungspegel
              </label>
              
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={formData.ruhezeitzuschlag || false}
                  onChange={(e) => setFormData({ ...formData, ruhezeitzuschlag: e.target.checked })}
                  style={{ marginRight: '5px' }}
                />
                Ruhezeitzuschlag
              </label>
              
              <label style={labelStyle}>Beurteilungszeitraum:</label>
              <select
                style={inputStyle}
                value={formData.beurteilungszeitraum ?? '0'}
                onChange={(e) => setFormData({ ...formData, beurteilungszeitraum: e.target.value })}
                required
              >
                <option value="0">0 - Tag (6:00-22:00)</option>
                <option value="1">1 - Nacht (22:00-6:00)</option>
                <option value="2">2 - Lauteste Stunde</option>
              </select>
              
              <label style={labelStyle}>Einwirkzeit:</label>
              <input
                style={inputStyle}
                type="number"
                step="0.1"
                value={formData.einwirkzeit || ''}
                onChange={(e) => setFormData({ ...formData, einwirkzeit: e.target.value })}
                required
              />
              
              <label style={labelStyle}>Zeiteinheit:</label>
              <select
                style={inputStyle}
                value={formData.zeiteinheit ?? '0'}
                onChange={(e) => setFormData({ ...formData, zeiteinheit: e.target.value })}
                required
              >
                <option value="0">0 - Sekunden</option>
                <option value="1">1 - Minuten</option>
                <option value="2">2 - Stunden</option>
              </select>
            </>
          )}
          

          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              type="button"
              style={{
                ...buttonStyle,
                background: '#f5f5f5',
                color: '#333',
              }}
              onClick={() => setEditFormOpen(false)}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              style={{
                ...buttonStyle,
                background: '#4CAF50',
                color: 'white',
              }}
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </>
  );
};