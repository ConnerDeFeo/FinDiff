const Modal = ({onClose, children}:{onClose: () => void, children: React.ReactNode})=>{
    return(
        <>
            {/* Backdrop with opacity */}
            <div 
                className="fixed inset-0 bg-black opacity-20 z-40"
                onClick={onClose}
            />
            
            {/* Modal centered on screen */}
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                <div 
                    className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer ml-auto mb-4 block"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    {children}
                </div>
            </div>
        </>
    );
};

export default Modal;