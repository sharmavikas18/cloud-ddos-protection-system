const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const UserModel = require('../models/userModel');

class AuthController {
  static async register(req, res) {
    try {
      const { name, email, password, role = 'user' } = req.body;

      // Validation
      if (!name || !email || !password) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'name, email, and password are required fields'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Password must be at least 6 characters'
        });
      }

      // Check existing
      const existing = UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = UserModel.create({
        name,
        email,
        passwordHash,
        role: ['admin', 'analyst'].includes(role) ? role : 'user'
      });

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user
      });
    } catch (err) {
      console.error('[AUTH ERROR]', err);
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'email and password are required'
        });
      }

      const user = UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password'
        });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
      console.error('[LOGIN ERROR]', err);
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  static getProfile(req, res) {
    res.json({
      user: req.user
    });
  }
}

module.exports = AuthController;
