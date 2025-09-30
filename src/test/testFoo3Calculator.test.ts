
// import { UsedDataCalculator } from '../utils/usedDataCalculator';
// import { foo3CalculatorV2 as foo3CalculatorGUI } from './Foo3GUICalculatorV2';
// import { DTMProcessor } from '../utils/dtmProcessor';
// import { foo3Calculator as foo3CalculatorCLI } from './Foo3CLICalculator';
// import { expect } from 'vitest';
// import { calculateParabolaParametersForAll } from '../utils/parabolaCalculator';
// describe('Foo3 TrasseOnlyCalculator Test', () => {
//     it('should process Foo3TrasseOnlyCalculator.json with UsedDataCalculator', () => {
//         // Load the JSON data

//         console.log('\n=== Foo3 TrasseOnlyCalculator Test ===\n');
        
//         // Create calculator instance with the loaded data
//         const dtmProcessor = new DTMProcessor(foo3CalculatorGUI.usedData.DGMDreiecke, foo3CalculatorGUI.usedData.Hoehenpunkte);
//         const calculator = new UsedDataCalculator(foo3CalculatorGUI.usedData, dtmProcessor);
//         calculateParabolaParametersForAll(calculator.usedData.Trassen);
//         // Display basic information
//         const res = calculator.calculateLatLTForImmissionPoint(0);
        
//         console.log("res", res);

//         const dtmProcessorCLI = new DTMProcessor(foo3CalculatorCLI.usedData.DGMDreiecke, foo3CalculatorCLI.usedData.Hoehenpunkte);  

//         const calculatorCLI = new UsedDataCalculator(foo3CalculatorCLI.usedData, dtmProcessorCLI);

//         const resCLI = calculatorCLI.calculateLatLTForImmissionPoint(0);
        
//         console.log("resCLI", resCLI);

//         expect(res).toBeCloseTo(resCLI, 0);

//         // fs.writeFileSync("result.json", JSON.stringify(calculator, null, 2));
//     });
// });