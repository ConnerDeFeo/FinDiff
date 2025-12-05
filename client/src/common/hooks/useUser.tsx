import { createContext, useContext, useState } from "react";
import type { User } from "../types/User";

export const useUserContext = createContext<{
    currentUser: User | null,
    setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>
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
    return (
        <useUserContext.Provider value={{currentUser, setCurrentUser}}>
            {children}
        </useUserContext.Provider>
    );
}