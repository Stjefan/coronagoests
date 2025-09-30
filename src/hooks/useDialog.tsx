/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

interface DialogContextType {
  confirm: (message: string) => Promise<boolean>;
  prompt: (message: string, defaultValue?: string) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    resolve: (value: boolean) => void;
  }>({ isOpen: false, message: '', resolve: () => {} });

  const [promptDialog, setPromptDialog] = useState<{
    isOpen: boolean;
    message: string;
    defaultValue: string;
    resolve: (value: string | null) => void;
  }>({ isOpen: false, message: '', defaultValue: '', resolve: () => {} });

  const [inputValue, setInputValue] = useState('');

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({
        isOpen: true,
        message,
        resolve,
      });
    });
  }, []);

  const prompt = useCallback((message: string, defaultValue = ''): Promise<string | null> => {
    return new Promise((resolve) => {
      setInputValue(defaultValue);
      setPromptDialog({
        isOpen: true,
        message,
        defaultValue,
        resolve,
      });
    });
  }, []);

  const handleConfirmClose = useCallback((confirmed: boolean) => {
    confirmDialog.resolve(confirmed);
    setConfirmDialog({ isOpen: false, message: '', resolve: () => {} });
  }, [confirmDialog]);

  const handlePromptClose = useCallback((value: string | null) => {
    promptDialog.resolve(value);
    setPromptDialog({ isOpen: false, message: '', defaultValue: '', resolve: () => {} });
    setInputValue('');
  }, [promptDialog]);

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}

      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && handleConfirmClose(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bestätigung</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleConfirmClose(false)}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleConfirmClose(true)}>Bestätigen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={promptDialog.isOpen} onOpenChange={(open) => !open && handlePromptClose(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eingabe erforderlich</DialogTitle>
            <DialogDescription>{promptDialog.message}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="prompt-input" className="text-right">
                Wert:
              </Label>
              <Input
                id="prompt-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="col-span-3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePromptClose(inputValue);
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handlePromptClose(null)}>
              Abbrechen
            </Button>
            <Button onClick={() => handlePromptClose(inputValue)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};