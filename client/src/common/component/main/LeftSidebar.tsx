import { useState } from "react";
import FinDiffButton from "../FinDiffButton";
import SearchStock from "../SearchStock";
import secService from "../../../service/SecService";
import type { Stock } from "../../types/Stock";
import { Sections } from "../../variables/Sections";

const LeftSidebar = ({analysisMode, setAnalysis, setJobId, setAnalysisMode, awaitingAnalysis}:
    {
        analysisMode: 'compare' | 'single', 
        setAnalysis: React.Dispatch<React.SetStateAction<string>>, 
        setJobId: React.Dispatch<React.SetStateAction<string>>, 
        setAnalysisMode: React.Dispatch<React.SetStateAction<'compare' | 'single'>>, 
        awaitingAnalysis: boolean
    }
) => {
    const [selectedOlderFilingDate, setSelectedOlderFilingDate] = useState<string>('');
    const [selectedNewerFilingDate, setSelectedNewerFilingDate] = useState<string>('');
    const [selectedSingleFilingDate, setSelectedSingleFilingDate] = useState<string>('');
    const [selectedStock, setSelectedStock] = useState<Stock | undefined>();
    const [available10KFilings, setAvailable10KFilings] = useState<{accessionNumber:string, filingDate:string, primaryDocument:string}[]>([]);
    const [selectedSection, setSelectedSection] = useState<string>("");
    const handleCompareSubmit = async () => {
        if(!selectedOlderFilingDate || !selectedNewerFilingDate) return;
        setAnalysis('');

        const stock1 = available10KFilings.find(filing=>filing.filingDate === selectedOlderFilingDate);
        const stock2 = available10KFilings.find(filing=>filing.filingDate === selectedNewerFilingDate);
        const stockData1 = {cik: selectedStock!.cik_str, accessionNumber: stock1!.accessionNumber, primaryDocument: stock1!.primaryDocument};
        const stockData2 = {cik: selectedStock!.cik_str, accessionNumber: stock2!.accessionNumber, primaryDocument: stock2!.primaryDocument};
        const resp = await secService.compare10KFilings(stockData1, stockData2, selectedSection);

        if(resp.ok){
        const jobId = await resp.json();
        setJobId(jobId);
        }
    }

    const handleSingleAnalysisSubmit = async () => {
        if(!selectedSingleFilingDate) return;
        setAnalysis('');

        const filing = available10KFilings.find(f=>f.filingDate === selectedSingleFilingDate);
        const stockData = {cik: selectedStock!.cik_str, accessionNumber: filing!.accessionNumber, primaryDocument: filing!.primaryDocument};
        const resp = await secService.analyze10KSection(stockData, selectedSection);

        if(resp.ok){
        const jobId = await resp.json();
        setJobId(jobId);
        }
    }
    const handleSubmit = () => {
        if(analysisMode === 'compare') {
        handleCompareSubmit();
        } else {
        handleSingleAnalysisSubmit();
        }
    }

    const fetchAvailable10KFilings = async (cik:string) => {
        const resp = await secService.getAvailable10KFilings(cik);
        if(resp.ok){
        const data = await resp.json();
        setAvailable10KFilings(data);
        }
    }

    const onStockSelect = (stock: Stock) => {
        fetchAvailable10KFilings(stock.cik_str);
        setSelectedStock(stock);
    }
    return (
        <div className="w-96 bg-white border-r border-gray-200 shadow-lg overflow-y-auto flex-shrink-0">
            <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r findiff-primary-blue bg-clip-text text-transparent">
                FinDiff
                </h1>
                <p className="text-sm text-gray-600">SEC Filing Comparison</p>
            </div>

            {/* Search Section */}
            <div className="mb-6">
                <SearchStock onSelect={onStockSelect}/>
            </div>

            {/* Selected Stock Card */}
            {selectedStock && (
                <div className="space-y-6">
                {/* Stock Overview */}
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

                {/* Analysis Mode Toggle */}
                <div className="pb-6 border-b border-gray-200">
                    <label className="block text-xs font-medium text-gray-700 mb-2">Analysis Mode</label>
                    <div className="flex gap-2">
                    <button
                        onClick={() => setAnalysisMode('compare')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        analysisMode === 'compare'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Compare Filings
                    </button>
                    <button
                        onClick={() => setAnalysisMode('single')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        analysisMode === 'single'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Single Analysis
                    </button>
                    </div>
                </div>

                {/* Filing Selection */}
                <div className="pb-6 border-b border-gray-200">
                    <h3 className="text-sm font-semibold findiff-secondary-blue mb-4">
                    {analysisMode === 'compare' ? 'Select Filings to Compare' : 'Select Filing to Analyze'}
                    </h3>
                    {analysisMode === 'compare' ? (
                    <div className="flex flex-row jsutify-between gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">Older Filing</label>
                        <select 
                        className="w-full border-2 border-gray-300 rounded-lg p-2 text-sm cursor-pointer hover:border-blue-500 focus:border-blue-800 focus:ring-2 focus:ring-blue-200 transition-all" 
                        value={selectedOlderFilingDate} 
                        onChange={e => setSelectedOlderFilingDate(e.target.value)}
                        >
                        <option value="" className="cursor-pointer">Select a filing</option>
                        {available10KFilings.map(filing=> (!selectedNewerFilingDate || filing.filingDate < selectedNewerFilingDate) && (
                            <option key={filing.accessionNumber} value={filing.filingDate} className="cursor-pointer">
                            {filing.filingDate.split('-')[0]}
                            </option>
                        ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">Newer Filing</label>
                        <select 
                        className="w-full border-2 border-gray-300 rounded-lg p-2 text-sm cursor-pointer hover:border-blue-500 focus:border-blue-800 focus:ring-2 focus:ring-blue-200 transition-all" 
                        value={selectedNewerFilingDate} 
                        onChange={e=>setSelectedNewerFilingDate(e.target.value)}
                        >
                        <option value="">Select a filing</option>
                        {available10KFilings.map(filing=>(!selectedOlderFilingDate || filing.filingDate > selectedOlderFilingDate) && (
                            <option key={filing.accessionNumber} value={filing.filingDate}>
                            {filing.filingDate.split('-')[0]}
                            </option>
                        ))}
                        </select>
                    </div>
                    </div>
                    ) : (
                    <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Select Filing</label>
                    <select 
                        className="w-full border-2 border-gray-300 rounded-lg p-2 text-sm cursor-pointer hover:border-blue-500 focus:border-blue-800 focus:ring-2 focus:ring-blue-200 transition-all" 
                        value={selectedSingleFilingDate} 
                        onChange={e => setSelectedSingleFilingDate(e.target.value)}
                    >
                        <option value="" className="cursor-pointer">Select a filing</option>
                        {available10KFilings.map(filing => (
                        <option key={filing.accessionNumber} value={filing.filingDate} className="cursor-pointer">
                            {filing.filingDate.split('-')[0]}
                        </option>
                        ))}
                    </select>
                    </div>
                    )}
                </div>

                {/* Sections Selection */}
                <div className="pb-6">
                    <label className="block text-xs font-medium text-gray-700 mb-2">Section to Analyze</label>
                    <select 
                    className="w-full border-2 border-gray-300 rounded-lg p-2 text-sm cursor-pointer hover:border-blue-500 focus:border-blue-800 focus:ring-2 focus:ring-blue-200 transition-all" 
                    value={selectedSection || ''} 
                    onChange={e => setSelectedSection(e.target.value)}
                    >
                    <option value="">Select a section</option>
                    {Object.values(Sections).map((section) => (
                        <option key={section} value={section}>
                        {section.replace(/_/g, ' ')}
                        </option>
                    ))}
                    </select>
                </div>

                {/* Action Button */}
                <div>
                    <FinDiffButton 
                    onClick={handleSubmit} 
                    disabled={
                        awaitingAnalysis || !selectedSection ||
                        (analysisMode === 'compare' && (!selectedOlderFilingDate || !selectedNewerFilingDate)) ||
                        (analysisMode === 'single' && !selectedSingleFilingDate)
                    }
                    >
                    {analysisMode === 'compare' ? 'Compare Filings' : 'Analyze Filing'}
                    </FinDiffButton>
                </div>
                </div>
            )}
            </div>
        </div>
    );
}

export default LeftSidebar;