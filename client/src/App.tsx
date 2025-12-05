import MainPage from "./pages/main/MainPage";
import './global.css'
import { AuthenticationModalProvider } from "./common/hooks/useAuthenticationModal";
import { Amplify } from 'aws-amplify';
import amplifyConfig from "./AmplifyConfiguration";
import { UserProvider } from "./common/hooks/useUser";

// Configure Amplify with your AWS resources
Amplify.configure(amplifyConfig);

function App() {
  return(
    <UserProvider>
        <AuthenticationModalProvider>
          <MainPage />
        </AuthenticationModalProvider>
    </UserProvider>
  );
}

export default App;