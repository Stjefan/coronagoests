import JSZip from 'jszip';
import type { UsedProjectData } from '../types/usedData';

export interface ProjectExportData {
  projectData: UsedProjectData;
  imageData?: string;
  metadata: {
    exportDate: string;
    version: string;
    projectName: string;
  };
}

export class ProjectExporter {
  /**
   * Export project to a ZIP file containing JSON data and image
   */
  static async exportToZip(
    projectData: UsedProjectData,
    projectName: string,
    imageData?: string
  ): Promise<Blob> {
    const zip = new JSZip();
    
    // Create metadata
    const metadata = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      projectName: projectName
    };
    
    // Add project data JSON
    const projectJson = JSON.stringify({
      ProjectData: projectData,
      Metadata: metadata
    }, null, 2);
    zip.file('project.json', projectJson);
    
    // Add image if available
    if (imageData) {
      // Extract image format and data
      const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
      if (matches) {
        const imageFormat = matches[1];
        // const base64Data = matches[2];
        const imageBlob = await fetch(imageData).then(r => r.blob());
        zip.file(`lageplan.${imageFormat}`, imageBlob);
      }
    }
    
    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return zipBlob;
  }
  
  /**
   * Export project to JSON (legacy format)
   */
  static exportToJson(
    projectData: UsedProjectData,
    projectName: string,
    imageData?: string
  ): string {
    const exportData = {
      ProjectData: projectData,
      Metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        projectName: projectName,
        imageData: imageData || null
      }
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  /**
   * Download a blob as a file
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}