import type { Stock } from "../../types/Stock";

const StockDisplay = ({selectedStock}:{selectedStock: Stock}) => {
    return(
        <div className="pb-6 border-b border-gray-200">
            <h2 className="font-bold text-xl mb-3 findiff-secondary-blue">{selectedStock.title}</h2>
            <div className="space-y-2">
                <p className="text-sm text-gray-700">
                    <span className="font-semibold findiff-primary-blue">Ticker:</span> 
                    <span className="ml-2 px-2 py-1 bg-blue-100 findiff-primary-blue rounded text-xs font-mono">{selectedStock.ticker}</span>
                </p>
                <p className="text-sm text-gray-700">
                    <span className="font-semibold findiff-primary-blue">CIK:</span> 
                    <span className="ml-2 font-mono text-xs text-gray-600">{selectedStock.cik_str}</span>
                </p>
            </div>
        </div>
    );
};

export default StockDisplay;