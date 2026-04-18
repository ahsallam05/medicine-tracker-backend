/*
  Auth Service

  Contains all business logic for authentication:
  - Password hashing and comparison (bcrypt)
  - JWT token generation
  - User lookup and validation

  The controller delegates all logic to this service.
  The service does NOT touch Express (no req/res).
*/

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import UserRepository from './user.repository.js';

class AuthService {
  static async login(username, password) {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    const user = await UserRepository.findByUsername(username);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
      },
    };
  }
}

export default AuthService;
