import AdminService from './admin.service.js';

class AdminController {
  static async createPharmacist(req, res, next) {
    try {
      const pharmacist = await AdminService.createPharmacist(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Pharmacist account created successfully',
        data: pharmacist,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllPharmacists(req, res, next) {
    try {
      const pharmacists = await AdminService.getAllPharmacists();
      res.status(200).json({
        status: 'success',
        data: pharmacists,
      });
    } catch (error) {
      next(error);
    }
  }

  static async togglePharmacistStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      const updated = await AdminService.togglePharmacistStatus(id, is_active);
      res.status(200).json({
        status: 'success',
        message: `Pharmacist account ${is_active ? 'activated' : 'deactivated'} successfully`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deletePharmacist(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      await AdminService.deletePharmacist(id, adminId);
      res.status(200).json({
        status: 'success',
        message: 'Pharmacist deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AdminController;
