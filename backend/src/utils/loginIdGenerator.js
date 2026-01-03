import prisma from "../config/prisma.js";

/**
 * Generate initials from name (first 2 letters of first name + first 2 letters of last name)
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} - Uppercase initials (e.g., "JODO" from "John Doe")
 */
export const generateInitials = (firstName, lastName) => {
  const first = (firstName || "").trim().substring(0, 2).toUpperCase();
  const last = (lastName || "").trim().substring(0, 2).toUpperCase();
  
  // If names are too short, pad with X
  const firstPadded = first.padEnd(2, "X");
  const lastPadded = last.padEnd(2, "X");
  
  return firstPadded + lastPadded;
};

/**
 * Get or create serial number for a given year and increment it
 * @param {number} year - Year (e.g., 2022)
 * @returns {Promise<number>} - Next serial number for that year
 */
export const getNextSerialForYear = async (year) => {
  try {
    // Try to find existing record for this year
    let serialRecord = await prisma.loginIdSerial.findUnique({
      where: { year },
    });

    if (!serialRecord) {
      // Create new record for this year
      serialRecord = await prisma.loginIdSerial.create({
        data: {
          year,
          serial: 1,
        },
      });
      return 1;
    }

    // Increment and update serial number
    const nextSerial = serialRecord.serial + 1;
    await prisma.loginIdSerial.update({
      where: { year },
      data: { serial: nextSerial },
    });

    return nextSerial;
  } catch (error) {
    console.error("Error getting serial number:", error);
    throw error;
  }
};

/**
 * Generate login ID in format: OI + initials + year + serial (4 digits)
 * Example: OIJODO20220001
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @param {number} year - Year of joining
 * @returns {Promise<string>} - Generated login ID
 */
export const generateLoginId = async (firstName, lastName, year) => {
  const initials = generateInitials(firstName, lastName);
  const serial = await getNextSerialForYear(year);
  
  // Format serial as 4-digit string (e.g., 0001, 0002, etc.)
  const serialStr = serial.toString().padStart(4, "0");
  
  return `OI${initials}${year}${serialStr}`;
};

/**
 * Generate a random secure password
 * @param {number} length - Password length (default: 12)
 * @returns {string} - Generated password
 */
export const generateRandomPassword = (length = 12) => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*";
  
  const allChars = uppercase + lowercase + numbers + special;
  
  // Ensure at least one character from each set
  let password = 
    uppercase[Math.floor(Math.random() * uppercase.length)] +
    lowercase[Math.floor(Math.random() * lowercase.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password string
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

