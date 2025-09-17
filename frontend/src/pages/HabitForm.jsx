import React, {useState} from 'react'
import api from '../api'
import { useNavigate } from 'react-router-dom'

export default function HabitForm(){
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [start, setStart] = useState(new Date().toISOString().slice(0,10));
  const [freq, setFreq] = useState('daily');
  const navigate = useNavigate();

  async function submit(e){
    e.preventDefault();
    try{
      await api.post('/habits', {title,description: desc,start_date: start,frequency: freq,category_id: category || null});
      navigate('/');
    }catch(err){ alert('Error: '+ (err?.response?.data?.error || err.message)) }
  }

  return (
    <div>
      <h2>Add Habit</h2>
      <form onSubmit={submit}>
        <div><label>Title<br/><input value={title} onChange={e=>setTitle(e.target.value)} required /></label></div>
        <div><label>Description<br/><input value={desc} onChange={e=>setDesc(e.target.value)} /></label></div>
        <div><label>Start date<br/><input type="date" value={start} onChange={e=>setStart(e.target.value)} required /></label></div>
        <div><label>Frequency<br/>
          <select value={freq} onChange={e=>setFreq(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        <div>
          <select value={category} onChange={e=>setCategory(e.target.value)} required>
            <option value="">Select Category</option>
            <option value="1">Health</option>
            <option value="2">Learning</option>
            <option value="3">Productivity</option>
          </select>
        </div>

        </label></div>
        <div style={{marginTop:8}}>
          <button type="submit">Create</button>
        </div>
      </form>
    </div>
  )
}
