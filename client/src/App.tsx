import MainPage from "./pages/main/MainPage";
import './global.css'
import { SignInModalProvider } from "./common/hooks/useSignInModal";

function App() {
  return(
    <SignInModalProvider>
      <MainPage />
    </SignInModalProvider>
  );
}

export default App;