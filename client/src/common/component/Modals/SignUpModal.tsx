import { useState } from "react";
import FinDiffButton from "../FinDiffButton";
import { signIn, signUp, confirmSignIn, signInWithRedirect} from 'aws-amplify/auth';
import Modal from "./Modal";

const SignUpModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;
    const [email, setEmail] = useState<string>('');
    const [verificationCode, setVerificationCode] = useState<string>('');
    const [isVerifying, setIsVerifying] = useState<boolean>(false);

    const handleSSOClick = async () => {
        try{
            await signUp({
                username: email,
                password: Math.random().toString(36).substring(2, 15),
                options:{
                    userAttributes: {
                        email: email,
                    }
                }
            });
        } catch (error:any){};
        try {
            await signIn({
                username: email,
                options:{
                    authFlowType: 'CUSTOM_WITHOUT_SRP',
                }
            });
            setIsVerifying(true);
        }
        catch (signInError) {
            console.error('Error during sign in:', signInError);
        }
    };

    const handleVerifyCode = async () => {
        const result = await confirmSignIn({
            challengeResponse: verificationCode
        });
        if(result.isSignedIn){
            onClose();
        }
    };

    return (
        <Modal onClose={onClose}>
            <>
                {/* Modal content */}
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer ml-auto mb-4 block"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                {/* Conditional rendering based on verification state */}
                {!isVerifying ? (
                    /* Email input form */
                    <div className="flex flex-col gap-y-3">
                        <button 
                            className="cursor-pointer border-2 border-gray-300 rounded-lg py-2 flex items-center justify-center mb-4 hover:bg-gray-100 transition-colors" 
                            onClick={() => signInWithRedirect({ provider: 'Google'})}
                        >
                            <img src="/images/Google.webp" alt="Google logo" className="w-4 h-4 mr-2"/>
                            Sign in with Google
                        </button>
                        <input 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-2 mb-1"
                            placeholder="Enter your email"
                        />
                        <FinDiffButton onClick={handleSSOClick} className="text-xl">
                            Continue with Email
                        </FinDiffButton>
                        <p className="text-center text-gray-500">Single Sign On (SSO)</p>
                    </div>
                ) : (
                    /* Verification code form */
                    <div className="flex flex-col gap-y-3">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Verify Your Email</h3>
                        <p className="text-gray-600 mb-4">
                            We've sent a 6-digit code to <span className="font-medium">{email}</span>
                        </p>
                        <input 
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-2 mb-1 text-center text-2xl tracking-widest"
                            placeholder="000000"
                            maxLength={6}
                            pattern="[0-9]*"
                        />
                        <FinDiffButton onClick={handleVerifyCode} className="text-xl">
                            Verify Code
                        </FinDiffButton>
                        <button
                            onClick={() => setIsVerifying(false)}
                            className="text-sm text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                        >
                            ← Back to email
                        </button>
                    </div>
                )}
            </>
        </Modal>
    );
}

export default SignUpModal;