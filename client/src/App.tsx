import MainPage from "./pages/main/MainPage";
import './global.css'
import { AuthenticationModalProvider } from "./common/hooks/useAuthenticationModal";
import { UserProvider } from "./common/hooks/useUser";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Profile from "./pages/Profile";


function App() {
  return(
    <BrowserRouter>
      <UserProvider>
        <AuthenticationModalProvider>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </AuthenticationModalProvider>
      </UserProvider>
    </BrowserRouter>
    
  );
}

export default App;