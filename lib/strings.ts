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
  BIN_HAS_STOCK: 'სექციას აქვს მარაგი - წაშლა შეუძლებელია',
  VARIETY_HAS_LOTS: 'ამ ჯიშს აქვს მოსავალი',
  WORK_HAS_EXPENSES: 'ამ სამუშაოს აქვს დაკავშირებული ხარჯი',

  // Loading states
  LOADING: 'იტვირთება...',
  NOT_FOUND: 'ჩანაწერი ვერ მოიძებნა',

  // Season specific
  SET_AS_CURRENT: 'მიმდინარედ მონიშვნა',
  CURRENT_SEASON_DELETE_DISABLED: 'მიმდინარე სეზონის წაშლა შეუძლებელია',
  SEASON_HAS_RELATED_RECORDS: 'ამ სეზონს აქვს დაკავშირებული ჩანაწერები',

  // Lot deletion
  LOT_DELETE_DISABLED: 'მოსავალს აქვს გაყიდვები - წაშლა შეუძლებელია',

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

  // Dropdown states
  DROPDOWN_LOADING: 'იტვირთება...',
  DROPDOWN_ERROR: 'შეცდომა მოხდა',
  DROPDOWN_NO_DATA: 'მონაცემები არ მოიძებნა',
  DROPDOWN_NO_RESULTS: 'შედეგი არ მოიძებნა',
  DROPDOWN_CLEAR: 'გასუფთავება',
  DROPDOWN_CREATE: 'შექმნა',
  DROPDOWN_CREATE_NEW: 'ახლის შექმნა',

  // Page titles
  PAGE_BUYERS: 'მყიდველები',
  PAGE_SEASONS: 'სეზონები',
  PAGE_VARIETIES: 'ჯიშები',

  // Form labels
  WEIGHT: 'წონა',
  WEIGHT_KG: 'წონა (კგ)',
  SALE_DATE: 'გაყიდვის თარიღი',
  LOCATION: 'ლოკაცია',
  AREA_HA: 'ფართობი (ჰა)',
  CURRENT_SEASON: 'მიმდინარე',
  BIN: 'სექცია',

  // Placeholders
  VARIETY_NAME_PLACEHOLDER: 'ჯიშის სახელი',
  BUYER_NAME_PLACEHOLDER: 'მყიდველის სახელი',
  YEAR_PLACEHOLDER: 'წელი (მაგ: 2027)',
  BIN_NAME_PLACEHOLDER: 'მაგ: სილოსი 2',

  // Expense allocation
  ALLOCATION_TYPE: 'ხარჯის ტიპი (განაწილება)',
  ALLOCATION_GENERAL: 'ზოგადი (ფერმის ხარჯი)',
  ALLOCATION_SEASONAL: 'სეზონური (მთლიანი სეზონი)',
  ALLOCATION_FIELD: 'მიწის მიხედვით',
  ALLOCATION_LOT: 'მოსავლის მიხედვით',
  ALLOCATION_WORK: 'სამუშაოს მიხედვით',
  ALLOCATION_FIELD_SPECIFIC: 'კონკრეტულ მიწაზე',
  ALLOCATION_LOT_SPECIFIC: 'კონკრეტულ მოსავალზე',
  ALLOCATION_WORK_SPECIFIC: 'კონკრეტულ სამუშაოზე',
  AMOUNT: 'თანხა',
  DATE: 'თარიღი',
  EXPENSE_EXAMPLE: 'მაგ: საწვავი, სასუქი...',

  // Movement types
  MOVEMENT_RECEIVE: 'მიღება',
  MOVEMENT_SALE: 'გაყიდვა',
  MOVEMENT_TRANSFER: 'გადატანა',
  MOVEMENT_ADJUSTMENT: 'კორექცია',

  // Info messages
  WEIGHT_CANNOT_CHANGE: 'წონის შეცვლა შეუძლებელია',
  LOT_CANNOT_CHANGE: 'მოსავლის შეცვლა შეუძლებელია',

  // Not found messages
  SALE_NOT_FOUND: 'გაყიდვა ვერ მოიძებნა',
  LOT_NOT_FOUND: 'მოსავალი ვერ მოიძებნა',
  FIELD_NOT_FOUND: 'მიწა ვერ მოიძებნა',
  WAREHOUSE_NOT_FOUND: 'საწყობი ვერ მოიძებნა',
  WORK_NOT_FOUND: 'სამუშაო ვერ მოიძებნა',
  EXPENSE_NOT_FOUND: 'ხარჯი ვერ მოიძებნა',

  // History and movements
  MOVEMENT_HISTORY: 'მოძრაობის ისტორია',
  NO_MOVEMENTS: 'მოძრაობა არ არის',

  // Actions
  BACK: 'უკან',
  VIEW_DETAILS: 'დეტალები',
  ADD_BIN: 'სექციის დამატება',

  // Empty states
  NO_BINS: 'სექციები არ არის',
  NO_DATA: 'მონაცემები არ არის',
  NO_RECORDS: 'ჩანაწერები არ არის',
  STOCK_ZERO: 'ნაშთი განულებულია (გაიყიდა ან გადავიდა).',
  BIN_EMPTY: 'ცარიელია',

  // Detail page labels
  PHONE_NOT_SET: 'ტელეფონი მითითებული არ არის',
  ADDRESS_NOT_SET: 'მისამართი მითითებული არ არის',
  INITIAL_WEIGHT: 'საწყისი წონა',
  CURRENT_BALANCE: 'მიმდინარე ნაშთი',
  TOTAL_WORKS: 'სულ სამუშაო',
  TOTAL_HARVEST: 'სულ მოსავალი',
  TOTAL_TO_PAY: 'სულ გადასახდელი',
  CHANGE_STATUS: 'სტატუსის შეცვლა',
  FINANCES: 'ფინანსები',
  OVERVIEW: 'მიმოხილვა',
  LOCATION_DESCRIPTION: 'ლოკაცია / აღწერა',
  BINS_SECTIONS: 'სექციები (Bins)',
  BIN_ADD_HINT: 'გამოიყენეთ სექციები საწყობში სხვადასხვა კულტურის ან ლოტის გასმიჯნად.',
  BIN_ADD_ERROR: 'სექციის დამატება ვერ მოხერხდა',
  BIN_STOCK_WARNING: 'ამ სექციაში არის მარაგი',
  PRICE_PER_KG_SHORT: 'ფასი / კგ',

  // Table headers
  TABLE_DATE: 'თარიღი',
  TABLE_TYPE: 'ტიპი',
  TABLE_FROM_TO: 'საიდან → სად',

  // Profile errors
  PROFILE_NOT_FOUND: 'პროფილის მონაცემები ვერ მოიძებნა.',
  PROFILE_CHECK_DB: 'პროფილის მონაცემები ვერ მოიძებნა. გთხოვთ შეამოწმოთ მონაცემთა ბაზა.',

  // Add entity errors
  ADD_BUYER_ERROR: 'მყიდველის დამატება ვერ მოხერხდა',
  ADD_SEASON_ERROR: 'სეზონის დამატება ვერ მოხერხდა',
  ADD_VARIETY_ERROR: 'ჯიშის დამატება ვერ მოხერხდა',
  ADD_BIN_ERROR: 'სექციის დამატება ვერ მოხერხდა',

  // Internal transfer
  INTERNAL_TRANSFER: 'შიდა გადატანა',

  // View actions
  VIEW: 'ნახვა',
  NO_ADDRESS: 'მისამართი გარეშე',
  DETAILED_LIST: 'დეტალური სია',

  // Form placeholders
  PHONE_PLACEHOLDER: 'ტელეფონი',
  NAME_PLACEHOLDER: 'სახელი',
  FIELD_NAME_PLACEHOLDER: 'მაგ: ზედა ყანა',
  WAREHOUSE_NAME_PLACEHOLDER: 'მაგ: მთავარი საწყობი',
  ADDRESS_DESCRIPTION: 'მისამართი / აღწერა',
  DEFAULT_BIN_NAME: 'სექცია 1',
};
