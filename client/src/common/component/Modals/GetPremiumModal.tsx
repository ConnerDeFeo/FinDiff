import Modal from "./Modal";

const GetPremiumModal = ({isOpen, onClose}: {isOpen: boolean; onClose: () => void}) => {
    if(!isOpen) return null;
    return (
        <Modal onClose={onClose}>
            <></>
        </Modal>
    );
};

export default GetPremiumModal;