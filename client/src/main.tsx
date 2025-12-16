import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { Amplify } from 'aws-amplify';
import amplifyConfig from "./AmplifyConfiguration";
import { UserProvider } from './common/hooks/useUser.tsx';

// Configure Amplify with your AWS resources
Amplify.configure(amplifyConfig);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </StrictMode>,
)
