import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EntityObjectModal from './EntityObjectModal';
import UpdateEntityObjectModal from './UpdateEntityObjectModal';
import "./App.css";

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000',
});

const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleDateString();
};

function App() {
  const [entities, setEntities] = useState([]);
  const [name, setName] = useState('');
  const [attributes, setAttributes] = useState([]);
  const [newAttribute, setNewAttribute] = useState('');
  const [dataType, setDataType] = useState('string'); 
  const [entityAttributes, setEntityAttributes] = useState({});
  const [entityObject, setEntityObjects] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEntityId, setCurrentEntityId] = useState(null);
  const [currentEntityDataId, setCurrentEntityDataId] = useState(null);
  const [currentAttributes, setCurrentAttributes] = useState([]);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);


  useEffect(() => {
    fetchEntities();
  }, []);

  useEffect(() => {
    entities.forEach((entity) => getAttributes(entity.id))
  }, [entities]);

  useEffect(() => {
    entities.forEach((entity) => getEntityObject(entity.id))
  }, [entities]);

  const fetchEntities = () => {
    axiosInstance.get('/api/entities')
      .then(response => {
        setEntities(response.data);
      })
      .catch(error => {
        console.error('Error fetching entities:', error);
      });
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        getAttributes(entity.id);
      }
  };

  const handleCreateEntity = async () => {
    try {
      const entity = { name, attributes };
      await axiosInstance.post('/api/entities', entity);
      fetchEntities();
      setName('');
      setAttributes([]);
    } catch (error) {
      console.error('Error creating entity:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        if (error.response.status === 400) {
          alert('Bad request: Please check your input data.');
        } else if (error.response.status === 404) {
          alert('Not found: The requested resource was not found.');
        } else {
          alert('An error occurred while creating the entity.');
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        alert('No response received from the server.');
      } else {
        console.error('Error in request:', error.message);
        alert('Error making the request.');
      }
    }
    fetchEntities();
  };
  

  const handleAddAttribute = () => {
    setAttributes([...attributes, { name: newAttribute, dataType }]);
    setNewAttribute('');
  };

  const handleDeleteAttribute = (index) => {
    const updatedAttributes = [...attributes];
    updatedAttributes.splice(index, 1);
    setAttributes(updatedAttributes);
  };
  

  const handleDeleteEntity = async (id) => {
    await axiosInstance.delete(`/api/entities/${id}`);
    fetchEntities();
  };

 
  
  const getAttributes = async (id) => {
    try {
      const response = await axiosInstance.get(`/api/entities/${id}/attributes`);
      console.log('response:', response);
      console.log('Attributes Response:', response.data);
      setEntityAttributes(prevState => ({
        ...prevState,
        [id]: response.data
      }));
    } catch (error) {
      console.error('Error fetching attributes of entity:', error);
    }
  };


  const getEntityObject = async (id) => {
    try {
      const response = await axiosInstance.get(`/api/entities/${id}/entitydata`);
      const entityData = response.data['Attributes'];
      console.log('EntityData:', entityData);
      let dataPromises = [];
      for (const entityId in entityData) {
        const entityEntry = entityData[entityId];
        console.log('Entity Entry:', entityEntry);
        const entityDataResponse = await axiosInstance.get(`/api/entities/${id}/entitydata/${entityEntry.id}/data`);
        let dataEntryAttribute = {};
        entityDataResponse.data.Attributes.forEach(attributeDataEntry => {
          dataEntryAttribute[attributeDataEntry.attributeId] = attributeDataEntry;
        });
        const dataEntry = { id: entityEntry.id, name: entityEntry.name, data: dataEntryAttribute };
        console.log('dataEntry:', dataEntry);
        dataPromises.push(dataEntry);
      };
      console.log('Data Promises:', dataPromises);
      setEntityObjects((prevState) => ({
        ...prevState,
        [id]: dataPromises,
      }));
      console.log('Entity Data:', entityObject);
    } catch (error) {
      console.error('Error fetching entity data:', error);
    }
  };

  const handleDeleteEntityObject = async (id, entitydataId) => {
    await axiosInstance.delete(`/api/entities/${id}/entitydata/${entitydataId}`);
    fetchEntities();
  };


  const openCreateObjectModal = (entityId, attributesArray) => {
    setCurrentEntityId(entityId);
    setCurrentAttributes(attributesArray);
    setIsModalOpen(true);
  };


  const handleSaveEntityObject = (name, attributeValues) => {
    let entitydataId;
    axiosInstance.post(`/api/entities/${currentEntityId}/entitydata`, { data: { name } })
      .then(response => {
        entitydataId = response.data.id;
        currentAttributes.forEach(attribute => {
          const dataType = attribute.dataType === 'date' ? 'value_datetime' : 'value_text';
          const attributeData = {
            [dataType]: attributeValues[attribute.id],
            entitydataId: entitydataId,
          };

          axiosInstance.post(`/api/entities/${currentEntityId}/attributes/${attribute.id}/data`, { data: attributeData })
            .then(response => {
              fetchEntities();
            })
            .catch(error => {
              console.error('Error creating attribute data:', error);
            });
        });
      })
      .catch(error => {
        console.error('Error creating entity:', error);
      });
  };
  

  const openUpdateObjectModal = (entityId, entitydataId, attributesArray) => {
    setCurrentEntityId(entityId);
    setCurrentEntityDataId(entitydataId);
    setCurrentAttributes(attributesArray);
    setIsUpdateModalOpen(true);
  };


  const handleUpdateEntityObject = async (name, attributeValues) => {
    axiosInstance.put(`/api/entities/${currentEntityId}/entitydata/${currentEntityDataId}`, { data: { name } })
      .then(response => {
        console.log('Entity updated successfully:', response.data);
        currentAttributes.forEach(attribute => {
          const dataType = attribute.dataType === 'date' ? 'value_datetime' : 'value_text';
          const attributeData = {
            [dataType]: attributeValues[attribute.id],
            entitydataId: currentEntityDataId, 
          };
          axiosInstance.put(`/api/entities/${currentEntityId}/entitydata/${currentEntityDataId}/attributes/${attribute.id}/data`, { data: attributeData })
            .then(response => {
              console.log('Attribute data updated successfully:', response.data);
              fetchEntities(); 
            })
            .catch(error => {
              console.error('Error updating attribute data:', error);
            });
        });
      })
      .catch(error => {
        console.error('Error updating entity:', error);
      });
  };


  return (
    <div className="App">
      <h1>Basic Headless-CMS</h1>
      <div>
        <label>Name:</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label>Add Attribute:</label>
        <input type="text" value={newAttribute} onChange={(e) => setNewAttribute(e.target.value)} />
        <select value={dataType} onChange={(e) => setDataType(e.target.value)}>
          <option value="string">String</option>
          <option value="number">Number</option>
          <option value="date">Date</option>
        </select>
        <button onClick={handleAddAttribute}>Add Attribute</button>
      </div>
      <div>
        <h2>Entity Class:</h2>
        <ul>
          {attributes.map((attribute, index) => (
            <li key={index}>
              {attribute.name} - {attribute.dataType}
              <button onClick={() => handleDeleteAttribute(index)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
      <button onClick={handleCreateEntity}>Create Entity</button>
      <hr />
      <h2>Entities</h2>
      <ul>
        {entities.map((entity) => (
          <li key={entity.id}>
            <div>
              {entity.name} - Attributes:
              <ul>
                {entityAttributes[entity.id]?.Attributes.map((attribute, index) => (
                  <li key={index}>
                    {attribute.name} ({attribute.dataType})
                  </li>
                ))}
              </ul>
              <button onClick={() => openCreateObjectModal(entity.id, entityAttributes[entity.id]?.Attributes)}>Create Object</button>
              <button onClick={() => handleDeleteEntity(entity.id)}>Delete</button>
            </div>
            <div>
            <h3>Objects:</h3>
            <ul>
              {entityObject[entity.id]?.map((obj, index) => (
                <div key={index}>
                  <h3>Name: {obj.name}</h3>
                  {entityAttributes[entity.id]?.Attributes.map((attribute, index) => (
                  <li key={index}>
                    {attribute.name}: {obj.data[attribute.id]?.valuedateTime ? formatDate(obj.data[attribute.id].valuedateTime) : obj.data[attribute.id]?.valueText}
                  </li>
                ))}
                  <button onClick={() => openUpdateObjectModal(entity.id, obj.id, entityAttributes[entity.id]?.Attributes)}>Update</button>
                  <button onClick={() => handleDeleteEntityObject(entity.id, obj.id)}>Delete</button>
                </div>
              ))}
            </ul>
          </div>
          </li>
        ))}
      </ul>
      <EntityObjectModal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        attributes={currentAttributes}
        onSave={handleSaveEntityObject}
      />
      <UpdateEntityObjectModal
        isOpen={isUpdateModalOpen}
        onRequestClose={() => setIsUpdateModalOpen(false)}
        attributes={currentAttributes}
        onSave={handleUpdateEntityObject}
      />
    </div>
  );
}

export default App;
