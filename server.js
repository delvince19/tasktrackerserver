    const express = require('express');
    const mysql = require('mysql');
    const cors = require('cors');

    const app = express();
    app.use(cors());
    app.use(express.json()); // Middleware to parse JSON requests

    const db = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'db_tasks'
    });

    db.connect((err) => {
        if (err) {
            console.error('Error connecting to database:', err);
            return;
        }
        console.log('Connected to the database');
    });

    app.get('/', (req, res) => {
        return res.json("From Backend Side");
    });

    app.get('/tasklist', (req, res) => {
        const { student_id } = req.query; // Extract student_id from query parameters
        const sql = "SELECT tbl_tasklist.*, tbl_users.firstname, tbl_users.lastname FROM tbl_tasklist INNER JOIN tbl_users ON tbl_tasklist.student_id = tbl_users.student_id WHERE tbl_tasklist.student_id = ?";
        db.query(sql, [student_id], (err, data) => {
            if(err) return res.json(err);
            return res.json(data);
        });
    });    



    app.get('/tbl_tasklist/:id', (req, res) => {
        const { id } = req.params;
        const sql = "SELECT tbl_tasklist.*, tbl_users.firstname, tbl_users.lastname FROM tbl_tasklist INNER JOIN tbl_users ON tbl_tasklist.student_id = tbl_users.student_id WHERE tbl_tasklist.id = ?";
        db.query(sql, [id], (err, data) => {
            if(err) return res.json(err);
            return res.json(data);
        });
    });
        


    app.post('/add_task', (req, res) => {
        const { student_id, task_course, task_name, deadline } = req.body; 
        const query = "INSERT INTO `tbl_tasklist`(`student_id`, `task_course`, `task_name`, `deadline`) VALUES (?, ?, ?, ?)"; 
        db.query(query, [student_id, task_course, task_name, deadline], (err, result) => {
            if (err) {
                console.error('Error adding task:', err);
                return res.json({ success: false, error: err.message });
            }
            return res.json({ success: true });
        });
    });
    

    
    app.put('/update_task/:id', (req, res) => {
        const { id } = req.params;
        const { task_name, task_course, priority, deadline } = req.body;
        const query = "UPDATE `tbl_tasklist` SET `task_name`=?, `task_course`=?, `priority`=?, `deadline`=? WHERE `id`=?";
        db.query(query, [task_name, task_course, priority, deadline, id], (err, result) => {
            if (err) {
                console.error('Error updating task:', err);
                return res.json({ success: false, error: err.message });
            }
            return res.json({ success: true });
        });
    });

    app.patch('/update_task/:id', (req, res) => {
        const { id } = req.params;
        const { mark_as_done } = req.body;
    
        const query = "UPDATE `tbl_tasklist` SET `mark_as_done`=? WHERE `id`=?";
        db.query(query, [mark_as_done, id], (err, result) => {
            if (err) {
                console.error('Error updating task status:', err);
                return res.json({ success: false, error: err.message });
            }
            return res.json({ success: true });
        });
    });
    
    
    

    // Endpoint to handle task deletion
    app.post('/delete_task', (req, res) => {
        const id = req.body.id; // Extract id from request body
        const query = "DELETE FROM `tbl_tasklist` WHERE id = ?";
        db.query(query, [id], (err, result) => {
            if (err) {
                console.error('Error deleting task:', err);
                return res.json({ success: false, error: err.message });
            }
            return res.json({ success: true });
        });
    });

    const isGoogleAccount = (email) => {
        return email.endsWith('@gmail.com');
    };
    
    app.post('/register', (req, res) => {
        const { student_id, password, repassword, firstname, middlename, lastname, email, profile_picture } = req.body;
    
        // Check if the email exists as a Google account
        if (!isGoogleAccount(email)) {
            return res.status(400).json({ error: 'Please use a Google account email for registration.' });
        }
    
        const checkIdQuery = `SELECT * FROM tbl_users WHERE student_id = ?`;
        db.query(checkIdQuery, [student_id], (err, result) => {
            if (err) {
                console.error('Error checking student ID:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (result.length > 0) {
                return res.status(400).json({ error: 'This ID already exists' });
            }
    
            if (password !== repassword) {
                return res.status(400).json({ error: 'Password does not match' });
            }
    
            const image = 'img/pfp.jpg';
            const insertQuery = `INSERT INTO tbl_users (student_id, password, firstname, middlename, lastname, email, profile_picture) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            db.query(insertQuery, [student_id, password, firstname, middlename, lastname, email, 'img/pfp.jpg'], (err, result) => {
                if (err) {
                    console.error('Error registering user:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                return res.status(200).json({ message: 'Registration Successful!' });
            });
            
        });
    });

    app.post('/login', (req, res) => {
        const { student_id, password } = req.body;
    
        const loginQuery = `SELECT student_id, firstname, middlename, lastname FROM tbl_users WHERE student_id = ? AND password = ? LIMIT 1`;
        db.query(loginQuery, [student_id, password], (err, result) => {
        if (err) {
            console.error('Error during login:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    
        if (result.length === 1) {
            const user = result[0];
            // Set session variables or JWT token for authentication
            // For simplicity, you can return user data here
            return res.status(200).json({ user });
        } else {
            return res.status(401).json({ error: 'Invalid Username/Password' });
        }
        });
    });
    

    app.listen(8081, () => {
        console.log("Server listening on port 8081");
    });

