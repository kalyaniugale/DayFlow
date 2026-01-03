import prisma from "../config/prisma.js";
import validator from "validator";
import bcrypt from "bcryptjs";
import generateToken from "../config/token.js";
import { generateLoginId, generateRandomPassword } from "../utils/loginIdGenerator.js";

/**
 * Convert Prisma enum -> frontend role
 */
const apiRoleFromDb = (role) => {
  return role;
};

/**
 * CREATE EMPLOYEE (Admin/HR only)
 * Creates a new employee with auto-generated login ID and password
 */
export const createEmployee = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      role = "EMPLOYEE",
      department,
      designation,
      dateOfJoin,
      phone,
      addressLine,
      city,
      state,
      country,
      pincode,
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ 
        message: "First name, last name, and email are required" 
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Validate role
    if (!["ADMIN", "HR", "EMPLOYEE"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Get year of joining from dateOfJoin or use current year
    const joinDate = dateOfJoin ? new Date(dateOfJoin) : new Date();
    const yearOfJoining = joinDate.getFullYear();

    // Generate login ID
    const loginId = await generateLoginId(firstName, lastName, yearOfJoining);

    // Check if loginId already exists (shouldn't happen, but safety check)
    const existingLoginId = await prisma.user.findUnique({
      where: { loginId },
    });

    if (existingLoginId) {
      return res.status(500).json({ 
        message: "Login ID collision. Please try again." 
      });
    }

    // Generate random password
    const autoPassword = generateRandomPassword(12);

    // Hash password
    const hashPassword = await bcrypt.hash(autoPassword, 10);

    // Create user and employee in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name: `${firstName} ${lastName}`,
          email,
          loginId,
          password: hashPassword,
          role,
          passwordChanged: false,
          emailVerified: false,
        },
      });

      // Create employee
      const employee = await tx.employee.create({
        data: {
          employeeCode: loginId, // Use loginId as employeeCode
          userId: user.id,
          department,
          designation,
          dateOfJoin: joinDate,
          yearOfJoining,
        },
      });

      // Create employee profile if personal details provided
      if (phone || addressLine || city || state || country || pincode) {
        await tx.employeeProfile.create({
          data: {
            employeeId: employee.id,
            phone,
            addressLine,
            city,
            state,
            country,
            pincode,
          },
        });
      }

      return { user, employee, autoPassword };
    });

    // Return user data with auto-generated password (only shown once)
    return res.status(201).json({
      message: "Employee created successfully",
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        loginId: result.user.loginId,
        role: result.user.role,
        passwordChanged: result.user.passwordChanged,
      },
      temporaryPassword: result.autoPassword, // Include auto-generated password
      note: "Please share the login ID and temporary password with the employee. They must change it on first login.",
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    return res.status(500).json({ message: "Error creating employee" });
  }
};

/**
 * LOGIN
 * Supports both loginId and email
 */
export const login = async (req, res) => {
  try {
    const { loginIdOrEmail, password } = req.body;

    if (!loginIdOrEmail || !password) {
      return res.status(400).json({ message: "Login ID/Email and password are required" });
    }

    // Try to find user by loginId or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { loginId: loginIdOrEmail },
          { email: loginIdOrEmail },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        loginId: true,
        password: true,
        role: true,
        passwordChanged: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(400).json({ 
        message: "Invalid login ID/Email or password" 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        message: "Account is deactivated. Please contact HR." 
      });
    }


    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ 
        message: "Invalid login ID/Email or password" 
      });
    }

    const token = generateToken(user.id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production" ? "None" : "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, ...safeUser } = user;

    return res.status(200).json({
      ...safeUser,
      role: apiRoleFromDb(user.role),
      requiresPasswordChange: !user.passwordChanged, // Flag if password needs to be changed
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Login error" });
  }
};

/**
 * LOGOUT
 */
export const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({ message: "logout successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "logout error" });
  }
};

/**
 * CHANGE PASSWORD
 * Allows users to change their auto-generated password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: "Current password and new password are required" 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        message: "New password must be at least 8 characters long" 
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ 
        message: "Current password is incorrect" 
      });
    }

    // Hash new password
    const hashPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark as changed
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        password: hashPassword,
        passwordChanged: true,
      },
    });

    return res.status(200).json({ 
      message: "Password changed successfully" 
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Error changing password" });
  }
};

/**
 * GET ME
 */
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        loginId: true,
        role: true,
        passwordChanged: true,
        emailVerified: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: {
        ...user,
        role: apiRoleFromDb(user.role),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
