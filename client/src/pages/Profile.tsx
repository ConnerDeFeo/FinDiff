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

    return(
        <div className="min-h-screen findiff-bg-white p-8">
            <div className="max-w-2xl mx-auto">
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