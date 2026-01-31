import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// Ajoutez cette ligne :
import 'bootstrap/dist/css/bootstrap.min.css'; 
// On supprime index.css s'il contient du tailwind, ou on le vide
import './index.css' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)