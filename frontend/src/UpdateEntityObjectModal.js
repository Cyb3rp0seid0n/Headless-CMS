// UpdateEntityObjectModal.js
import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';

Modal.setAppElement('#root'); // Bind modal to the app root element

const UpdateEntityObjectModal = ({ isOpen, onRequestClose, attributes, onSave }) => {
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
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="Update Entity Object">
      <div className="input-group">
      <h2>Update Entity Object</h2>
      </div>
      <div className="input-group">
        <label>Object Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      {attributes.map(attribute => (
        <div key={attribute.id} className="input-group">
          <label>{attribute.name} ({attribute.dataType}) </label>
          <input
            type="text"
            value={attributeValues[attribute.id]}
            onChange={(e) => handleChange(attribute.id, e.target.value)}
          />
        </div>
      ))}
      <div className="input-group">
      <button onClick={handleSave}>Save</button>
      <button onClick={onRequestClose}>Cancel</button>
      </div>
    </Modal>
  );
};

export default UpdateEntityObjectModal;
