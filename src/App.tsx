import { useState, useEffect } from 'react'
import { LageplanMap } from './components/LageplanMap'
import { EditForms } from './components/EditForms'
import { MenuBar } from './components/MenuBar'
import { StatusBar } from './components/StatusBar'
import { ReferencePointCalibration } from './components/ReferencePointCalibration'
import { MastEditDialog } from './components/dialogs/MastEditDialog'
import { MarkerSelectionToolbar } from './components/MarkerSelectionToolbar'
import { DialogProvider } from './hooks/useDialog'
import { useComputationErrorDisplay } from './hooks/useComputationErrorDisplay'
import { HelmertTransform } from './utils/helmertTransform'
import { useProjectStore } from './store/projectStore'
import './App.css'

function App() {
  const [transform, setTransform] = useState<HelmertTransform | null>(null);
  const [showTrassen, setShowTrassen] = useState(true);
  const [showDGM, setShowDGM] = useState(false);
  const [showContour, setShowContour] = useState(false);
  const [showReferenceCalibration, setShowReferenceCalibration] = useState(true);
  const [mapDimensions, setMapDimensions] = useState({ width: 800, height: 600 });
  
  const { 
    imageWidth, 
    imageHeight, 
    loadStandardTemplates, 
    selectedElementId,
    selectedElementType,
    isEditFormOpen,
    setEditFormOpen,
    referencePoints,
    immissionPoints,
    isImmissionPointsComputed,
    immissionGrid,
    isGridComputed
  } = useProjectStore();
  
  // Hook for displaying computation errors
  const { ErrorDialog } = useComputationErrorDisplay();
  
  // Load standard templates on first load
  useEffect(() => {
    loadStandardTemplates();
  }, []);
  
  useEffect(() => {
    if (imageWidth && imageHeight) {
      setMapDimensions({ width: imageWidth, height: imageHeight });
    }
  }, [imageWidth, imageHeight]);
  
  return (
    <DialogProvider>
      <div style={{ height: '100vh', width: '100vw' }}>
        <MenuBar 
          mapWidth={mapDimensions.width}
          mapHeight={mapDimensions.height}
          transform={transform}
          showTrassen={showTrassen}
          setShowTrassen={setShowTrassen}
          showDGM={showDGM}
          setShowDGM={setShowDGM}
          showContour={showContour}
          setShowContour={setShowContour}
          showReferenceCalibration={showReferenceCalibration}
          setShowReferenceCalibration={setShowReferenceCalibration}
        />
        <StatusBar 
          referencePointsCount={referencePoints.length}
          immissionPointsCount={immissionPoints.size}
          isImmissionPointsComputed={isImmissionPointsComputed}
          gridPointsCount={immissionGrid.length}
          isGridComputed={isGridComputed}
        />
        <div style={{ paddingTop: '72px', height: '100%' }}>
          <LageplanMap 
            onTransformUpdate={setTransform}
            showTrassen={showTrassen}
            showDGM={showDGM}
            showContour={showContour}
            onDimensionsUpdate={setMapDimensions}
          />
          <MarkerSelectionToolbar />
          {showReferenceCalibration && <ReferencePointCalibration />}
          {/* Use MastEditDialog for both poles and masts, EditForms for other elements */}
          {(selectedElementType === 'pole') && selectedElementId && (
            <MastEditDialog
              mastId={selectedElementId}
              isPole={selectedElementType === 'pole'}
              isOpen={isEditFormOpen}
              onClose={() => setEditFormOpen(false)}
            />
          )}
          {selectedElementType !== 'pole' && (
            <EditForms />
          )}
        </div>
        <ErrorDialog />
      </div>
    </DialogProvider>
  )
}

export default App