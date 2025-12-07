import API from "./API";

const URL = import.meta.env.VITE_FINDIFF_API_URL!;

const AuthenticationService = {
    getCognitoToken: async (code: string): Promise<any> => {
        return API.post(`${URL}/get_cognito_token`, { code, redirectURI: `${import.meta.env.VITE_HOMEPAGE_URL}/GoogleCallBack` });
    }
}

export default AuthenticationService;