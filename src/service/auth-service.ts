import userModel, { UserDocument } from "../models/user-model";

export async function createUser(
  input: Pick<UserDocument, "email" | "name" | "password">,
) {
  return userModel.create(input);
}

export async function validatePassword({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
    const user = await userModel.findOne({email})

    if (!user) {
        return false
    }

    const isValid = user.comparePassword(password)

    if (!isValid) {
        return false
    }

    return user
}
