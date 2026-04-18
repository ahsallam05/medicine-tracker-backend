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
}

export default AdminService;
