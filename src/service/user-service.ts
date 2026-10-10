import userModel, { UserDocument } from "../models/user-model";

export async function createUser(
  input: Pick<UserDocument, "email" | "name" | "password">,
) {
  return userModel.create(input);
}
