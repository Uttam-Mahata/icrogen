import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ErrorAlertProps {
  error: string | Error;
  title?: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, title = 'Error' }) => {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <div className="my-2">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    </div>
  );
};

export default ErrorAlert;