import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthenticationService from "../service/AuthenticationService";

const GoogleCallBack = () => {
    const navigate = useNavigate();

    const getBearerToken = async (code: string) => {
        const resp = await AuthenticationService.getCognitoToken(code);
        if (resp.status === 200) {
            const data = await resp.json();
            console.log("Token data:", data);

            const authData = {
                idToken: data.id_token,
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
            };
            localStorage.setItem('amplify-auth-tokens', JSON.stringify(authData));
            navigate("/");
        } else {
            console.error("Failed to get token");
        }
    }

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (code) {
            getBearerToken(code);
        } else {
            console.error("No code found in URL");
        }
    }, []);
    return (
        <div>Signing you in...</div>
    );
}

export default GoogleCallBack;