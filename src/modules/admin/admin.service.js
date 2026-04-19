import UserRepository from '../auth/user.repository.js';
import bcrypt from 'bcryptjs';

class AdminService {
  static async createPharmacist(userData) {
    const { name, username, password } = userData;
    
    const existingUser = await UserRepository.findByUsername(username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    return await UserRepository.create({
      name,
      username,
      password: hashedPassword,
      role: 'pharmacist',
    });
  }

  static async getAllPharmacists() {
    return await UserRepository.findAllByRole('pharmacist');
  }

  static async togglePharmacistStatus(id, isActive) {
    const user = await UserRepository.findById(id);
    if (!user || user.role !== 'pharmacist') {
      throw new Error('Pharmacist not found');
    }

    return await UserRepository.updateStatus(id, isActive);
  }

  static async deletePharmacist(id, adminId) {
    // Check if trying to delete yourself
    if (parseInt(id, 10) === adminId) {
      const error = new Error('Cannot delete your own account');
      error.status = 400;
      throw error;
    }

    // Find the user to delete
    const user = await UserRepository.findById(id);
    if (!user) {
      const error = new Error('Pharmacist not found');
      error.status = 404;
      throw error;
    }

    // Check if trying to delete an admin
    if (user.role === 'admin') {
      const error = new Error('Cannot delete admin accounts');
      error.status = 400;
      throw error;
    }

    return await UserRepository.delete(id);
  }
}

export default AdminService;
