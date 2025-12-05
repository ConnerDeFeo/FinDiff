import { signOut } from "aws-amplify/auth";
import FinDiffButton from "./FinDiffButton";

const LogoutModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;

    const handleLogout = async () => {
        await signOut();
        onClose();
    }
    return(
        <>
            {/* Backdrop with opacity */}
            <div 
                className="fixed inset-0 bg-black opacity-20 z-40"
                onClick={onClose}
            />
            {/* Modal centered on screen */}
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                <div 
                    className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Modal content */}
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer ml-auto mb-4 block"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="flex flex-col gap-y-3">
                        <FinDiffButton onClick={handleLogout} className="text-xl">
                            Signout
                        </FinDiffButton>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LogoutModal;