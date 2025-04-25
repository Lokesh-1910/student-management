const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Lokesh@1910', // Enter your password if any
  database: 'student_management'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL!');
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Register route
app.post('/register', async (req, res) => {
  const { firstname, lastname, dob, gender, mobile, email, password, confirm_password } = req.body;

  if (password !== confirm_password) return res.send('Passwords do not match');

  // Check if mobile or email already exists
  db.query('SELECT * FROM users WHERE mobile = ? OR email = ?', [mobile, email], async (err, results) => {
    if (results.length > 0) {
      return res.send('Email or Mobile already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query('INSERT INTO users SET ?', {
      firstname, lastname, dob, gender, mobile, email, password: hashedPassword
    }, (err, result) => {
      if (err) throw err;
      res.sendFile(__dirname + '/public/success.html');


    });
  });
});

// Login route
app.post('/login', (req, res) => {
  const { emailOrMobile, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ? OR mobile = ?', [emailOrMobile, emailOrMobile], async (err, results) => {
    if (results.length === 0) return res.send('User not found');

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (match) {
      res.send(`
        <script>
          localStorage.setItem("user_id", ${user.id});
          window.location.href = '/welcome.html';
        </script>
      `);
    } else {
      res.send('Incorrect password');
    }
  });
});

// Profile route to fetch user data
app.get('/user-profile', (req, res) => {
  const userId = req.query.id;

  db.query('SELECT firstname, lastname, dob, gender, email, mobile FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) return res.status(500).send('Error fetching data');
    if (results.length === 0) return res.status(404).send('User not found');

    res.json(results[0]);
  });
});

// 📥 Upload 10th Marks
app.post('/upload10', (req, res) => {
  const { name, exam_no, tamil, english, maths, science, social_science, total, status, year } = req.body;

  db.query('INSERT INTO marks_10 SET ?', {
    name, exam_no, tamil, english, maths, science, social_science, total, status, year
  }, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.send('Exam Number already exists');
      return res.status(500).send('Database Error');
    }
    res.send(`<script>alert('10th Marks Uploaded Successfully'); window.location.href = '/welcome.html';</script>`);
  });
});

