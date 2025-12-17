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
                    {children}
                </div>
            </div>
        </>
    );
};

export default Modal;