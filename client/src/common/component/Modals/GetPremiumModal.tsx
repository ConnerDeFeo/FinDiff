import { useNavigate } from "react-router-dom";
import Modal from "./Modal";
import FinDiffButton from "../FinDiffButton";

const GetPremiumModal = ({isOpen, onClose}: {isOpen: boolean; onClose: () => void}) => {
    const navigate = useNavigate();
    
    if(!isOpen) return null;
    
    const handleUpgrade = () => {
        onClose();
        navigate("/subscription-manager");
    };
    
    return (
        <Modal onClose={onClose}>
            <div className="text-center p-6">
                {/* Icon */}
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-4">
                    <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Free Tier Limit Reached
                </h2>

                {/* Description */}
                <p className="text-gray-600 mb-6">
                    You've used all your free chats! Upgrade to <span className="font-semibold text-blue-600">FinDiff Premium</span> to continue analyzing SEC filings with unlimited access.
                </p>

                {/* Premium Features */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                    <h3 className="font-semibold text-gray-900 mb-3">Premium includes:</h3>
                    <ul className="space-y-2">
                        <li className="flex items-start text-sm text-gray-700">
                            <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Unlimited chats and analysis
                        </li>
                        <li className="flex items-start text-sm text-gray-700">
                            <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Compare multiple documents
                        </li>
                        <li className="flex items-start text-sm text-gray-700">
                            <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Priority support
                        </li>
                        <li className="flex items-start text-sm text-gray-700">
                            <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Only $5/month
                        </li>
                    </ul>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 cursor-pointer px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                        Maybe Later
                    </button>
                    <FinDiffButton
                        onClick={handleUpgrade}
                        className="flex-1"
                    >
                        Upgrade to Premium
                    </FinDiffButton>
                </div>
            </div>
        </Modal>
    );
};

export default GetPremiumModal;