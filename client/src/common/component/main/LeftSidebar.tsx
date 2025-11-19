import { useState } from "react";
import FinDiffButton from "../FinDiffButton";
import SearchStock from "../SearchStock";
import secService from "../../../service/SecService";
import type { Stock } from "../../types/Stock";
import { ImportantSections, Sections } from "../../variables/Sections";
import FindiffDropDown from "../display/FindiffDropDown";


const LeftSidebar = ({ setAnalysis, setJobId, setAnalysisMode, awaitingAnalysis, selectedDocuments, selectedStock, setSelectedDocuments, setSelectedStock}:
    {
        setAnalysis: React.Dispatch<React.SetStateAction<string>>, 
        setJobId: React.Dispatch<React.SetStateAction<string>>, 
        setAnalysisMode: React.Dispatch<React.SetStateAction<'compare' | 'single' | 'chatbot'>>, 
        awaitingAnalysis: boolean,
        selectedDocuments: {
            filingDate: string;
            accessionNumber: string;
            primaryDocument: string;
            year: string;
        }[],
        selectedStock: Stock | undefined,
        setSelectedDocuments: React.Dispatch<React.SetStateAction<{
            filingDate: string;
            accessionNumber: string;
            primaryDocument: string;
            year: string;
        }[]>>,
        setSelectedStock: React.Dispatch<React.SetStateAction<Stock | undefined>>,
    }
) => {
    const [available10KFilings, setAvailable10KFilings] = useState<{accessionNumber:string, filingDate:string, primaryDocument:string}[]>([]);
    const [selectedSection, setSelectedSection] = useState<string>("");
    const [currentFilingSelection, setCurrentFilingSelection] = useState<string>('');
    
    const convertSectionKeyToDisplay = (key: string) => {
        return key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
    }

    const addDocument = () => {
        if (!currentFilingSelection || selectedDocuments.length >= 2) return;
        
        const filing = available10KFilings.find(f => f.filingDate.split('-')[0] === currentFilingSelection);
        if (filing && !selectedDocuments.some(doc => doc.filingDate === filing.filingDate)) {
            setSelectedDocuments([...selectedDocuments, {
                filingDate: filing.filingDate,
                accessionNumber: filing.accessionNumber,
                primaryDocument: filing.primaryDocument,
                year: filing.filingDate.split('-')[0]
            }]);
            setCurrentFilingSelection('');
        }
    };

    const removeDocument = (filingDate: string) => {
        setSelectedDocuments(selectedDocuments.filter(doc => doc.filingDate !== filingDate));
    };
    
    const handleSubmit = async () => {
        if (selectedDocuments.length === 0 || !selectedSection || !selectedStock) return;
        
        setAnalysis('');

        if (selectedDocuments.length === 1) {
            // Single analysis
            setAnalysisMode('single');
            const doc = selectedDocuments[0];
            const stockData = {
                cik: selectedStock.cik_str, 
                accessionNumber: doc.accessionNumber, 
                primaryDocument: doc.primaryDocument
            };
            const resp = await secService.analyze10KSection(stockData, selectedSection);
            
            if(resp.ok){
                const jobId = await resp.json();
                setJobId(jobId);
            }
        } else if (selectedDocuments.length === 2) {
            // Comparison analysis
            setAnalysisMode('compare');
            const [doc1, doc2] = selectedDocuments.sort((a, b) => a.filingDate.localeCompare(b.filingDate));
            const stockData1 = {
                cik: selectedStock.cik_str, 
                accessionNumber: doc1.accessionNumber, 
                primaryDocument: doc1.primaryDocument
            };
            const stockData2 = {
                cik: selectedStock.cik_str, 
                accessionNumber: doc2.accessionNumber, 
                primaryDocument: doc2.primaryDocument
            };
            const resp = await secService.compare10KFilings(stockData1, stockData2, selectedSection);

            if(resp.ok){
                const jobId = await resp.json();
                setJobId(jobId);
            }
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

                {/* Selected Documents */}
                <div className="pb-6 border-b border-gray-200">
                    <h3 className="text-sm font-semibold findiff-secondary-blue mb-3">
                        Selected Documents ({selectedDocuments.length}/2)
                    </h3>
                    {selectedDocuments.length > 0 ? (
                        <div className="space-y-2 mb-3">
                            {selectedDocuments.map((doc) => (
                                <div 
                                    key={doc.filingDate}
                                    className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg"
                                >
                                    <span className="text-sm text-blue-800 font-medium">{doc.year}</span>
                                    <button
                                        onClick={() => removeDocument(doc.filingDate)}
                                        className="text-red-600 hover:text-red-800 transition-colors"
                                        disabled={awaitingAnalysis}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500 mb-3">No documents selected</p>
                    )}
                    
                    {selectedDocuments.length < 2 && (
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <FindiffDropDown
                                    options={available10KFilings
                                        .filter(filing => !selectedDocuments.some(doc => doc.filingDate === filing.filingDate))
                                        .map(filing => filing.filingDate.split('-')[0])}
                                    value={currentFilingSelection}
                                    onChange={setCurrentFilingSelection}
                                    placeholder="Select a filing"
                                    disabled={awaitingAnalysis}
                                />
                                <button
                                    onClick={addDocument}
                                    disabled={!currentFilingSelection || awaitingAnalysis}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                            <p className="text-xs text-gray-500">
                                {selectedDocuments.length === 0 
                                    ? 'Add 1 document for single analysis, or 2 for comparison' 
                                    : 'Add 1 more document for comparison analysis'}
                            </p>
                        </div>
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
                            awaitingAnalysis || 
                            !selectedSection || 
                            selectedDocuments.length === 0
                        }
                    >
                        {selectedDocuments.length === 2 ? 'Compare Filings' : selectedDocuments.length === 1 ? 'Analyze Filing' : 'Select Documents'}
                    </FinDiffButton>
                </div>
                </div>
            )}
            </div>
        </div>
    );
}

export default LeftSidebar;