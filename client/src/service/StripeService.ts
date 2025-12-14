import API from "./API";

const URL = import.meta.env.VITE_FINDIFF_API_URL!;

const stripeService = {
    createCheckoutSession: async () => {
        return await API.post(`${URL}/create_checkout_session`);
    }
};

export default stripeService;