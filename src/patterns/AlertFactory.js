/*
  DESIGN PATTERN: FACTORY METHOD

  Purpose: Define an interface for creating objects, but let subclasses decide
  which class to instantiate. In our case, AlertFactory decides which specific
  alert type (Expired, Critical, etc.) to create based on a medicine's data.

  How it works:
  - AlertFactory.createAlerts(medicine) returns an array of alert objects
  - Each alert object has a consistent interface (type, severity, message)
  - New alert types can be added without changing the core business logic
*/

class Alert {
  constructor(medicine, type, severity, message) {
    this.medicine_id = medicine.id;
    this.medicine_name = medicine.name;
    this.type = type;
    this.severity = severity;
    this.message = message;
    this.quantity = medicine.quantity;
    this.expiry_date = medicine.expiry_date;
  }
}

class ExpiredAlert extends Alert {
  constructor(medicine) {
    super(medicine, 'EXPIRED', 'HIGH', `Medicine "${medicine.name}" has expired!`);
  }
}

class CriticalAlert extends Alert {
  constructor(medicine) {
    super(medicine, 'CRITICAL', 'HIGH', `Medicine "${medicine.name}" expires in less than 7 days!`);
  }
}

class ExpiringSoonAlert extends Alert {
  constructor(medicine) {
    super(medicine, 'EXPIRING_SOON', 'MEDIUM', `Medicine "${medicine.name}" expires within 30 days.`);
  }
}

class OutOfStockAlert extends Alert {
  constructor(medicine) {
    super(medicine, 'OUT_OF_STOCK', 'HIGH', `Medicine "${medicine.name}" is out of stock!`);
  }
}

class RunningLowAlert extends Alert {
  constructor(medicine) {
    super(medicine, 'RUNNING_LOW', 'MEDIUM', `Medicine "${medicine.name}" stock is low (${medicine.quantity} left).`);
  }
}

class AlertFactory {
  static createAlerts(medicine) {
    const alerts = [];
    const today = new Date();
    const expiryDate = new Date(medicine.expiry_date);
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Expiry Alerts
    if (diffDays < 0) {
      alerts.push(new ExpiredAlert(medicine));
    } else if (diffDays <= 7) {
      alerts.push(new CriticalAlert(medicine));
    } else if (diffDays <= 30) {
      alerts.push(new ExpiringSoonAlert(medicine));
    }

    // Stock Alerts
    if (medicine.quantity === 0) {
      alerts.push(new OutOfStockAlert(medicine));
    } else if (medicine.quantity <= 10) {
      alerts.push(new RunningLowAlert(medicine));
    }

    return alerts;
  }
}

export default AlertFactory;
export {
  ExpiredAlert,
  CriticalAlert,
  ExpiringSoonAlert,
  OutOfStockAlert,
  RunningLowAlert
};
