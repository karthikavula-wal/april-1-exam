const bcrypt = require('bcrypt');
var express = require('express');
const jwt = require('jsonwebtoken');
var router = express.Router();
const connector = require('../poolconnect');
let salt = bcrypt.genSaltSync(10);

router.get('/createtable', function (req, res) {
    connector.query(
        'CREATE TABLE users (id int AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) , password VARCHAR(100));',
        function (err, results) {
            res.json({ err, results });
        }
    );
});

router.get('/', function (req, res) {
    connector.query('SELECT * FROM users', function (err, results) {
        res.json({ err, results });
    });
});

router.post('/register', (req, res) => {
    const { username, password } = req.body;
    let encryptedPassword;
    try {
        encryptedPassword = bcrypt.hashSync(password, salt);
        console.log(encryptedPassword);
    } catch (error) {
        console.log('Error in bcrypt');
    }
    const sql = 'INSERT INTO users(username, password) VALUES(?,?)';
    connector.query(sql, [username, encryptedPassword], (error, result) => {
        res.json({ error, result });
    });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users';
    connector.query(sql, (error, result) => {
        result.forEach((user) => {
            console.log(user);
            if (user.username !== username) {
                res.json({ status: 0, debug_data: "username doesn't exist" });
            }
            const passCorrect = bcrypt.compareSync(password, user.password);
            console.log(passCorrect);
            if (!passCorrect) {
                res.json({ status: 0, debug_data: 'Password is wrong' });
            }
        });
        const payload = {
            user: {
                username: username,
            },
        };
        jwt.sign(
            payload,
            'secret_string',
            {
                expiresIn: 1200,
            },
            (err, token) => {
                if (err) {
                    throw error;
                    res.json({
                        status: 0,
                        debug_data: 'Backend Error',
                    });
                }
                res.status(200).json({
                    token,
                });
            }
        );
    });
});

module.exports = router;
