import { useNavigate } from "react-router-dom";
import FinDiffButton from "../../common/component/FinDiffButton";

const Cancel = () => {
    const navigate = useNavigate();

    return(
        <div className="min-h-screen findiff-bg-white flex items-center justify-center p-8">
            <div className="max-w-md w-full">
                {/* Cancel Icon */}
                <div className="flex justify-center mb-6">
                    <div className="bg-red-100 rounded-full p-6">
                        <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                </div>

                {/* Cancel Message */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-3">
                        Payment Cancelled
                    </h1>
                    <p className="text-lg text-gray-600 mb-2">
                        Your payment was not completed
                    </p>
                    <p className="text-gray-500">
                        No charges were made to your account.
                    </p>
                </div>

                {/* Information Card */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">What happened?</h2>
                    <p className="text-gray-600 mb-4">
                        The payment process was interrupted or cancelled. This could be due to:
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start">
                            <span className="text-gray-400 mr-2">•</span>
                            <span>Payment was cancelled by you</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-gray-400 mr-2">•</span>
                            <span>Payment information was incorrect</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-gray-400 mr-2">•</span>
                            <span>Connection issue occurred</span>
                        </li>
                    </ul>
                </div>

                {/* Navigation Buttons */}
                <div className="space-y-3">
                    <FinDiffButton 
                        onClick={() => navigate("/")}
                        className="w-full"
                    >
                        Return to Dashboard
                    </FinDiffButton>
                </div>
            </div>
        </div>
    );
};

export default Cancel;