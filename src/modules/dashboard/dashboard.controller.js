import DashboardRepository from './dashboard.repository.js';

class DashboardController {
  static async getDashboardStats(req, res, next) {
    try {
      const stats = await DashboardRepository.getStats();
      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default DashboardController;
