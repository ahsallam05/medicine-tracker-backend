import MedicineService from './MedicineService.js';

class MedicineController {
  static async create(req, res, next) {
    try {
      const medicine = await MedicineService.createMedicine(req.body, req.user.id);
      res.status(201).json({
        status: 'success',
        message: 'Medicine created successfully',
        data: medicine,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const result = await MedicineService.getAllMedicines(req.query);
      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const medicine = await MedicineService.getMedicineById(req.params.id);
      res.status(200).json({
        status: 'success',
        data: medicine,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const medicine = await MedicineService.updateMedicine(req.params.id, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Medicine updated successfully',
        data: medicine,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      await MedicineService.deleteMedicine(req.params.id);
      res.status(200).json({
        status: 'success',
        message: 'Medicine deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default MedicineController;
