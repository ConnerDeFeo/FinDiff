import { createContext, useContext, useEffect, useState } from "react";
import SignUpModal from "../component/SignUpModal";
import LogoutModal from "../component/LogoutModal";
import { useUser } from "./useUser";
import { fetchUserAttributes } from "aws-amplify/auth";

export enum AuthenticationModalType {
    SIGNIN= 'signin',
    LOGOUT= 'logout',
    NONE= 'none'
};

export const AuthenticationModalContext = createContext<{
    authenticationModal: AuthenticationModalType;
    setAuthenticationModal: React.Dispatch<React.SetStateAction<AuthenticationModalType>>;
} | null>(null);


export const useAuthenticationModal = () => {
    const context = useContext(AuthenticationModalContext);
    if (!context) {
        throw new Error("useAuthenticationModal must be used within a SignInModalProvider");
    }
    return context;
}

export const AuthenticationModalProvider = ({ children }: { children: React.ReactNode })=>{
    const [authenticationModal, setAuthenticationModal] = useState<AuthenticationModalType>(AuthenticationModalType.NONE);
    const {setCurrentUser} = useUser();
    useEffect(()=>{
        const fetchUser = async () => {
            try{
                const currentUser = await fetchUserAttributes();
                currentUser.email = currentUser.email?.toLowerCase();
                setCurrentUser({email: currentUser.email!});
            }catch{
                setCurrentUser(null);
            }
        }
        if(authenticationModal === AuthenticationModalType.NONE){
            fetchUser();
        }
    }, [authenticationModal]);
    return (
        <AuthenticationModalContext.Provider value={{ authenticationModal, setAuthenticationModal }}>
            {children}
            <SignUpModal isOpen={authenticationModal === AuthenticationModalType.SIGNIN} onClose={() => setAuthenticationModal(AuthenticationModalType.NONE)} />
            <LogoutModal isOpen={authenticationModal === AuthenticationModalType.LOGOUT} onClose={() => setAuthenticationModal(AuthenticationModalType.NONE)} />
        </AuthenticationModalContext.Provider>
    );
};