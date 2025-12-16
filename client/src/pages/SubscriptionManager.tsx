import { useNavigate } from "react-router-dom";
import stripeService from "../service/StripeService";
import FinDiffButton from "../common/component/FinDiffButton";
import { useUser } from "../common/hooks/useUser";

const SubscriptionManager = () => {
    const navigate = useNavigate();
    const { currentUser } = useUser();
    
    const subscribeToPremium = async () => {
        const resp = await stripeService.createCheckoutSession();
        if(resp.ok){
            const data = await resp.json();
            window.location.href = data.url;
        }
    }

    return(
        <div className="min-h-screen findiff-bg-white p-8">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors cursor-pointer"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="font-medium">Back to Home</span>
                </button>

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r findiff-primary-blue bg-clip-text text-transparent">
                        Choose Your Plan
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Select the plan that best fits your investment analysis needs
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 gap-8 mx-auto">
                    {/* Free Tier */}
                    <div className={`bg-white rounded-lg shadow-md border-2 p-8 flex flex-col ${!currentUser?.premium ? 'border-green-500' : 'border-gray-200'}`}>
                        {!currentUser?.premium && (
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                    CURRENT PLAN
                                </span>
                            </div>
                        )}
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Free</h2>
                            <div className="flex items-baseline mb-4">
                                <span className="text-4xl font-bold text-gray-900">$0</span>
                                <span className="text-gray-600 ml-2">/month</span>
                            </div>
                            <p className="text-gray-600">Perfect for getting started with SEC filing analysis</p>
                        </div>

                        <div className="flex-1 mb-6">
                            <ul className="space-y-3">
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-700">Basic SEC filing analysis</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-700">Limited document comparisons</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-700">Standard AI responses</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-700">Access to basic features</span>
                                </li>
                            </ul>
                        </div>

                        {!currentUser?.premium && (
                            <button
                                disabled
                                className="w-full py-3 px-6 border-2 border-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
                            >
                                Current Plan
                            </button>
                        )}
                    </div>

                    {/* Premium Tier */}
                    <div className={`bg-white rounded-lg shadow-xl border-2 p-8 flex flex-col relative ${currentUser?.premium ? 'border-blue-500' : 'border-blue-500'}`}>
                        {/* Badge */}
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                            {currentUser?.premium ? (
                                <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                    CURRENT PLAN
                                </span>
                            ) : (
                                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                    POPULAR
                                </span>
                            )}
                        </div>

                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Premium</h2>
                            <div className="flex items-baseline mb-4">
                                <span className="text-4xl font-bold text-blue-600">$5</span>
                                <span className="text-gray-600 ml-2">/month</span>
                            </div>
                            <p className="text-gray-600">Advanced features for serious investors</p>
                        </div>

                        <div className="flex-1 mb-6">
                            <ul className="space-y-3">
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-700 font-medium">Everything in Free, plus:</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-700">Advanced SEC filing analysis</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-700">Unlimited document comparisons</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-700">Priority AI responses</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-700">Premium support</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-700">Early access to new features</span>
                                </li>
                            </ul>
                        </div>

                        {currentUser?.premium ? (
                            <button
                                disabled
                                className="w-full py-3 px-6 border-2 border-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
                            >
                                Current Plan
                            </button>
                        ) : (
                            <FinDiffButton
                                onClick={subscribeToPremium}
                                className="w-full"
                            >
                                Upgrade to Premium
                            </FinDiffButton>
                        )}
                    </div>
                </div>

                {/* FAQ or Additional Info */}
                <div className="mt-12 text-center text-gray-600">
                    <p className="text-sm">
                        All plans include secure data handling and regular updates. Cancel anytime.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionManager;