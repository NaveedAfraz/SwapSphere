// Business day calculation utilities

const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

const isHoliday = (date) => {
  // Add US holidays or customize for your region
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // New Year's Day
  if (month === 0 && day === 1) return true;
  
  // Independence Day (July 4th)
  if (month === 6 && day === 4) return true;
  
  // Christmas Day
  if (month === 11 && day === 25) return true;
  
  // Thanksgiving (4th Thursday in November)
  if (month === 10) {
    const firstDay = new Date(year, 10, 1);
    const firstThursday = new Date(firstDay);
    while (firstThursday.getDay() !== 4) {
      firstThursday.setDate(firstThursday.getDate() + 1);
    }
    const thanksgiving = new Date(firstThursday);
    thanksgiving.setDate(thanksgiving.getDate() + 21); // 4th Thursday
    if (day === thanksgiving.getDate()) return true;
  }
  
  return false;
};

const addBusinessDays = (startDate, days) => {
  const result = new Date(startDate);
  let businessDaysAdded = 0;
  
  while (businessDaysAdded < days) {
    result.setDate(result.getDate() + 1);
    
    // Skip weekends and holidays
    if (!isWeekend(result) && !isHoliday(result)) {
      businessDaysAdded++;
    }
  }
  
  return result;
};

const getBusinessDaysUntil = (startDate, endDate) => {
  let businessDays = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    if (!isWeekend(current) && !isHoliday(current)) {
      businessDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return businessDays;
};

module.exports = {
  isWeekend,
  isHoliday,
  addBusinessDays,
  getBusinessDaysUntil
};
