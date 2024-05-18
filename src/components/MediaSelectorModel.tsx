import React from 'react';
import MediaSelector from './MediaSelector'; // 假设MediaSelector是你的媒体选择组件

function MediaSelectorModel({ isOpen, onClose }) {
 if (!isOpen) return null;

 return (
   <div className="modal-overlay">
     <div className="modal-content">
       <MediaSelector />
       <button onClick={onClose}>关闭</button>
     </div>
   </div>
 );
}

export default MediaSelectorModel;