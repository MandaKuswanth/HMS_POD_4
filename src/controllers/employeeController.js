const User=require('../models/User');
const bcrypt=require("bcrypt");
const Employee=require('../models/Employee');
const jwt = require("jsonwebtoken");
exports.getProfile = async (req, res) => {
  try {
    // req.user comes from token middleware
    const user = await User.findById(req.user.userId)
      .select("-passwordHash")   // hide password
      .populate("employeeId");

    res.status(200).json({
      message: "Profile fetched successfully",
      user
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
exports.signUp = async (req, res) => {
  try {
    // console.log("STEP 1: Request received");

    const { email, password, roles, employeeData } = req.body;

    const currentUser = await User.findOne({ userName: email });
    if (currentUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }
    // console.log("STEP 2: Creating employee");
    const employee = await Employee.create(employeeData);
    console.log("STEP 3: Hashing password");
    const passwordHash = await bcrypt.hash(password, 10);
    console.log("STEP 4: Creating user");
    const user = await User.create({
      userName: email,
      passwordHash,
      roles,
      employeeId: employee._id
    });

       const token = jwt.sign(
  { userId: user._id, role: user.roles },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
);

    // console.log("STEP 5: User created:", user);

    res.status(201).json({
      message: "Signup successful",
      token,
      user,
      employee
    });

  } catch (error) {
    console.error("ERROR HERE:", error); 
    res.status(500).json({
      error: error.message
    });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ userName: email })
      .populate("employeeId");
    if (!user) {
      return res.status(400).json({
        message: "Invalid email"
      });
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password"
      });
    }
    user.lastLoginAt = new Date();
    await user.save();
    const token = jwt.sign(
  { userId: user._id, role: user.roles },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
);

    res.status(200).json({
      message: "Login successful",
      token,
      user
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};



