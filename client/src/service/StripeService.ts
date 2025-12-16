import API from "./API";

const URL = import.meta.env.VITE_FINDIFF_API_URL!;

const stripeService = {
    createCheckoutSession: async () => {
        return await API.post(`${URL}/create_checkout_session`);
    },
    checkSubscription: async () => {
        return await API.get(`${URL}/check_subscription`);
    }
};

export default stripeService;