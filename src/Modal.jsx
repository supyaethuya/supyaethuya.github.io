import CharacterTraceCard from './TraceCard';
import { FaVolumeUp } from "react-icons/fa";

export default function Modal({ isOpen, onClose, item, children }) {
  if (!isOpen) return null;
  const handleClick = () => {
      console.log("Speaker button clicked");
    };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="header">
          <h2>{item.name}</h2>
          <button onClick={onClose} className="closeBtn">
            ✕
          </button>
        </div>
        <div className="audio">
          {/* <button className="audioButton" onClick={handleClick}>
            <FaVolumeUp size={20} />
          </button> */}
          ({item.pronunciation})
        </div>
        <div className="content">
          {children}
          <CharacterTraceCard
            character={item.name}
            viewBox={item.viewBox}
            strokes={item.stroke}
            ghost={item.ghost}
          />
        </div>
      </div>
    </div>
  );
}
