// Mast Layout Template System
// Defines reusable templates for mast configurations

export interface MastLayoutTemplate {
  id: string;
  name: string;
  description?: string;
  
  // Structural configuration only - dimensions are set per mast
  anzahlEbenen: number;  // Number of levels/Ebenen
  
  // Level configurations (structure only)
  ebenenConfig: EbeneConfig[];
}

export interface EbeneConfig {
  nummerEbene: number;
  
  // Number of conductors for this specific level
  anzahlLeitungenLinks: number;
  anzahlLeitungenRechts: number;
}

// Predefined standard templates
export const STANDARD_TEMPLATES: Partial<MastLayoutTemplate>[] = [
  {
    name: "Einfacher Einzelmast",
    description: "Einzelmast mit einer Ebene und einem Leiter rechts",
    anzahlEbenen: 1,
    ebenenConfig: [
      {
        nummerEbene: 1,
        anzahlLeitungenLinks: 0,
        anzahlLeitungenRechts: 1,
      }
    ]
  }
];

// Helper function to create a complete template from partial data
export function createMastLayoutTemplate(partial: Partial<MastLayoutTemplate>): MastLayoutTemplate {
  const template: MastLayoutTemplate = {
    id: partial.id || '',
    name: partial.name || 'Neue Vorlage',
    description: partial.description,
    anzahlEbenen: partial.anzahlEbenen || 1,
    ebenenConfig: [],
  };
  
  // Generate default ebenen configuration if not provided
  if (!partial.ebenenConfig || partial.ebenenConfig.length === 0) {
    template.ebenenConfig = generateDefaultEbenenConfig(template.anzahlEbenen);
  } else {
    template.ebenenConfig = partial.ebenenConfig;
  }
  
  return template;
}

// Generate default configuration for levels
function generateDefaultEbenenConfig(anzahlEbenen: number): EbeneConfig[] {
  const configs: EbeneConfig[] = [];
  
  for (let i = 0; i < anzahlEbenen; i++) {
    configs.push({
      nummerEbene: i + 1,
      anzahlLeitungenLinks: 1,  // Default to 1 conductor per side
      anzahlLeitungenRechts: 1,
    });
  }
  
  return configs;
}

// Validate a template configuration
export function validateMastLayoutTemplate(template: MastLayoutTemplate): string[] {
  const errors: string[] = [];
  
  if (!template.name || template.name.trim() === '') {
    errors.push('Template name is required');
  }
  
  if (template.anzahlEbenen < 1) {
    errors.push('At least one level (Ebene) is required');
  }
  
  if (template.ebenenConfig.length !== template.anzahlEbenen) {
    errors.push('Number of level configurations must match anzahlEbenen');
  }
  
  // Validate each level has at least one conductor
  template.ebenenConfig.forEach((ebene, index) => {
    if (ebene.anzahlLeitungenLinks < 0 || ebene.anzahlLeitungenRechts < 0) {
      errors.push(`Ebene ${index + 1}: Number of conductors cannot be negative`);
    }
    
    if (ebene.anzahlLeitungenLinks === 0 && ebene.anzahlLeitungenRechts === 0) {
      errors.push(`Ebene ${index + 1}: At least one conductor is required`);
    }
  });
  
  return errors;
}