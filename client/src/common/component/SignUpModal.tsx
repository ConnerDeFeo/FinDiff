import { useState } from "react";
import FinDiffButton from "./FinDiffButton";

const SignUpModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;
    const [email, setEmail] = useState<string>('');

    

    return (
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
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Sign Up</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    {/* Add your sign up form content here */}
                    <div className="flex flex-col gap-y-3">
                        <input 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-2 mb-1"
                            placeholder="Enter your email"
                        />
                        <FinDiffButton onClick={()=>{}} className="text-xl">
                            Continue with Email
                        </FinDiffButton>
                        <p className="text-center text-gray-500">Single Sign On (SSO)</p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SignUpModal;