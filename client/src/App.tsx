import MainPage from "./pages/main/MainPage";
import './global.css'
import { AuthenticationModalProvider } from "./common/hooks/useAuthenticationModal";
import { UserProvider } from "./common/hooks/useUser";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GoogleCallBack from "./pages/GoogleCallBack";


function App() {
  return(
    <BrowserRouter>
      <UserProvider>
        <AuthenticationModalProvider>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/GoogleCallBack" element={<GoogleCallBack />} />
          </Routes>
        </AuthenticationModalProvider>
      </UserProvider>
    </BrowserRouter>
    
  );
}

export default App;