// POST route for uploading 11th marks
app.post('/upload11', (req, res) => {
  const {
    name, exam_no, group, total, year, status,
    subject1, mark1, subject2, mark2, subject3, mark3,
    subject4, mark4, subject5, mark5, subject6, mark6
  } = req.body;

  // Validate that all fields are provided
  if (!name || !exam_no || !group || !total || !year || !status || !subject1 || !subject2 || !subject3 || !subject4 || !subject5 || !subject6) {
    return res.status(400).send('All fields are required');
  }

  // Define the subject-group mapping
  let subjects = [];

  switch (group) {
    case 'BioMaths':
      subjects = [
        ['Tamil', req.body.tamil],
        ['English', req.body.english],
        ['Biology', req.body.biology],
        ['Maths', req.body.maths],
        ['Chemistry', req.body.chemistry],
        ['Physics', req.body.physics],
      ];
      break;
    case 'Science':
      subjects = [
        ['Tamil', req.body.tamil],
        ['English', req.body.english],
        ['Zoology', req.body.zoology],
        ['Botany', req.body.botany],
        ['Chemistry', req.body.chemistry],
        ['Physics', req.body.physics],
      ];
      break;
    case 'MathsComputer':
      subjects = [
        ['Tamil', req.body.tamil],
        ['English', req.body.english],
        ['Computer Science', req.body.cs],
        ['Maths', req.body.maths],
        ['Chemistry', req.body.chemistry],
        ['Physics', req.body.physics],
      ];
      break;
    case 'Commerce':
      subjects = [
        ['Tamil', req.body.tamil],
        ['English', req.body.english],
        ['Commerce', req.body.commerce],
        ['Accountancy', req.body.accountancy],
        ['Economics', req.body.economics],
        ['Business Maths', req.body.bm],
      ];
      break;
    case 'Vocational':
      subjects = [
        ['Tamil', req.body.tamil],
        ['English', req.body.english],
        ['Vocational Theory', req.body.voc_theory],
        ['Vocational Practical', req.body.voc_practical],
        ['Maths', req.body.maths],
        ['Physics', req.body.physics],
      ];
      break;
    default:
      return res.status(400).send('Invalid group selected.');
  }

  const sql = `
    INSERT INTO marks_11 (
      name, exam_no, group_name,
      subject1, mark1, subject2, mark2, subject3, mark3,
      subject4, mark4, subject5, mark5, subject6, mark6,
      total, year, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    name,
    exam_no,
    group,
    subject1, mark1,
    subject2, mark2,
    subject3, mark3,
    subject4, mark4,
    subject5, mark5,
    subject6, mark6,
    total,
    year,
    status
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting 11th marks:', err);
      return res.status(500).send('Error inserting marks into the database.');
    }
    res.sendFile(path.join(__dirname, 'path/to/success.html'));
  });
});



app.post('/upload12', (req, res) => {
  const {
    name, exam_no, group, total, year, status,
    subject1, mark1, subject2, mark2, subject3, mark3,
    subject4, mark4, subject5, mark5, subject6, mark6
  } = req.body;

  // Validate that all fields are provided
  if (!name || !exam_no || !group || !total || !year || !status || !subject1 || !subject2 || !subject3 || !subject4 || !subject5 || !subject6) {
    return res.status(400).send('All fields are required');
  }

  // Define the subject-group mapping
  let subjects = [];

  switch (group) {
    case 'BioMaths':
      subjects = [
        ['Tamil', req.body.tamil],
        ['English', req.body.english],
        ['Biology', req.body.biology],
        ['Maths', req.body.maths],
        ['Chemistry', req.body.chemistry],
        ['Physics', req.body.physics],
      ];
      break;
    case 'Science':
      subjects = [
        ['Tamil', req.body.tamil],
        ['English', req.body.english],
        ['Zoology', req.body.zoology],
        ['Botany', req.body.botany],
        ['Chemistry', req.body.chemistry],
        ['Physics', req.body.physics],
      ];
      break;
    case 'MathsComputer':
      subjects = [
        ['Tamil', req.body.tamil],
        ['English', req.body.english],
        ['Computer Science', req.body.cs],
        ['Maths', req.body.maths],
        ['Chemistry', req.body.chemistry],
        ['Physics', req.body.physics],
      ];
      break;
    case 'Commerce':
      subjects = [
        ['Tamil', req.body.tamil],
        ['English', req.body.english],
        ['Commerce', req.body.commerce],
        ['Accountancy', req.body.accountancy],
        ['Economics', req.body.economics],
        ['Business Maths', req.body.bm],
      ];
      break;
    case 'Vocational':
      subjects = [
        ['Tamil', req.body.tamil],
        ['English', req.body.english],
        ['Vocational Theory', req.body.voc_theory],
        ['Vocational Practical', req.body.voc_practical],
        ['Maths', req.body.maths],
        ['Physics', req.body.physics],
      ];
      break;
    default:
      return res.status(400).send('Invalid group selected.');
  }

  const sql = `
    INSERT INTO marks_12 (
      name, exam_no, group_name,
      subject1, mark1, subject2, mark2, subject3, mark3,
      subject4, mark4, subject5, mark5, subject6, mark6,
      total, year, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    name,
    exam_no,
    group,
    subject1, mark1,
    subject2, mark2,
    subject3, mark3,
    subject4, mark4,
    subject5, mark5,
    subject6, mark6,
    total,
    year,
    status
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting 12th marks:', err);
      return res.status(500).send('Error inserting marks into the database.');
    }
    res.sendFile(path.join(__dirname, 'path/to/success.html'));
  });
});




// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
