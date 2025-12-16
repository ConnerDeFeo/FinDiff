import MainPage from "./pages/main/MainPage";
import './global.css'
import { AuthenticationModalProvider } from "./common/hooks/useAuthenticationModal";
import { useUser } from "./common/hooks/useUser";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Profile from "./pages/Profile";
import Success from "./pages/stripe/Sucess";
import Cancel from "./pages/stripe/Cancel";
import SubscriptionManager from "./pages/SubscriptionManager";
import stripeService from "./service/StripeService";
import { useEffect } from "react";
import { fetchUserAttributes } from "aws-amplify/auth";


function App() {
  const { setCurrentUser } = useUser();

  useEffect(() => {
    const fetchUser = async () => {
      const resp = await stripeService.checkSubscription();
      const currentUser = await fetchUserAttributes();
      currentUser.email = currentUser.email?.toLowerCase();
      if(resp.ok){
        const data = await resp.json();
        setCurrentUser({
          email: currentUser.email!, 
          premium: data.subscription_active, 
          nextBillingDate: data.next_billing_date, 
          cancelAtPeriodEnd: data.cancel_at_period_end
        });
      }
      else{
        setCurrentUser({email: currentUser.email!, premium: false} );
      }
    };
    fetchUser();
  }, []);

  return(
    <BrowserRouter>
      <AuthenticationModalProvider>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/success" element={<Success />} />
          <Route path="/cancel" element={<Cancel />} />
          <Route path="/subscription-manager" element={<SubscriptionManager />} />
        </Routes>
      </AuthenticationModalProvider>
    </BrowserRouter>
    
  );
}

export default App;