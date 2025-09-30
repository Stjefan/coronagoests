import JSZip from 'jszip';
import type { UsedProjectData } from '../types/usedData';
import { UsedDataLoader } from './usedDataLoader';

export interface ImportResult {
  projectData: UsedProjectData;
  imageData?: string;
  projectName?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export class ProjectImporter {
  /**
   * Import project from a ZIP file
   */
  static async importFromZip(file: File): Promise<ImportResult> {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    
    // Look for project.json
    const projectJsonFile = contents.file('project.json');
    if (!projectJsonFile) {
      throw new Error('Invalid project file: project.json not found');
    }
    
    // Load project data
    const projectJsonText = await projectJsonFile.async('text');
    const projectJson = JSON.parse(projectJsonText);
    
    if (!projectJson.ProjectData) {
      throw new Error('Invalid project file: ProjectData not found');
    }
    
    // Validate project data
    const projectData = UsedDataLoader.validateAndTransform(projectJson.ProjectData);
    
    // Look for image file
    let imageData: string | undefined;
    const imageFiles = Object.keys(contents.files).filter(name => 
      name.startsWith('lageplan.') && !contents.files[name].dir
    );
    
    if (imageFiles.length > 0) {
      const imageFile = contents.file(imageFiles[0]);
      if (imageFile) {
        const imageBlob = await imageFile.async('blob');
        imageData = await blobToBase64(imageBlob);
      }
    }
    
    // Get image dimensions from project data if available
    const imageWidth = projectData.IM_X_max;
    const imageHeight = projectData.IM_Y_max;
    
    return {
      projectData,
      imageData,
      projectName: projectJson.Metadata?.projectName,
      imageWidth,
      imageHeight
    };
  }
  
  /**
   * Import project from JSON file (legacy format)
   */
  static async importFromJson(file: File): Promise<ImportResult> {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!data.ProjectData) {
      throw new Error('Invalid project file: ProjectData not found');
    }
    
    // Validate project data
    const projectData = UsedDataLoader.validateAndTransform(data.ProjectData);
    
    // Get image dimensions from project data if available
    const imageWidth = projectData.IM_X_max;
    const imageHeight = projectData.IM_Y_max;
    
    return {
      projectData,
      imageData: data.Metadata?.imageData,
      projectName: data.Metadata?.projectName || data.ProjectData?.Name,
      imageWidth,
      imageHeight
    };
  }
  
  /**
   * Auto-detect file type and import accordingly
   */
  static async importProject(file: File): Promise<ImportResult> {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.zip')) {
      return this.importFromZip(file);
    } else if (fileName.endsWith('.json')) {
      return this.importFromJson(file);
    } else {
      throw new Error('Unsupported file type. Please use .zip or .json files.');
    }
  }
}

/**
 * Convert blob to base64 data URL
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}