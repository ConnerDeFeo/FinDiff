import { useNavigate } from "react-router-dom";
import FinDiffButton from "../../common/component/FinDiffButton";

const Success = () => {
    const navigate = useNavigate();

    return(
        <div className="min-h-screen findiff-bg-white flex items-center justify-center p-8">
            <div className="max-w-md w-full">
                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                    <div className="bg-green-100 rounded-full p-6">
                        <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                {/* Success Message */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-3">
                        Payment Successful!
                    </h1>
                    <p className="text-lg text-gray-600 mb-2">
                        Welcome to <span className="font-semibold text-blue-600">FinDiff Premium</span>
                    </p>
                    <p className="text-gray-500">
                        Your subscription has been activated successfully.
                    </p>
                </div>

                {/* Premium Features Card */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">You now have access to:</h2>
                    <ul className="space-y-3">
                        <li className="flex items-start">
                            <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-700">Advanced SEC filing analysis</span>
                        </li>
                        <li className="flex items-start">
                            <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-700">Unlimited document comparisons</span>
                        </li>
                        <li className="flex items-start">
                            <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-700">Priority AI responses</span>
                        </li>
                    </ul>
                </div>

                {/* Navigation Button */}
                <FinDiffButton 
                    onClick={() => navigate("/")}
                    className="w-full"
                >
                    Go to Dashboard
                </FinDiffButton>
            </div>
        </div>
    );
};

export default Success;