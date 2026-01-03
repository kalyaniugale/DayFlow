import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../src/config/prisma.js";
import {
  generateLoginId,
  generateRandomPassword,
} from "../src/utils/loginIdGenerator.js";

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log("🧹 Cleaning existing data...");
  await prisma.companyLog.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.document.deleteMany();
  await prisma.employeeSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.employeeProfile.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.loginIdSerial.deleteMany();

  // Create Admin User
  console.log("👤 Creating Admin user...");
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const adminYear = 2022;
  const adminLoginId = await generateLoginId("Admin", "User", adminYear);
  
  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@dayflow.com",
      loginId: adminLoginId,
      password: adminPassword,
      role: "ADMIN",
      passwordChanged: true,
      emailVerified: true,
    },
  });

  const adminEmployee = await prisma.employee.create({
    data: {
      employeeCode: adminLoginId,
      userId: adminUser.id,
      department: "Management",
      designation: "System Administrator",
      dateOfJoin: new Date("2022-01-01"),
      yearOfJoining: adminYear,
    },
  });

  await prisma.employeeProfile.create({
    data: {
      employeeId: adminEmployee.id,
      phone: "+91-9876543210",
      dob: new Date("1985-05-15"),
      gender: "Male",
      addressLine: "123 Admin Street",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      pincode: "400001",
      emergencyContactName: "Admin Emergency",
      emergencyContactPhone: "+91-9876543211",
    },
  });

  // Create HR User
  console.log("👤 Creating HR user...");
  const hrPassword = await bcrypt.hash("HR@123", 10);
  const hrYear = 2022;
  const hrLoginId = await generateLoginId("HR", "Manager", hrYear);
  
  const hrUser = await prisma.user.create({
    data: {
      name: "HR Manager",
      email: "hr@dayflow.com",
      loginId: hrLoginId,
      password: hrPassword,
      role: "HR",
      passwordChanged: true,
      emailVerified: true,
    },
  });

  const hrEmployee = await prisma.employee.create({
    data: {
      employeeCode: hrLoginId,
      userId: hrUser.id,
      department: "Human Resources",
      designation: "HR Manager",
      dateOfJoin: new Date("2022-02-01"),
      yearOfJoining: hrYear,
    },
  });

  await prisma.employeeProfile.create({
    data: {
      employeeId: hrEmployee.id,
      phone: "+91-9876543220",
      dob: new Date("1990-03-20"),
      gender: "Female",
      addressLine: "456 HR Avenue",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      pincode: "400002",
      emergencyContactName: "HR Emergency",
      emergencyContactPhone: "+91-9876543221",
    },
  });

  // Create Employees
  console.log("👥 Creating employees...");
  const employees = [
    {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@dayflow.com",
      department: "Engineering",
      designation: "Senior Software Engineer",
      dateOfJoin: new Date("2022-03-15"),
      phone: "+91-9876543230",
      dob: new Date("1992-07-10"),
      gender: "Male",
      addressLine: "789 Tech Street",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      pincode: "560001",
    },
    {
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@dayflow.com",
      department: "Engineering",
      designation: "Software Engineer",
      dateOfJoin: new Date("2022-04-01"),
      phone: "+91-9876543240",
      dob: new Date("1995-09-25"),
      gender: "Female",
      addressLine: "321 Developer Road",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      pincode: "560002",
    },
    {
      firstName: "Michael",
      lastName: "Johnson",
      email: "michael.johnson@dayflow.com",
      department: "Sales",
      designation: "Sales Manager",
      dateOfJoin: new Date("2022-05-10"),
      phone: "+91-9876543250",
      dob: new Date("1988-11-12"),
      gender: "Male",
      addressLine: "654 Sales Boulevard",
      city: "Delhi",
      state: "Delhi",
      country: "India",
      pincode: "110001",
    },
    {
      firstName: "Sarah",
      lastName: "Williams",
      email: "sarah.williams@dayflow.com",
      department: "Marketing",
      designation: "Marketing Executive",
      dateOfJoin: new Date("2023-01-15"),
      phone: "+91-9876543260",
      dob: new Date("1993-04-18"),
      gender: "Female",
      addressLine: "987 Marketing Lane",
      city: "Pune",
      state: "Maharashtra",
      country: "India",
      pincode: "411001",
    },
    {
      firstName: "David",
      lastName: "Brown",
      email: "david.brown@dayflow.com",
      department: "Engineering",
      designation: "Junior Software Engineer",
      dateOfJoin: new Date("2023-06-01"),
      phone: "+91-9876543270",
      dob: new Date("1997-12-05"),
      gender: "Male",
      addressLine: "147 Code Street",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
      pincode: "500001",
    },
  ];

  const createdEmployees = [];

  for (const emp of employees) {
    const year = emp.dateOfJoin.getFullYear();
    const loginId = await generateLoginId(emp.firstName, emp.lastName, year);
    const password = generateRandomPassword(12);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: `${emp.firstName} ${emp.lastName}`,
        email: emp.email,
        loginId: loginId,
        password: hashedPassword,
        role: "EMPLOYEE",
        passwordChanged: false, // They need to change password on first login
        emailVerified: false,
      },
    });

    const employee = await prisma.employee.create({
      data: {
        employeeCode: loginId,
        userId: user.id,
        department: emp.department,
        designation: emp.designation,
        dateOfJoin: emp.dateOfJoin,
        yearOfJoining: year,
        managerId: emp.department === "Engineering" ? adminEmployee.id : hrEmployee.id,
      },
    });

    await prisma.employeeProfile.create({
      data: {
        employeeId: employee.id,
        phone: emp.phone,
        dob: emp.dob,
        gender: emp.gender,
        addressLine: emp.addressLine,
        city: emp.city,
        state: emp.state,
        country: emp.country,
        pincode: emp.pincode,
        emergencyContactName: `${emp.firstName} Emergency Contact`,
        emergencyContactPhone: emp.phone.replace(/\d$/, "1"),
      },
    });

    createdEmployees.push({ user, employee, password, loginId });
    console.log(`✅ Created employee: ${emp.firstName} ${emp.lastName} - Login ID: ${loginId}`);
  }

  // Create Skills
  console.log("🎯 Creating skills...");
  const skills = await Promise.all([
    prisma.skill.create({ data: { name: "JavaScript" } }),
    prisma.skill.create({ data: { name: "TypeScript" } }),
    prisma.skill.create({ data: { name: "React" } }),
    prisma.skill.create({ data: { name: "Node.js" } }),
    prisma.skill.create({ data: { name: "Python" } }),
    prisma.skill.create({ data: { name: "Sales" } }),
    prisma.skill.create({ data: { name: "Marketing" } }),
    prisma.skill.create({ data: { name: "Communication" } }),
  ]);

  // Assign skills to employees
  console.log("🔗 Assigning skills to employees...");
  const engineeringEmployees = createdEmployees.filter(
    (e) => e.employee.department === "Engineering"
  );

  for (let i = 0; i < engineeringEmployees.length; i++) {
    const emp = engineeringEmployees[i];
    await prisma.employeeSkill.create({
      data: {
        employeeId: emp.employee.id,
        skillId: skills[0].id, // JavaScript
        level: 4 + i,
        years: 2 + i * 0.5,
      },
    });
    await prisma.employeeSkill.create({
      data: {
        employeeId: emp.employee.id,
        skillId: skills[2].id, // React
        level: 3 + i,
        years: 1.5 + i * 0.5,
      },
    });
    await prisma.employeeSkill.create({
      data: {
        employeeId: emp.employee.id,
        skillId: skills[3].id, // Node.js
        level: 3 + i,
        years: 1 + i * 0.5,
      },
    });
  }

  // Create Leave Requests
  console.log("📅 Creating leave requests...");
  const leaveRequests = [
    {
      employee: createdEmployees[0],
      fromDate: new Date("2024-01-15"),
      toDate: new Date("2024-01-17"),
      reason: "Personal work",
      status: "APPROVED",
      approvedBy: hrUser,
    },
    {
      employee: createdEmployees[1],
      fromDate: new Date("2024-02-01"),
      toDate: new Date("2024-02-03"),
      reason: "Family function",
      status: "PENDING",
    },
    {
      employee: createdEmployees[2],
      fromDate: new Date("2024-01-20"),
      toDate: new Date("2024-01-22"),
      reason: "Sick leave",
      status: "APPROVED",
      approvedBy: hrUser,
    },
    {
      employee: createdEmployees[3],
      fromDate: new Date("2024-03-10"),
      toDate: new Date("2024-03-12"),
      reason: "Vacation",
      status: "REJECTED",
      approvedBy: hrUser,
    },
  ];

  for (const leave of leaveRequests) {
    await prisma.leaveRequest.create({
      data: {
        employeeId: leave.employee.employee.id,
        fromDate: leave.fromDate,
        toDate: leave.toDate,
        reason: leave.reason,
        status: leave.status,
        approvedByUserId: leave.approvedBy?.id,
        approvedAt: leave.approvedBy ? new Date() : null,
      },
    });
  }

  // Create Documents
  console.log("📄 Creating documents...");
  const documents = [
    {
      title: "Resume - John Doe",
      type: "RESUME",
      fileUrl: "https://example.com/documents/john-doe-resume.pdf",
      mimeType: "application/pdf",
      sizeBytes: 245760,
      employee: createdEmployees[0],
    },
    {
      title: "Offer Letter - Jane Smith",
      type: "OFFER_LETTER",
      fileUrl: "https://example.com/documents/jane-smith-offer.pdf",
      mimeType: "application/pdf",
      sizeBytes: 189440,
      employee: createdEmployees[1],
    },
    {
      title: "Aadhar Card - Michael Johnson",
      type: "ID_PROOF",
      fileUrl: "https://example.com/documents/michael-johnson-aadhar.pdf",
      mimeType: "application/pdf",
      sizeBytes: 156672,
      employee: createdEmployees[2],
    },
  ];

  for (const doc of documents) {
    await prisma.document.create({
      data: {
        title: doc.title,
        type: doc.type,
        fileUrl: doc.fileUrl,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        ownerEmployeeId: doc.employee.employee.id,
      },
    });
  }

  // Create Company Logs
  console.log("📝 Creating company logs...");
  await prisma.companyLog.create({
    data: {
      action: "EMPLOYEE_CREATED",
      entity: "Employee",
      entityId: createdEmployees[0].employee.id,
      createdByUserId: hrUser.id,
      meta: {
        department: "Engineering",
        designation: "Senior Software Engineer",
      },
    },
  });

  await prisma.companyLog.create({
    data: {
      action: "LEAVE_APPROVED",
      entity: "LeaveRequest",
      entityId: leaveRequests[0].employee.employee.id,
      createdByUserId: hrUser.id,
      meta: {
        fromDate: leaveRequests[0].fromDate.toISOString(),
        toDate: leaveRequests[0].toDate.toISOString(),
      },
    },
  });

  console.log("\n✅ Seed completed successfully!");
  console.log("\n📋 Test Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Admin:");
  console.log(`  Login ID: ${adminLoginId}`);
  console.log(`  Email: admin@dayflow.com`);
  console.log(`  Password: Admin@123`);
  console.log("\nHR Manager:");
  console.log(`  Login ID: ${hrLoginId}`);
  console.log(`  Email: hr@dayflow.com`);
  console.log(`  Password: HR@123`);
  console.log("\nEmployees (Login with Login ID or Email):");
  createdEmployees.forEach((emp, index) => {
    console.log(`\n${employees[index].firstName} ${employees[index].lastName}:`);
    console.log(`  Login ID: ${emp.loginId}`);
    console.log(`  Email: ${employees[index].email}`);
    console.log(`  Password: ${emp.password} (Auto-generated, needs to be changed)`);
  });
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

