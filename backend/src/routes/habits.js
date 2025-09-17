const express = require('express');
const pool = require('../db');
const router = express.Router();

// helper to run queries
async function query(sql, params) {
  const [rows] = await pool.query(sql, params || []);
  return rows;
}

// GET /api/habits
// GET /api/habits?q=meditation&status=completed&category=Health
router.get('/', async (req, res) => {
  const { q, status, category } = req.query;

  let sql = `
    SELECT h.*, c.name as category_name,
      EXISTS(
        SELECT 1 FROM completions comp
        WHERE comp.habit_id = h.id AND comp.date = CURDATE()
      ) as is_completed_today
    FROM habits h
    LEFT JOIN categories c ON h.category_id = c.id
    WHERE 1=1
  `;
  let params = [];

  // Keyword search
  if (q) {
    sql += " AND (h.title LIKE ? OR h.description LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }

  // Category filter
  if (category) {
    sql += " AND c.name = ?";
    params.push(category);
  }

  sql += " ORDER BY h.id DESC";

  try {
    let rows = await query(sql, params);

    // Status filter (done today or not)
    if (status === 'completed') {
      rows = rows.filter(r => r.is_completed_today === 1);
    } else if (status === 'pending') {
      rows = rows.filter(r => r.is_completed_today === 0);
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST /api/habits
router.post('/', async (req, res) => {
  const { title, description, start_date, frequency, category_id } = req.body;
  if (!title || !start_date) return res.status(400).json({ error: 'title and start_date required' });
  try {
    const result = await query(
      `INSERT INTO habits (title, description, start_date, frequency, category_id)
       VALUES (?, ?, ?, ?, ?)`,
      [title, description || null, start_date, frequency || 'daily', category_id || null]
    );
    const rows = await query('SELECT * FROM habits WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/habits/:id
// UPDATE a habit
// PUT /api/habits/:id
router.put('/:id', async (req, res) => {
  const { title, description, start_date, frequency, category_id } = req.body;
  const { id } = req.params;

  try {
    await query(
      `UPDATE habits 
       SET title=?, description=?, start_date=?, frequency=?, category_id=?, updated_at=NOW() 
       WHERE id=?`,
      [title, description || null, start_date, frequency || 'daily', category_id || null, id]
    );

    const rows = await query('SELECT * FROM habits WHERE id=?', [id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// DELETE /api/habits/:id
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await query('DELETE FROM habits WHERE id=?', [id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

function calculateStreak(dates) {
  if (!dates || dates.length === 0) return 0;

  let streak = 1;
  let maxStreak = 1;
  let prevDate = new Date(dates[0].date);

  for (let i = 1; i < dates.length; i++) {
    const currDate = new Date(dates[i].date);
    const diff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak++;
    } else if (diff > 1) {
      streak = 1;
    }
    if (streak > maxStreak) maxStreak = streak;
    prevDate = currDate;
  }

  return streak;
}

// POST /api/habits/:id/complete  { date: 'YYYY-MM-DD' } default today
// Mark completion (supports past dates too)
// Mark completion (with streak calculation)
router.post('/:id/complete', async (req, res) => {
  // let { date } = req.body;
  // if (!date) {
  //   date = new Date().toISOString().slice(0, 10); // today
  // }

  let { date } = req.body;
  if (!date) {
    const today = new Date();
    date = today.toLocaleDateString('en-CA'); // reset to midnight local
  }

  try {
    // Insert completion (ignore duplicates)
    await query(
      `INSERT INTO completions (habit_id, date) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE habit_id = habit_id`,
      [req.params.id, date]
    );

    // Fetch all completion dates sorted
    const rows = await query(
      'SELECT date FROM completions WHERE habit_id=? ORDER BY date ASC',
      [req.params.id]
    );

    // Calculate streak
    let streak = 0;
    let maxStreak = 0;
    let prevDate = null;

    rows.forEach(r => {
      const currDate = new Date(r.date);
      if (prevDate) {
        const diff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          streak++;
        } else if (diff > 1) {
          streak = 1; // reset streak
        }
      } else {
        streak = 1; // first completion
      }
      prevDate = currDate;
      if (streak > maxStreak) maxStreak = streak;
    });

    res.json({
      success: true,
      date,
      streak,
      completions: rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// GET /api/habits/:id/completions
router.get('/:id/completions', async (req, res) => {
  const id = req.params.id;
  try {
    const rows = await query(
      'SELECT DATE(date) as date FROM completions WHERE habit_id=? ORDER BY date ASC',
      [id]
    );
    res.json(rows.map(r => r.date));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




/*
 Analytics:
 - /:id/stats?from=YYYY-MM-DD&to=YYYY-MM-DD
 returns {
   current_streak,
   longest_streak,
   completed,
   expected,
   completion_pct
 }
*/
router.get('/:id/stats', async (req, res) => {
  const id = req.params.id;
  const from = req.query.from;
  const to = req.query.to;

  try {
    // Get habit
    const habitRows = await query('SELECT * FROM habits WHERE id=?', [id]);
    if (!habitRows.length) return res.status(404).json({ error: 'Habit not found' });
    const habit = habitRows[0];

    // Get completions between from and to
    const compRows = await query(
      'SELECT date FROM completions WHERE habit_id=? AND date BETWEEN ? AND ? ORDER BY date ASC',
      [id, from || '1900-01-01', to || new Date().toISOString().slice(0,10)]
    );
    const dates = compRows.map(r => r.date);

    // Compute expected occurrences between from and to
    const start = from ? new Date(from) : new Date(habit.start_date);
    const end = to ? new Date(to) : new Date();
    const s = new Date(Math.max(start, new Date(habit.start_date)));
    const e = end;

    function daysDiff(a,b){ return Math.floor((b - a)/(24*3600*1000)); }

    let expected = 0;
    if (s <= e) {
      if (habit.frequency === 'daily') {
        expected = daysDiff(s, e) + 1;
      } else if (habit.frequency === 'weekly') {
        expected = Math.floor(daysDiff(s, e) / 7) + 1;
      }
    }

    // Get all completions (for streaks)
    const allComps = (await query(
      'SELECT date FROM completions WHERE habit_id=? ORDER BY date ASC',
      [id]
    )).map(r => r.date);

    // 🔥 Current streak (consecutive days ending today)
    let current_streak = 0;
    if (allComps.length > 0) {
      // Start from the latest completion
      let cursor = new Date(allComps[allComps.length - 1]);
      const set = new Set(allComps.map(d => d.toISOString ? d.toISOString().slice(0,10) : d));

      while (set.has(cursor.toISOString().slice(0,10))) {
        current_streak++;
        cursor.setDate(cursor.getDate() - 1);
      }
    }

    // 🏆 Longest streak
    let longest = 0;
    let streak = 0;
    let prev = null;
    for (const d of allComps) {
      if (!prev) {
        streak = 1;
      } else {
        const prevDate = new Date(prev);
        const curDate = new Date(d);
        const diff = Math.round((curDate - prevDate)/(24*3600*1000));
        if (diff === 1) streak++;
        else streak = 1;
      }
      if (streak > longest) longest = streak;
      prev = d;
    }

    const completed = dates.length;
    const completion_pct = expected === 0 ? 0 : Math.round((completed/expected)*10000)/100;

    res.json({
      current_streak,
      longest_streak: longest,
      completed,
      expected,
      completion_pct
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
