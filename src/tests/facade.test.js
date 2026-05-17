jest.mock('../modules/medicine/medicine.repository.js', () => ({
  __esModule: true,
  default: {
    create:   jest.fn(),
    findAll:  jest.fn(),
    count:    jest.fn(),
    findById: jest.fn(),
    update:   jest.fn(),
    delete:   jest.fn(),
  },
}));

import MedicineRepository from '../modules/medicine/medicine.repository.js';
import MedicineService    from '../modules/medicine/MedicineService.js';

// Shared fixtures
const fakeMedicine = {
  id:          1,
  name:        'Aspirin',
  quantity:    50,
  expiry_date: '2026-12-01',
  category:    'Painkiller',
};

describe('Facade Pattern — MedicineService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('3.1 createMedicine() merges created_by and calls repo.create', async () => {
    MedicineRepository.create.mockResolvedValue(fakeMedicine);

    const inputData = { name: 'Aspirin', quantity: 50, expiry_date: '2026-12-01', category: 'Painkiller' };
    const userId    = 42;
    const result    = await MedicineService.createMedicine(inputData, userId);

    // Facade must pass created_by merged into data
    expect(MedicineRepository.create).toHaveBeenCalledWith({ ...inputData, created_by: userId });
    expect(result).toEqual(fakeMedicine);
  });

  test('3.2 getMedicineById() returns the medicine when found', async () => {
    MedicineRepository.findById.mockResolvedValue(fakeMedicine);

    const result = await MedicineService.getMedicineById(1);

    expect(MedicineRepository.findById).toHaveBeenCalledWith(1);
    expect(result).toEqual(fakeMedicine);
  });

  test('3.3 getMedicineById() throws "Medicine not found" when repo returns undefined', async () => {
    MedicineRepository.findById.mockResolvedValue(undefined);

    // The facade adds this error guard — the repository itself just returns undefined
    await expect(MedicineService.getMedicineById(999)).rejects.toThrow('Medicine not found');
  });

  test('3.4 getAllMedicines() returns correct pagination metadata', async () => {
    MedicineRepository.findAll.mockResolvedValue(Array(10).fill(fakeMedicine));
    MedicineRepository.count.mockResolvedValue(25);

    const result = await MedicineService.getAllMedicines({ page: 2, limit: 10 });

    // Facade calculates pages = ceil(25 / 10) = 3
    expect(result.pagination).toEqual({
      total: 25,
      page:  2,
      limit: 10,
      pages: 3,
    });
    expect(result.medicines).toHaveLength(10);
  });

  test('3.5 getAllMedicines() uses default params safely when called with {}', async () => {
    MedicineRepository.findAll.mockResolvedValue([fakeMedicine]);
    MedicineRepository.count.mockResolvedValue(1);

    const result = await MedicineService.getAllMedicines({});

    // Default page=1, limit=10 → pages = ceil(1/10) = 1
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(10);
    expect(result.pagination.pages).toBe(1);
  });

  test('3.6 updateMedicine() merges partial update with existing medicine fields', async () => {
    MedicineRepository.findById.mockResolvedValue(fakeMedicine);
    MedicineRepository.update.mockResolvedValue({ ...fakeMedicine, quantity: 20 });

    // Only quantity is being updated — facade must preserve the rest from existing
    const result = await MedicineService.updateMedicine(1, { quantity: 20 });

    expect(MedicineRepository.update).toHaveBeenCalledWith(1, {
      name:        fakeMedicine.name,        
      quantity:    20,                       
      expiry_date: fakeMedicine.expiry_date, 
      category:    fakeMedicine.category,    
    });
    expect(result.quantity).toBe(20);
  });

  test('3.7 updateMedicine() throws "Medicine not found" when medicine does not exist', async () => {
    MedicineRepository.findById.mockResolvedValue(undefined);

    await expect(MedicineService.updateMedicine(999, { quantity: 5 })).rejects.toThrow('Medicine not found');

    // update must never be called if medicine doesn't exist
    expect(MedicineRepository.update).not.toHaveBeenCalled();
  });

  test('3.8 deleteMedicine() returns true when repo confirms deletion', async () => {
    MedicineRepository.delete.mockResolvedValue(true);

    const result = await MedicineService.deleteMedicine(1);

    expect(MedicineRepository.delete).toHaveBeenCalledWith(1);
    expect(result).toBe(true);
  });

  test('3.9 deleteMedicine() throws "Medicine not found" when repo returns falsy', async () => {
    MedicineRepository.delete.mockResolvedValue(false);

    await expect(MedicineService.deleteMedicine(999)).rejects.toThrow('Medicine not found');
  });
});
