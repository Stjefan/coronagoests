import { useEffect, useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

export function useComputationErrorDisplay() {
  const { computationErrors, clearComputationErrors } = useProjectStore();
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  useEffect(() => {
    // Show dialog when there are new computation errors
    if (computationErrors.length > 0) {
      setShowErrorDialog(true);
    }
  }, [computationErrors]);

  const handleClose = () => {
    setShowErrorDialog(false);
    clearComputationErrors();
  };

  return {
    ErrorDialog: () => (
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Computation Errors Detected
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-4">
              <div className="space-y-2">
                <p className="font-medium mb-3">
                  The following errors occurred while computing immission values:
                </p>
                <div className="bg-red-50 border border-red-200 rounded-md p-4 max-h-96 overflow-y-auto">
                  <ul className="list-disc list-inside space-y-1">
                    {computationErrors.map((error, index) => (
                      <li key={index} className="text-sm text-red-800">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Please check your data and try again. Common issues include:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
                  <li>Missing or invalid terrain data</li>
                  <li>Incorrectly configured trassen or masts</li>
                  <li>Invalid immission point positions</li>
                  <li>Calculation parameters out of valid range</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleClose}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
  };
}