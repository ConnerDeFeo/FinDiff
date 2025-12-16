import { signOut } from "aws-amplify/auth";
import FinDiffButton from "../common/component/FinDiffButton";
import { useNavigate } from "react-router-dom";
import { useUser } from "../common/hooks/useUser";

const Profile = () => {
    const navigate = useNavigate(); 
    const {currentUser} = useUser();
    
    const handleSignOut = async () => {
        await signOut();
        navigate("/");
    }

    const handleManageSubscription = async () => {
        navigate("/subscription-manager");
    }

    return(
        <div className="min-h-screen findiff-bg-white p-8">
            <div className="max-w-2xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors cursor-pointer"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="font-medium">Back</span>
                </button>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r findiff-primary-blue bg-clip-text text-transparent">
                        Profile
                    </h1>
                    <p className="text-gray-600">Manage your account settings</p>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Information</h2>
                    
                    {/* Email Section */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                            <span className="text-gray-800">{currentUser?.email || 'No email available'}</span>
                        </div>
                    </div>

                    {/* Subscription Status Section */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subscription Plan
                        </label>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center">
                                {currentUser?.premium ? (
                                    <>
                                        <svg className="w-5 h-5 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span className="text-gray-800 font-semibold">Premium</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span className="text-gray-800">Free</span>
                                    </>
                                )}
                            </div>
                            {currentUser?.premium && (
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                    ACTIVE
                                </span>
                            )}
                        </div>
                        {currentUser?.premium && currentUser?.nextBillingDate && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-gray-700">
                                    <span className="font-medium">Next billing date:</span>{" "}
                                    <span className="text-blue-700">{new Date(currentUser.nextBillingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/**Subscription Button */}
                    <button 
                        onClick={handleManageSubscription}
                        className="cursor-pointer w-full mt-2 group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Manage Subscription</span>
                            <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </button>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <FinDiffButton onClick={handleSignOut} className="flex-1">
                        Sign Out
                    </FinDiffButton>
                </div>
            </div>
        </div>
    );
}

export default Profile;