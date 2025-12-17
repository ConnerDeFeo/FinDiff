import { createContext, useContext, useState } from "react";
import SignUpModal from "../component/Modals/SignUpModal";

export enum FindiffModalType {
    SIGNIN = 'signin',
    NONE = 'none'
};

export const FindiffModalContext = createContext<{
    findiffModal: FindiffModalType;
    setFindiffModal: React.Dispatch<React.SetStateAction<FindiffModalType>>;
} | null>(null);


export const useFindiffModal = () => {
    const context = useContext(FindiffModalContext);
    if (!context) {
        throw new Error("useFindiffModal must be used within a FindiffModalProvider");
    }
    return context;
}

export const FindiffModalProvider = ({ children }: { children: React.ReactNode })=>{
    const [findiffModal, setFindiffModal] = useState<FindiffModalType>(FindiffModalType.NONE);
    return (
        <FindiffModalContext.Provider value={{ findiffModal, setFindiffModal }}>
            {children}
            <SignUpModal isOpen={findiffModal === FindiffModalType.SIGNIN} onClose={() => setFindiffModal(FindiffModalType.NONE)} />
        </FindiffModalContext.Provider>
    );
};