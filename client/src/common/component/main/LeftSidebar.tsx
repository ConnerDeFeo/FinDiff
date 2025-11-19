import { useState } from "react";
import FinDiffButton from "../FinDiffButton";
import SearchStock from "../SearchStock";
import secService from "../../../service/SecService";
import type { Stock } from "../../types/Stock";
import { ImportantSections, Sections } from "../../variables/Sections";
import FindiffDropDown from "../display/FindiffDropDown";

const LeftSidebar = ({analysisMode, setAnalysis, setJobId, setAnalysisMode, awaitingAnalysis}:
    {
        analysisMode: 'compare' | 'single' | 'chatbot', 
        setAnalysis: React.Dispatch<React.SetStateAction<string>>, 
        setJobId: React.Dispatch<React.SetStateAction<string>>, 
        setAnalysisMode: React.Dispatch<React.SetStateAction<'compare' | 'single' | 'chatbot'>>, 
        awaitingAnalysis: boolean
    }
) => {
    const [selectedOlderFilingDate, setSelectedOlderFilingDate] = useState<string>('');
    const [selectedNewerFilingDate, setSelectedNewerFilingDate] = useState<string>('');
    const [selectedSingleFilingDate, setSelectedSingleFilingDate] = useState<string>('');
    const [selectedStock, setSelectedStock] = useState<Stock | undefined>();
    const [available10KFilings, setAvailable10KFilings] = useState<{accessionNumber:string, filingDate:string, primaryDocument:string}[]>([]);
    const [selectedSection, setSelectedSection] = useState<string>("");
    
    
    const convertSectionKeyToDisplay = (key: string) => {
        return key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
    }
    
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
    const handleSubmit = async () => {
        if(analysisMode === 'compare') {
            await handleCompareSubmit();
        } else {
            await handleSingleAnalysisSubmit();
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
                    <FinDiffButton gray={analysisMode !== 'compare'} onClick={() => setAnalysisMode('compare')}>Compare Filings</FinDiffButton>
                    <FinDiffButton gray={analysisMode !== 'single'} onClick={() => setAnalysisMode('single')}>Single Analysis</FinDiffButton>
                    </div>
                </div>

                {/* Filing Selection */}
                <div className="pb-6 border-b border-gray-200">
                    <h3 className="text-sm font-semibold findiff-secondary-blue mb-4">
                    {analysisMode === 'compare' ? 'Select Filings to Compare' : 'Select Filing to Analyze'}
                    </h3>
                    {analysisMode === 'compare' ? (
                    <div className="flex flex-row justify-between gap-4">
                        <FindiffDropDown
                            label="Older Filing"
                            options={available10KFilings
                                .filter(filing => !selectedNewerFilingDate || filing.filingDate < selectedNewerFilingDate)
                                .map(filing => filing.filingDate.split('-')[0])}
                            value={selectedOlderFilingDate ? selectedOlderFilingDate.split('-')[0] : ''}
                            onChange={(value) => {
                                const filing = available10KFilings.find(f => f.filingDate.split('-')[0] === value);
                                if (filing) setSelectedOlderFilingDate(filing.filingDate);
                            }}
                            placeholder="Select a filing"
                        />
                        <FindiffDropDown
                            label="Newer Filing"
                            options={available10KFilings
                                .filter(filing => !selectedOlderFilingDate || filing.filingDate > selectedOlderFilingDate)
                                .map(filing => filing.filingDate.split('-')[0])}
                            value={selectedNewerFilingDate ? selectedNewerFilingDate.split('-')[0] : ''}
                            onChange={(value) => {
                                const filing = available10KFilings.find(f => f.filingDate.split('-')[0] === value);
                                if (filing) setSelectedNewerFilingDate(filing.filingDate);
                            }}
                            placeholder="Select a filing"
                        />
                    </div>
                    ) : (
                        <FindiffDropDown
                            label="Select Filing"
                            options={available10KFilings.map(filing => filing.filingDate.split('-')[0])}
                            value={selectedSingleFilingDate ? selectedSingleFilingDate.split('-')[0] : ''}
                            onChange={(value) => {
                                const filing = available10KFilings.find(f => f.filingDate.split('-')[0] === value);
                                if (filing) setSelectedSingleFilingDate(filing.filingDate);
                            }}
                            placeholder="Select a filing"
                        />
                    )}
                </div>

                {/* Sections Selection */}
                <div className="pb-6">
                    <FindiffDropDown
                        label="Section to Analyze"
                        options={Object.values(Sections).map(section => convertSectionKeyToDisplay(section))}
                        value={selectedSection ? convertSectionKeyToDisplay(selectedSection) : ''}
                        onChange={(value) => {
                            const section = Object.values(Sections).find(s => convertSectionKeyToDisplay(s) === value);
                            if (section) setSelectedSection(section);
                        }}
                        placeholder="Select a section"
                        openUpward
                        specialOptions={new Set(ImportantSections.map(section => convertSectionKeyToDisplay(section)))}
                    />
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