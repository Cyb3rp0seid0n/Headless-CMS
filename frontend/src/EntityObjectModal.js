// EntityObjectModal.js
import React, { useState } from 'react';
import Modal from 'react-modal';

Modal.setAppElement('#root'); // Bind modal to the app root element

const EntityObjectModal = ({ isOpen, onRequestClose, attributes, onSave }) => {
  const [name, setName] = useState('');
  const [attributeValues, setAttributeValues] = useState(
    attributes.reduce((acc, attr) => {
      acc[attr.id] = '';
      return acc;
    }, {})
  );

  const handleChange = (id, value) => {
    setAttributeValues(prevState => ({
      ...prevState,
      [id]: value,
    }));
  };

  const handleSave = () => {
    onSave(name, attributeValues);
    onRequestClose();
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="Create Entity Object">
      <h2>Create Entity Object</h2>
      <div>
        <label>Name:</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      {attributes.map(attribute => (
        <div key={attribute.id}>
          <label>{attribute.name} ({attribute.dataType}):</label>
          <input
            type="text"
            value={attributeValues[attribute.id]}
            onChange={(e) => handleChange(attribute.id, e.target.value)}
          />
        </div>
      ))}
      <button onClick={handleSave}>Save</button>
      <button onClick={onRequestClose}>Cancel</button>
    </Modal>
  );
};

export default EntityObjectModal;
