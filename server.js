const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());


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

// API endpoint to get user profile
app.get('/api/user-profile', (req, res) => {
  const userId = req.query.id || 1; // Default to user ID 1 if not specified
  
  const query = `
    SELECT 
      id, firstname, lastname, email, 
      DATE_FORMAT(dob, '%Y-%m-%d') as dob, 
      gender, mobile, address, hobby, skills, interest
    FROM users 
    WHERE id = ?
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user profile:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = results[0];
    
    // Format the response
    const response = {
      firstname: user.firstname,
      lastname: user.lastname,
      fullname: `${user.firstname} ${user.lastname}`,
      dob: user.dob,
      gender: user.gender,
      email: user.email,
      mobile: user.mobile || 'Not provided',
      address: user.address || 'Not provided',
      interest: user.interest || 'Not provided',
      hobby: user.hobby || 'Not provided',
      skills: user.skills || 'Not provided'
    };
    
    res.json(response);
  });
});

// Serve the profile page
app.get('/profile', (req, res) => {
  res.sendFile(__dirname + '/profile.html');
});

// Add this to your existing server.js

// API endpoint to update user profile
app.post('/api/update-profile', (req, res) => {
  const userId = req.query.id;
  const {
    firstname = '',
    lastname = '',
    email = '',
    mobile = '',
    dob = null,
    gender = '',
    address = '',
    hobby = '',
    skills = '',
    interest = ''
  } = req.body;

  if (!firstname || !lastname || !email) {
    return res.status(400).json({ error: 'First name, last name, and email are required' });
  }

  const query = `
    UPDATE users 
    SET 
      firstname = ?,
      lastname = ?,
      email = ?,
      mobile = ?,
      dob = ?,
      gender = ?,
      address = ?,
      hobby = ?,
      skills = ?,
      interest = ?
    WHERE id = ?
  `;

  db.query(query, [
    firstname,
    lastname,
    email,
    mobile,
    dob,
    gender,
    address,
    hobby,
    skills,
    interest,
    userId
  ], (err, results) => {
    if (err) {
      console.error('Error updating user profile:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: 'Profile updated successfully' });
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
    res.sendFile(__dirname + '/public/uploadsuccess.html');
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
    res.sendFile(__dirname + '/public/uploadsuccess.html');
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
    res.sendFile(__dirname + '/public/uploadsuccess.html');
  });
});

// API endpoint to upload CIE 1 marks
app.post('/api/upload-cie1', (req, res) => {
  console.log('Incoming body:', req.body);

  const { name, reg_no, paper_count, subjects, marks } = req.body;

  // Check all marks are valid (0-50)
  for (const mark of marks) {
    if (mark < 0 || mark > 50) {
      return res.status(400).json({ success: false, message: 'Marks must be between 0-50' });
    }
  }

  // Prepare data for database
  const cieData = {
    student_name: name,
    register_number: reg_no,
    subject_count: paper_count,
    subjects: JSON.stringify(subjects),
    marks: JSON.stringify(marks)
  };

  // Insert into database
  const query = `
    INSERT INTO sem1_cie1 
    (student_name, register_number, subject_count, subjects, marks)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(query, [
    cieData.student_name,
    cieData.register_number,
    cieData.subject_count,
    cieData.subjects,
    cieData.marks
  ], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    res.json({ 
      success: true,
      message: 'CIE 1 marks uploaded successfully',
      record_id: results.insertId
    });
  });
});

app.post('/api/upload-cie2', (req, res) => {
  console.log('Incoming body:', req.body);

  const { name, reg_no, paper_count, subjects, marks } = req.body;

  // Check all marks are valid (0-50)
  for (const mark of marks) {
    if (mark < 0 || mark > 50) {
      return res.status(400).json({ success: false, message: 'Marks must be between 0-50' });
    }
  }

  // Prepare data for database
  const cieData = {
    student_name: name,
    register_number: reg_no,
    subject_count: paper_count,
    subjects: JSON.stringify(subjects),
    marks: JSON.stringify(marks)
  };

  // Insert into database
  const query = `
    INSERT INTO sem1_cie2 
    (student_name, register_number, subject_count, subjects, marks)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(query, [
    cieData.student_name,
    cieData.register_number,
    cieData.subject_count,
    cieData.subjects,
    cieData.marks
  ], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    res.json({ 
      success: true,
      message: 'CIE 2 marks uploaded successfully',
      record_id: results.insertId
    });
  });
});

app.post('/api/upload-cie3', (req, res) => {
  console.log('Incoming body:', req.body);

  const { name, reg_no, paper_count, subjects, marks } = req.body;

  // Check all marks are valid (0-50)
  for (const mark of marks) {
    if (mark < 0 || mark > 50) {
      return res.status(400).json({ success: false, message: 'Marks must be between 0-50' });
    }
  }

  // Prepare data for database
  const cieData = {
    student_name: name,
    register_number: reg_no,
    subject_count: paper_count,
    subjects: JSON.stringify(subjects),
    marks: JSON.stringify(marks)
  };

  // Insert into database
  const query = `
    INSERT INTO sem1_cie3 
    (student_name, register_number, subject_count, subjects, marks)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(query, [
    cieData.student_name,
    cieData.register_number,
    cieData.subject_count,
    cieData.subjects,
    cieData.marks
  ], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    res.json({ 
      success: true,
      message: 'CIE 3 marks uploaded successfully',
      record_id: results.insertId
    });
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
