import React from 'react';
import { Alert, AlertTitle, Box } from '@mui/material';

interface ErrorAlertProps {
  error: string | Error;
  title?: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, title = 'Error' }) => {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return (
    <Box sx={{ my: 2 }}>
      <Alert severity="error">
        <AlertTitle>{title}</AlertTitle>
        {errorMessage}
      </Alert>
    </Box>
  );
};

export default ErrorAlert;