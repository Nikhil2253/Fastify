import User from "../models/user.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// REGISTER
export const register = async (request, reply) => {
  try {
    const { name, email, password, country } = request.body;

    // validate fields
    if (!name || !email || !password) {
      return reply.code(400).send({ message: "Missing required fields" });
    }

    // check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return reply.code(400).send({ message: "Email already registered" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // save user
    const user = new User({ name, email, password: hashedPassword, country });
    await user.save();

    // success response (without password)
    reply.code(201).send({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        country: user.country,
      },
    });
  } catch (error) {
    reply.code(500).send({ message: "Server error", error: error.message });
  }
};

// LOGIN
export const login = async (request, reply) => {
  try {
    const { email, password } = request.body;

    // validate fields
    if (!email || !password) {
      return reply.code(400).send({ message: "Missing required fields" });
    }

    // check user
    const user = await User.findOne({ email });
    if (!user) {
      return reply.code(404).send({ message: "Incorrect email" });
    }

    // check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return reply.code(401).send({ message: "Invalid credentials" });
    }

    // generate JWT
    const token = await reply.jwtSign({ id: user._id });

    reply.code(200).send({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        country: user.country,
      },
    });
  } catch (error) {
    reply.code(500).send({ message: "Server error", error: error.message });
  }
};

// FORGOT PASSWORD
export const forgotPassword = async (request, reply) => {
  try {
    const { email } = request.body;
    const user = await User.findOne({ email });

    if (!user) {
      return reply.code(404).send({ message: "Invalid email" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetPasswordExpire;

    await user.save({ validateBeforeSave: false });

    const resetUrl = `http://localhost:${process.env.PORT}/api/auth/reset-password/${resetToken}`;

    reply.code(200).send({ message: "Password reset link generated", resetUrl });
  } catch (error) {
    reply.code(500).send({ message: "Server error", error: error.message });
  }
};

// RESET PASSWORD
export const resetPassword = async (request, reply) => {
  try {
    const resetToken = request.params.token;
    const { newPassword } = request.body;

    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return reply.code(400).send({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;

    await user.save();

    reply.code(201).send({ message: "Password reset successful" });
  } catch (error) {
    reply.code(500).send({ message: "Server error", error: error.message });
  }
};

// LOGOUT
export const logout = async (request, reply) => {
  try {
    return reply.code(200).send({ message: "User logged out successfully" });
  } catch (error) {
    return reply.code(500).send({ message: error.message });
  }
};
