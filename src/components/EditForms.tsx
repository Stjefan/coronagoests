import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../store/projectStore';

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
  
  const [formData, setFormData] = useState<any>({});
  
  useEffect(() => {
    if (selectedElementId) {
      if (selectedElementType === 'hoehenpunkt') {
        const hp = hoehenpunkte.get(selectedElementId);
        if (hp) {
          setFormData({
            rechts: hp.GK_Vektor.GK.Rechts,
            hoch: hp.GK_Vektor.GK.Hoch,
            z: hp.GK_Vektor.z,
          });
        }
      } else if (selectedElementType === 'immissionpoint') {
        const ip = immissionPoints.get(selectedElementId);
        if (ip) {
          setFormData({
            name: ip.Name,
            rechts: ip.Position.GK.Rechts,
            hoch: ip.Position.GK.Hoch,
            z: ip.Position.z,
            heightOffset: ip.HeightOffset,
            g_bodenfaktor: ip.G_Bodenfaktor,
          });
        }
      } else if (selectedElementType === 'esq') {
        const esq = esqSources.get(selectedElementId);
        if (esq) {
          setFormData({
            bezeichnung: esq.Bezeichnung,
            rechts: esq.Position.GK.Rechts,
            hoch: esq.Position.GK.Hoch,
            z: esq.Position.z,
            hoehe: esq.Hoehe,
            l: esq.L,
            s: esq.S,
            z_impulshaltigkeit: esq.Z_Impulshaltigkeit,
            z_tonhaltigkeit: esq.Z_Tonhaltigkeit,
            z_cmet: esq.Z_Cmet,
            schallleistungspegel: esq.Schallleistungspegel,
            ruhezeitzuschlag: esq.Ruhezeitzuschlag,
            beurteilungszeitraum: esq.Beurteilungszeitraum,
            einwirkzeit: esq.Einwirkzeit,
            zeiteinheit: esq.Zeiteinheit,
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
            Rechts: parseFloat(formData.rechts),
            Hoch: parseFloat(formData.hoch),
          },
          z: parseFloat(formData.z),
        },
      });
    } else if (selectedElementType === 'immissionpoint') {
      updateImmissionPoint(selectedElementId, {
        Name: formData.name,
        Position: {
          GK: {
            Rechts: parseFloat(formData.rechts),
            Hoch: parseFloat(formData.hoch),
          },
          z: parseFloat(formData.z),
        },
        HeightOffset: parseFloat(formData.heightOffset),
        G_Bodenfaktor: parseFloat(formData.g_bodenfaktor),
      });
    } else if (selectedElementType === 'esq') {
      updateESQ(selectedElementId, {
        Bezeichnung: formData.bezeichnung,
        Position: {
          GK: {
            Rechts: parseFloat(formData.rechts),
            Hoch: parseFloat(formData.hoch),
          },
          z: parseFloat(formData.z),
        },
        Hoehe: parseFloat(formData.hoehe),
        L: parseFloat(formData.l),
        S: parseFloat(formData.s),
        Z_Impulshaltigkeit: parseFloat(formData.z_impulshaltigkeit),
        Z_Tonhaltigkeit: parseFloat(formData.z_tonhaltigkeit),
        Z_Cmet: parseFloat(formData.z_cmet),
        Schallleistungspegel: formData.schallleistungspegel,
        Ruhezeitzuschlag: formData.ruhezeitzuschlag,
        Beurteilungszeitraum: parseInt(formData.beurteilungszeitraum) || 0,
        Einwirkzeit: parseFloat(formData.einwirkzeit),
        Zeiteinheit: parseInt(formData.zeiteinheit) || 0,
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
                value={formData.beurteilungszeitraum ?? 0}
                onChange={(e) => setFormData({ ...formData, beurteilungszeitraum: parseInt(e.target.value) })}
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
                value={formData.zeiteinheit ?? 0}
                onChange={(e) => setFormData({ ...formData, zeiteinheit: parseInt(e.target.value) })}
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