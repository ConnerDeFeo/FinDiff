import API from "./API";

const URL = import.meta.env.VITE_FINDIFF_API_URL!;

const secService = {
    searchTickers: async (query: string) => {
        return await API.get(`${URL}/search_tickers?q=${query}`);
    },
    getAvailable10KFilings: async (cik: string) => {
        return await API.get(`${URL}/get_available_10k_filings?cik=${cik}`);
    },
    checkDocumentProcessed: async (cik: string, accessionNumber: string, primaryDocument: string) => {
        return await API.get(`${URL}/check_document_processed?cik=${cik}&accession=${accessionNumber}&primaryDoc=${primaryDocument}`);
    }
}

export default secService;