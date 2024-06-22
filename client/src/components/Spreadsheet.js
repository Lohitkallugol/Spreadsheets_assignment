import React, { useState, useEffect } from 'react';
import './Spreadsheet.css'; 
import axios from 'axios';
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from '@material-ui/icons/Add';

const Spreadsheet = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', value: '' });
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [history, setHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);
  const [clipboard, setClipboard] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete') {
        handleDeleteAction();
      } else if (e.ctrlKey && e.key === 'z') {
        handleUndoAction();
      } else if (e.ctrlKey && e.key === 'y') {
        handleRedoAction();
      } else if (e.ctrlKey && e.key === 'c') {
        handleCopyAction();
      } else if (e.ctrlKey && e.key === 'v') {
        handlePasteAction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedItem, selectedType, history, redoHistory, clipboard]);

  const fetchItems = () => {
    axios.get('http://localhost:3001/api/items').then((response) => {
      setItems(response.data);
    }).catch((error) => {
      console.error('Error fetching items:', error);
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewItem({ ...newItem, [name]: value });
  };

  const handleAdd = () => {
    axios.post('http://localhost:3001/api/items', newItem).then((response) => {
      const addedItem = response.data;
      setItems([...items, addedItem]);
      setNewItem({ name: '', value: '' });
      setHistory([...history, { type: 'add', item: addedItem }]);
      setRedoHistory([]);  // Clear redo history on new action
    }).catch((error) => {
      console.error('Error adding item:', error);
    });
  };

  const handleUpdate = (id, name, value, recordHistory = true) => {
    const oldItem = items.find(item => item.id === id);
    axios.put(`http://localhost:3001/api/items/${id}`, { name, value }).then((response) => {
      const updatedItems = items.map((item) => (item.id === id ? response.data : item));
      setItems(updatedItems);
      if (recordHistory) {
        setHistory([...history, { type: 'update', oldItem, newItem: response.data }]);
        setRedoHistory([]);  // Clear redo history on new action
      }
    }).catch((error) => {
      console.error('Error updating item:', error);
    });
  };

  const handleDelete = (id, recordHistory = true) => {
    const deletedItem = items.find(item => item.id === id);
    axios.delete(`http://localhost:3001/api/items/${id}`).then(() => {
      const remainingItems = items.filter((item) => item.id !== id);
      setItems(remainingItems);
      if (recordHistory) {
        setHistory([...history, { type: 'delete', item: deletedItem }]);
        setRedoHistory([]);  // Clear redo history on new action
      }
    }).catch((error) => {
      console.error('Error deleting item:', error);
    });
  };

  const handleDeleteAction = () => {
    if (selectedType === 'row') {
      if (window.confirm('Are you sure you want to delete this row?')) {
        handleDelete(selectedItem.id);
        setSelectedItem(null);
        setSelectedType(null);
      }
    } else if (selectedType === 'cell') {
      if (selectedItem) {
        const { id, field } = selectedItem;
        const item = items.find(item => item.id === id);
        handleUpdate(id, field === 'name' ? '' : item.name, field === 'value' ? '' : item.value);
        setSelectedItem(null);
        setSelectedType(null);
      }
    }
  };

  const handleSelect = (id, field = null) => {
    setSelectedItem(field ? { id, field } : { id });
    setSelectedType(field ? 'cell' : 'row');
  };

  const handleUndoAction = () => {
    if (history.length === 0) return;
    const lastAction = history.pop();
    setHistory([...history]);
    setRedoHistory([...redoHistory, lastAction]);

    if (lastAction.type === 'add') {
      handleDelete(lastAction.item.id, false);
    } else if (lastAction.type === 'update') {
      const { oldItem } = lastAction;
      handleUpdate(oldItem.id, oldItem.name, oldItem.value, false);
    } else if (lastAction.type === 'delete') {
      axios.post('http://localhost:3001/api/items', lastAction.item).then((response) => {
        setItems([...items, response.data]);
      }).catch((error) => {
        console.error('Error undoing delete:', error);
      });
    }
  };

  const handleRedoAction = () => {
    if (redoHistory.length === 0) return;
    const lastUndoneAction = redoHistory.pop();
    setRedoHistory([...redoHistory]);
    setHistory([...history, lastUndoneAction]);

    if (lastUndoneAction.type === 'add') {
      axios.post('http://localhost:3001/api/items', lastUndoneAction.item).then((response) => {
        setItems([...items, response.data]);
      }).catch((error) => {
        console.error('Error redoing add:', error);
      });
    } else if (lastUndoneAction.type === 'update') {
      const { newItem } = lastUndoneAction;
      handleUpdate(newItem.id, newItem.name, newItem.value, false);
    } else if (lastUndoneAction.type === 'delete') {
      handleDelete(lastUndoneAction.item.id, false);
    }
  };

  const handleCopyAction = () => {
    if (selectedItem && selectedType === 'cell') {
      const item = items.find(item => item.id === selectedItem.id);
      const dataToCopy = selectedItem.field === 'name' ? item.name : item.value;
      setClipboard(dataToCopy);
    } else if (selectedItem && selectedType === 'row') {
      const item = items.find(item => item.id === selectedItem.id);
      setClipboard({ name: item.name, value: item.value });
    }
  };

  const handlePasteAction = () => {
    if (selectedItem && selectedType === 'cell' && clipboard !== null) {
      const { id, field } = selectedItem;
      const item = items.find(item => item.id === id);
      handleUpdate(id, field === 'name' ? clipboard : item.name, field === 'value' ? clipboard : item.value);
    } else if (selectedItem && selectedType === 'row' && clipboard !== null && typeof clipboard === 'object') {
      const { id } = selectedItem;
      handleUpdate(id, clipboard.name, clipboard.value);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Spreadsheet</h1>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`border p-2 ${selectedItem && selectedItem.id === item.id && selectedType === 'row' ? 'bg-gray-200' : ''}`}
            onClick={() => handleSelect(item.id)}
          >
            <input
              type="text"
              value={item.name}
              onChange={(e) => handleUpdate(item.id, e.target.value, item.value)}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(item.id, 'name');
              }}
              className={`border p-1 ${selectedItem && selectedItem.id === item.id && selectedType === 'cell' && selectedItem.field === 'name' ? 'bg-gray-200' : ''}`}
            />
            <input
              type="text"
              value={item.value}
              onChange={(e) => handleUpdate(item.id, item.name, e.target.value)}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(item.id, 'value');
              }}
              className={`border p-1 ml-2 ${selectedItem && selectedItem.id === item.id && selectedType === 'cell' && selectedItem.field === 'value' ? 'bg-gray-200' : ''}`}
            />
            <button onClick={(e) => {
              e.stopPropagation();
              handleDelete(item.id);
            }} className="ml-2 text-red-500">
              <DeleteIcon/>
            </button>
          </div>
        ))}
        <div className="border p-2">
          <input
            type="text"
            name="name"
            value={newItem.name}
            onChange={handleChange}
            placeholder="Name"
            className="border p-1"
          />
          <input
            type="text"
            name="value"
            value={newItem.value}
            onChange={handleChange}
            placeholder="Value"
            className="border p-1 ml-2"
          />
          <button onClick={handleAdd} className="ml-2 text-green-500">
            <AddIcon/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Spreadsheet;
