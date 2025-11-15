import { useEffect, useState } from "react";
import './global.css'
import SearchStock from "./common/component/SearchStock";
import type { Stock } from "./common/types/Stock";
import secService from "./service/SecService";
import MarkDownDisplay from "./common/component/display/MarkdownDisplay";
import FinDiffButton from "./common/component/FinDiffButton";
import Spinner from "./common/component/display/Spinner";
import { Sections } from "./common/variables/Sections";

function App() {
  const [analysis, setAnalysis] = useState<string>('');
  const [progress, setProgress] = useState<string>('');
  const [jobId, setJobId] = useState<string>('');
  const [selectedStock, setSelectedStock] = useState<Stock | undefined>();
  const [available10KFilings, setAvailable10KFilings] = useState<{accessionNumber:string, filingDate:string, primaryDocument:string}[]>([]);
  const [selectedOlderFilingDate, setSelectedOlderFilingDate] = useState<string>('');
  const [selectedNewerFilingDate, setSelectedNewerFilingDate] = useState<string>('');
  const [awaitingAnalysis, setAwaitingAnalysis] = useState<boolean>(false);
  const [selectedSection, setSelectedSection] = useState<string>("");

  const handleSubmit = async () => {
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

  useEffect(()=>{
    const poll = async (attempt: number) => {
      if (attempt >= 90) {
        setAnalysis('Analysis timed out. Please try again later.');
        setAwaitingAnalysis(false);
        return;
      }
      setAwaitingAnalysis(true);
      const resp = await secService.getComparisonStatus(jobId);
      if(!resp.ok) {
        setAnalysis('Error fetching comparison status.');
        setAwaitingAnalysis(false);
        return;
      }
      const job =  await resp.json();

      if (job.status === 'COMPLETED' || job.status === 'FAILED') {
        setAnalysis(job.result || 'Comparison failed.');
        setAwaitingAnalysis(false);
        return;
      }
      if(job.progress){
        setProgress(job.progress);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      poll(attempt + 1);
    };
    if(jobId){
      poll(0);
      setJobId('');
    }
  }, [jobId]);

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
    <div className="h-screen findiff-bg-white flex overflow-hidden">
      {/* Left Sidebar */}
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

              {/* Filing Selection */}
              <div className="pb-6 border-b border-gray-200">
                <h3 className="text-sm font-semibold findiff-secondary-blue mb-4">Select Filings to Compare</h3>
                <div className="space-y-4">
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
                  {Sections && Object.values(Sections).map((section) => (
                    <option key={section} value={section}>
                      {section.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Compare Button */}
              <div>
                <FinDiffButton 
                  onClick={handleSubmit} 
                  disabled={!selectedOlderFilingDate || !selectedNewerFilingDate || awaitingAnalysis || !selectedSection}
                >
                  Compare Filings
                </FinDiffButton>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8">
          {(analysis || awaitingAnalysis) && (
            <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 findiff-border-primary-blue">
              { awaitingAnalysis ? 
                <div className="flex flex-col justify-center items-center py-12">
                  <Spinner />
                  <p className="mt-4 text-gray-600">This may take a few moments.</p>
                </div>
                :
                <MarkDownDisplay markdown={analysis} />
              }
              {awaitingAnalysis &&
                <p>{progress}</p>
              }
            </div>
          )}
          {!analysis && !awaitingAnalysis && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <svg className="mx-auto h-24 w-24 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg">Select filings to compare and view analysis here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;