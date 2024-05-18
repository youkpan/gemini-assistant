import React, { useState } from 'react';
import MediaSelectorModel from './MediaSelectorModel'; // 引入模态对话框组件

function MainComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <button onClick={openModal}>选择媒体源</button>
      <MediaSelectorModel isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
}

export default MainComponent;