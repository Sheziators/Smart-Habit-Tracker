import React, { useEffect, useState } from 'react'
import api from '../api'
import { useParams } from 'react-router-dom'

export default function HabitDetail(){
  const { id } = useParams();
  const [habit, setHabit] = useState(null);
  const [comps, setComps] = useState([]);
  const [streak, setStreak] = useState(0);

  async function load(){
    // fetch habit
    const res = await api.get('/habits');
    const h = res.data.find(x => String(x.id) === String(id));
    setHabit(h);

    // fetch completions
    const c = await api.get(`/habits/${id}/completions`);
    setComps(c.data);

    // ✅ fetch streak stats
    const s = await api.get(`/habits/${id}/stats`);
    setStreak(s.data.current_streak);
  }

  useEffect(() => {
    load();
  }, [id]);

  return (
    <div>
      {habit ? (
        <>
          <h2>{habit.title}</h2>
          <p className="small">{habit.description}</p>
          <div className="small">
            Start: {habit.start_date} | Frequency: {habit.frequency}
          </div>

          <div style={{marginTop:12}}>
            <button onClick={async () => {
              const date = prompt("Enter completion date (YYYY-MM-DD)", new Date().toISOString().slice(0,10));
              if (date) {
                const res = await api.post(`/habits/${id}/complete`, { date });
                setComps(res.data.completions);
                setStreak(res.data.streak); // ✅ update streak after completion
                alert(`Marked complete on ${date}. Current streak: ${res.data.streak} days`);
              }
            }}>
              Mark Complete
            </button>
          </div>

          <h4 style={{marginTop:16}}>Completions</h4>
          <p>🔥 Current Streak: {streak} days</p>
          <ul>
            {comps.map((c,i) => (
              <li key={i}>{new Date(c).toLocaleDateString()}</li>
            ))}
          </ul>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  )
}
