import React, {useEffect, useState} from 'react'
import api from '../api'
import { Link } from 'react-router-dom'

export default function Home(){
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');


  async function load(){
  const res = await api.get('/habits', {
    params: { q: search, status, category }
  });
  setHabits(res.data);
}


  useEffect(()=>{ load() }, []);

  return (
    <div>
      <h2>Habits</h2>
      {loading && <p>Loading...</p>}


      <div style={{marginBottom:16}}>
      <input 
        placeholder="Search..." 
        value={search} 
        onChange={e=>setSearch(e.target.value)} 
        onKeyDown={e=>{ if(e.key==='Enter') load(); }} 
      />
        <select value={status} onChange={e=>setStatus(e.target.value)}>
        <option value="">All</option>
        <option value="completed">Completed Today</option>
        <option value="pending">Pending Today</option>
      </select>

        <select value={category} onChange={e=>setCategory(e.target.value)}>
        <option value="">All Categories</option>
        <option value="Health">Health</option>
        <option value="Learning">Learning</option>
        <option value="Productivity">Productivity</option>
      </select>
      <button onClick={load}>Apply</button>
    </div>



      {habits.map(h => (
        <div className="habit" key={h.id}>
          <h3><Link to={'/habit/'+h.id}>{h.title}</Link></h3>
          <p className="small">{h.description}</p>
          <div className="small">Category: {h.category_name || '—'} | Frequency: {h.frequency}</div>
          <div style={{marginTop:8}}>
            <button onClick={async () => {
              let date = prompt("Enter completion date (YYYY-MM-DD)", new Date().toISOString().slice(0,10));
              if (date) {
                try {
                  const res = await api.post(`/habits/${h.id}/complete`, { date });
                  alert(`Marked complete on ${date}`);
                  console.log("Completions:", res.data.completions);
                } catch (err) {
                  alert("Error marking completion: " + err.message);
                }
              }
            }}>Mark Complete</button>

            {/* Habit details page */}
            <Link style={{marginLeft:8}} to={'/habit/'+h.id}>
              <button>Details</button>
            </Link>
              {/* Edit habit */}
              <button 
                style={{ marginLeft: 8 }} 
                onClick={async () => {
                  const newTitle = prompt("Enter new title:", h.title);
                  if (newTitle) {
                    try {
                      await api.put(`/habits/${h.id}`, {
                        ...h,
                        title: newTitle
                      });
                      alert("Habit updated!");
                      load(); // reload list
                    } catch (err) {
                      alert("Error updating habit: " + err.message);
                    }
                  }
                }}
              >
                Edit
              </button>

              {/* Delete habit */}
              <button 
                style={{ marginLeft: 8, color: "red" }} 
                onClick={async () => {
                  if (window.confirm("Delete this habit?")) {
                    try {
                      await api.delete(`/habits/${h.id}`);
                      alert("Habit deleted!");
                      load();
                    } catch (err) {
                      alert("Error deleting habit: " + err.message);
                    }
                  }
                }}
              >
                Delete
              </button>
            <Link style={{marginLeft:8}} to={'/habit/'+h.id}><button>Details</button></Link>
          </div>
        </div>
      ))}
    </div>
  )
}
