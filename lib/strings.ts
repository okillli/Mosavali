export const STRINGS = {
  APP_NAME: 'მოსავალი',
  CURRENCY: '₾',
  UNIT_KG: 'კგ',
  UNIT_TON: 'ტ',
  
  // Navigation
  NAV_DASHBOARD: 'მთავარი',
  NAV_FIELDS: 'მიწები',
  NAV_WORKS: 'სამუშაოები',
  NAV_LOTS: 'მოსავალი',
  NAV_WAREHOUSES: 'საწყობები',
  NAV_SALES: 'გაყიდვები',
  NAV_EXPENSES: 'ხარჯები',
  NAV_REPORTS: 'რეპორტები',
  NAV_SETTINGS: 'პარამეტრები',
  
  // Auth
  LOGIN_TITLE: 'შესვლა',
  EMAIL: 'ელფოსტა',
  PASSWORD: 'პაროლი',
  LOGIN_BUTTON: 'შესვლა',
  LOGOUT: 'გამოსვლა',
  AUTH_ERROR: 'ელფოსტა ან პაროლი არასწორია.',
  
  // Common Actions
  ADD: 'დამატება',
  SAVE: 'შენახვა',
  CANCEL: 'გაუქმება',
  DELETE: 'წაშლა',
  EDIT: 'რედაქტირება',
  SEARCH: 'ძებნა',
  FILTER: 'ფილტრი',
  
  // Fields
  FIELD_NAME: 'სახელი',
  FIELD_AREA: 'ფართობი (ჰა)',
  FIELD_OWNERSHIP: 'სტატუსი',
  OWNED: 'საკუთარი',
  RENTED: 'ნაქირავები',
  
  // Works
  WORK_TYPE: 'სამუშაოს ტიპი',
  STATUS: 'სტატუსი',
  PLANNED: 'დაგეგმილი',
  COMPLETED: 'შესრულებული',
  PLANNED_DATE: 'დაგეგმილი თარიღი',
  COMPLETED_DATE: 'შესრულების თარიღი',
  
  // Lots
  LOT_CODE: 'მოსავლის კოდი',
  HARVEST_DATE: 'მოსავლის თარიღი',
  HARVEST_WEIGHT: 'მოსავლის წონა (კგ)',
  SEASON: 'სეზონი',
  CROP: 'კულტურა',
  VARIETY: 'ჯიში',
  RECEIVE_INTO_WAREHOUSE: 'მიღება საწყობში',
  
  // Warehouses
  WAREHOUSE_NAME: 'საწყობის სახელი',
  BIN_NAME: 'სექციის სახელი',
  ACTIVE_LOT: 'აქტიური მოსავალი',
  STOCK: 'მარაგი',
  TRANSFER: 'გადატანა',
  ADJUSTMENT: 'კორექცია',
  FROM: 'საიდან',
  TO: 'სად',
  
  // Sales
  PRICE_PER_KG: 'ფასი / კგ (₾)',
  TOTAL: 'ჯამი',
  BUYER: 'მყიდველი',
  PAYMENT_STATUS: 'გადახდის სტატუსი',
  UNPAID: 'გადაუხდელი',
  PART_PAID: 'ნაწილობრივ გადახდილი',
  PAID: 'გადახდილი',
  ADD_PAYMENT: 'გადახდის დამატება',
  
  // Validation Messages
  REQUIRED_FIELD: 'სავალდებულო ველი',
  INVALID_VALUE: 'არასწორი მნიშვნელობა',
  NO_MIXING_ERROR: 'ეს სექცია უკვე შეიცავს სხვა ლოტს. შერევა აკრძალულია.',
  NEGATIVE_STOCK_ERROR: 'მარაგი არასაკმარისია.',
  SAVED_SUCCESS: 'წარმატებით შეინახა',
  DELETED_SUCCESS: 'წარმატებით წაიშალა',
  DELETE_ERROR: 'წაშლა ვერ მოხერხდა',
  SAVE_ERROR: 'შენახვა ვერ მოხერხდა',
  LOAD_ERROR: 'მონაცემების ჩატვირთვა ვერ მოხერხდა',

  // Delete Confirmation
  DELETE_CONFIRM_TITLE: 'წაშლის დადასტურება',
  DELETE_FIELD_CONFIRM: 'წაშალოთ მიწა',
  DELETE_LOT_CONFIRM: 'წაშალოთ მოსავალი',
  DELETE_WAREHOUSE_CONFIRM: 'წაშალოთ საწყობი',
  DELETE_BIN_CONFIRM: 'წაშალოთ სექცია',
  DELETE_SALE_CONFIRM: 'წაშალოთ გაყიდვა',
  DELETE_WORK_CONFIRM: 'წაშალოთ სამუშაო',
  DELETE_EXPENSE_CONFIRM: 'წაშალოთ ხარჯი',
  DELETE_BUYER_CONFIRM: 'წაშალოთ მყიდველი',
  DELETE_SEASON_CONFIRM: 'წაშალოთ სეზონი',
  DELETE_VARIETY_CONFIRM: 'წაშალოთ ჯიში',
  DELETE_WARNING_RELATED: 'ეს ჩანაწერი დაკავშირებულია სხვა მონაცემებთან.',
  DELETE_CANNOT_UNDO: 'ეს მოქმედება ვეღარ შეიცვლება.',

  // Related data warnings
  FIELD_HAS_LOTS: 'ამ მიწას აქვს მოსავალი',
  FIELD_HAS_WORKS: 'ამ მიწას აქვს სამუშაოები',
  WAREHOUSE_HAS_STOCK: 'ამ საწყობში არის მარაგი',
  LOT_HAS_STOCK: 'ამ მოსავალს აქვს მარაგი',
  LOT_HAS_SALES: 'ამ მოსავალს აქვს გაყიდვები',
  BUYER_HAS_SALES: 'ამ მყიდველს აქვს გაყიდვები',
  SEASON_HAS_DATA: 'ამ სეზონს აქვს მონაცემები',
  
  // Placeholders
  SELECT_OPTION: 'აირჩიეთ...',
  NOTES: 'შენიშვნა',
  
  // Reports
  REPORT_STOCK: 'მიმდინარე მარაგი',
  REPORT_PNL: 'მოგება/ზარალი',
  REPORT_OUTSTANDING: 'დაუფარავი გადახდები',
  REPORT_YIELD: 'მოსავლიანობა',

  // Expenses linked to works
  LINKED_EXPENSES: 'დაკავშირებული ხარჯები',
  ADD_EXPENSE_TO_WORK: 'ხარჯის დამატება',
  TOTAL_EXPENSES: 'სულ ხარჯები',
  NO_LINKED_EXPENSES: 'ხარჯები არ არის',
  EXPENSE_AMOUNT: 'თანხა',
  EXPENSE_DATE: 'თარიღი',
};
