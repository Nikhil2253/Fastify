import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password:{
    type:String,
    required:true,
  },
  country:{
    type:String,
  },
  resetPasswordToken:{
    type:String,
  },
  resetPasswordExpiry:{
    type:Date,
  },
});

const User = mongoose.model("User", userSchema);

export default User;
