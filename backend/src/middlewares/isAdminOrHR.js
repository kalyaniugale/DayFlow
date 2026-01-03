import prisma from "../config/prisma.js";

/**
 * Middleware to check if user is Admin or HR
 * Must be used after isAuth middleware
 */
const isAdminOrHR = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "ADMIN" && user.role !== "HR") {
      return res.status(403).json({ 
        message: "Access denied. Admin or HR role required." 
      });
    }

    next();
  } catch (error) {
    console.error("Error in isAdminOrHR middleware:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export default isAdminOrHR;

