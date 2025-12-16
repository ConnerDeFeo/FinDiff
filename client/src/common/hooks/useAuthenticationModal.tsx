import { createContext, useContext, useState } from "react";
import SignUpModal from "../component/SignUpModal";

export enum AuthenticationModalType {
    SIGNIN= 'signin',
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
    return (
        <AuthenticationModalContext.Provider value={{ authenticationModal, setAuthenticationModal }}>
            {children}
            <SignUpModal isOpen={authenticationModal === AuthenticationModalType.SIGNIN} onClose={() => setAuthenticationModal(AuthenticationModalType.NONE)} />
        </AuthenticationModalContext.Provider>
    );
};