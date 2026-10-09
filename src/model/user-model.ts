import mongoose from "mongoose";
import bcrypt from "bcrypt";

export interface UserDocument extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: Promise<boolean>;
}

const userSchema = new mongoose.Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  let self = this as UserDocument;

  if (!self.isModified("password")) {
    return;
  }
  const genSalt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(self.password, genSalt);

  self.password = hash;
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  let self = this as UserDocument;

  return await bcrypt.compare(candidatePassword, self.password);
};

const userModel = mongoose.model<UserDocument>("User", userSchema);
export default userModel;
