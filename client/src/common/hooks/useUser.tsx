import { createContext, useContext, useState } from "react";
import type { User } from "../types/User";
// import stripeService from "../../service/StripeService";
// import { fetchUserAttributes } from "aws-amplify/auth";

export const useUserContext = createContext<{
    currentUser: User | null,
    setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>,
    fetchUser: () => Promise<void>
} | null>(null);

export const useUser = () => {
    const context = useContext(useUserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}

export const UserProvider = ({ children }: { children: React.ReactNode; }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const fetchUser = async () => {
      // const resp = await stripeService.checkSubscription();
      // const currentUser = await fetchUserAttributes();
      // currentUser.email = currentUser.email?.toLowerCase();
      // if(resp.ok){
      //   const data = await resp.json();
      //   setCurrentUser({
      //     email: currentUser.email!, 
      //     premium: data.subscription_active, 
      //     nextBillingDate: data.next_billing_date, 
      //     cancelAtPeriodEnd: data.cancel_at_period_end
      //   });
      // }
      // else{
      //   setCurrentUser({email: currentUser.email!, premium: false} );
      // }
      setCurrentUser({
          email: "CurrentlyFree@gmail.com", 
          premium: true, 
          nextBillingDate: "", 
          cancelAtPeriodEnd: false
        });
    };
    return (
        <useUserContext.Provider value={{currentUser, setCurrentUser, fetchUser}}>
            {children}
        </useUserContext.Provider>
    );
}