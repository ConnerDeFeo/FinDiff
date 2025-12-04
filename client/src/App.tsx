import MainPage from "./pages/main/MainPage";
import './global.css'
import { SignInModalProvider } from "./common/hooks/useSignInModal";
import { Amplify } from 'aws-amplify';
import amplifyConfig from "./AmplifyConfiguration";

// Configure Amplify with your AWS resources
Amplify.configure(amplifyConfig);

function App() {
  return(
    <SignInModalProvider>
      <MainPage />
    </SignInModalProvider>
  );
}

export default App;