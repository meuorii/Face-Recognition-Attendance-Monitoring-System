// src/components/Common/ModalManager.jsx
import { createContext, useContext, useState } from "react";

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

const ModalManager = ({ children }) => {
  const [modalContent, setModalContent] = useState(null);

  const openModal = (content) => setModalContent(content);
  const closeModal = () => setModalContent(null);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}

      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative bg-neutral-900 rounded-xl shadow-xl border border-neutral-700 max-w-2xl w-full p-6">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>
            {modalContent}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export default ModalManager;
