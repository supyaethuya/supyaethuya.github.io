import { useState } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import data from './Components.json';
import Modal from './Modal';
import { FaArrowLeft } from "react-icons/fa";

function ListView() {
  const {id} = useParams()
  const item = data.find((x)=> x.id === Number(id))
  const [selectedItem, setSelectedItem] = useState(null);
  const navigate = useNavigate();

  return(
   <div className="pageContainer">
        <div key={item.id}>
          <div className="headerRow">
            <button className="backButton" onClick={() => navigate(-1)}>
              <FaArrowLeft size={12} /> Back
            </button>
            <h2>{item.title}</h2>
          </div>
          <p>{item.description}</p>
            {item.components.map((component) => (
              <div className='card' style={{margin:0}}>
                  <button key={component.id} onClick={() => setSelectedItem(component)}>
                    <span className="character">{component.name}</span>
                  </button>
              </div>
            ))}

        </div>

        <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        >
      </Modal>

    </div>
  );
}

export default ListView