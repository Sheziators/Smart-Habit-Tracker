import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Analytics(){
  const [habits, setHabits] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  async function load(){
    try {
      const res = await api.get('/habits');
      setHabits(res.data);

      const obj = {};
      for (const h of res.data){
        try{
          const r = await api.get(`/habits/${h.id}/stats`);
          obj[h.id] = r.data;
        }catch(e){
          obj[h.id] = { error: true };
        }
      }
      setStats(obj);
    } catch (err) {
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ load() }, []);

  if (loading) return <p>Loading analytics...</p>;

  return (
    <div>
      <h2>📊 Analytics</h2>
      <table border="1" cellPadding="8" style={{marginTop: "1em"}}>
        <thead>
          <tr>
            <th>Habit</th>
            <th>🔥 Current Streak</th>
            <th>🏆 Longest Streak</th>
            <th>✅ Completed</th>
            <th>📅 Expected</th>
            <th>📈 Completion %</th>
          </tr>
        </thead>
        <tbody>
          {habits.map(h => (
            <tr key={h.id}>
              <td>{h.title}</td>
              <td>{stats[h.id]?.current_streak ?? '—'}</td>
              <td>{stats[h.id]?.longest_streak ?? '—'}</td>
              <td>{stats[h.id]?.completed ?? 0}</td>
              <td>{stats[h.id]?.expected ?? 0}</td>
              <td>{stats[h.id]?.completion_pct ?? 0}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

