const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors()); 
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Vignesh@2003',
  database: 'headless_cms'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

db.query(`CREATE TABLE IF NOT EXISTS entities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
  if (err) throw err;
  console.log('Entities table created or already exists');
});

db.query(`CREATE TABLE IF NOT EXISTS attributes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  entity_id INT,
  name VARCHAR(255) NOT NULL,
  data_type VARCHAR(50) NOT NULL,
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
)`, (err) => {
  if (err) throw err;
  console.log('Attributes table created or already exists');
});

db.query(`CREATE TABLE IF NOT EXISTS entitydata (
  id INT PRIMARY KEY AUTO_INCREMENT,
  entity_id INT,
  name VARCHAR(255), 
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
)`, (err) => {
  if (err) throw err;
  console.log('Entity Data table created or already exists');
});

db.query(`CREATE TABLE IF NOT EXISTS data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  entity_id INT,
  attribute_id INT,
  entitydata_id INT,
  value_datetime DATETIME,
  value_text VARCHAR(255),
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE,
  FOREIGN KEY (entitydata_id) REFERENCES entitydata(id) ON DELETE CASCADE
)`, (err) => {
  if (err) throw err;
  console.log('Data table created or already exists');
});
 
app.post('/api/entities', (req, res) => {
  const { name, attributes } = req.body;
  db.query('INSERT INTO entities (name) VALUES (?)', [name], (err, entityResult) => {
    if (err) {
      console.error('Error creating entity:', err);
      res.status(500).json({ error: 'An error occurred during entity creation' });
      return;
    }
    const entityId = entityResult.insertId;
    for (const attribute of attributes) {
      db.query('INSERT INTO attributes (entity_id, name, data_type) VALUES (?, ?, ?)', [entityId, attribute.name, attribute.dataType], (err, attributeResult) => {
        if (err) {
          console.error('Error creating attribute:', err);
          res.status(500).json({ error: 'An error occurred during attribute creation' });
          return;
        }
      });
    }
    res.status(201).json({ message: 'Entity created successfully', id: entityId });
  });
});

app.get('/api/entities', (req, res) => {
  db.query('SELECT * FROM entities', (err, results) => {
    if (err) {
      console.error('Error fetching entities:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(results);
    }
  });
});

app.get('/api/entities/:id/attributes', (req, res) => {
  const entityId = req.params.id;
  db.query('SELECT * FROM attributes WHERE entity_id = ?', [entityId], (err, results) => {
    if (err) {
      console.error('Error fetching entities:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      const formattedAttributes = results.map(row => ({
        name: row.name,
        dataType: row.data_type,
        id: row.id,
        entityId: row.entity_id
      }));
      res.json({ Attributes: formattedAttributes });
    }
  });
});


app.delete('/api/entities/:id', (req, res) => {
  const entityId = req.params.id;
  db.query('DELETE FROM entities WHERE id = ?', [entityId], (err, result) => {
    if (err) {
      console.error('Error deleting entity:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Entity not found' });
    } else {
      res.json({ message: 'Entity deleted successfully' });
    }
  });
});

app.post('/api/entities/:entityId/entitydata', (req,res) => {
  const {data} = req.body;
  const entityId = req.params.entityId;  
  db.query('INSERT INTO entitydata (entity_id, name) VALUES (?, ?)', [entityId, data.name], (err, entityData) => {
    if (err) {
      console.error('Error entering attribute data:', err);
      res.status(500).json({ error: 'An error occurred during entering attriubte data' });
      return;
    }
    const entitydataId = entityData.insertId;
    res.status(201).json({ message: 'Attribute data entered successfully', id: entitydataId });
  });
})


app.post('/api/entities/:entityId/attributes/:attributeId/data', (req, res) => {
  const {data} = req.body;
  const entityId = req.params.entityId;  
  const attributeId = req.params.attributeId;  
  const entitydataId = data.entitydataId;
  const value_datetime = data.value_datetime || null;
  const value_text = data.value_text || null;
  db.query('INSERT INTO data (entity_id, attribute_id, entitydata_id, value_datetime, value_text) VALUES (?, ?, ?, ?, ?)', [entityId, attributeId, entitydataId, value_datetime, value_text], (err, attributeData) => {
    if (err) {
      console.error('Error entering attribute data:', err);
      res.status(500).json({ error: 'An error occurred during entering attriubte data' });
      return;
    }
    const dataId = attributeData.insertId;
    res.status(201).json({ message: 'Attribute data entered successfully', id: dataId });
  });
});


app.get('/api/entities/:entityId/entitydata', (req, res) => {
  const entityId = req.params.entityId;
  db.query('SELECT * FROM entitydata WHERE entity_id = ?', [entityId], (err, results) => {
    if (err) {
      console.error('Error fetching entities:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      const formattedEntityData = results.map(row => ({
        name: row.name,
        id: row.id,
        entityId: row.entity_id
      }));
      res.json({ Attributes: formattedEntityData });
    }
  });
});


app.get('/api/entities/:entityId/entitydata/:entitydataId/data', (req, res) => {
  const entityId = req.params.entityId;  
  const entitydataId = req.params.entitydataId;  
  db.query('SELECT * FROM data WHERE entity_id = ? AND entitydata_id = ?', [entityId, entitydataId], (err, results) => {
    if (err) {
      console.error('Error fetching entities:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      const formattedAttributeData = results.map(row => ({
        entityId: row.entity_id,
        attributeId: row.attribute_id,
        id: row.id,
        entitydataId: row.entitydata_id,
        valuedateTime: row.value_datetime,
        valueText: row.value_text
      }));
      res.json({ Attributes: formattedAttributeData });
    }
  });
});


app.delete('/api/entities/:entityId/entitydata/:entitydataId', (req, res) => {
  const entitydataId = req.params.entitydataId;
  const entityId = req.params.entityId;
  db.query('DELETE FROM entitydata WHERE  entity_id = ? AND id = ?', [entityId, entitydataId], (err, result) => {
    if (err) {
      console.error('Error deleting entity data:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Entity not found' });
    } else {
      res.json({ message: 'Entity data deleted successfully' });
    }
  });
});

app.put('/api/entities/:entityId/entitydata/:entitydataId', (req,res) => {
  const {data} = req.body;
  const entityId = req.params.entityId;  
  const entitydataId = req.params.entitydataId;
  db.query('UPDATE entitydata SET name = ? WHERE entity_id = ? AND id = ?', [data.name, entityId, entitydataId], (err, entityData) => {
    if (err) {
      console.error('Error updating attribute data:', err);
      res.status(500).json({ error: 'An error occurred during updating attriubte data' });
      return;
    }
    const entitydataId = entityData.insertId;
    res.status(201).json({ message: 'Attribute data updated successfully', id: entitydataId });
  });
});


app.put('/api/entities/:entityId/entitydata/:entitydataId/attributes/:attributeId/data', (req, res) => {
  const {data} = req.body;
  const entityId = req.params.entityId;  
  const attributeId = req.params.attributeId;  
  const entitydataId = req.params.entitydataId;
  const value_datetime = data.value_datetime || null;
  const value_text = data.value_text || null;
  db.query('UPDATE data SET value_datetime = ?, value_text = ? WHERE entity_id = ? AND attribute_id = ? AND entitydata_id = ?', [value_datetime, value_text, entityId, attributeId, entitydataId], (err, attributeData) => {
    if (err) {
      console.error('Error updating attribute data:', err);
      res.status(500).json({ error: 'An error occurred during updating attriubte data' });
      return;
    }
    const dataId = attributeData.insertId;
    res.status(201).json({ message: 'Attribute data updated successfully', id: dataId });
  });
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
