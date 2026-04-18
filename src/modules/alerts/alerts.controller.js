import AlertsRepository from './alerts.repository.js';
import AlertFactory from '../../patterns/AlertFactory.js';

class AlertsController {
  static async getAlerts(req, res, next) {
    try {
      const medicines = await AlertsRepository.getMedicinesForAlerts();
      
      const allAlerts = {
        expired: [],
        critical: [],
        expiring_soon: [],
        out_of_stock: [],
        running_low: [],
      };

      medicines.forEach(medicine => {
        const alerts = AlertFactory.createAlerts(medicine);
        alerts.forEach(alert => {
          switch (alert.type) {
            case 'EXPIRED':
              allAlerts.expired.push(alert);
              break;
            case 'CRITICAL':
              allAlerts.critical.push(alert);
              break;
            case 'EXPIRING_SOON':
              allAlerts.expiring_soon.push(alert);
              break;
            case 'OUT_OF_STOCK':
              allAlerts.out_of_stock.push(alert);
              break;
            case 'RUNNING_LOW':
              allAlerts.running_low.push(alert);
              break;
          }
        });
      });

      res.status(200).json({
        status: 'success',
        data: allAlerts,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AlertsController;
