import MainPage from "./pages/main/MainPage";
import './global.css'
import { useUser } from "./common/hooks/useUser";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Profile from "./pages/Profile";
import Success from "./pages/stripe/Sucess";
import Cancel from "./pages/stripe/Cancel";
import SubscriptionManager from "./pages/SubscriptionManager";
import { useEffect } from "react";
import { FindiffModalProvider } from "./common/hooks/useFindiffModal";


function App() {
  const { fetchUser } = useUser();

  useEffect(() => {
    fetchUser();
  }, []);

  return(
    <BrowserRouter>
      <FindiffModalProvider>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/success" element={<Success />} />
          <Route path="/cancel" element={<Cancel />} />
          <Route path="/subscription-manager" element={<SubscriptionManager />} />
        </Routes>
      </FindiffModalProvider>
    </BrowserRouter>
    
  );
}

export default App;