/*
  DESIGN PATTERN: FACADE

  Purpose: Provide a single, simplified interface for all medicine-related operations.
  Controllers should not need to know about repositories, pagination logic, or complex filtering.
  They just call methods on the MedicineService facade.

  How it works:
  - MedicineService combines operations from repositories.
  - It handles common tasks like formatting responses and calculating pagination metadata.
  - It acts as a gateway for the medicine module.
*/

import MedicineRepository from './medicine.repository.js';

class MedicineService {
  static async createMedicine(medicineData, userId) {
    const data = { ...medicineData, created_by: userId };
    return await MedicineRepository.create(data);
  }

  static async getAllMedicines(queryParams) {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      status = '', // 'expired', 'active'
    } = queryParams;

    const offset = (page - 1) * limit;

    const [medicines, total] = await Promise.all([
      MedicineRepository.findAll({ search, category, status, limit, offset }),
      MedicineRepository.count({ search, category, status }),
    ]);

    return {
      medicines,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async getMedicineById(id) {
    const medicine = await MedicineRepository.findById(id);
    if (!medicine) {
      throw new Error('Medicine not found');
    }
    return medicine;
  }

  static async updateMedicine(id, medicineData) {
    const existing = await MedicineRepository.findById(id);
    if (!existing) {
      throw new Error('Medicine not found');
    }
    
    // Merge existing data with new data
    const updatedData = {
      name: medicineData.name !== undefined ? medicineData.name : existing.name,
      quantity: medicineData.quantity !== undefined ? medicineData.quantity : existing.quantity,
      expiry_date: medicineData.expiry_date !== undefined ? medicineData.expiry_date : existing.expiry_date,
      category: medicineData.category !== undefined ? medicineData.category : existing.category,
    };
    
    return await MedicineRepository.update(id, updatedData);
  }

  static async deleteMedicine(id) {
    const deleted = await MedicineRepository.delete(id);
    if (!deleted) {
      throw new Error('Medicine not found');
    }
    return true;
  }
}

export default MedicineService;
