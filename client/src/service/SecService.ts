import API from "./API";

const URL = import.meta.env.VITE_FINDIFF_API_URL!;

const secService = {
    compare10KFilings: async (
        stock1:{cik: string, accessionNumber:string, primaryDocument:string}, 
        stock2:{cik: string, accessionNumber:string, primaryDocument:string}, 
        section: string
    )=>{
        return await API.post(`${URL}/compare_10k_filings`, { stock1, stock2, section });
    },
    searchTickers: async (query: string) => {
        return await API.get(`${URL}/search_tickers?q=${query}`);
    },
    getAvailable10KFilings: async (cik: string) => {
        return await API.get(`${URL}/get_available_10k_filings?cik=${cik}`);
    },
    getComparisonStatus: async (jobId: string) => {
        return await API.get(`${URL}/get_comparison_status?jobId=${jobId}`);
    },
    analyze10KSection: async (
        stock: {cik: string, accessionNumber:string, primaryDocument:string},
        section: string
    )=>{
        return await API.post(`${URL}/analyze_10k_section`, { stock, section });
    },
    get10KAnalysisStatus: async (jobId: string) => {
        return await API.get(`${URL}/get_10k_analysis_status?jobId=${jobId}`);
    },
    generateResponse: async (prompt: string) => {
        return await API.post(`${URL}/generate_response`, { prompt, cik:"", accessionNumber:"", primaryDocument:"" });
    },
    getChatbotStatus: async (jobId: string) => {
        return await API.get(`${URL}/get_chatbot_status?jobId=${jobId}`);
    }
}

export default secService;