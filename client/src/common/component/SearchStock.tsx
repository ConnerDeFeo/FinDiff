import React, { useEffect, useState } from "react";
import secService from "../../service/SecService";
import type { Stock } from "../types/Stock";
import Spinner from "./display/Spinner";

/**
 * SearchTicker Component
 * Allows users to search for stock ticker symbols with auto-complete functionality
 */
const SearchStock : React.FC<{onSelect: (stock: Stock) => void}> = ({ onSelect }) => {
    // State for the search input value
    const [ticker, setTicker] = useState<string>('');
    
    // State for storing search results from the API
    const [searchResults, setSearchResults] = useState<Array<Stock>>([]);

    // Loading state to indicate ongoing search
    const [loading, setLoading] = useState<boolean>(false);

    //flag for mouse clicking down on some option
    const [isMouseDown, setIsMouseDown] = useState<boolean>(false);

    // Display search results flag
    const [displayResults, setDisplayResults] = useState<boolean>(false);

    /**
     * Fetches ticker search results from the SEC service
     */
    const handleSearchTicker = async () => {
        setLoading(true);
        const resp = await secService.searchTickers(ticker);
        if(resp.ok) {
            const data = await resp.json();
            setSearchResults(data);
        }
        setLoading(false);
    }

    // Auto-search debounce effect: triggers search 500ms after user stops typing
    useEffect(() => {
        if(ticker.length === 0) {
            setSearchResults([]);
            setDisplayResults(false);
            setLoading(false);
            return;
        }
        setLoading(true);
        const delayDebounceFn = setTimeout(() => {
            setLoading(true);
            if(ticker.length > 0) {
                handleSearchTicker();
            }
        }, 300);

        // Cleanup: clear timeout if ticker changes before 500ms
        return () => {clearTimeout(delayDebounceFn); setLoading(false);};
    }, [ticker]);

    const handleStockSelect = (stock: Stock) => {
        onSelect(stock);
        setSearchResults([]);
        setDisplayResults(false);
        setTicker('');
    }

    const handleTypeTicker = (value: string) => {
        setTicker(value);
        setDisplayResults(true);
    }

    return(
        <div className="relative">
            <h2>Search Ticker Symbol</h2>
            
            {/* Search input with icon */}
            <div className="relative">
                <input
                    type="text"
                    value={ticker}
                    onChange={(e) => handleTypeTicker(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                    placeholder="Enter ticker symbol or name..."
                    onKeyDown={e=>e.key === "Enter" && handleSearchTicker()} 
                    onBlur={isMouseDown ? undefined : ()=>setDisplayResults(false)}
                />
                {/* Search icon button */}
                <img 
                    src="/images/Search.png" 
                    alt="Search" 
                    className="absolute right-4 top-3 cursor-pointer h-5 w-5" 
                    onClick={handleSearchTicker}  
                />
            </div>
            
            {/* Results list - only shown when results exist */}
            {displayResults && (
                <ul className="border border-gray-300 rounded-md p-4 mb-4 max-h-60 overflow-y-auto absolute bg-white w-full z-10">
                    {searchResults.length > 0 ? searchResults.map((result, index) => (
                        <li 
                            key={index} 
                            className="mb-2 cursor-pointer hover:bg-gray-100 p-2 rounded" 
                            onClick={() => handleStockSelect(result)} 
                            onMouseDown={()=>setIsMouseDown(true)}
                            onMouseUp={()=>setIsMouseDown(false)}
                        >
                            <strong>{result.ticker}</strong> - {result.title} (CIK: {result.cik_str})
                        </li>
                    )) : (
                        loading ? <Spinner /> : <li className="mb-2 p-2 text-gray-500">No results found</li>
                    )}
                </ul>
            )}
        </div>
    );
}

export default SearchStock;