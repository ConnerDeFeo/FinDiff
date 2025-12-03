import { createContext, useContext, useState } from "react";
import SignUpModal from "../component/SignUpModal";

export const SignInModalContext = createContext<{
    isSignInModalOpen: boolean;
    setIsSignInModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null);


export const useSignInModal = () => {
    const context = useContext(SignInModalContext);
    if (!context) {
        throw new Error("useSignInModal must be used within a SignInModalProvider");
    }
    return context;
}

export const SignInModalProvider = ({ children }: { children: React.ReactNode })=>{
    const [isSignInModalOpen, setIsSignInModalOpen] = useState<boolean>(false);
    return (
        <SignInModalContext.Provider value={{ isSignInModalOpen, setIsSignInModalOpen }}>
            {children}
            <SignUpModal isOpen={isSignInModalOpen} onClose={() => setIsSignInModalOpen(false)} />
        </SignInModalContext.Provider>
    );
};